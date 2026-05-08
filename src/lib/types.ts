export const DISPLAY_MODES = [
  "youtube",
  "image",
  "announcement",
  "carousel",
  "split",
] as const;

export type DisplayMode = (typeof DISPLAY_MODES)[number];

export interface Configuracoes {
  id?: number;
  youtube_link: string;
  texto_aviso: string;
  display_mode: DisplayMode;
  image_url?: string | null;
  announcement_title?: string | null;
  announcement_text?: string | null;
  show_instagram?: boolean | null;
  aviso_bg_color?: string | null;
  aviso_text_color?: string | null;
  updated_at?: string | null;
}

export interface InstagramLink {
  id: string;
  url: string;
  ordem: number;
}

export interface CarouselImage {
  id: string;
  imagem_url: string;
  titulo?: string | null;
  descricao?: string | null;
  ordem: number;
}

export interface TideInfo {
  tendencia: string;
  tipo: string;
  horario: string;
}

export interface CurrentWeather {
  temperatureC: number | null;
}

export const defaultConfig: Configuracoes = {
  youtube_link: "",
  texto_aviso: "Aguardando configurações...",
  display_mode: "youtube",
  image_url: "",
  announcement_title: "",
  announcement_text: "",
  show_instagram: false,
  aviso_bg_color: "#123a70",
  aviso_text_color: "#ffffff",
};
