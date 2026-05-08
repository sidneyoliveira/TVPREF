"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  defaultConfig,
  DISPLAY_MODES,
  type CarouselImage,
  type Configuracoes,
  type InstagramLink,
} from "@/lib/types";

export type { CarouselImage, Configuracoes, InstagramLink };

type TvDataState = {
  config: Configuracoes;
  instagramLinks: InstagramLink[];
  carouselImages: CarouselImage[];
};

const initialState: TvDataState = {
  config: defaultConfig,
  instagramLinks: [],
  carouselImages: [],
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
  };
}

async function fetchConfig() {
  const { data, error } = await supabase
    .from("configuracoes")
    .select("*")
    .eq("id", 1)
    .single();

  if (error) {
    console.error("Erro ao buscar configurações:", error);
    return defaultConfig;
  }

  return normalizeConfig(data);
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

export function useTvData() {
  const [state, setState] = useState<TvDataState>(initialState);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    const [config, instagramLinks, carouselImages] = await Promise.all([
      fetchConfig(),
      fetchInstagramLinks(),
      fetchCarouselImages(),
    ]);

    setState({ config, instagramLinks, carouselImages });
    setLoading(false);
  }, []);

  useEffect(() => {
    let active = true;

    async function loadInitialData() {
      const [config, instagramLinks, carouselImages] = await Promise.all([
        fetchConfig(),
        fetchInstagramLinks(),
        fetchCarouselImages(),
      ]);

      if (!active) return;

      setState({ config, instagramLinks, carouselImages });
      setLoading(false);
    }

    void loadInitialData();

    const channel = supabase
      .channel("tv-dashboard")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "configuracoes" },
        (payload) => {
          if (payload.new) {
            setState((current) => ({
              ...current,
              config: normalizeConfig(payload.new as Partial<Configuracoes>),
            }));
          }
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
      .subscribe();

    return () => {
      active = false;
      void supabase.removeChannel(channel);
    };
  }, []);

  return useMemo(
    () => ({
      ...state,
      loading,
      refetch,
    }),
    [loading, refetch, state],
  );
}
