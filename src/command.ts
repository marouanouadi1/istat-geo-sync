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
  .command("sync-mysql")
  .description("Upsert the normalized dataset into a MySQL database")
  .option("--database <name>", "MySQL database name")
  .option("--host <host>", "MySQL host")
  .addOption(new Option("--port <number>", "MySQL port"))
  .option("--user <user>", "MySQL user")
  .option("--password <password>", "MySQL password")
  .option(
    "--config <path>",
    "Path to a JSON config file (default: istat-geo-sync.config.json)"
  )
  .action(async function (options) {
    const configPath =
      options.config ??
      path.join(__dirname, "..", "istat-geo-sync.config.json");

    const config = await loadConfig(configPath);

    const mysqlConfig = config.mysql;

    const database = options.database ?? mysqlConfig?.database;

    if (!database) {
      throw new Error(
        "A MySQL database name is required (use --database, MYSQL_DATABASE, or mysql.database in the config file)."
      );
    }

    const host = options.host ?? mysqlConfig?.host ?? "127.0.0.1";
    const port = options.port ?? mysqlConfig?.port ?? 3306;
    const user = options.user ?? mysqlConfig?.user ?? "root";
    const password = options.password ?? mysqlConfig?.password ?? "";

    const wb = await fetchIstatWorkbook();
    const dataSet = buildDataset(wb);

    await syncDataset(
      {
        database: "mysql",
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
