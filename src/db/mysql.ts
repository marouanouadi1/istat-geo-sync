import mysql from "mysql2/promise";
import { MySqlConfig } from "../config";
import {
  Dataset,
  Municipality,
  MUNICIPALITY_FIELDS,
  Province,
  PROVINCE_FIELDS,
  Region,
  REGION_FIELDS,
} from "../models";

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
  const statements = [
    `CREATE TABLE IF NOT EXISTS \`regions\` (
      \`istat_region_code\` VARCHAR(32) NOT NULL,
      \`region_name\` VARCHAR(255) NOT NULL,
      \`geo_partition_code\` VARCHAR(32) NOT NULL,
      \`geo_partition_name\` VARCHAR(255) NOT NULL,
      \`nuts1_2021\` VARCHAR(32) NULL,
      \`nuts2_2021\` VARCHAR(32) NULL,
      \`nuts1_2024\` VARCHAR(32) NULL,
      \`nuts2_2024\` VARCHAR(32) NULL,
      PRIMARY KEY (\`istat_region_code\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
    `CREATE TABLE IF NOT EXISTS \`provinces\` (
      \`uts_code\` VARCHAR(32) NOT NULL,
      \`uts_name\` VARCHAR(255) NOT NULL,
      \`uts_type\` VARCHAR(32) NOT NULL,
      \`car_code\` VARCHAR(32) NULL,
      \`region_code\` VARCHAR(32) NOT NULL,
      \`region_name\` VARCHAR(255) NOT NULL,
      \`nuts3_2021\` VARCHAR(32) NULL,
      \`nuts3_2024\` VARCHAR(32) NULL,
      PRIMARY KEY (\`uts_code\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
    `CREATE TABLE IF NOT EXISTS \`municipalities\` (
      \`istat_code_alphanumeric\` VARCHAR(32) NOT NULL,
      \`istat_code_numeric\` VARCHAR(32) NOT NULL,
      \`istat_code_numeric_110\` VARCHAR(32) NULL,
      \`istat_code_numeric_107\` VARCHAR(32) NULL,
      \`istat_code_numeric_103\` VARCHAR(32) NULL,
      \`cadastral_code\` VARCHAR(32) NULL,
      \`name_it\` VARCHAR(255) NOT NULL,
      \`name_alt\` VARCHAR(255) NULL,
      \`is_provincial_capital\` TINYINT(1) NOT NULL,
      \`province_uts_code\` VARCHAR(32) NOT NULL,
      \`province_code_storico\` VARCHAR(32) NOT NULL,
      \`province_progressive\` VARCHAR(32) NOT NULL,
      \`region_code\` VARCHAR(32) NOT NULL,
      \`region_name\` VARCHAR(255) NOT NULL,
      \`nuts3_2021\` VARCHAR(32) NULL,
      \`nuts3_2024\` VARCHAR(32) NULL,
      PRIMARY KEY (\`istat_code_alphanumeric\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`,
  ];

  for (const statement of statements) {
    await connection.query(statement);
  }
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
