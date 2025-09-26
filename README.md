# istat-geo-sync
A small TypeScript + CLI package that downloads the official ISTAT “Elenco dei comuni italiani” dataset, normalizes Regions/Provinces/Municipalities, and exports to CSV/JSON and/or upserts into your DB (PostgreSQL/MySQL/SQLite). Designed to be re-usable across projects and easy to keep in sync with new ISTAT releases.

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
