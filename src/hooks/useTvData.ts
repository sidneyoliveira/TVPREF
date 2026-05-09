"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { subscribeTvDataChange } from "@/lib/tv-sync";
import {
  defaultConfig,
  DISPLAY_MODES,
  type CarouselImage,
  type Announcement,
  type Configuracoes,
  type InstagramLink,
} from "@/lib/types";

export type { Announcement, CarouselImage, Configuracoes, InstagramLink };

type TvDataState = {
  config: Configuracoes;
  instagramLinks: InstagramLink[];
  carouselImages: CarouselImage[];
  announcements: Announcement[];
};

const initialState: TvDataState = {
  config: defaultConfig,
  instagramLinks: [],
  carouselImages: [],
  announcements: [],
};

function isDisplayMode(value: unknown): value is Configuracoes["display_mode"] {
  return typeof value === "string" && DISPLAY_MODES.includes(value as Configuracoes["display_mode"]);
}

function normalizeConfig(value: Partial<Configuracoes> | null): Configuracoes {
  const displayMode = isDisplayMode(value?.display_mode)
    ? value.display_mode
    : defaultConfig.display_mode;

  return {
    ...defaultConfig,
    ...value,
    display_mode: displayMode,
    show_instagram: Boolean(value?.show_instagram),
    aviso_bg_color: value?.aviso_bg_color || defaultConfig.aviso_bg_color,
    aviso_text_color: value?.aviso_text_color || defaultConfig.aviso_text_color,
    theme_primary_color: value?.theme_primary_color || defaultConfig.theme_primary_color,
    theme_secondary_color: value?.theme_secondary_color || defaultConfig.theme_secondary_color,
    theme_accent_color: value?.theme_accent_color || defaultConfig.theme_accent_color,
  };
}

async function fetchConfig() {
  try {
    const response = await fetch("/api/admin/config", { cache: "no-store" });

    if (response.ok) {
      return normalizeConfig((await response.json()) as Partial<Configuracoes>);
    }
  } catch (error) {
    console.error("Erro ao buscar configurações pela API:", error);
  }

  const { data, error } = await supabase.from("configuracoes").select("*").eq("id", 1).single();

  if (!error) return normalizeConfig(data);

  console.error("Erro ao buscar configurações:", error);
  return defaultConfig;
}

async function fetchInstagramLinks() {
  const { data, error } = await supabase
    .from("instagram_links")
    .select("id,url,ordem")
    .order("ordem", { ascending: true });

  if (error) {
    console.error("Erro ao buscar links do Instagram:", error);
    return [];
  }

  return data ?? [];
}

async function fetchCarouselImages() {
  const { data, error } = await supabase
    .from("carousel_images")
    .select("id,imagem_url,titulo,descricao,ordem")
    .order("ordem", { ascending: true });

  if (error) {
    console.error("Erro ao buscar carrossel:", error);
    return [];
  }

  return data ?? [];
}

async function fetchAnnouncements() {
  try {
    const response = await fetch("/api/admin/announcements", { cache: "no-store" });

    if (!response.ok) {
      throw new Error("Falha ao buscar avisos");
    }

    const data = (await response.json()) as Announcement[];
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Erro ao buscar avisos:", error);
  }

  return [];
}

export function useTvData() {
  const [state, setState] = useState<TvDataState>(initialState);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    const [config, instagramLinks, carouselImages, announcements] = await Promise.all([
      fetchConfig(),
      fetchInstagramLinks(),
      fetchCarouselImages(),
      fetchAnnouncements(),
    ]);

    setState({ config, instagramLinks, carouselImages, announcements });
    setLoading(false);
  }, []);

  useEffect(() => {
    let active = true;

    async function loadInitialData() {
      const [config, instagramLinks, carouselImages, announcements] = await Promise.all([
        fetchConfig(),
        fetchInstagramLinks(),
        fetchCarouselImages(),
        fetchAnnouncements(),
      ]);

      if (!active) return;

      setState({ config, instagramLinks, carouselImages, announcements });
      setLoading(false);
    }

    void loadInitialData();

    const refreshFromSignal = () => {
      void refetch();
    };

    const channel = supabase
      .channel("tv-dashboard")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "configuracoes" },
        async () => {
          const [config, announcements] = await Promise.all([fetchConfig(), fetchAnnouncements()]);
          setState((current) => ({ ...current, config, announcements }));
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "instagram_links" },
        async () => {
          const instagramLinks = await fetchInstagramLinks();
          setState((current) => ({ ...current, instagramLinks }));
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "carousel_images" },
        async () => {
          const carouselImages = await fetchCarouselImages();
          setState((current) => ({ ...current, carouselImages }));
        },
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "announcements" },
        async () => {
          const announcements = await fetchAnnouncements();
          setState((current) => ({ ...current, announcements }));
        },
      )
      .subscribe();

    const unsubscribeTvDataChange = subscribeTvDataChange(refreshFromSignal);
    const refreshInterval = window.setInterval(refreshFromSignal, 2500);

    return () => {
      active = false;
      window.clearInterval(refreshInterval);
      unsubscribeTvDataChange();
      void supabase.removeChannel(channel);
    };
  }, [refetch]);

  return useMemo(
    () => ({
      ...state,
      loading,
      refetch,
    }),
    [loading, refetch, state],
  );
}
