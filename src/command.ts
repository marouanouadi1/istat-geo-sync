import { Command, Option, Argument } from "commander";
import { version } from "../package.json";
import { buildDataset, fetchIstatWorkbook } from "./istat";
import { exportData } from "./export";
import path from "path";
import { loadConfig } from "./config";
import { syncDatasetToMySql } from "./db/mysql";
import { syncDataset } from "./db";

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
    entity: "regions" | "provinces" | "municipalities" | "all",
    options
  ) {
    const wb = await fetchIstatWorkbook();
    const dataSet = buildDataset(wb);
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
  .option("--type <type>", "Database type (mysql or postgres)", "mysql")
  .option("--database <name>", "Database name")
  .option("--host <host>", "Database host")
  .addOption(new Option("--port <number>", "Database port"))
  .option("--user <user>", "Database user")
  .option("--password <password>", "Database password")
  .option(
    "--config <path>",
    "Path to a JSON config file (default: istat-geo-sync.config.json)"
  )
  .action(async function (options) {
    const configPath =
      options.config ??
      path.join(__dirname, "..", "istat-geo-sync.config.json");

    const config = await loadConfig(configPath);

    const databaseConfig = config.database;

    const database = options.database ?? databaseConfig?.database;

    if (!database) {
      throw new Error(
        "A database name is required (use --database, DATABASE_NAME, or database.name in the config file)."
      );
    }

    const host = options.host ?? databaseConfig?.host ?? "127.0.0.1";
    const port = options.port ?? databaseConfig?.port ?? 3306;
    const user = options.user ?? databaseConfig?.user ?? "root";
    const password = options.password ?? databaseConfig?.password ?? "";

    const wb = await fetchIstatWorkbook();
    const dataSet = buildDataset(wb);

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
      },
      dataSet
    );
  });
program.parseAsync();
