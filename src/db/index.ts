import { Dataset } from "../models";
import { MySqlConfig } from "../config";
import { syncDatasetToMySql } from "./mysql";

export type SyncOptions = {
  database: "mysql";
  config: MySqlConfig;
};

export async function syncDataset(
  options: SyncOptions,
  dataset: Dataset
): Promise<void> {
  if (options.database !== "mysql") {
    throw new Error(`Unsupported database: ${String(options.database)}`);
  }

  return syncDatasetToMySql(options.config, dataset);
}

export type { MySqlConfig } from "../config";
export { syncDatasetToMySql } from "./mysql";
