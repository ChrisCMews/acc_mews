"use client";

import { useState } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";
import type { AccountingItem } from "@/types/app";

type SortKey = keyof Pick<AccountingItem, "accountName" | "name" | "consumedAt" | "netAmount" | "ledgerAccountCode" | "serviceName">;

interface AccountingItemsTableProps {
  items: AccountingItem[];
  isLoading: boolean;
}

export function AccountingItemsTable({ items, isLoading }: AccountingItemsTableProps) {
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({
    key: "consumedAt",
    dir: "desc",
  });

  function toggleSort(key: SortKey) {
    setSort((prev) =>
      prev.key === key ? { key, dir: prev.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }
    );
  }

  const sorted = [...items].sort((a, b) => {
    const va = a[sort.key] ?? "";
    const vb = b[sort.key] ?? "";
    const cmp = String(va).localeCompare(String(vb), undefined, { numeric: true });
    return sort.dir === "asc" ? cmp : -cmp;
  });

  function SortIcon({ col }: { col: SortKey }) {
    if (sort.key !== col) return <ChevronUp className="h-3 w-3 opacity-30" />;
    return sort.dir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />;
  }

  function SortableHead({ col, label }: { col: SortKey; label: string }) {
    return (
      <TableHead className="cursor-pointer select-none" onClick={() => toggleSort(col)}>
        <span className="flex items-center gap-1">{label}<SortIcon col={col} /></span>
      </TableHead>
    );
  }

  if (isLoading) {
    return <div className="space-y-2 p-4">{Array.from({ length: 10 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>;
  }

  if (!items.length) {
    return <div className="p-12 text-center text-sm text-muted-foreground">No accounting items found for the selected period.</div>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <SortableHead col="accountName" label="Account" />
          <SortableHead col="ledgerAccountCode" label="Ledger Code" />
          <SortableHead col="name" label="Description" />
          <SortableHead col="serviceName" label="Service" />
          <TableHead>Outlet</TableHead>
          <SortableHead col="consumedAt" label="Date" />
          <TableHead>Qty</TableHead>
          <TableHead>Unit Cost</TableHead>
          <TableHead>Tax %</TableHead>
          <SortableHead col="netAmount" label="Net" />
          <TableHead>Tax</TableHead>
          <TableHead>CCY</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((item) => (
          <TableRow key={item.id}>
            <TableCell>{item.accountName}</TableCell>
            <TableCell>
              {item.ledgerAccountCode ? (
                <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-mono font-medium">
                  {item.ledgerAccountCode}
                </span>
              ) : (
                <span className="text-muted-foreground">—</span>
              )}
            </TableCell>
            <TableCell className="max-w-[200px] truncate">{item.name}</TableCell>
            <TableCell>{item.serviceName ?? "—"}</TableCell>
            <TableCell>{item.outletName ?? "—"}</TableCell>
            <TableCell>{formatDate(item.consumedAt)}</TableCell>
            <TableCell>{item.unitCount}</TableCell>
            <TableCell>{item.unitCost.toFixed(2)}</TableCell>
            <TableCell>{item.taxRate != null ? `${(item.taxRate * 100).toFixed(0)}%` : "—"}</TableCell>
            <TableCell>{item.netAmount.toFixed(2)}</TableCell>
            <TableCell>{item.taxAmount.toFixed(2)}</TableCell>
            <TableCell>{item.currency}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
