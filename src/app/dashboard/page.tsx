"use client";

import { Header } from "@/components/layout/header";
import { CredentialsCard } from "@/components/dashboard/credentials-card";

export default function DashboardPage() {
  return (
    <div>
      <Header
        title="Dashboard"
        description="Manage your Mews API connection and environment"
      />
      <div className="p-6">
        <CredentialsCard />
      </div>
    </div>
  );
}
