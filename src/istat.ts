import * as XLSX from "xlsx";
import { writeFileSync } from "fs";
const ISTAT_URL_XLSX =
  "https://www.istat.it/storage/codici-unita-amministrative/Elenco-comuni-italiani.xlsx";

export async function fetchIstatWorkbook(): Promise<XLSX.WorkBook> {
  const res = await fetch(ISTAT_URL_XLSX);
  if (!res.ok) {
    throw new Error(
      `Failed to fetch ISTAT Excel data: ${res.status} ${res.statusText}`
    );
  }
  const arrayBuffer = await res.arrayBuffer();
  return XLSX.read(arrayBuffer, {
    type: "array",
    cellDates: false,
    cellText: false,
    raw: false,
  });
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
