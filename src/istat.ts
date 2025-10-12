import * as XLSX from "xlsx";
import {
  Dataset,
  FieldLegend,
  Municipality,
  NoteMap,
  Province,
  Region,
} from "./models";
const ISTAT_URL_XLSX =
  "https://www.istat.it/storage/codici-unita-amministrative/Elenco-comuni-italiani.xlsx";

export type FetchedWorkbook = {
  workbook: XLSX.WorkBook;
  lastModified?: string | null;
};

export async function fetchIstatWorkbook(): Promise<FetchedWorkbook> {
  const res = await fetch(ISTAT_URL_XLSX);
  if (!res.ok) {
    throw new Error(
      `Failed to fetch ISTAT Excel data: ${res.status} ${res.statusText}`
    );
  }

  const lastModifiedHeader = res.headers.get("last-modified");
  const parsedLastModified = parseLastModifiedHeader(lastModifiedHeader);

  const arrayBuffer = await res.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, {
    type: "array",
    cellDates: false,
    cellText: false,
    raw: false,
  });
  return { workbook, lastModified: parsedLastModified };
}

function parseLastModifiedHeader(value: string | null): string | null {
  if (!value) return null;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) return null;
  return parsed.toISOString();
}

export function getSheet(
  workbook: XLSX.WorkBook,
  index: number
): XLSX.WorkSheet {
  const name = workbook.SheetNames[index];
  const ws = workbook.Sheets[name!];
  if (!ws) throw new Error(`Worksheet not found (index: ${index})`);
  return ws;
}

export function rawToObjects(ws: XLSX.WorkSheet): Record<string, string>[] {
  const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws, {
    defval: "",
    raw: false,
  });

  if (rows.length === 0) return [];

  // replace keys with canonical ones
  const keys = Object.keys(rows[0]!);
  const keyMap: Record<string, string> = {};
  for (const k of keys) keyMap[k] = mapHeaderToKey(k);

  return rows.map((row) => {
    const o: Record<string, string> = {};
    for (const [key, value] of Object.entries(row)) {
      const newKey = keyMap[key] ?? key;
      // Always string, trim, keep leading zeros
      o[newKey] = (value ?? "").toString().trim();
    }
    return o;
  });
}

