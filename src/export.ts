import path from "path";
import { Dataset } from "./models";
import { promises as fs } from "fs";

type ExportFormat = "csv" | "json";

function resolveFilename(
  pattern: string,
  entity: string,
  date: string,
  ext: string
): string {
  return pattern
    .replace(/\{entity\}/g, entity)
    .replace(/\{date\}/g, date)
    .replace(/\{ext\}/g, ext);
}

export async function exportData(
  dataSet: Dataset,
  entity: "regions" | "provinces" | "municipalities" | "all",
  format: ExportFormat,
  outDir: string,
  filenamePattern: string
) {
  await fs.mkdir(outDir, { recursive: true });
  const ext = format === "json" ? "json" : "csv";

  const entityMap = {
    regions: dataSet.regions,
    provinces: dataSet.provinces,
    municipalities: dataSet.municipalities,
  };

  for (const [key, value] of Object.entries(entityMap)) {
    if (entity === key || entity === "all") {
      if (format === "json") {
        const fileName = resolveFilename(
          filenamePattern,
          key,
          dataSet.dataset_date,
          ext
        );
        const fullName = path.join(outDir, fileName);
        await fs.writeFile(fullName, JSON.stringify(value, null, 2), "utf8");
      }
    }
  }
}
