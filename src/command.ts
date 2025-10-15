#!/usr/bin/env -S node --experimental-sqlite
import { Command, Option, Argument } from "commander";
import { version } from "../package.json";
import { buildDataset, fetchIstatWorkbook } from "./istat";
import { exportData } from "./export";
import path from "path";
import { loadConfig } from "./config";
import { DatabaseType, syncDataset } from "./db";

const program = new Command();

program
  .name("istat-geo-sync")
  .description(
    "Sync/export ISTAT geographic datasets (Regions/Provinces/Municipalities)"
  )
  .version(version);

program
  .command("export")
  .description("Export normalized datasets to files")
  .addArgument(
    new Argument("<entity>", "Entity to export").choices([
      "regions",
      "provinces",
      "municipalities",
      "legend",
      "notes",
      "all",
    ])
  )
  .addOption(
    new Option("-f, --format <format>", "output format")
      .choices(["csv", "json"])
      .makeOptionMandatory(true)
  )
  .option("-o, --out <dir>", "output directory", "out")
  .option(
    "--filename <pattern>",
    "output filename pattern; placeholders: {entity},{date},{ext}",
    "{date}-{entity}.{ext}"
  )
  .action(async function (
    entity:
      | "regions"
      | "provinces"
      | "municipalities"
      | "legend"
      | "notes"
      | "all",
    options
  ) {
    const { workbook, lastModified } = await fetchIstatWorkbook();
    const dataSet = buildDataset(workbook, {
      sourceLastModified: lastModified,
    });
    await exportData(
      dataSet,
      entity,
      options.format,
      options.out,
      options.filename
    );
  });

program
  .command("sync-database")
  .description("Upsert the normalized dataset into a database")
  .option(
    "--type <type>",
    "Database type (mysql, postgres, or sqlite)",
    "mysql"
  )
  .option("--database <name>", "Database name")
  .option("--host <host>", "Database host")
  .addOption(new Option("--port <number>", "Database port"))
  .option("--user <user>", "Database user")
  .option("--password <password>", "Database password")
  .option(
    "--config <path>",
    "Path to a JSON config file (default: istat-geo-sync.config.json)"
  )
  .option(
    "--force",
    "Force synchronization even if the remote dataset has not changed"
  )
  .action(async function (options) {
    const configPath =
      options.config ??
      path.join(__dirname, "..", "istat-geo-sync.config.json");

    const config = await loadConfig(configPath);

    const databaseConfig = config.database;
    const type = options.type as DatabaseType;

    const database = options.database ?? databaseConfig?.database;

    if (!database) {
      throw new Error(
        "A database name or file path is required (use --database or provide it in the config file)."
      );
    }

    const defaultHost =
      type === "postgres" || type === "mysql" ? "127.0.0.1" : undefined;
    const defaultPort =
      type === "postgres" ? 5432 : type === "mysql" ? 3306 : undefined;
    const defaultUser =
      type === "postgres" ? "postgres" : type === "mysql" ? "root" : undefined;
    const defaultPassword =
      type === "postgres" ? "" : type === "mysql" ? "" : undefined;

    const host = options.host ?? defaultHost;
    const port = options.port ?? defaultPort;
    const user = options.user ?? defaultUser;
    const password = options.password ?? defaultPassword;

    const { workbook, lastModified } = await fetchIstatWorkbook();
    const dataSet = buildDataset(workbook, {
      sourceLastModified: lastModified,
    });

    await syncDataset(
      {
        database: options.type,
        config: {
          host,
          port,
          user,
          password,
          database,
        },
        force: Boolean(options.force),
      },
      dataSet
    );
  });
program.parseAsync();
