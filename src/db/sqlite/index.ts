import path from "path";
import { promises as fs } from "fs";
import { DatabaseSync } from "node:sqlite";
import { DatabaseConfig } from "../../config";
import {
  Dataset,
  FIELD_LEGEND_FIELDS,
  MUNICIPALITY_FIELDS,
  NOTE_FIELDS,
  PROVINCE_FIELDS,
  REGION_FIELDS,
  noteMapToEntries,
} from "../../models";

type Row = (string | number | null)[];

type TableConfig = {
  name: string;
  columns: string[];
  primaryKey: string;
  rows: Row[];
};

export async function syncDatasetToSqlite(
  config: DatabaseConfig,
  dataset: Dataset,
  force?: boolean
): Promise<void> {
  const databasePath = config.database;
  if (!databasePath) {
    throw new Error("SQLite requires a database file path");
  }

  await ensureDirectoryExists(databasePath);

  const schemaStatements = await loadSchemaStatements();
  const tables = buildTableConfigs(dataset);
  
  let skipSync = false;
  const database = new DatabaseSync(databasePath);
  try {
    database.exec("PRAGMA foreign_keys = ON;");
    if (!force && dataset.source_last_modified) {
      try {
        const statement = database.prepare(
          'SELECT value FROM "sync_metadata" WHERE "key" = ? LIMIT 1'
        );
        const row = statement.get("source_last_modified") as
          | { value?: unknown }
          | undefined;
        const current =
          typeof row?.value === "string" ? (row.value as string) : null;
        if (current) {
          const storedTime = Date.parse(current);
          const incomingTime = Date.parse(dataset.source_last_modified);
          if (
            !Number.isNaN(storedTime) &&
            !Number.isNaN(incomingTime) &&
            storedTime >= incomingTime
          ) {
            skipSync = true;
          }
        }
      } catch (error) {
        if (!isMissingTableError(error)) {
          throw error;
        }
      }
    }
  } finally {
    database.close();
  }

  if (skipSync) {
    console.log(
      `SQLite dataset already up-to-date (Last-Modified: ${
        dataset.source_last_modified ?? "unknown"
      }). Use --force to override.`
    );
    return;
  }

  const scriptParts: string[] = [
    "PRAGMA foreign_keys = ON;",
    "BEGIN TRANSACTION;",
  ];
  scriptParts.push(...schemaStatements);

  for (const table of tables) {
    scriptParts.push(...generateUpsertStatements(table));
  }

  scriptParts.push(
    buildMetadataUpsertStatement("last_sync_at", new Date().toISOString())
  );
  if (dataset.source_last_modified) {
    scriptParts.push(
      buildMetadataUpsertStatement(
        "source_last_modified",
        dataset.source_last_modified
      )
    );
  }

  scriptParts.push("COMMIT;");

  const script = scriptParts.join("\n") + "\n";
  await runSqliteScript(databasePath, script);
}

function buildMetadataUpsertStatement(key: string, value: string): string {
  const escapedValue = value.replace(/'/g, "''");
  return (
    `INSERT INTO "sync_metadata" ("key", "value") VALUES ('${key.replace(
      /'/g,
      "''"
    )}', '${escapedValue}') ` +
    'ON CONFLICT("key") DO UPDATE SET "value" = excluded."value";'
  );
}

async function ensureDirectoryExists(databasePath: string): Promise<void> {
  if (databasePath === ":memory:") return;
  const dir = path.dirname(databasePath);
  if (!dir || dir === "." || dir === "") return;
  await fs.mkdir(dir, { recursive: true });
}

async function loadSchemaStatements(): Promise<string[]> {
  const schemaPath = path.join(__dirname, "schema.sql");
  const schemaContent = await fs.readFile(schemaPath, "utf8");

  return schemaContent
    .split(/;\s*(?:\r?\n|$)/)
    .map((statement) => statement.trim())
    .filter((statement) => statement.length > 0)
    .map((statement) => `${statement};`);
}

function buildTableConfigs(dataset: Dataset): TableConfig[] {
  const regionRows: Row[] = dataset.regions.map((region) =>
    REGION_FIELDS.map((column) => (region[column] ?? null) as string | null)
  );

  const provinceRows: Row[] = dataset.provinces.map((province) =>
    PROVINCE_FIELDS.map((column) => (province[column] ?? null) as string | null)
  );

  const municipalityRows: Row[] = dataset.municipalities.map((municipality) =>
    MUNICIPALITY_FIELDS.map((column) => {
      if (column === "is_provincial_capital") {
        return municipality.is_provincial_capital ? 1 : 0;
      }
      const value = municipality[column];
      return (value ?? null) as string | number | null;
    })
  );

  const legendRows: Row[] = dataset.legend.map((item) =>
    FIELD_LEGEND_FIELDS.map((column) => (item[column] ?? null) as string | null)
  );

  const noteEntries = noteMapToEntries(dataset.notes);
  const noteRows: Row[] = noteEntries.map((entry) =>
    NOTE_FIELDS.map((column) => (entry[column] ?? null) as string | null)
  );

  return [
    {
      name: "regions",
      columns: REGION_FIELDS as string[],
      primaryKey: "istat_region_code",
      rows: regionRows,
    },
    {
      name: "provinces",
      columns: PROVINCE_FIELDS as string[],
      primaryKey: "uts_code",
      rows: provinceRows,
    },
    {
      name: "municipalities",
      columns: MUNICIPALITY_FIELDS as string[],
      primaryKey: "istat_code_alphanumeric",
      rows: municipalityRows,
    },
    {
      name: "legend",
      columns: FIELD_LEGEND_FIELDS as string[],
      primaryKey: "field",
      rows: legendRows,
    },
    {
      name: "notes",
      columns: NOTE_FIELDS as string[],
      primaryKey: "note_id",
      rows: noteRows,
    },
  ];
}

function generateUpsertStatements(table: TableConfig): string[] {
  if (table.rows.length === 0) return [];

  const columnList = table.columns.map((column) => `"${column}"`).join(", ");
  const updateColumns = table.columns.filter(
    (column) => column !== table.primaryKey
  );
  const updateClause =
    updateColumns.length > 0
      ? updateColumns
          .map((column) => `"${column}" = excluded."${column}"`)
          .join(", ")
      : "";

  return table.rows.map((row) => {
    const values = row.map((value) => toSqliteValue(value)).join(", ");
    let sql = `INSERT INTO "${table.name}" (${columnList}) VALUES (${values})`;
    if (updateClause) {
      sql += ` ON CONFLICT("${table.primaryKey}") DO UPDATE SET ${updateClause};`;
    } else {
      sql += ` ON CONFLICT("${table.primaryKey}") DO NOTHING;`;
    }
    return sql;
  });
}

function toSqliteValue(value: string | number | null): string {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number") {
    return Number.isFinite(value) ? value.toString() : "NULL";
  }
  const escaped = value.replace(/'/g, "''");
  return `'${escaped}'`;
}

async function runSqliteScript(
  databasePath: string,
  script: string
): Promise<void> {
  const database = new DatabaseSync(databasePath);
  try {
    database.exec(script);
  } finally {
    database.close();
  }
}

function isMissingTableError(error: unknown): boolean {
  return error instanceof Error && /no such table/i.test(error.message ?? "");
}
