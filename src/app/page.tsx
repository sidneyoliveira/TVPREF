import type { Metadata } from "next";
import { TvScreenClient } from "./tv-screen-client";

export const metadata: Metadata = {
  title: "TV Prefeitura de Itarema",
  description: "Canal oficial de comunicados, transmissão ao vivo, avisos e informações da Prefeitura de Itarema.",
  openGraph: {
    title: "TV Prefeitura de Itarema",
    description: "Canal oficial de comunicados, transmissão ao vivo, avisos e informações da Prefeitura de Itarema.",
    type: "website",
    locale: "pt_BR",
  },
};

export default function Page() {
  return <TvScreenClient />;
}
