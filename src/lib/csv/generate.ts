import Papa from "papaparse";
import type { CsvColumn } from "./schemas";

export function generateCsv<T>(data: T[], schema: CsvColumn<T>[]): string {
  const rows = data.map((row) =>
    Object.fromEntries(schema.map((col) => [col.header, col.value(row) ?? ""]))
  );
  return Papa.unparse(rows, {
    columns: schema.map((c) => c.header),
    quotes: true,
  });
}
