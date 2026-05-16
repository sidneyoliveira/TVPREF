import type { Metadata } from "next";
import { AnuncioScreenClient } from "./anuncio-screen-client";

export const metadata: Metadata = {
  title: "Exibição de Patrocinadores",
  description: "Slideshow fullscreen de patrocinadores para telão de LED.",
};

export default function AnuncioPage() {
  return <AnuncioScreenClient />;
}
