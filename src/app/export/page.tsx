import { Header } from "@/components/layout/header";
import { ExportForm } from "@/components/export/export-form";

export default function ExportPage() {
  return (
    <div>
      <Header
        title="Export CSV"
        description="Download accounting data as CSV for import into any accounting system"
      />
      <div className="p-6">
        <ExportForm />
      </div>
    </div>
  );
}
