// Main exports for programmatic usage
export { fetchIstatWorkbook, buildDataset } from "./istat";
export { exportData } from "./export";
export { syncDataset, type DatabaseType } from "./db";
export { loadConfig } from "./config";
export type {
  Region,
  Province,
  Municipality,
  Dataset,
  FieldLegend,
  NoteMap,
  NoteEntry,
} from "./models";
