import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import * as XLSX from "xlsx";

import { buildDataset, fetchIstatWorkbook, rawToObjects } from "../src/istat";

test("rawToObjects normalizes headers and trims values", () => {
  const ws = XLSX.utils.aoa_to_sheet([
    [
      "Codice regione ",
      "Denominazione Regione",
      "Denominazione (italiana e straniera)",
      " Campo Extra ",
    ],
    [" 01", " Piemonte ", " Torino ", " valore "],
  ]);

  const rows = rawToObjects(ws);

  assert.deepStrictEqual(rows, [
    {
      codice_regione: "01",
      denominazione_regione: "Piemonte",
      denominazione_full: "Torino",
      "campo extra": "valore",
    },
  ]);
});

test("buildDataset aggregates regions, provinces and municipalities", () => {
  const dataSheet = XLSX.utils.aoa_to_sheet([
    [
      "Codice regione",
      "Denominazione Regione",
      "Codice ripartizione geografica",
      "Ripartizione geografica",
      "Codice dell'unità territoriale sovracomunale (valida a fini statistici)",
      "Denominazione dell'unità territoriale sovracomunale (valida a fini statistici)",
      "Tipologia di unità territoriale sovracomunale",
      "Sigla automobilistica",
      "Codice comune formato alfanumerico",
      "Codice comune formato numerico",
      "Codice catastale del comune",
      "Denominazione in italiano",
      "Denominazione altra lingua",
      "Flag comune capoluogo di provincia/città metropolitana/libero consorzio",
      "Codice provincia (storico)",
      "Progressivo del comune",
      "Codice NUTS3 2021",
      "Codice NUTS3 2024",
    ],
    [
      "01",
      "Piemonte",
      "1",
      "Nord",
      "123",
      "Provincia Test",
      "Città Metropolitana",
      "TO",
      "A123",
      "00123",
      "C001",
      "Torino",
      "Turin",
      "1",
      "002",
      "456",
      "ITC11",
      "ITC12",
    ],
    [
      "01",
      "Piemonte",
      "1",
      "Nord",
      "123",
      "Provincia Test",
      "Città Metropolitana",
      "TO",
      "A124",
      "00124",
      "C002",
      "Example",
      "",
      "0",
      "002",
      "789",
      "ITC11",
      "",
    ],
  ]);

  const notesSheet = XLSX.utils.aoa_to_sheet([[" (1) Nota uno"], [" (2) Nota due"], ["Altra riga"]]);
  const legendSheet = XLSX.utils.aoa_to_sheet([
    ["Campo", "Descrizione", "Note", "Anno", "Fonte"],
    ["campo_1", "descrizione", "nota", "2024", "ISTAT"],
  ]);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, dataSheet, "Elenco");
  XLSX.utils.book_append_sheet(wb, notesSheet, "Note");
  XLSX.utils.book_append_sheet(wb, legendSheet, "Legenda");

  const originalSheetToTxt = XLSX.utils.sheet_to_txt;
  XLSX.utils.sheet_to_txt = (sheet) => {
    if (sheet === notesSheet) return "(1) Nota uno\n(2) Nota due\n";
    return originalSheetToTxt(sheet);
  };

  let dataset: ReturnType<typeof buildDataset>;
  try {
    dataset = buildDataset(wb);
  } finally {
    XLSX.utils.sheet_to_txt = originalSheetToTxt;
  }

  assert.equal(dataset.regions.length, 1);
  assert.deepStrictEqual(dataset.regions[0], {
    istat_region_code: "01",
    region_name: "Piemonte",
    geo_partition_code: "1",
    geo_partition_name: "Nord",
    nuts1_2021: undefined,
    nuts2_2021: undefined,
    nuts1_2024: undefined,
    nuts2_2024: undefined,
  });

  assert.equal(dataset.provinces.length, 1);
  assert.deepStrictEqual(dataset.provinces[0], {
    uts_code: "123",
    uts_name: "Provincia Test",
    uts_type: "Città Metropolitana",
    car_code: "TO",
    region_code: "01",
    region_name: "Piemonte",
    nuts3_2021: "ITC11",
    nuts3_2024: "ITC12",
  });

  assert.equal(dataset.municipalities.length, 2);
  assert.deepStrictEqual(dataset.municipalities[0], {
    istat_code_alphanumeric: "A123",
    istat_code_numeric: "00123",
    istat_code_numeric_110: null,
    istat_code_numeric_107: null,
    istat_code_numeric_103: null,
    cadastral_code: "C001",
    name_it: "Torino",
    name_alt: "Turin",
    is_provincial_capital: true,
    province_uts_code: "123",
    province_code_storico: "002",
    province_progressive: "456",
    region_code: "01",
    region_name: "Piemonte",
    nuts3_2021: "ITC11",
    nuts3_2024: "ITC12",
  });
  assert.deepStrictEqual(dataset.municipalities[1], {
    istat_code_alphanumeric: "A124",
    istat_code_numeric: "00124",
    istat_code_numeric_110: null,
    istat_code_numeric_107: null,
    istat_code_numeric_103: null,
    cadastral_code: "C002",
    name_it: "Example",
    name_alt: null,
    is_provincial_capital: false,
    province_uts_code: "123",
    province_code_storico: "002",
    province_progressive: "789",
    region_code: "01",
    region_name: "Piemonte",
    nuts3_2021: "ITC11",
    nuts3_2024: null,
  });

  assert.deepStrictEqual(dataset.notes, {
    "1": "Nota uno",
    "2": "Nota due",
  });

  assert.deepStrictEqual(dataset.legend, [
    {
      field: "campo_1",
      description: "descrizione",
      note: "nota",
      year: "2024",
      source: "ISTAT",
    },
  ]);

  assert.match(dataset.dataset_date, /^\d{4}-\d{2}-\d{2}$/);
});

