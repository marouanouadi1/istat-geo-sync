# istat-geo-sync Development Guide

## Project Overview

CLI tool and npm package for syncing Italian ISTAT geographic data (Regions/Provinces/Municipalities) to databases or exporting to JSON/CSV. Fetches official ISTAT Excel files, normalizes data, and provides smart caching with HTTP conditional requests.

**Key characteristics:**

- Node.js ≥22.5.0 (uses `--experimental-sqlite` flag for native SQLite)
- TypeScript with strict mode enabled
- Zero-dependency CLI (uses native Node.js test runner)
- Dual-purpose: CLI tool (`bin/istat-geo-sync`) and programmatic API

## Architecture & Data Flow

### Three-Layer Architecture

1. **Data Acquisition** (`src/istat.ts`):

   - `fetchIstatWorkbook()`: Downloads ISTAT Excel file with HTTP caching (ETags, Last-Modified)
   - Cache location: `~/.cache/istat-geo-sync/` (Linux/macOS) or `%LOCALAPPDATA%/istat-geo-sync` (Windows)
   - `buildDataset()`: Parses 3 sheets (data, notes, legend) into normalized TypeScript models

2. **Processing Layer** (`src/models.ts`):

   - Normalizes Italian ISTAT headers (e.g., "Codice regione" → `codice_regione`)
   - De-duplicates regions and provinces from flattened municipality data
   - Preserves NUTS codes (2021 & 2024 versions) and historical province codes

3. **Output Layer**:
   - **Export** (`src/export.ts`): Writes JSON/CSV with filename patterns (`{date}-{entity}.{ext}`)
   - **Database Sync** (`src/db/`): Upserts to PostgreSQL, MySQL, or SQLite with smart `sync_metadata` tracking

### Database Strategy

Each database adapter (`src/db/{postgres,mysql,sqlite}/index.ts`) follows the same pattern:

- **Schema creation**: Auto-creates tables from `schema.sql` if missing
- **Smart sync**: Compares `source_last_modified` in `sync_metadata` table to skip unnecessary syncs
- **Bulk upserts**: Uses `ON CONFLICT` (PostgreSQL/SQLite) or `ON DUPLICATE KEY UPDATE` (MySQL)
- **Batching**: PostgreSQL chunks at 65535 params; MySQL at 1000 rows

**Important**: Boolean `is_provincial_capital` stored as `TINYINT(1)` in MySQL, `BOOLEAN` elsewhere.

## Development Workflows

### Running Tests

```bash
# Uses native Node.js test runner (no Jest/Mocha)
npm test

# Tests use mocked XLSX responses and temp directories
# See test/istat.test.ts for fetch stubbing patterns
```

### Building & Type Checking

```bash
npm run typecheck  # No emit, validates types
npm run build      # Compiles to dist/ with .d.ts declarations
```

### Local Database Testing

```bash
# Start PostgreSQL & MySQL containers
docker compose up -d

# Test PostgreSQL sync
npx tsx src/command.ts sync-database \
  --type postgres \
  --host localhost \
  --user postgres \
  --password postgres \
  --database istat_geo

# SQLite (no Docker needed)
npx tsx src/command.ts sync-database \
  --type sqlite \
  --database ./test.db
```

## Code Conventions

### TypeScript Patterns

- **Strict null checks**: Always use `?? null` for optional fields (never `?? undefined` in models)
- **Type guards**: Use `=== null` checks, not `!value` (preserves empty strings)
- **Field ordering**: Model fields match CSV column order (see `*_FIELDS` constants in `src/models.ts`)

Example from `src/models.ts`:

```typescript
export type Municipality = {
  istat_code_alphanumeric: string; // Required
  cadastral_code?: string | null; // Optional with explicit null
  // ...
};

// MUNICIPALITY_FIELDS must match property order for CSV export
export const MUNICIPALITY_FIELDS: (keyof Municipality)[] = [
  "istat_code_alphanumeric",
  "cadastral_code",
  // ...
];
```

### Database Common Utilities

All database adapters use `src/db/common.ts` helpers:

- `buildRegionRows()`, `buildProvinceRows()`, `buildMunicipalityRows()`
- `booleanAsNumber` option: MySQL converts booleans to 0/1

### Error Handling

- **Cache failures**: Silently ignored (network errors shouldn't break CLI)
- **Database errors**: Wrapped in transactions with `ROLLBACK`
- **Missing config**: Throws clear error messages mentioning `--database` or config file

## Testing Patterns

### Mocking XLSX Data

```typescript
const dataSheet = XLSX.utils.aoa_to_sheet([
  ["Codice regione", "Denominazione Regione"],
  ["01", "Piemonte"],
]);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, dataSheet, "Elenco");
```

### Mocking HTTP Fetch

Use `globalThis.fetch` override with Response objects:

```typescript
const stubFetch: typeof fetch = async (_input, init) => {
  return new Response(workbookBuffer, {
    status: 200,
    headers: { "Last-Modified": "Tue, 02 Jan 2024 03:04:05 GMT" },
  });
};
globalThis.fetch = stubFetch;
```

### Temporary Directories

Always clean up with `rm(tmpRoot, { recursive: true, force: true })` in finally blocks.

## Key Files Reference

- **`src/command.ts`**: CLI entry point with Commander.js definitions
- **`src/istat.ts`**: ISTAT API client, caching, header normalization logic
- **`src/db/common.ts`**: Shared database utilities (row builders, schema loader)
- **`src/db/postgres/schema.sql`**: Table definitions (reference for other DBs)
- **`config-example.json`**: Shows database connection structure

## Common Pitfalls

1. **SQLite requires Node.js flag**: CLI uses `#!/usr/bin/env -S node --experimental-sqlite`
2. **XLSX header normalization**: Use `mapHeaderToKey()` for Italian → snake_case conversion
3. **MySQL param limits**: Batch at 1000 rows (PostgreSQL: 65535 params ÷ column count)
4. **Cache env override**: Set `ISTAT_GEO_SYNC_CACHE_DIR` for testing to avoid polluting user cache
5. **Config file resolution**: Defaults to `./istat-geo-sync.config.json` (relative to cwd, not `__dirname`)

## Publishing

```bash
# Triggered by GitHub Release (see .github/workflows/publish.yml)
npm run prepublishOnly  # Runs typecheck + build
npm publish --provenance --access public
```

**Pre-publish checklist**: Update version in `package.json`, tag release on GitHub, CI must pass.
