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

export const REGION_FIELDS: (keyof Region)[] = [
  "istat_region_code",
  "region_name",
  "geo_partition_code",
  "geo_partition_name",
  "nuts1_2021",
  "nuts2_2021",
  "nuts1_2024",
  "nuts2_2024",
];

export type Province = {
  uts_code: string;
  uts_name: string;
  uts_type: string;
  car_code?: string;
  region_code: string;
  region_name: string;
  nuts3_2021?: string;
  nuts3_2024?: string;
};

export const PROVINCE_FIELDS: (keyof Province)[] = [
  "uts_code",
  "uts_name",
  "uts_type",
  "car_code",
  "region_code",
  "region_name",
  "nuts3_2021",
  "nuts3_2024",
];

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

export const MUNICIPALITY_FIELDS: (keyof Municipality)[] = [
  "istat_code_alphanumeric",
  "istat_code_numeric",
  "istat_code_numeric_110",
  "istat_code_numeric_107",
  "istat_code_numeric_103",
  "cadastral_code",
  "name_it",
  "name_alt",
  "is_provincial_capital",
  "province_uts_code",
  "province_code_storico",
  "province_progressive",
  "region_code",
  "region_name",
  "nuts3_2021",
  "nuts3_2024",
];

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
  provinces: Province[];
  municipalities: Municipality[];
  notes: NoteMap;
  legend: FieldLegend[];
  dataset_date: string;
};
