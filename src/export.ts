import path from "path";
import {
  Dataset,
  FIELD_LEGEND_FIELDS,
  MUNICIPALITY_FIELDS,
  NOTE_FIELDS,
  noteMapToEntries,
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

type ExportableEntity = {
  json: unknown;
  csv: { data: Record<string, any>[]; fields: string[] };
};

export async function exportData(
  dataSet: Dataset,
  entity:
    | "regions"
    | "provinces"
    | "municipalities"
    | "legend"
    | "notes"
    | "all",
  format: ExportFormat,
  outDir: string,
  filenamePattern: string
) {
  await fs.mkdir(outDir, { recursive: true });
  const ext = format === "json" ? "json" : "csv";

  const entityMap: Record<
    "regions" | "provinces" | "municipalities" | "legend" | "notes",
    ExportableEntity
  > = {
    regions: {
      json: dataSet.regions,
      csv: {
        data: dataSet.regions as Record<string, any>[],
        fields: REGION_FIELDS as string[],
      },
    },
    provinces: {
      json: dataSet.provinces,
      csv: {
        data: dataSet.provinces as Record<string, any>[],
        fields: PROVINCE_FIELDS as string[],
      },
    },
    municipalities: {
      json: dataSet.municipalities,
      csv: {
        data: dataSet.municipalities as Record<string, any>[],
        fields: MUNICIPALITY_FIELDS as string[],
      },
    },
    legend: {
      json: dataSet.legend,
      csv: {
        data: dataSet.legend,
        fields: FIELD_LEGEND_FIELDS,
      },
    },
    notes: {
      json: dataSet.notes,
      csv: {
        data: noteMapToEntries(dataSet.notes) as Record<string, any>[],
        fields: NOTE_FIELDS as string[],
      },
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
        await fs.writeFile(fullName, JSON.stringify(value.json, null, 2), "utf8");
      } else {
        const csv = toCsv(value.csv.data, value.csv.fields);
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
