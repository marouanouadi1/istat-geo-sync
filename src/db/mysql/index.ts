import mysql from "mysql2/promise";
import { MySqlConfig } from "../../config";
import {
  Dataset,
  Municipality,
  MUNICIPALITY_FIELDS,
  Province,
  PROVINCE_FIELDS,
  Region,
  REGION_FIELDS,
} from "../../models";
import path from "path";
import { readFile } from "fs/promises";

export async function syncDatasetToMySql(
  config: MySqlConfig,
  dataset: Dataset
): Promise<void> {
  const pool = mysql.createPool({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    database: config.database,
    waitForConnections: true,
  });

  const connection = await pool.getConnection();

  try {
    await ensureTablesExist(connection);
    await connection.beginTransaction();
    await upsertRegions(connection, dataset.regions);
    await upsertProvinces(connection, dataset.provinces);
    await upsertMunicipalities(connection, dataset.municipalities);
    await connection.commit();
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
    await pool.end();
  }
}

async function ensureTablesExist(connection: mysql.PoolConnection) {
  const statements = await loadSchemaStatements();

  for (const statement of statements) {
    await connection.query(statement);
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
  connection: mysql.PoolConnection,
  regions: Region[]
) {
  const rows = regions.map((region) =>
    REGION_FIELDS.map((column) => region[column] ?? null)
  );

  await bulkUpsert(
    connection,
    "regions",
    REGION_FIELDS,
    "istat_region_code",
    rows
  );
}

async function upsertProvinces(
  connection: mysql.PoolConnection,
  provinces: Province[]
) {
  const rows = provinces.map((province) =>
    PROVINCE_FIELDS.map((column) => province[column] ?? null)
  );

  await bulkUpsert(connection, "provinces", PROVINCE_FIELDS, "uts_code", rows);
}

async function upsertMunicipalities(
  connection: mysql.PoolConnection,
  municipalities: Municipality[]
) {
  const rows = municipalities.map((municipality) =>
    MUNICIPALITY_FIELDS.map((column) => {
      const value = municipality[column];
      if (column === "is_provincial_capital") {
        return municipality.is_provincial_capital ? 1 : 0;
      }
      return value ?? null;
    })
  );

  await bulkUpsert(
    connection,
    "municipalities",
    MUNICIPALITY_FIELDS,
    "istat_code_alphanumeric",
    rows
  );
}

async function bulkUpsert(
  connection: mysql.PoolConnection,
  table: string,
  columns: string[],
  primaryKey: string,
  rows: (any | null)[][]
) {
  if (rows.length === 0) return;

  const updateColumns = columns.filter((column) => column !== primaryKey);
  const columnList = columns.map((column) => `\`${column}\``).join(", ");
  const updateClause = updateColumns
    .map((column) => `\`${column}\` = VALUES(\`${column}\`)`)
    .join(", ");

  const MAX_PLACEHOLDERS = 65535;
  const maxRowsPerBatch = Math.max(
    1,
    Math.floor(MAX_PLACEHOLDERS / columns.length)
  );

  for (let start = 0; start < rows.length; start += maxRowsPerBatch) {
    const batchRows = rows.slice(start, start + maxRowsPerBatch);

    const placeholders = batchRows
      .map(() => `(${columns.map(() => "?").join(", ")})`)
      .join(", ");

    const sql =
      `INSERT INTO \`${table}\` (${columnList}) VALUES ${placeholders} ` +
      `ON DUPLICATE KEY UPDATE ${updateClause}`;

    const values: (any | null)[] = [];
    for (const row of batchRows) {
      values.push(...row);
    }
    await connection.execute(sql, values);
  }
}
