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
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Payment } from "@/types/app";

type SortKey = keyof Pick<Payment, "accountName" | "type" | "state" | "chargedAt" | "amount">;

interface PaymentsTableProps {
  payments: Payment[];
  isLoading: boolean;
}

const stateVariant: Record<string, "success" | "warning" | "destructive" | "outline"> = {
  Charged: "success",
  Pending: "warning",
  Verifying: "warning",
  Canceled: "outline",
  Failed: "destructive",
};

export function PaymentsTable({ payments, isLoading }: PaymentsTableProps) {
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({
    key: "chargedAt",
    dir: "desc",
  });

  function toggleSort(key: SortKey) {
    setSort((prev) =>
      prev.key === key ? { key, dir: prev.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }
    );
  }

  const sorted = [...payments].sort((a, b) => {
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
    return <div className="space-y-2 p-4">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>;
  }

  if (!payments.length) {
    return <div className="p-12 text-center text-sm text-muted-foreground">No payments found for the selected period.</div>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <SortableHead col="accountName" label="Account" />
          <SortableHead col="type" label="Type" />
          <SortableHead col="state" label="Status" />
          <SortableHead col="chargedAt" label="Charged Date" />
          <SortableHead col="amount" label="Amount" />
          <TableHead>Currency</TableHead>
          <TableHead>Bill ID</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((p) => (
          <TableRow key={p.id}>
            <TableCell>{p.accountName}</TableCell>
            <TableCell>{p.type}</TableCell>
            <TableCell>
              <Badge variant={stateVariant[p.state] ?? "outline"}>{p.state}</Badge>
            </TableCell>
            <TableCell>{formatDate(p.chargedAt)}</TableCell>
            <TableCell className="font-medium">{formatCurrency(p.amount, p.currency)}</TableCell>
            <TableCell>{p.currency}</TableCell>
            <TableCell className="text-xs text-muted-foreground">{p.billId ? p.billId.slice(0, 8) + "…" : "—"}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
