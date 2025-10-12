-- REGIONS
CREATE TABLE
  IF NOT EXISTS regions (
    istat_region_code varchar(32) PRIMARY KEY,
    region_name varchar(255) NOT NULL,
    geo_partition_code varchar(32) NOT NULL,
    geo_partition_name varchar(255) NOT NULL,
    nuts1_2021 varchar(32),
    nuts2_2021 varchar(32),
    nuts1_2024 varchar(32),
    nuts2_2024 varchar(32)
  );

CREATE INDEX IF NOT EXISTS idx_regions_geo_partition_code ON regions (geo_partition_code);

CREATE INDEX IF NOT EXISTS idx_regions_nuts1_2021 ON regions (nuts1_2021);

CREATE INDEX IF NOT EXISTS idx_regions_nuts2_2021 ON regions (nuts2_2021);

CREATE INDEX IF NOT EXISTS idx_regions_nuts1_2024 ON regions (nuts1_2024);

CREATE INDEX IF NOT EXISTS idx_regions_nuts2_2024 ON regions (nuts2_2024);

-- PROVINCES
CREATE TABLE
  IF NOT EXISTS provinces (
    uts_code varchar(32) PRIMARY KEY,
    uts_name varchar(255) NOT NULL,
    uts_type varchar(32) NOT NULL,
    car_code varchar(32),
    region_code varchar(32) NOT NULL,
    region_name varchar(255) NOT NULL,
    nuts3_2021 varchar(32),
    nuts3_2024 varchar(32),
    CONSTRAINT fk_provinces_region FOREIGN KEY (region_code) REFERENCES regions (istat_region_code) ON UPDATE CASCADE ON DELETE RESTRICT
  );

CREATE INDEX IF NOT EXISTS idx_provinces_region_code ON provinces (region_code);

CREATE INDEX IF NOT EXISTS idx_provinces_car_code ON provinces (car_code);

CREATE INDEX IF NOT EXISTS idx_provinces_nuts3_2021 ON provinces (nuts3_2021);

CREATE INDEX IF NOT EXISTS idx_provinces_nuts3_2024 ON provinces (nuts3_2024);

-- MUNICIPALITIES
CREATE TABLE
  IF NOT EXISTS municipalities (
    istat_code_alphanumeric varchar(32) PRIMARY KEY,
    istat_code_numeric varchar(32) NOT NULL,
    istat_code_numeric_110 varchar(32),
    istat_code_numeric_107 varchar(32),
    istat_code_numeric_103 varchar(32),
    cadastral_code varchar(32),
    name_it varchar(255) NOT NULL,
    name_alt varchar(255),
    is_provincial_capital boolean NOT NULL,
    province_uts_code varchar(32) NOT NULL,
    province_code_storico varchar(32) NOT NULL,
    province_progressive varchar(32) NOT NULL,
    region_code varchar(32) NOT NULL,
    region_name varchar(255) NOT NULL,
    nuts3_2021 varchar(32),
    nuts3_2024 varchar(32),
    CONSTRAINT fk_municipalities_region FOREIGN KEY (region_code) REFERENCES regions (istat_region_code) ON UPDATE CASCADE ON DELETE RESTRICT,
    CONSTRAINT fk_municipalities_province FOREIGN KEY (province_uts_code) REFERENCES provinces (uts_code) ON UPDATE CASCADE ON DELETE RESTRICT
  );

CREATE INDEX IF NOT EXISTS idx_municipalities_istat_code_numeric ON municipalities (istat_code_numeric);

CREATE INDEX IF NOT EXISTS idx_municipalities_region_code ON municipalities (region_code);

CREATE INDEX IF NOT EXISTS idx_municipalities_province_uts_code ON municipalities (province_uts_code);

CREATE INDEX IF NOT EXISTS idx_municipalities_province_code_storico ON municipalities (province_code_storico);

CREATE INDEX IF NOT EXISTS idx_municipalities_nuts3_2021 ON municipalities (nuts3_2021);

CREATE INDEX IF NOT EXISTS idx_municipalities_nuts3_2024 ON municipalities (nuts3_2024);

-- LEGEND
CREATE TABLE
  IF NOT EXISTS legend (
    field varchar(255) PRIMARY KEY,
    description text,
    note varchar(64),
    year varchar(32),
    source varchar(255)
  );

-- NOTES
CREATE TABLE
  IF NOT EXISTS notes (
    note_id varchar(32) PRIMARY KEY,
    text text NOT NULL
  );

CREATE TABLE
  IF NOT EXISTS sync_metadata (
    key varchar(64) PRIMARY KEY,
    value varchar(255) NOT NULL
  );