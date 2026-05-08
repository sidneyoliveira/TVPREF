"use client";

import { useEffect, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import Image from "next/image";
import { Maximize2, Minimize2 } from "lucide-react";
import { DisplayAnnouncement } from "@/components/DisplayAnnouncement";
import { DisplayCarousel } from "@/components/DisplayCarousel";
import { DisplayImage } from "@/components/DisplayImage";
import { DisplaySplit } from "@/components/DisplaySplit";
import { DisplayWithOptionalInstagram } from "@/components/DisplayWithOptionalInstagram";
import { DisplayYoutube } from "@/components/DisplayYoutube";
import { useClock } from "@/hooks/useClock";
import { useEnvironmentInfo } from "@/hooks/useEnvironmentInfo";
import { useTvData } from "@/hooks/useTvData";
import type { Configuracoes, InstagramLink, CarouselImage } from "@/lib/types";
import logoBranca from "@/img/logo_branca.png";

type FullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
};

type FullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};

type DisplayContentProps = {
  config: Configuracoes;
  instagramLinks: InstagramLink[];
  carouselImages: CarouselImage[];
};

function DisplayContent({ config, instagramLinks, carouselImages }: DisplayContentProps) {
  let content: ReactNode;

  switch (config.display_mode) {
    case "image":
      content = (
        <DisplayImage
          imageUrl={config.image_url || ""}
          title={config.announcement_title || undefined}
          description={config.announcement_text || undefined}
        />
      );
      break;
    case "announcement":
      content = (
        <DisplayAnnouncement
          title={config.announcement_title || "Aviso Importante"}
          text={config.announcement_text || "Nenhum aviso configurado."}
        />
      );
      break;
    case "carousel":
      content = <DisplayCarousel images={carouselImages} />;
      break;
    case "split":
      content = <DisplaySplit config={config} instagramLinks={instagramLinks} />;
      break;
    case "youtube":
    default:
      content = <DisplayYoutube youtubeLink={config.youtube_link || ""} />;
      break;
  }

  if (config.show_instagram && config.display_mode !== "split") {
    return (
      <DisplayWithOptionalInstagram config={config} instagramLinks={instagramLinks}>
        {content}
      </DisplayWithOptionalInstagram>
    );
  }

  return content;
}

function TvScreenSkeleton() {
  return (
    <div id="tv-root">
      <header className="tv-header">
        <div className="tv-header-left">
          <div className="tv-skeleton tv-logo-skeleton" />
        </div>
        <div className="tv-header-center">
          <div className="tv-skeleton tv-title-skeleton" />
        </div>
        <div className="tv-header-right">
          <div className="tv-skeleton tv-clock-skeleton" />
          <div className="tv-skeleton tv-date-skeleton" />
        </div>
      </header>

      <main className="tv-main">
        <div className="tv-display tv-display-skeleton">
          <div className="tv-skeleton tv-display-skeleton-bar" />
          <div className="tv-skeleton tv-display-skeleton-copy" />
        </div>
      </main>

      <footer className="tv-footer">
        <div className="tv-footer-left">
          <div className="tv-skeleton tv-footer-skeleton-message" />
        </div>
        <div className="tv-footer-right">
          <div className="tv-skeleton tv-info-card" />
          <div className="tv-skeleton tv-info-card" />
        </div>
      </footer>
    </div>
  );
}

export function TvScreenClient() {
  const { config, instagramLinks, carouselImages, loading } = useTvData();
  const clock = useClock();
  const { weather, tide } = useEnvironmentInfo();
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const syncFullscreenState = () => {
      const fullscreenDocument = document as FullscreenDocument;
      setIsFullscreen(Boolean(document.fullscreenElement || fullscreenDocument.webkitFullscreenElement));
    };

    document.addEventListener("fullscreenchange", syncFullscreenState);
    document.addEventListener("webkitfullscreenchange", syncFullscreenState);
    syncFullscreenState();

    return () => {
      document.removeEventListener("fullscreenchange", syncFullscreenState);
      document.removeEventListener("webkitfullscreenchange", syncFullscreenState);
    };
  }, []);

  async function toggleFullscreen() {
    const fullscreenDocument = document as FullscreenDocument;
    const root = document.documentElement as FullscreenElement;

    try {
      if (document.fullscreenElement || fullscreenDocument.webkitFullscreenElement) {
        if (document.exitFullscreen) {
          await document.exitFullscreen();
          return;
        }

        await fullscreenDocument.webkitExitFullscreen?.();
        return;
      }

      if (root.requestFullscreen) {
        await root.requestFullscreen();
        return;
      }

      await root.webkitRequestFullscreen?.();
    } catch (error) {
      console.error("Erro ao alternar tela cheia:", error);
    }
  }

  if (loading) {
    return <TvScreenSkeleton />;
  }

  const footerStyle: CSSProperties = {
    background: `linear-gradient(180deg, ${config.aviso_bg_color || "#07111f"}, rgba(5,15,28,0.98))`,
  };

  return (
    <div id="tv-root">
      <header className="tv-header">
        <div className="tv-header-left">
          <Image src={logoBranca} alt="Logo Prefeitura" priority className="tv-logo" />
        </div>

        <div className="tv-header-center">
          <span className="tv-header-title">Prefeitura de Itarema</span>
        </div>

        <div className="tv-header-right">
          <span className="tv-clock" suppressHydrationWarning>
            {clock.time}
          </span>
          <span className="tv-date" suppressHydrationWarning>
            {clock.date}
          </span>
        </div>
      </header>

      <main className="tv-main">
        <div className="tv-display">
          <DisplayContent config={config} instagramLinks={instagramLinks} carouselImages={carouselImages} />
        </div>
      </main>

      <footer className="tv-footer" style={footerStyle}>
        <div className="tv-footer-left">
          <span
            className="tv-footer-message"
            style={{
              color: config.aviso_text_color || "#ffffff",
            }}
          >
            {config.texto_aviso || "Bem-vindo à Prefeitura de Itarema!"}
          </span>
        </div>

        <div className="tv-footer-right">
          <div className="tv-info-card">
            <span className="tv-info-label">TEMP</span>
            <span className="tv-info-value">
              {weather.temperatureC === null ? "--" : `${Math.round(weather.temperatureC)}°C`}
            </span>
          </div>

          <div className="tv-info-card">
            <span className="tv-info-label">MARÉ {tide.tendencia}</span>
            <span className="tv-info-value">
              {tide.tipo} ÀS {tide.horario}
            </span>
          </div>
        </div>
      </footer>

      <button
        type="button"
        className="tv-fullscreen-btn"
        onClick={toggleFullscreen}
        aria-label={isFullscreen ? "Sair da tela cheia" : "Entrar em tela cheia"}
        title={isFullscreen ? "Sair da tela cheia" : "Tela cheia"}
      >
        {isFullscreen ? <Minimize2 aria-hidden="true" /> : <Maximize2 aria-hidden="true" />}
      </button>
    </div>
  );
}
