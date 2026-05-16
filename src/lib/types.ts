export const DISPLAY_MODES = [
  "youtube",
  "announcement",
  "carousel",
] as const;

export type DisplayMode = (typeof DISPLAY_MODES)[number];

export interface Configuracoes {
  id?: number;
  youtube_link: string;
  texto_aviso: string;
  display_mode: DisplayMode;
  show_instagram?: boolean | null;
  aviso_bg_color?: string | null;
  aviso_text_color?: string | null;
  theme_primary_color?: string | null;
  theme_secondary_color?: string | null;
  theme_accent_color?: string | null;
  tts_enabled?: boolean | null;
  tts_volume?: number | null;
  tts_voice?: string | null;
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

export interface Announcement {
  id: string;
  title: string;
  text: string;
  bg_color: string;
  text_color: string;
  ordem: number;
  is_active: boolean;
  image_url?: string | null;
  scheduled_start?: string | null;
  scheduled_end?: string | null;
  recurrence?: string | null;
  priority?: number;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface TideInfo {
  tendencia: string;
  tipo: string;
  horario: string;
}

export interface CurrentWeather {
  temperatureC: number | null;
}

export const ANUNCIO_TRANSITION_STYLES = ["fade", "zoom", "slide"] as const;

export type AnuncioTransitionStyle = (typeof ANUNCIO_TRANSITION_STYLES)[number];

export interface SponsorLogo {
  id: string;
  name: string;
  logo_url: string;
  ordem: number;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface AnuncioSettings {
  frame_url: string;
  duration_seconds: number;
  transition_ms: number;
  transition_style: AnuncioTransitionStyle;
  sponsors: SponsorLogo[];
  updated_at?: string | null;
}

export const defaultConfig: Configuracoes = {
  youtube_link: "",
  texto_aviso: "Aguardando configurações...",
  display_mode: "youtube",
  show_instagram: false,
  aviso_bg_color: "#123a70",
  aviso_text_color: "#ffffff",
  theme_primary_color: "#08244f",
  theme_secondary_color: "#04142e",
  theme_accent_color: "#2b7be4",
  tts_enabled: false,
  tts_volume: 1.0,
  tts_voice: "",
};

export const defaultAnuncioSettings: AnuncioSettings = {
  frame_url: "",
  duration_seconds: 5,
  transition_ms: 700,
  transition_style: "fade",
  sponsors: [],
  updated_at: null,
};
