"use client";

import { useCallback, useEffect, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import Image from "next/image";
import { Maximize2, Minimize2 } from "lucide-react";
import { DisplayAnnouncementQueue } from "@/components/DisplayAnnouncement";
import { DisplayCarousel } from "@/components/DisplayCarousel";
import { DisplayWithOptionalInstagram } from "@/components/DisplayWithOptionalInstagram";
import { DisplayYoutube } from "@/components/DisplayYoutube";
import { useClock } from "@/hooks/useClock";
import { useEnvironmentInfo } from "@/hooks/useEnvironmentInfo";
import { useTvData } from "@/hooks/useTvData";
import type { Announcement, CarouselImage, Configuracoes, InstagramLink } from "@/lib/types";
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
  announcements: Announcement[];
  onAnnouncementBackgroundChange: (color: string) => void;
};

function DisplayContent({
  config,
  instagramLinks,
  carouselImages,
  announcements,
  onAnnouncementBackgroundChange,
}: DisplayContentProps) {
  const activeAnnouncements = announcements.filter(a => {
    if (!a.is_active) return false;
    if (!a.scheduled_start && !a.scheduled_end) return true;

    const now = new Date();
    
    if (a.recurrence === 'daily' && a.scheduled_start && a.scheduled_end) {
      const start = new Date(a.scheduled_start);
      const end = new Date(a.scheduled_end);
      const currentMinutes = now.getHours() * 60 + now.getMinutes();
      const startMinutes = start.getHours() * 60 + start.getMinutes();
      const endMinutes = end.getHours() * 60 + end.getMinutes();
      return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
    }

    if (a.scheduled_start) {
      const start = new Date(a.scheduled_start);
      if (now < start) return false;
    }
    
    if (a.scheduled_end) {
      const end = new Date(a.scheduled_end);
      if (now > end) return false;
    }
    
    return true;
  });

  const sortedAnnouncements = [...activeAnnouncements].sort((a, b) => (b.priority || 0) - (a.priority || 0));

  let content: ReactNode;

  switch (config.display_mode) {
    case "announcement":
      content = (
        <DisplayAnnouncementQueue
          announcements={sortedAnnouncements}
          config={config}
          fallbackTitle="Aviso Importante"
          fallbackText="Nenhum aviso configurado."
          onBackgroundColorChange={onAnnouncementBackgroundChange}
        />
      );
      break;
    case "carousel":
      content = <DisplayCarousel images={carouselImages} />;
      break;
    case "youtube":
    default:
      content = <DisplayYoutube youtubeLink={config.youtube_link || ""} />;
      break;
  }

  if (config.show_instagram) {
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
  const { config, instagramLinks, carouselImages, announcements, loading } = useTvData();
  const clock = useClock();
  const { weather, tide } = useEnvironmentInfo();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [announcementBackgroundColor, setAnnouncementBackgroundColor] = useState("#123a70");

  const handleAnnouncementBackgroundChange = useCallback((color: string) => {
    setAnnouncementBackgroundColor(color);
  }, []);

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

  const displayBackgroundColor =
    config.display_mode === "announcement"
      ? announcementBackgroundColor
      : config.theme_secondary_color || "#04142e";

  const themeStyle = {
    "--tv-theme-primary": config.theme_primary_color || "#08244f",
    "--tv-theme-secondary": config.theme_secondary_color || "#04142e",
    "--tv-theme-accent": config.theme_accent_color || "#2b7be4",
    "--tv-display-bg": displayBackgroundColor,
  } as CSSProperties &
    Record<"--tv-theme-primary" | "--tv-theme-secondary" | "--tv-theme-accent" | "--tv-display-bg", string>;

  return (
    <div id="tv-root" style={themeStyle}>
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
          <DisplayContent
            config={config}
            instagramLinks={instagramLinks}
            carouselImages={carouselImages}
            announcements={announcements}
            onAnnouncementBackgroundChange={handleAnnouncementBackgroundChange}
          />
        </div>
      </main>

      <footer className="tv-footer">
        <div className="tv-footer-left">
          <span className="tv-footer-message">
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
