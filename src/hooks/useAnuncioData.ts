"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { subscribeAnuncioDataChange } from "@/lib/anuncio-sync";
import { supabase } from "@/lib/supabase";
import {
  ANUNCIO_TRANSITION_STYLES,
  defaultAnuncioSettings,
  type AnuncioSettings,
  type SponsorLogo,
} from "@/lib/types";

export type { AnuncioSettings, SponsorLogo };

type LegacyAnuncioSettings = Partial<AnuncioSettings> & {
  display_mode?: unknown;
  vertical_frame_url?: unknown;
  horizontal_frame_url?: unknown;
};

function isTransitionStyle(value: unknown): value is AnuncioSettings["transition_style"] {
  return typeof value === "string" && ANUNCIO_TRANSITION_STYLES.includes(value as AnuncioSettings["transition_style"]);
}

function normalizeSponsors(value: unknown): SponsorLogo[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter((item): item is Partial<SponsorLogo> => Boolean(item) && typeof item === "object")
    .map((item, index) => {
      const displayType: SponsorLogo["display_type"] = item.display_type === "text" ? "text" : "image";
      return {
        id: typeof item.id === "string" && item.id ? item.id : `sponsor-${index + 1}`,
        name: typeof item.name === "string" && item.name.trim() ? item.name : "Patrocinador",
        logo_url: typeof item.logo_url === "string" ? item.logo_url : "",
        display_type: displayType,
        bg_color: typeof item.bg_color === "string" ? item.bg_color : "#123a70",
        text_color: typeof item.text_color === "string" ? item.text_color : "#ffffff",
        font_size: typeof item.font_size === "number" && Number.isFinite(item.font_size) ? item.font_size : 48,
        ordem: typeof item.ordem === "number" && Number.isFinite(item.ordem) ? item.ordem : index + 1,
        created_at: typeof item.created_at === "string" ? item.created_at : null,
        updated_at: typeof item.updated_at === "string" ? item.updated_at : null,
      };
    })
    .filter((item) => item.display_type === "text" || item.logo_url)
    .sort((left, right) => left.ordem - right.ordem)
    .map((item, index) => ({ ...item, ordem: index + 1 }));
}

function getFrameUrl(value: LegacyAnuncioSettings | null) {
  return (
    (typeof value?.frame_url === "string" ? value.frame_url : "") ||
    (typeof value?.horizontal_frame_url === "string" ? value.horizontal_frame_url : "") ||
    (typeof value?.vertical_frame_url === "string" ? value.vertical_frame_url : "")
  );
}

function normalizeSettings(value: LegacyAnuncioSettings | null): AnuncioSettings {
  const durationSeconds =
    typeof value?.duration_seconds === "number" && Number.isFinite(value.duration_seconds)
      ? value.duration_seconds
      : defaultAnuncioSettings.duration_seconds;
  const transitionMs =
    typeof value?.transition_ms === "number" && Number.isFinite(value.transition_ms)
      ? value.transition_ms
      : defaultAnuncioSettings.transition_ms;

  return {
    frame_url: getFrameUrl(value),
    duration_seconds: Math.min(60, Math.max(2, Math.round(durationSeconds))),
    transition_ms: Math.min(2500, Math.max(0, Math.round(transitionMs))),
    transition_style: isTransitionStyle(value?.transition_style)
      ? value.transition_style
      : defaultAnuncioSettings.transition_style,
    sponsors: normalizeSponsors(value?.sponsors),
    updated_at: value?.updated_at || null,
  };
}

async function fetchAnuncioSettings() {
  try {
    const response = await fetch("/api/anuncio", { cache: "no-store" });

    return normalizeSettings((await response.json()) as LegacyAnuncioSettings);
  } catch (error) {
    console.error("Erro ao buscar módulo de anúncio:", error);
    return defaultAnuncioSettings;
  }
}

export function useAnuncioData() {
  const [settings, setSettings] = useState<AnuncioSettings>(defaultAnuncioSettings);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    const nextSettings = await fetchAnuncioSettings();
    setSettings(nextSettings);
    setLoading(false);
  }, []);

  useEffect(() => {
    let active = true;

    const refresh = async () => {
      const nextSettings = await fetchAnuncioSettings();
      if (!active) return;
      setSettings(nextSettings);
      setLoading(false);
    };

    void refresh();

    const channel = supabase
      .channel("anuncio-display")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "configuracoes" },
        () => {
          void refresh();
        },
      )
      .subscribe();

    const unsubscribeStorage = subscribeAnuncioDataChange(() => {
      void refresh();
    });
    const refreshInterval = window.setInterval(() => {
      void refresh();
    }, 2500);

    return () => {
      active = false;
      window.clearInterval(refreshInterval);
      unsubscribeStorage();
      void supabase.removeChannel(channel);
    };
  }, []);

  return useMemo(
    () => ({
      settings,
      loading,
      refetch,
    }),
    [loading, refetch, settings],
  );
}
