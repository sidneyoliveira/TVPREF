import type { Metadata } from "next";
import { AdminDashboardClient } from "./admin-dashboard-client";

export const metadata: Metadata = {
  title: "Admin TV Prefeitura",
  description: "Painel administrativo da TV Prefeitura de Itarema.",
};

export default function AdminPage() {
  return <AdminDashboardClient />;
}
