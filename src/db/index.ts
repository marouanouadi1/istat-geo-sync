import { DatabaseConfig } from "../config";
import { Dataset } from "../models";
import { syncDatasetToMySql } from "./mysql";
import { syncDatasetToPostgres } from "./postgres";
import { syncDatasetToSqlite } from "./sqlite";

export type DatabaseType = "mysql" | "postgres" | "sqlite";
export type SyncOptions = {
  database: DatabaseType;
  config: DatabaseConfig;
};

export async function syncDataset(
  options: SyncOptions,
  dataset: Dataset
): Promise<void> {
  if (options.database === "mysql") {
    return syncDatasetToMySql(options.config, dataset);
  } else if (options.database === "postgres") {
    return syncDatasetToPostgres(options.config, dataset);
  } else if (options.database === "sqlite") {
    return syncDatasetToSqlite(options.config, dataset);
  }
  throw new Error(`Unsupported database type: ${options.database}`);
}

export { syncDatasetToMySql } from "./mysql";
