CREATE TABLE IF NOT EXISTS regions (
  istat_region_code  TEXT PRIMARY KEY,
  region_name        TEXT NOT NULL,
  geo_partition_code TEXT NOT NULL,
  geo_partition_name TEXT NOT NULL,
  nuts1_2021         TEXT,
  nuts2_2021         TEXT,
  nuts1_2024         TEXT,
  nuts2_2024         TEXT
);

CREATE INDEX IF NOT EXISTS idx_regions_geo_partition_code ON regions (geo_partition_code);
CREATE INDEX IF NOT EXISTS idx_regions_nuts1_2021         ON regions (nuts1_2021);
CREATE INDEX IF NOT EXISTS idx_regions_nuts2_2021         ON regions (nuts2_2021);
CREATE INDEX IF NOT EXISTS idx_regions_nuts1_2024         ON regions (nuts1_2024);
CREATE INDEX IF NOT EXISTS idx_regions_nuts2_2024         ON regions (nuts2_2024);

CREATE TABLE IF NOT EXISTS provinces (
  uts_code    TEXT PRIMARY KEY,
  uts_name    TEXT NOT NULL,
  uts_type    TEXT NOT NULL,
  car_code    TEXT,
  region_code TEXT NOT NULL,
  region_name TEXT NOT NULL,
  nuts3_2021  TEXT,
  nuts3_2024  TEXT,
  FOREIGN KEY (region_code)
    REFERENCES regions (istat_region_code)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_provinces_region_code ON provinces (region_code);
CREATE INDEX IF NOT EXISTS idx_provinces_car_code    ON provinces (car_code);
CREATE INDEX IF NOT EXISTS idx_provinces_nuts3_2021  ON provinces (nuts3_2021);
CREATE INDEX IF NOT EXISTS idx_provinces_nuts3_2024  ON provinces (nuts3_2024);

CREATE TABLE IF NOT EXISTS municipalities (
  istat_code_alphanumeric TEXT PRIMARY KEY,
  istat_code_numeric      TEXT NOT NULL,
  istat_code_numeric_110  TEXT,
  istat_code_numeric_107  TEXT,
  istat_code_numeric_103  TEXT,
  cadastral_code          TEXT,
  name_it                 TEXT NOT NULL,
  name_alt                TEXT,
  is_provincial_capital   INTEGER NOT NULL,
  province_uts_code       TEXT NOT NULL,
  province_code_storico   TEXT NOT NULL,
  province_progressive    TEXT NOT NULL,
  region_code             TEXT NOT NULL,
  region_name             TEXT NOT NULL,
  nuts3_2021              TEXT,
  nuts3_2024              TEXT,
  FOREIGN KEY (region_code)
    REFERENCES regions (istat_region_code)
    ON UPDATE CASCADE
    ON DELETE RESTRICT,
  FOREIGN KEY (province_uts_code)
    REFERENCES provinces (uts_code)
    ON UPDATE CASCADE
    ON DELETE RESTRICT
);

CREATE INDEX IF NOT EXISTS idx_municipalities_istat_code_numeric    ON municipalities (istat_code_numeric);
CREATE INDEX IF NOT EXISTS idx_municipalities_region_code           ON municipalities (region_code);
CREATE INDEX IF NOT EXISTS idx_municipalities_province_uts_code     ON municipalities (province_uts_code);
CREATE INDEX IF NOT EXISTS idx_municipalities_province_code_storico ON municipalities (province_code_storico);
CREATE INDEX IF NOT EXISTS idx_municipalities_nuts3_2021            ON municipalities (nuts3_2021);
CREATE INDEX IF NOT EXISTS idx_municipalities_nuts3_2024            ON municipalities (nuts3_2024);

CREATE TABLE IF NOT EXISTS legend (
  field       TEXT PRIMARY KEY,
  description TEXT,
  note        TEXT,
  year        TEXT,
  source      TEXT
);

CREATE TABLE IF NOT EXISTS notes (
  note_id TEXT PRIMARY KEY,
  text    TEXT NOT NULL
);