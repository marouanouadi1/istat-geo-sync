# istat-geo-sync

[![npm version](https://badge.fury.io/js/istat-geo-sync.svg)](https://www.npmjs.com/package/istat-geo-sync)
[![CI](https://github.com/marouanouadi1/istat-geo-sync/actions/workflows/ci.yml/badge.svg)](https://github.com/marouanouadi1/istat-geo-sync/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D22.5.0-brightgreen)](https://nodejs.org/)

Download and sync official ISTAT geographic data (Regions, Provinces, Municipalities) to your database or export to CSV/JSON. Simple, fast, and always up-to-date with the latest ISTAT releases.

## Features

- 🇮🇹 **Official ISTAT data**: Italian Regions, Provinces, and Municipalities always up-to-date
- 🗄️ **Multi-database support**: PostgreSQL, MySQL, SQLite
- 📊 **Flexible export**: CSV or JSON formats
- 🔄 **Smart sync**: Updates only when ISTAT data changes
- ⚡ **Easy to use**: Simple and intuitive CLI commands
- 🐳 **Docker ready**: Quick setup with Docker Compose

## Installation

```bash
npm install -g istat-geo-sync
```

**Requirements**: Node.js >= 22.5.0

## Quick Start

### Export data to JSON or CSV

Export all municipalities to JSON:

```bash
istat-geo-sync export municipalities --format json --out ./data
```

Export regions, provinces, and municipalities to CSV:

```bash
istat-geo-sync export all --format csv --out ./export
```

### Sync to database

**PostgreSQL:**

```bash
istat-geo-sync sync-database \
  --type postgres \
  --host localhost \
  --port 5432 \
  --user postgres \
  --password yourpassword \
  --database istat_geo
```

**MySQL:**

```bash
istat-geo-sync sync-database \
  --type mysql \
  --host localhost \
  --port 3306 \
  --user root \
  --password yourpassword \
  --database istat_geo
```

**SQLite:**

```bash
istat-geo-sync sync-database \
  --type sqlite \
  --database ./data/istat.db
```

## Complete Guide

### `export` command

Export ISTAT geographic data to CSV or JSON files.

**Syntax:**

```bash
istat-geo-sync export <entity> --format <format> [options]
```

**Available entities:**

- `regions` - Italian regions
- `provinces` - Provinces and metropolitan cities
- `municipalities` - Italian municipalities
- `legend` - Field legend
- `notes` - ISTAT notes
- `all` - All of the above

**Options:**

| Option         | Description                                          | Default                 |
| -------------- | ---------------------------------------------------- | ----------------------- |
| `-f, --format` | Output format: `csv` or `json`                       | **required**            |
| `-o, --out`    | Output directory                                     | `out`                   |
| `--filename`   | Filename pattern (use `{entity}`, `{date}`, `{ext}`) | `{date}-{entity}.{ext}` |

**Examples:**

```bash
# Export only municipalities to JSON
istat-geo-sync export municipalities --format json

# Export everything to CSV in a specific folder
istat-geo-sync export all --format csv --out ./istat-data

# Export provinces with custom filename
istat-geo-sync export provinces --format json --filename "provinces-{date}.{ext}"
```

### `sync-database` command

Sync ISTAT data directly to your database.

**Syntax:**

```bash
istat-geo-sync sync-database [options]
```

**Options:**

| Option       | Description                                  | Default                      |
| ------------ | -------------------------------------------- | ---------------------------- |
| `--type`     | Database type: `mysql`, `postgres`, `sqlite` | `mysql`                      |
| `--database` | Database name (or file path for SQLite)      | **required**                 |
| `--host`     | Database host (MySQL/PostgreSQL)             | -                            |
| `--port`     | Database port                                | -                            |
| `--user`     | Database username                            | -                            |
| `--password` | Database password                            | -                            |
| `--config`   | Path to JSON config file                     | `istat-geo-sync.config.json` |
| `--force`    | Force sync even if data hasn't changed       | `false`                      |

**Examples:**

```bash
# Sync to MySQL
istat-geo-sync sync-database \
  --type mysql \
  --host localhost \
  --user root \
  --password secret \
  --database istat_geo

# Sync to SQLite (simpler!)
istat-geo-sync sync-database \
  --type sqlite \
  --database ./istat.db

# Force sync (ignore last modified check)
istat-geo-sync sync-database --type postgres --force
```

## Configuration File

You can use a JSON configuration file to avoid typing all parameters every time:

**Create `istat-geo-sync.config.json`:**

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

**Use the configuration file:**

```bash
# Use default configuration (istat-geo-sync.config.json)
istat-geo-sync sync-database

# Specify a custom configuration file
istat-geo-sync sync-database --config ./my-config.json
```

## Local Testing with Docker

If you want to test the tool with local databases without installing anything on your system:

```bash
# Start PostgreSQL and MySQL in containers
docker compose up -d

# This starts:
# - PostgreSQL on localhost:5432 (user: postgres, password: postgres, database: istat_geo)
# - MySQL on localhost:3306 (user: root, password: mysql, database: istat_geo)
```

Now you can sync data to these test databases:

```bash
# Test with PostgreSQL
istat-geo-sync sync-database \
  --type postgres \
  --host localhost \
  --port 5432 \
  --user postgres \
  --password postgres \
  --database istat_geo

# Test with MySQL
istat-geo-sync sync-database \
  --type mysql \
  --host localhost \
  --port 3306 \
  --user root \
  --password mysql \
  --database istat_geo
```

When you're done:

```bash
docker compose down
```

## Database Structure

The `sync-database` command automatically creates these tables in your database:

| Table            | Content                                 |
| ---------------- | --------------------------------------- |
| `regions`        | Italian regions with NUTS codes         |
| `provinces`      | Provinces and metropolitan cities (UTS) |
| `municipalities` | All Italian municipalities              |
| `legend`         | Field metadata descriptions             |
| `notes`          | ISTAT notes and annotations             |
| `sync_metadata`  | Last sync timestamps tracking           |

**You don't need to create tables manually** - the tool does it automatically!

## FAQ

### Which database should I use?

- **SQLite**: The simplest! Perfect for small projects or testing. No installation needed, just specify the file path.
- **PostgreSQL/MySQL**: For production applications or high traffic scenarios.

### How often is ISTAT data updated?

ISTAT periodically updates the list of Italian municipalities. The tool automatically checks for changes and syncs only when necessary. You can force an update with the `--force` option.

### Is data overwritten or updated?

The tool uses **smart upsert logic**: it updates existing records and inserts new ones, maintaining your data integrity.

### How do I get only municipalities from a specific region?

After syncing data to your database, you can run normal SQL queries. For example:

```sql
-- Municipalities in Lombardy
SELECT m.* FROM municipalities m
JOIN regions r ON m.region_code = r.code
WHERE r.name = 'Lombardia';
```

### Can I automate synchronization?

Yes! You can create a cronjob or scheduled task to run the command periodically:

```bash
# Example cronjob (daily at 3 AM)
0 3 * * * /usr/local/bin/istat-geo-sync sync-database --config /path/to/config.json
```

## For Developers

If you want to integrate this tool into your code:

```bash
npm install istat-geo-sync
```

```typescript
import { fetchIstatWorkbook, buildDataset, syncDataset } from "istat-geo-sync";

// Your code here...
```

For more details on the programmatic API, check the source code or open an issue on GitHub.

## Contributing

Contributions are welcome! Feel free to open a Pull Request or report issues on GitHub.

## License

[MIT](LICENSE) © Marouan Ouadi

## Links

- 📦 [npm package](https://www.npmjs.com/package/istat-geo-sync)
- 💻 [GitHub repository](https://github.com/marouanouadi1/istat-geo-sync)
- 📊 [Official ISTAT data source](https://www.istat.it/it/archivio/6789)
- 📝 [Changelog](CHANGELOG.md)
