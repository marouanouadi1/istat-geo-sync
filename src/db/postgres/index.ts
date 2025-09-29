import path from "path";
import { SyncOptions } from "..";
import { DatabaseConfig } from "../../config";
import {
  Dataset,
  Municipality,
  MUNICIPALITY_FIELDS,
  Province,
  PROVINCE_FIELDS,
  Region,
  REGION_FIELDS,
} from "../../models";
import { Pool, PoolClient } from "pg";
import { readFile } from "fs/promises";
export async function syncDatasetToPostgres(
  config: DatabaseConfig,
  dataset: Dataset
): Promise<void> {
  const pool = new Pool({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
  });

  const client = await pool.connect();

  try {
    await ensureTablesExist(client);
    await client.query("BEGIN");
    await upsertRegions(client, dataset.regions);
    await upsertProvinces(client, dataset.provinces);
    await upsertMunicipalities(client, dataset.municipalities);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

async function ensureTablesExist(client: PoolClient): Promise<void> {
  const statements = await loadSchemaStatements();

  for (const statement of statements) {
    await client.query(statement);
  }
}

async function loadSchemaStatements(): Promise<string[]> {
  const schemaPath = path.join(__dirname, "schema.sql");
  const schemaContent = await readFile(schemaPath, "utf8");

  return schemaContent
    .split(/;\s*(?:\r?\n|$)/)
    .map((statement) => statement.trim())
    .filter((statement) => statement.length > 0)
    .map((statement) => `${statement};`);
}

async function upsertRegions(
  client: PoolClient,
  regions: Region[]
): Promise<void> {
  const rows = regions.map((region) =>
    REGION_FIELDS.map((column) => region[column] ?? null)
  );

  await bulkUpsert(client, "regions", REGION_FIELDS, "istat_region_code", rows);
}

async function upsertProvinces(
  client: PoolClient,
  provinces: Province[]
): Promise<void> {
  const rows = provinces.map((province) =>
    PROVINCE_FIELDS.map((column) => province[column] ?? null)
  );

  await bulkUpsert(client, "provinces", PROVINCE_FIELDS, "uts_code", rows);
}

async function upsertMunicipalities(
  client: PoolClient,
  municipalities: Municipality[]
): Promise<void> {
  const rows = municipalities.map((municipality) =>
    MUNICIPALITY_FIELDS.map((column) => {
      if (column === "is_provincial_capital") {
        return Boolean(municipality.is_provincial_capital);
      }
      return municipality[column] ?? null;
    })
  );

  await bulkUpsert(
    client,
    "municipalities",
    MUNICIPALITY_FIELDS,
    "istat_code_alphanumeric",
    rows
  );
}

async function bulkUpsert(
  client: PoolClient,
  table: string,
  columns: string[],
  primaryKey: string,
  rows: (any | null)[][]
): Promise<void> {
  if (rows.length === 0) return;

  const updateColumns = columns.filter((column) => column !== primaryKey);
  const columnList = columns.map((column) => `"${column}"`).join(", ");
  const updateClause = updateColumns
    .map((column) => `"${column}" = EXCLUDED."${column}"`)
    .join(", ");

  const MAX_PARAMS = 65535;
  const maxRowsPerBatch = Math.max(1, Math.floor(MAX_PARAMS / columns.length));

  for (let start = 0; start < rows.length; start += maxRowsPerBatch) {
    const batchRows = rows.slice(start, start + maxRowsPerBatch);

    const values: (any | null)[] = [];
    const placeholders = batchRows
      .map((row, rowIndex) => {
        const rowPlaceholders = row
          .map(
            (_, columnIndex) =>
              `$${rowIndex * columns.length + columnIndex + 1}`
          )
          .join(", ");
        values.push(...row);
        return `(${rowPlaceholders})`;
      })
      .join(", ");

    const sql =
      `INSERT INTO "${table}" (${columnList}) VALUES ${placeholders} ` +
      `ON CONFLICT ("${primaryKey}") DO UPDATE SET ${updateClause}`;

    await client.query(sql, values);
  }
}