function mapHeaderToKey(header: string): string {
  const normalizedHeader = header
    .replace(/\r?\n+/g, " ")
    .replace(/\"/g, "")
    .replace(/\s*\(\d+\)\s*/g, "") // rimuove (1), (2)...
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();

  const table: Record<string, string> = {
    "codice regione": "codice_regione",
    "codice dell'unità territoriale sovracomunale (valida a fini statistici)":
      "codice_uts",
    "codice provincia (storico)": "codice_provincia_storico",
    "progressivo del comune": "progressivo_comune",
    "codice comune formato alfanumerico": "codice_comune_alfanumerico",
    "denominazione (italiana e straniera)": "denominazione_full",
    "denominazione in italiano": "denominazione_it",
    "denominazione altra lingua": "denominazione_alt",
    "codice ripartizione geografica": "codice_ripartizione",
    "ripartizione geografica": "ripartizione",
    "denominazione regione": "denominazione_regione",
    "denominazione dell'unità territoriale sovracomunale (valida a fini statistici)":
      "denominazione_uts",
    "tipologia di unità territoriale sovracomunale": "tipologia_uts",
    "flag comune capoluogo di provincia/città metropolitana/libero consorzio":
      "flag_capoluogo",
    "sigla automobilistica": "sigla_automobilistica",
    "codice comune formato numerico": "codice_comune_numerico",
    "codice comune numerico con 110 province (dal 2010 al 2016)":
      "codice_comune_numerico_110",
    "codice comune numerico con 107 province (dal 2006 al 2009)":
      "codice_comune_numerico_107",
    "codice comune numerico con 103 province (dal 1995 al 2005)":
      "codice_comune_numerico_103",
    "codice catastale del comune": "codice_catastale",
    "codice nuts1 2021": "nuts1_2021",
    "codice nuts2 2021": "nuts2_2021",
    "codice nuts3 2021": "nuts3_2021",
    "codice nuts1 2024": "nuts1_2024",
    "codice nuts2 2024": "nuts2_2024",
    "codice nuts3 2024": "nuts3_2024",
  };

  return table[normalizedHeader] ?? normalizedHeader;
}

function parseNotes(ws: XLSX.WorkSheet): NoteMap {
  const txt = XLSX.utils.sheet_to_txt(ws);
  const notes: NoteMap = {};

  for (const line of txt.split(/\r?\n/)) {
    const m = line.match(/^\s*\((\d+)\)\s*(.+)$/);
    if (m) notes[m[1]!] = m[2]!.trim();
  }
  return notes;
}

function parseLegend(ws: XLSX.WorkSheet): FieldLegend[] {
  const rows = XLSX.utils.sheet_to_json<Record<string, string>>(ws, {
    defval: "",
    raw: false,
  });
  if (rows.length === 0) return [];

  const norm = (s: string) => s.replace(/\s+/g, " ").trim().toLowerCase();
  const keyMap: Record<string, string> = {};
  for (const k of Object.keys(rows[0]!)) {
    const normalizedKey = norm(k);
    if (normalizedKey.startsWith("campo")) keyMap[k] = "field";
    else if (normalizedKey.startsWith("descr")) keyMap[k] = "description";
    else if (normalizedKey.startsWith("note")) keyMap[k] = "note";
    else if (normalizedKey.startsWith("anno")) keyMap[k] = "year";
    else if (normalizedKey.startsWith("fonte")) keyMap[k] = "source";
    else keyMap[k] = k;
  }
  return rows.map((r) => {
    const out: any = {};
    for (const [k, v] of Object.entries(r))
      out[keyMap[k] ?? k] = (v ?? "").toString().trim();
    return out as FieldLegend;
  });
}

export function buildDataset(
  wb: XLSX.WorkBook,
  options?: { sourceLastModified?: string | null }
): Dataset {
  const dataWS = getSheet(wb, 0);
  const objects = rawToObjects(dataWS);

  const notesWS = getSheet(wb, 1);
  const notes = parseNotes(notesWS);

  const legendWS = getSheet(wb, 2);
  const legend = parseLegend(legendWS);

  const regionMap = new Map<string, Region>();
  const provMap = new Map<string, Province>();
  const municipalities: Municipality[] = [];

  for (const obj of objects) {
    const region_code = obj["codice_regione"]!;
    const region_name = obj["denominazione_regione"]!;
    const rip_code = obj["codice_ripartizione"]!;
    const rip_name = obj["ripartizione"]!;

    if (region_code && !regionMap.has(region_code)) {
      regionMap.set(region_code, {
        istat_region_code: region_code,
        region_name,
        geo_partition_code: rip_code,
        geo_partition_name: rip_name,
        nuts1_2021: obj["nuts1_2021"] || undefined,
        nuts2_2021: obj["nuts2_2021"] || undefined,
        nuts1_2024: obj["nuts1_2024"] || undefined,
        nuts2_2024: obj["nuts2_2024"] || undefined,
      });
    }

    const uts_code = obj["codice_uts"];
    if (uts_code && !provMap.has(uts_code)) {
      provMap.set(uts_code, {
        uts_code,
        uts_name: obj["denominazione_uts"]!,
        uts_type: obj["tipologia_uts"]!,
        car_code: obj["sigla_automobilistica"] || undefined,
        region_code,
        region_name,
        nuts3_2021: obj["nuts3_2021"] || undefined,
        nuts3_2024: obj["nuts3_2024"] || undefined,
      });
    }

    const comune: Municipality = {
      istat_code_alphanumeric: obj["codice_comune_alfanumerico"]!,
      istat_code_numeric: obj["codice_comune_numerico"]!,
      istat_code_numeric_110: obj["codice_comune_numerico_110"] || null,
      istat_code_numeric_107: obj["codice_comune_numerico_107"] || null,
      istat_code_numeric_103: obj["codice_comune_numerico_103"] || null,
      cadastral_code: obj["codice_catastale"] || null,
      name_it: obj["denominazione_it"] || obj["denominazione_full"] || "",
      name_alt: obj["denominazione_alt"] || null,
      is_provincial_capital: obj["flag_capoluogo"] == "0" ? false : true,
      province_uts_code: uts_code || "",
      province_code_storico: obj["codice_provincia_storico"] || "",
      province_progressive: obj["progressivo_comune"] || "",
      region_code,
      region_name,
      nuts3_2021: obj["nuts3_2021"] || null,
      nuts3_2024: obj["nuts3_2024"] || null,
    };

    if (comune.istat_code_alphanumeric) {
      municipalities.push(comune);
    }
  }

  const regions = Array.from(regionMap.values()).sort((a, b) =>
    a.istat_region_code.localeCompare(b.istat_region_code)
  );
  const provinces = Array.from(provMap.values()).sort((a, b) =>
    a.uts_code.localeCompare(b.uts_code)
  );

  const dataset_date = deriveDatasetDate(options?.sourceLastModified);
  return {
    regions,
    provinces,
    municipalities,
    notes,
    legend,
    dataset_date,
    source_last_modified: options?.sourceLastModified ?? null,
  };
}

function deriveDatasetDate(sourceLastModified?: string | null): string {
  if (sourceLastModified) {
    const parsed = new Date(sourceLastModified);
    if (!Number.isNaN(parsed.valueOf())) {
      return parsed.toISOString().slice(0, 10);
    }
  }
  return new Date().toISOString().slice(0, 10);
}
