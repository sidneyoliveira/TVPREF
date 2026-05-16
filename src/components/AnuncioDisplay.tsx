"use client";

import { useEffect, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import type { AnuncioSettings } from "@/lib/types";

type AnuncioDisplayProps = {
  settings: AnuncioSettings;
  variant?: "fullscreen" | "preview";
};

function cssImageUrl(url: string) {
  if (!url) return "none";
  return `url("${url.replaceAll('"', '\\"')}")`;
}

export function AnuncioDisplay({ settings, variant = "fullscreen" }: AnuncioDisplayProps) {
  const sponsors = useMemo(
    () => [...settings.sponsors].sort((left, right) => left.ordem - right.ordem),
    [settings.sponsors],
  );
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (sponsors.length <= 1) return;

    const interval = window.setInterval(() => {
      setCurrentIndex((current) => (current + 1) % sponsors.length);
    }, settings.duration_seconds * 1000);

    return () => window.clearInterval(interval);
  }, [settings.duration_seconds, sponsors.length]);

  const safeCurrentIndex = sponsors.length > 0 ? currentIndex % sponsors.length : 0;
  const currentSponsor = sponsors[safeCurrentIndex];
  const frameUrl = settings.frame_url;
  const style = {
    "--anuncio-frame-image": cssImageUrl(frameUrl),
    "--anuncio-transition-ms": `${settings.transition_ms}ms`,
  } as CSSProperties & Record<"--anuncio-frame-image" | "--anuncio-transition-ms", string>;

  return (
    <div
      className={[
        "anuncio-display",
        `anuncio-display-${variant}`,
        "anuncio-mode-square",
        `anuncio-transition-${settings.transition_style}`,
        frameUrl ? "has-frame" : "has-no-frame",
      ].join(" ")}
      style={style}
    >
      <div className="anuncio-frame" aria-hidden="true" />

      <div className="anuncio-sponsor-window">
        {currentSponsor ? (
          <div key={currentSponsor.id} className="anuncio-sponsor-slide">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={currentSponsor.logo_url}
              alt={currentSponsor.name}
              className="anuncio-sponsor-logo"
              decoding="async"
              loading={variant === "fullscreen" ? "eager" : "lazy"}
            />
          </div>
        ) : (
          <div className="anuncio-empty-state">
            <span>Patrocinadores</span>
          </div>
        )}
      </div>

      <div className="anuncio-preload" aria-hidden="true">
        {sponsors.map((sponsor) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img key={sponsor.id} src={sponsor.logo_url} alt="" />
        ))}
      </div>
    </div>
  );
}