test("fetchIstatWorkbook caches responses and reuses conditional headers", async () => {
  const tmpRoot = await mkdtemp(path.join(os.tmpdir(), "istat-cache-test-"));
  const originalCacheDir = process.env.ISTAT_GEO_SYNC_CACHE_DIR;
  process.env.ISTAT_GEO_SYNC_CACHE_DIR = tmpRoot;

  const originalFetch = globalThis.fetch;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.aoa_to_sheet([
      ["Codice"],
      ["01"],
    ]),
    "Elenco"
  );

  const workbookBuffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  }) as ArrayBuffer;

  const httpDate = "Tue, 02 Jan 2024 03:04:05 GMT";
  const responses = [
    new Response(workbookBuffer, {
      status: 200,
      headers: {
        "Last-Modified": httpDate,
        ETag: '"etag-value"',
      },
    }),
    new Response(null, {
      status: 304,
      headers: {
        "Last-Modified": httpDate,
        ETag: '"etag-value"',
      },
    }),
  ];

  const requests: Array<Record<string, string>> = [];

  const stubFetch: typeof fetch = async (_input, init) => {
    const headers = new Headers(init?.headers ?? {});
    const headerMap: Record<string, string> = {};
    headers.forEach((value, key) => {
      headerMap[key] = value;
    });
    requests.push(headerMap);

    const response = responses.shift();
    if (!response) {
      throw new Error("Unexpected fetch call");
    }
    return response;
  };

  globalThis.fetch = stubFetch;

  try {
    const first = await fetchIstatWorkbook();
    assert.equal(requests[0]?.["if-modified-since"], undefined);
    assert.equal(first.lastModified, new Date(httpDate).toISOString());

    const second = await fetchIstatWorkbook();
    assert.equal(requests[1]?.["if-modified-since"], httpDate);
    assert.equal(requests[1]?.["if-none-match"], '"etag-value"');

    const sheetName = second.workbook.SheetNames[0]!;
    const secondSheet = second.workbook.Sheets[sheetName]!;
    const rows = XLSX.utils.sheet_to_json(secondSheet, { header: 1 });
    assert.deepStrictEqual(rows, [
      ["Codice"],
      ["01"],
    ]);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalCacheDir === undefined) delete process.env.ISTAT_GEO_SYNC_CACHE_DIR;
    else process.env.ISTAT_GEO_SYNC_CACHE_DIR = originalCacheDir;
    await rm(tmpRoot, { recursive: true, force: true });
  }
});

test("fetchIstatWorkbook refetches when cache is missing but server returns 304", async () => {
  const tmpRoot = await mkdtemp(path.join(os.tmpdir(), "istat-cache-test-"));
  const originalCacheDir = process.env.ISTAT_GEO_SYNC_CACHE_DIR;
  process.env.ISTAT_GEO_SYNC_CACHE_DIR = tmpRoot;

  const originalFetch = globalThis.fetch;

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(
    workbook,
    XLSX.utils.aoa_to_sheet([
      ["Codice"],
      ["01"],
    ]),
    "Elenco"
  );

  const workbookBuffer = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array",
  }) as ArrayBuffer;

  const httpDate = "Tue, 02 Jan 2024 03:04:05 GMT";
  const responses = [
    new Response(null, {
      status: 304,
      headers: {
        "Last-Modified": httpDate,
        ETag: '"etag-value"',
      },
    }),
    new Response(workbookBuffer, {
      status: 200,
      headers: {
        "Last-Modified": httpDate,
        ETag: '"etag-value"',
      },
    }),
  ];

  const requests: Array<Record<string, string>> = [];

  const stubFetch: typeof fetch = async (_input, init) => {
    const headers = new Headers(init?.headers ?? {});
    const headerMap: Record<string, string> = {};
    headers.forEach((value, key) => {
      headerMap[key] = value;
    });
    requests.push(headerMap);

    const response = responses.shift();
    if (!response) {
      throw new Error("Unexpected fetch call");
    }
    return response;
  };

  globalThis.fetch = stubFetch;

  try {
    const result = await fetchIstatWorkbook();

    assert.equal(requests.length, 2);
    assert.equal(requests[0]?.["if-modified-since"], undefined);
    assert.equal(requests[0]?.["if-none-match"], undefined);
    assert.equal(requests[1]?.["if-modified-since"], undefined);
    assert.equal(requests[1]?.["if-none-match"], undefined);
    assert.equal(result.lastModified, new Date(httpDate).toISOString());

    const sheetName = result.workbook.SheetNames[0]!;
    const sheet = result.workbook.Sheets[sheetName]!;
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 });
    assert.deepStrictEqual(rows, [
      ["Codice"],
      ["01"],
    ]);
  } finally {
    globalThis.fetch = originalFetch;
    if (originalCacheDir === undefined) delete process.env.ISTAT_GEO_SYNC_CACHE_DIR;
    else process.env.ISTAT_GEO_SYNC_CACHE_DIR = originalCacheDir;
    await rm(tmpRoot, { recursive: true, force: true });
  }
});
