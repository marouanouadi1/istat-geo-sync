import path from "path";
import { readFile } from "fs/promises";
import {
  FIELD_LEGEND_FIELDS,
  FieldLegend,
  MUNICIPALITY_FIELDS,
  Municipality,
  NOTE_FIELDS,
  NoteMap,
  PROVINCE_FIELDS,
  Province,
  REGION_FIELDS,
  Region,
  noteMapToEntries,
} from "../models";

type RowValue = string | number | boolean | null;

export type TableRow = RowValue[];

export async function loadSchemaStatements(
  schemaDirectory: string
): Promise<string[]> {
  const schemaPath = path.join(schemaDirectory, "schema.sql");
  const schemaContent = await readFile(schemaPath, "utf8");

  return schemaContent
    .split(/;\s*(?:\r?\n|$)/)
    .map((statement) => statement.trim())
    .filter((statement) => statement.length > 0)
    .map((statement) => `${statement};`);
}

export function buildRegionRows(regions: Region[]): TableRow[] {
  return regions.map((region) =>
    REGION_FIELDS.map((column) => region[column] ?? null)
  );
}

export function buildProvinceRows(provinces: Province[]): TableRow[] {
  return provinces.map((province) =>
    PROVINCE_FIELDS.map((column) => province[column] ?? null)
  );
}

export function buildMunicipalityRows(
  municipalities: Municipality[],
  options?: { booleanAsNumber?: boolean }
): TableRow[] {
  const booleanAsNumber = options?.booleanAsNumber ?? false;

  return municipalities.map((municipality) =>
    MUNICIPALITY_FIELDS.map((column) => {
      if (column === "is_provincial_capital") {
        return booleanAsNumber
          ? municipality.is_provincial_capital
            ? 1
            : 0
          : Boolean(municipality.is_provincial_capital);
      }
      const value = municipality[column];
      return value ?? null;
    })
  );
}

export function buildLegendRows(legend: FieldLegend[]): TableRow[] {
  return legend.map((item) =>
    FIELD_LEGEND_FIELDS.map((column) => item[column] ?? null)
  );
}

export function buildNoteRows(notes: NoteMap): TableRow[] {
  const entries = noteMapToEntries(notes);

  return entries.map((entry) =>
    NOTE_FIELDS.map((column) => entry[column] ?? null)
  );
}
