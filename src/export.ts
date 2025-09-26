import path from "path";
import {
  Dataset,
  MUNICIPALITY_FIELDS,
  PROVINCE_FIELDS,
  REGION_FIELDS,
} from "./models";
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
    regions: { data: dataSet.regions, fields: REGION_FIELDS },
    provinces: { data: dataSet.provinces, fields: PROVINCE_FIELDS },
    municipalities: {
      data: dataSet.municipalities,
      fields: MUNICIPALITY_FIELDS,
    },
  };

  for (const [key, value] of Object.entries(entityMap)) {
    const fileName = resolveFilename(
      filenamePattern,
      key,
      dataSet.dataset_date,
      ext
    );
    const fullName = path.join(outDir, fileName);
    if (entity === key || entity === "all") {
      if (format === "json") {
        await fs.writeFile(fullName, JSON.stringify(value, null, 2), "utf8");
      } else {
        const csv = toCsv(value.data as Record<string, any>[], value.fields as string[]);
        await fs.writeFile(fullName, csv, "utf8");
      }
    }
  }
}

function toCsv<T extends Record<string, any>>(
  rows: T[],
  fields: (keyof T)[]
): string {
  const q = (v: any) => {
    const s = v === null || v === undefined ? "" : String(v);
    const esc = s.replace(/"/g, '""');
    return `"${esc}"`;
  };
  const header = fields.map((f) => q(String(f))).join(",");
  const body = rows.map((r) => fields.map((f) => q(r[f])).join(",")).join("\n");
  return `${header}\n${body}\n`;
}
