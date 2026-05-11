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
import type { Bill } from "@/types/app";

type SortKey = keyof Pick<Bill, "number" | "accountName" | "state" | "issuedAt" | "grossAmount">;

interface BillsTableProps {
  bills: Bill[];
  isLoading: boolean;
}

const stateVariant: Record<string, "success" | "warning" | "destructive" | "outline"> = {
  Closed: "success",
  Open: "warning",
  Overdue: "destructive",
};

export function BillsTable({ bills, isLoading }: BillsTableProps) {
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({
    key: "issuedAt",
    dir: "desc",
  });

  function toggleSort(key: SortKey) {
    setSort((prev) =>
      prev.key === key ? { key, dir: prev.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }
    );
  }

  const sorted = [...bills].sort((a, b) => {
    const va = a[sort.key] ?? "";
    const vb = b[sort.key] ?? "";
    const cmp = String(va).localeCompare(String(vb), undefined, { numeric: true });
    return sort.dir === "asc" ? cmp : -cmp;
  });

  function SortIcon({ col }: { col: SortKey }) {
    if (sort.key !== col) return <ChevronUp className="h-3 w-3 opacity-30" />;
    return sort.dir === "asc" ? (
      <ChevronUp className="h-3 w-3" />
    ) : (
      <ChevronDown className="h-3 w-3" />
    );
  }

  function SortableHead({ col, label }: { col: SortKey; label: string }) {
    return (
      <TableHead
        className="cursor-pointer select-none"
        onClick={() => toggleSort(col)}
      >
        <span className="flex items-center gap-1">
          {label}
          <SortIcon col={col} />
        </span>
      </TableHead>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-2 p-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  if (!bills.length) {
    return (
      <div className="p-12 text-center text-sm text-muted-foreground">
        No bills found for the selected period.
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <SortableHead col="number" label="Bill #" />
          <SortableHead col="accountName" label="Account" />
          <TableHead>Type</TableHead>
          <SortableHead col="state" label="Status" />
          <SortableHead col="issuedAt" label="Issue Date" />
          <TableHead>Due Date</TableHead>
          <TableHead>Net</TableHead>
          <TableHead>Tax</TableHead>
          <SortableHead col="grossAmount" label="Gross" />
          <TableHead>Currency</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((bill) => (
          <TableRow key={bill.id}>
            <TableCell className="font-medium">{bill.number}</TableCell>
            <TableCell>{bill.accountName}</TableCell>
            <TableCell>{bill.type}</TableCell>
            <TableCell>
              <Badge variant={stateVariant[bill.state] ?? "outline"}>{bill.state}</Badge>
            </TableCell>
            <TableCell>{formatDate(bill.issuedAt)}</TableCell>
            <TableCell>{formatDate(bill.dueAt)}</TableCell>
            <TableCell>{bill.netAmount.toFixed(2)}</TableCell>
            <TableCell>{bill.taxAmount.toFixed(2)}</TableCell>
            <TableCell className="font-medium">
              {formatCurrency(bill.grossAmount, bill.currency)}
            </TableCell>
            <TableCell>{bill.currency}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
