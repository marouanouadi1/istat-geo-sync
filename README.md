# istat-geo-sync
A small TypeScript + CLI package that downloads the official ISTAT “Elenco dei comuni italiani” dataset, normalizes Regions/Provinces/Municipalities, and exports to CSV/JSON and/or upserts into your DB (PostgreSQL/MySQL/SQLite). Designed to be re-usable across projects and easy to keep in sync with new ISTAT releases.
## Quick start with Docker Compose

To quickly spin up local PostgreSQL and MySQL instances for development and testing you can use the provided `docker-compose.yml` file.

```bash
docker compose up -d
```

The compose file exposes:

- **PostgreSQL** on `localhost:5432` with credentials `postgres` / `postgres` and a pre-created `istat_geo` database.
- **MySQL** on `localhost:3306` with credentials `istat` / `istat` (or the `root` user with password `mysql`) and a pre-created `istat_geo` database.

Update your local configuration (for example `config.json`) with these values to run the CLI against the containers. When you are done, stop the services with:

```bash
docker compose down
```


### Data source choice (XLSX vs CSV)
By default this project uses the official **XLSX** file rather than the CSV. Parsing XLSX is **~40× slower** in my tests (median **1,027.98 ms** vs **24.70 ms**; **+4062%** parsing-only, 7 runs), but the total runtime stays reasonable for this dataset and XLSX provides **additional sheets** (notes, legend) that I use to enrich/validate the data. Given that the “Comuni” dataset size is relatively stable, I prefer the richer XLSX source over the faster CSV.

<details>
<summary><strong>Benchmark details (parsing-only)</strong></summary>

| Format | Runs | Median ms | Mean ms | Stdev ms |
|-------:|-----:|----------:|--------:|---------:|
| CSV    | 7    | 24.70     | 25.21   | 2.76     |
| XLSX   | 7    | 1027.98   | 1057.24 | 66.80    |

- XLSX vs CSV (median): **+4062.0%** slower  
- XLSX vs CSV (mean): **+4093.6%** slower

_Note: benchmark isolates **parsing/manipulation only** (network excluded)._
</details>
