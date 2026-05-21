"use client";

import { useState } from "react";
import type { DateRange } from "react-day-picker";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ExportType } from "@/types/app";
import { last5DaysRange } from "@/lib/utils";
import { getStoredCredentials } from "@/lib/credentials";

const exportOptions: { value: ExportType; label: string; description: string }[] = [
  { value: "bills", label: "Bills / Invoices", description: "All bills with tax breakdown" },
  { value: "payments", label: "Payments", description: "All charged and pending payments" },
  {
    value: "accounting-items",
    label: "Accounting Items",
    description: "Revenue line items with ledger codes",
  },
];

export function ExportForm() {
  const [exportType, setExportType] = useState<ExportType>("bills");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => last5DaysRange());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload() {
    if (!dateRange?.from || !dateRange?.to) {
      setError("Please select a date range.");
      return;
    }
    setError(null);
    setIsLoading(true);

    try {
      const creds = getStoredCredentials();
      const credHeaders: Record<string, string> = {};
      if (creds.clientToken) credHeaders["x-mews-client-token"] = creds.clientToken;
      if (creds.accessToken) credHeaders["x-mews-access-token"] = creds.accessToken;
      if (creds.baseUrl) credHeaders["x-mews-base-url"] = creds.baseUrl;

      const res = await fetch("/api/export", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...credHeaders },
        body: JSON.stringify({
          type: exportType,
          startUtc: dateRange.from.toISOString(),
          endUtc: dateRange.to.toISOString(),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Export failed");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `mews-${exportType}-${dateRange.from.toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed");
    } finally {
      setIsLoading(false);
    }
  }

  const selected = exportOptions.find((o) => o.value === exportType);

  return (
    <div className="max-w-xl space-y-6">
      <div className="space-y-2">
        <Label>Export Type</Label>
        <Select value={exportType} onValueChange={(v) => setExportType(v as ExportType)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {exportOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {selected && (
          <p className="text-sm text-muted-foreground">{selected.description}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label>Date Range</Label>
        <DateRangePicker value={dateRange} onChange={setDateRange} />
      </div>

      {error && (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <Button onClick={handleDownload} disabled={isLoading} size="lg">
        <Download className="mr-2 h-4 w-4" />
        {isLoading ? "Generating CSV…" : "Download CSV"}
      </Button>

      <div className="rounded-md border bg-muted/40 p-4 text-sm text-muted-foreground">
        <p className="font-medium text-foreground">CSV columns for {selected?.label}:</p>
        <ul className="mt-1 list-inside list-disc space-y-0.5">
          {exportType === "bills" && (
            <>
              <li>Bill ID, Bill Number, Account Name, Type, Status</li>
              <li>Issue Date, Due Date, Paid Date</li>
              <li>Net Amount, Tax Amount, Gross Amount, Currency, Notes</li>
            </>
          )}
          {exportType === "payments" && (
            <>
              <li>Payment ID, Account Name, Bill ID, Payment Type, Status</li>
              <li>Charged Date, Amount, Currency, Notes</li>
            </>
          )}
          {exportType === "accounting-items" && (
            <>
              <li>Item ID, Account Name, Bill ID</li>
              <li>Accounting Category, Ledger Account Code</li>
              <li>Service, Outlet, Type, Description, Consumed Date</li>
              <li>Unit Count, Unit Cost, Tax Rate %, Net Amount, Tax Amount, Currency</li>
            </>
          )}
        </ul>
      </div>
    </div>
  );
}
