"use client";

import { useState } from "react";
import { Header } from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { apiFetcher } from "@/lib/api-fetch";
import { last5DaysRange } from "@/lib/utils";
import { getStoredCredentials } from "@/lib/credentials";
import type { DateRange } from "react-day-picker";

const ENTITY_TYPES = [
  {
    type: "Bill",
    description: "Closed bills and invoices",
    fields: ["Id", "AccountId", "State", "Type", "Number", "IssuedUtc", "DueUtc", "PaidUtc", "TaxedNet", "TaxedTax", "TaxedGross", "Notes"],
  },
  {
    type: "OrderItem",
    description: "Revenue line items and charges",
    fields: ["Id", "AccountId", "BillId", "ServiceId", "AccountingCategoryId", "Name", "UnitCount", "UnitAmount", "Amount", "Type", "ConsumedUtc", "ClosedUtc"],
  },
  {
    type: "Payment",
    description: "Payments and settlements",
    fields: ["Id", "AccountId", "BillId", "State", "Type", "Amount", "ChargedUtc", "SettlementUtc", "Notes"],
  },
  {
    type: "Reservation",
    description: "Guest reservations",
    fields: ["Id", "AccountId", "State", "Number", "CheckInUtc", "CheckOutUtc", "RoomId", "RateId", "AdultCount", "ChildCount"],
  },
  {
    type: "Customer",
    description: "Guest and customer profiles",
    fields: ["Id", "FirstName", "LastName", "Email", "Phone", "NationalityCode", "BirthDateUtc", "TaxIdentificationNumber", "CreatedUtc"],
  },
  {
    type: "Company",
    description: "Company accounts",
    fields: ["Id", "Name", "TaxIdentificationNumber", "Email", "Phone", "Address", "CreatedUtc"],
  },
  {
    type: "LedgerEntry",
    description: "General ledger entries (beta)",
    fields: ["Id", "AccountId", "AccountingCategoryId", "Amount", "Type", "CreatedUtc"],
    beta: true,
  },
] as const;

type ExportResult = {
  exportId: string;
  status: string;
  entityType: string;
  files: { url: string; sizeInBytes: number; sizeKb: number }[];
  expiresUtc: string;
  createdUtc: string;
  raw: Record<string, unknown>;
  error?: string;
};

export default function ExportApiPage() {
  const [selectedType, setSelectedType] = useState("Bill");
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => last5DaysRange());
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ExportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showRaw, setShowRaw] = useState(false);

  async function handleTrigger() {
    if (!dateRange?.from || !dateRange?.to) return;
    setLoading(true);
    setResult(null);
    setError(null);
    setShowRaw(false);

    try {
      const creds = getStoredCredentials();
      const credHeaders: Record<string, string> = {};
      if (creds.clientToken) credHeaders["x-mews-client-token"] = creds.clientToken;
      if (creds.accessToken) credHeaders["x-mews-access-token"] = creds.accessToken;
      if (creds.baseUrl) credHeaders["x-mews-base-url"] = creds.baseUrl;

      const res = await fetch("/api/mews/exports", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...credHeaders },
        body: JSON.stringify({
          entityType: selectedType,
          startUtc: dateRange.from.toISOString(),
          endUtc: dateRange.to.toISOString(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Export failed");
      } else {
        setResult(data as ExportResult);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  const selectedEntityType = ENTITY_TYPES.find((e) => e.type === selectedType);

  return (
    <div>
      <Header
        title="Export API"
        description="Mews async bulk exports — trigger, poll, and inspect raw file exports"
      />
      <div className="space-y-6 p-6">

        {/* Entity type grid */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">1. Select Entity Type</CardTitle>
            <CardDescription>Each type maps to a different Mews data category</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {ENTITY_TYPES.map(({ type, description, ...rest }) => {
                const beta = "beta" in rest ? rest.beta : false;
                return (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={`rounded-lg border p-3 text-left transition-colors ${
                    selectedType === type
                      ? "border-slate-900 bg-slate-900 text-white"
                      : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{type}</span>
                    {beta && (
                      <Badge variant="outline" className={`text-[10px] ${selectedType === type ? "border-white/40 text-white/70" : ""}`}>
                        beta
                      </Badge>
                    )}
                  </div>
                  <p className={`mt-0.5 text-xs ${selectedType === type ? "text-white/70" : "text-muted-foreground"}`}>
                    {description}
                  </p>
                </button>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Fields for selected type */}
        {selectedEntityType && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Fields returned for <span className="font-mono">{selectedEntityType.type}</span></CardTitle>
              <CardDescription>All fields present in the export file</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {selectedEntityType.fields.map((field) => (
                  <span key={field} className="rounded bg-slate-100 px-2 py-1 font-mono text-xs text-slate-700">
                    {field}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Trigger */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">2. Set Date Range (UpdatedUtc)</CardTitle>
            <CardDescription>
              Filters by when records were last updated. Max range is 180 days; end must be at least 5 minutes in the past.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <DateRangePicker value={dateRange} onChange={setDateRange} />
            <Button onClick={handleTrigger} disabled={loading || !dateRange?.from || !dateRange?.to}>
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Waiting for Mews to generate file…
                </span>
              ) : (
                `Trigger ${selectedType} Export`
              )}
            </Button>
            {loading && (
              <p className="text-xs text-muted-foreground">
                Mews processes the export asynchronously — this polls every 3s up to 45s.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Error */}
        {error && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Result */}
        {result && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <CardTitle className="text-base">3. Result</CardTitle>
                <Badge variant={result.status === "Success" ? "success" : result.status === "Failed" ? "destructive" : "outline"}>
                  {result.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Export ID</p>
                  <p className="font-mono text-xs">{result.exportId}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Entity Type</p>
                  <p>{result.entityType}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Created</p>
                  <p>{result.createdUtc ? new Date(result.createdUtc).toLocaleString() : "—"}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Download URL expires</p>
                  <p>{result.expiresUtc ? new Date(result.expiresUtc).toLocaleString() : "—"}</p>
                </div>
              </div>

              {result.files.length > 0 ? (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Files ({result.files.length})</p>
                  {result.files.map((f, i) => (
                    <div key={i} className="flex items-center justify-between rounded-md border bg-slate-50 px-3 py-2">
                      <span className="font-mono text-xs text-slate-500 truncate max-w-[60%]">{f.url}</span>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-xs text-muted-foreground">{f.sizeKb} KB</span>
                        <a
                          href={f.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded bg-slate-900 px-2 py-1 text-xs font-medium text-white hover:bg-slate-700"
                        >
                          Download
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No files returned.</p>
              )}

              <div>
                <button
                  onClick={() => setShowRaw(!showRaw)}
                  className="text-xs font-medium text-slate-500 hover:text-slate-900 underline"
                >
                  {showRaw ? "Hide" : "Show"} raw API response
                </button>
                {showRaw && (
                  <pre className="mt-2 max-h-96 overflow-auto rounded-md border bg-slate-950 p-4 text-xs text-slate-100">
                    {JSON.stringify(result.raw, null, 2)}
                  </pre>
                )}
              </div>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
}
