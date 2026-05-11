"use client";

import { Header } from "@/components/layout/header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useAccountingCategories } from "@/hooks/use-accounting-categories";

export default function AccountingCategoriesPage() {
  const { categories, isLoading, error } = useAccountingCategories();

  return (
    <div>
      <Header
        title="Chart of Accounts"
        description="Accounting categories and ledger codes configured in Mews"
      />
      {error && (
        <div className="m-4 rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}
      {isLoading ? (
        <div className="space-y-2 p-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Ledger Code</TableHead>
              <TableHead>External ID</TableHead>
              <TableHead>Type</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center text-muted-foreground py-12">
                  No accounting categories found.
                </TableCell>
              </TableRow>
            ) : (
              categories.map((cat) => (
                <TableRow key={cat.id}>
                  <TableCell className="font-medium">{cat.name}</TableCell>
                  <TableCell>
                    {cat.code ? (
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-mono font-medium">
                        {cat.code}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {cat.externalIdentifier ?? "—"}
                  </TableCell>
                  <TableCell>
                    {cat.type ? <Badge variant="outline">{cat.type}</Badge> : "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
