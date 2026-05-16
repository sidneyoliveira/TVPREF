import type { Metadata } from "next";
import { AnuncioAdminClient } from "./anuncio-admin-client";

export const metadata: Metadata = {
  title: "Admin Patrocinadores",
  description: "Gerenciamento de patrocinadores para telão de LED.",
};

export default function AnuncioAdminPage() {
  return <AnuncioAdminClient />;
}
