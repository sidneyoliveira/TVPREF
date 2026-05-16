"use client";

import { AnuncioDisplay } from "@/components/AnuncioDisplay";
import { useAnuncioData } from "@/hooks/useAnuncioData";

function AnuncioLoading() {
  return (
    <div className="anuncio-display anuncio-display-fullscreen anuncio-mode-square has-no-frame">
      <div className="anuncio-frame" aria-hidden="true" />
      <div className="anuncio-sponsor-window">
        <div className="anuncio-empty-state">
          <span>Carregando</span>
        </div>
      </div>
    </div>
  );
}

export function AnuncioScreenClient() {
  const { settings, loading } = useAnuncioData();

  if (loading) return <AnuncioLoading />;

  return <AnuncioDisplay settings={settings} />;
}
