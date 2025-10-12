import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";

import { exportData } from "../src/export";
import { Dataset } from "../src/models";

const baseDataset: Dataset = {
  regions: [],
  provinces: [],
  municipalities: [],
  legend: [
    {
      field: "field_1",
      description: "Example field",
      note: "Some note",
      year: "2024",
      source: "ISTAT",
    },
  ],
  notes: {
    "1": "Nota uno",
    "2": "Nota due",
  },
  dataset_date: "2024-01-01",
  source_last_modified: null,
};

test("exportData writes legend and notes in CSV format", async () => {
  const tmp = await mkdtemp(path.join(tmpdir(), "istat-export-"));

  await exportData(baseDataset, "all", "csv", tmp, "{entity}.{ext}");

  const legendCsv = await readFile(path.join(tmp, "legend.csv"), "utf8");
  assert.equal(
    legendCsv,
    '"field","description","note","year","source"\n"field_1","Example field","Some note","2024","ISTAT"\n'
  );

  const notesCsv = await readFile(path.join(tmp, "notes.csv"), "utf8");
  assert.equal(
    notesCsv,
    '"note_id","text"\n"1","Nota uno"\n"2","Nota due"\n'
  );
});

test("exportData writes notes as JSON object", async () => {
  const tmp = await mkdtemp(path.join(tmpdir(), "istat-export-json-"));

  await exportData(baseDataset, "notes", "json", tmp, "{entity}.{ext}");

  const notesJson = await readFile(path.join(tmp, "notes.json"), "utf8");
  assert.deepEqual(JSON.parse(notesJson), baseDataset.notes);
});