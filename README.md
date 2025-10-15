# istat-geo-sync

[![npm version](https://badge.fury.io/js/istat-geo-sync.svg)](https://www.npmjs.com/package/istat-geo-sync)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A TypeScript CLI and library that downloads the official ISTAT "Elenco dei comuni italiani" dataset, normalizes Regions/Provinces/Municipalities, and exports to CSV/JSON and/or syncs into your database (PostgreSQL/MySQL/SQLite). Designed to be re-usable across projects and easy to keep in sync with new ISTAT releases.

## Features

- 📦 **CLI tool** for quick exports and database synchronization
- 📚 **Programmatic API** for integration into your applications
- 🗄️ **Multi-database support**: PostgreSQL, MySQL, SQLite
- 📊 **Multiple export formats**: CSV, JSON
- 🇮🇹 **Complete Italian geographic data**: Regions, Provinces, Municipalities
- 📝 **Includes metadata**: Field legend and notes from ISTAT
- 🔄 **Smart sync**: Only updates when source data changes (unless forced)
- 🐳 **Docker ready**: Includes Docker Compose setup for development

## Installation

### Global installation (CLI)

```bash
npm install -g istat-geo-sync
```

### Local installation (as a library)

```bash
npm install istat-geo-sync
```

**Requirements**: Node.js >= 22.5.0 (required for native SQLite support)

## Quick Start

### CLI Usage

Export municipalities to JSON:
```bash
istat-geo-sync export municipalities --format json --out ./data
```

Export all entities to CSV:
```bash
istat-geo-sync export all --format csv --out ./exports
```

Sync to PostgreSQL:
```bash
istat-geo-sync sync-database \
  --type postgres \
  --host localhost \
  --port 5432 \
  --user postgres \
  --password yourpassword \
  --database istat_geo
```

Sync to SQLite:
```bash
istat-geo-sync sync-database \
  --type sqlite \
  --database ./data/istat.db
```

### Programmatic Usage

```typescript
import { fetchIstatWorkbook, buildDataset, exportData, syncDataset } from 'istat-geo-sync';

// Fetch and build dataset
const { workbook, lastModified } = await fetchIstatWorkbook();
const dataset = buildDataset(workbook, { sourceLastModified: lastModified });

// Export to files
await exportData(dataset, 'municipalities', 'json', './output', '{entity}.{ext}');

// Or sync to database
await syncDataset({
  database: 'postgres',
  config: {
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'yourpassword',
    database: 'istat_geo'
  }
}, dataset);
```

## CLI Commands

### `export`

Export normalized datasets to files.

```bash
istat-geo-sync export <entity> --format <format> [options]
```

**Entities**: `regions`, `provinces`, `municipalities`, `legend`, `notes`, `all`

**Options**:
- `-f, --format <format>`: Output format (`csv` or `json`) - **required**
- `-o, --out <dir>`: Output directory (default: `out`)
- `--filename <pattern>`: Filename pattern with placeholders: `{entity}`, `{date}`, `{ext}` (default: `{date}-{entity}.{ext}`)

**Examples**:
```bash
# Export municipalities as JSON
istat-geo-sync export municipalities --format json

# Export all entities as CSV to custom directory
istat-geo-sync export all --format csv --out ./data

# Custom filename pattern
istat-geo-sync export provinces --format json --filename "province-{date}.{ext}"
```

### `sync-database`

Sync the dataset to a database with automatic upsert logic.

```bash
istat-geo-sync sync-database [options]
```

**Options**:
- `--type <type>`: Database type: `mysql`, `postgres`, or `sqlite` (default: `mysql`)
- `--database <name>`: Database name (or file path for SQLite) - **required**
- `--host <host>`: Database host (for MySQL/PostgreSQL)
- `--port <number>`: Database port
- `--user <user>`: Database user
- `--password <password>`: Database password
- `--config <path>`: Path to JSON config file (default: `istat-geo-sync.config.json`)
- `--force`: Force sync even if remote dataset hasn't changed

**Examples**:
```bash
# Sync to MySQL
istat-geo-sync sync-database \
  --type mysql \
  --host localhost \
  --user root \
  --password secret \
  --database istat_geo

# Sync to SQLite
istat-geo-sync sync-database \
  --type sqlite \
  --database ./istat.db

# Force sync (ignore last modified check)
istat-geo-sync sync-database --type postgres --force
```

## Configuration File

You can use a JSON configuration file instead of CLI arguments:

```json
{
  "database": {
    "type": "postgres",
    "host": "localhost",
    "port": 5432,
    "user": "postgres",
    "password": "yourpassword",
    "database": "istat_geo"
  }
}
```

Use it with:
```bash
istat-geo-sync sync-database --config ./my-config.json
```

## API Reference

### `fetchIstatWorkbook()`

Fetches the ISTAT workbook from the official source.

```typescript
const { workbook, lastModified } = await fetchIstatWorkbook();
```

**Returns**: `Promise<{ workbook: WorkBook, lastModified: string | null }>`

### `buildDataset(workbook, options)`

Builds a normalized dataset from the ISTAT workbook.

```typescript
const dataset = buildDataset(workbook, { sourceLastModified: lastModified });
```

**Parameters**:
- `workbook`: XLSX WorkBook object
- `options.sourceLastModified`: Optional last modified timestamp

**Returns**: `Dataset` object containing regions, provinces, municipalities, legend, and notes

### `exportData(dataset, entity, format, outDir, filenamePattern)`

Exports dataset to files.

```typescript
await exportData(dataset, 'municipalities', 'json', './output', '{entity}.{ext}');
```

### `syncDataset(config, dataset)`

Syncs dataset to a database.

```typescript
await syncDataset({
  database: 'postgres',
  config: { host: 'localhost', port: 5432, user: 'postgres', password: 'pass', database: 'db' },
  force: false
}, dataset);
```

### Types

```typescript
import type { 
  Region, 
  Province, 
  Municipality, 
  Dataset,
  FieldLegend,
  NoteMap,
  NoteEntry,
  DatabaseType 
} from 'istat-geo-sync';
```

## Development Setup

### Quick start with Docker Compose

To keep everything self-contained you can run the CLI and the optional databases entirely through Docker Compose.

```bash
docker compose up -d
```

The command above starts:

- **CLI** based on the official `node:latest` image (Node.js 22 at the time of writing) with the project mounted at `/app`.
- **PostgreSQL** on `localhost:5432` with credentials `postgres` / `postgres` and a pre-created `istat_geo` database.
- **MySQL** on `localhost:3306` with credentials `istat` / `istat` (or the `root` user with password `mysql`) and a pre-created `istat_geo` database.

Update your local configuration (for example `config.json`) with these connection details whenever you want the CLI to talk to the containers.

Inside the running CLI container you can install dependencies and run the TypeScript commands without touching your host machine:

```bash
# Install dependencies (stored in the named node_modules volume)
docker compose exec cli npm install

# Run the CLI (replace arguments as needed)
docker compose exec cli npx tsx src/command.ts --help

# Drop into a shell if you prefer an interactive session
docker compose exec cli bash
```

When you are done, stop the services with:

```bash
docker compose down
```

## Database Schema

The sync commands create the following tables:

- `regions`: Italian regions with NUTS codes
- `provinces`: Provinces/Metropolitan cities (UTS)
- `municipalities`: All Italian municipalities (comuni)
- `legend`: Field metadata and descriptions
- `notes`: ISTAT notes and annotations
- `sync_metadata`: Tracks last sync timestamps

Schema files are available in `src/db/{mysql,postgres,sqlite}/schema.sql`.

## Data Details

### SQLite support

You can also sync the dataset into a local SQLite database file by running the CLI with `--type sqlite`. The `--database` option (or the corresponding config entry) should point to the SQLite file path. The file is created automatically if it does not exist, and the command reuses the same schema used for MySQL/PostgreSQL.

### Legend and notes exports

Both the file exporter and the SQL sync commands now include the ISTAT legend and notes sheets. Use `legend` or `notes` with the `export` command (or `all` to include everything). Notes are exported as a keyed JSON object or as a CSV table with `note_id` and `text` columns, while legend rows include field metadata such as the description, year, and source.

### Data source choice (XLSX vs CSV)

By default this project uses the official **XLSX** file rather than the CSV. Parsing XLSX is **~40× slower** in my tests (median **1,027.98 ms** vs **24.70 ms**; **+4062%** parsing-only, 7 runs), but the total runtime stays reasonable for this dataset and XLSX provides **additional sheets** (notes, legend) that I use to enrich/validate the data. Given that the “Comuni” dataset size is relatively stable, I prefer the richer XLSX source over the faster CSV.

<details>
<summary><strong>Benchmark details (parsing-only)</strong></summary>

| Format | Runs | Median ms | Mean ms | Stdev ms |
| -----: | ---: | --------: | ------: | -------: |
|    CSV |    7 |     24.70 |   25.21 |     2.76 |
|   XLSX |    7 |   1027.98 | 1057.24 |    66.80 |

- XLSX vs CSV (median): **+4062.0%** slower
- XLSX vs CSV (mean): **+4093.6%** slower

_Note: benchmark isolates **parsing/manipulation only** (network excluded)._

</details>

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

[MIT](LICENSE) © Marouan Ouadi

## Links

- [npm package](https://www.npmjs.com/package/istat-geo-sync)
- [GitHub repository](https://github.com/marouanouadi1/istat-geo-sync)
- [ISTAT Official Data Source](https://www.istat.it/it/archivio/6789)

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history and updates.

