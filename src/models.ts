export type Region = {
  istat_region_code: string;
  region_name: string;
  geo_partition_code: string;
  geo_partition_name: string;
  nuts1_2021?: string;
  nuts2_2021?: string;
  nuts1_2024?: string;
  nuts2_2024?: string;
};

export type ProvinceLike = {
  uts_code: string;
  uts_name: string;
  uts_type: string;
  car_code?: string;
  region_code: string;
  region_name: string;
  nuts3_2021?: string;
  nuts3_2024?: string;
};

export type Municipality = {
  istat_code_alphanumeric: string;
  istat_code_numeric: string;
  istat_code_numeric_110?: string | null;
  istat_code_numeric_107?: string | null;
  istat_code_numeric_103?: string | null;
  cadastral_code?: string | null;
  name_it: string;
  name_alt?: string | null;
  is_provincial_capital: boolean;
  province_uts_code: string;
  province_code_storico: string;
  province_progressive: string;
  region_code: string;
  region_name: string;
  nuts3_2021?: string | null;
  nuts3_2024?: string | null;
};

export type FieldLegend = {
  field: string;
  description?: string;
  note?: string;
  year?: string;
  source?: string;
};

export type NoteMap = Record<string, string>;

export type Dataset = {
  regions: Region[];
  provinces: ProvinceLike[];
  municipalities: Municipality[];
  notes: NoteMap;
  legend: FieldLegend[];
  dataset_date: string;
};
