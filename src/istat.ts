import * as XLSX from "xlsx";
const ISTAT_URL_XLSX =
  "https://www.istat.it/storage/codici-unita-amministrative/Elenco-comuni-italiani.xlsx";

export async function fetchIstatDataExcel(): Promise<string[][]> {
  const res = await fetch(ISTAT_URL_XLSX);
  if (!res.ok) {
    throw new Error(`Failed to fetch ISTAT Excel data: ${res.statusText}`);
  }

  const arrayBuffer = await res.arrayBuffer();
  return parseIstatExcelData(arrayBuffer);
}

function parseIstatExcelData(buffer: ArrayBuffer): string[][] {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName!];
  const data = XLSX.utils.sheet_to_json(sheet!, { header: 1, raw: false });
  return data as string[][];
}
