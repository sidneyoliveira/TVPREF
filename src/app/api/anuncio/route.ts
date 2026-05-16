import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { readSettingsJson, touchConfigUpdatedAt, writeSettingsJson } from "@/lib/settings-storage";
import {
  ANUNCIO_TRANSITION_STYLES,
  defaultAnuncioSettings,
  type AnuncioSettings,
  type SponsorLogo,
} from "@/lib/types";

const ANUNCIO_SETTINGS_PATH = "anuncio-display.json";
const MIN_DURATION_SECONDS = 2;
const MAX_DURATION_SECONDS = 60;
const MIN_TRANSITION_MS = 0;
const MAX_TRANSITION_MS = 2500;

type AnuncioRequestBody = Partial<AnuncioSettings>;

type LegacyAnuncioSettings = Partial<AnuncioSettings> & {
  display_mode?: unknown;
  vertical_frame_url?: unknown;
  horizontal_frame_url?: unknown;
};

function asText(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asNumber(value: unknown, fallback: number) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function asColor(value: unknown, fallback: string) {
  if (typeof value !== "string") return fallback;
  return /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function isTransitionStyle(value: unknown): value is AnuncioSettings["transition_style"] {
  return typeof value === "string" && ANUNCIO_TRANSITION_STYLES.includes(value as AnuncioSettings["transition_style"]);
}

function normalizeSponsor(value: Partial<SponsorLogo>, fallbackOrder: number): SponsorLogo | null {
  const displayType = value.display_type === "text" ? "text" : "image";
  const name = asText(value.name, "Patrocinador").trim() || "Patrocinador";
  const logoUrl = asText(value.logo_url).trim();
  const now = new Date().toISOString();

  if (displayType === "image" && !logoUrl) return null;

  return {
    id: asText(value.id).trim() || crypto.randomUUID(),
    name,
    logo_url: displayType === "image" ? logoUrl : "",
    display_type: displayType,
    bg_color: asColor(value.bg_color, "#123a70"),
    text_color: asColor(value.text_color, "#ffffff"),
    font_size: asNumber(value.font_size, 48),
    ordem: asNumber(value.ordem, fallbackOrder) || fallbackOrder,
    created_at: asText(value.created_at, now),
    updated_at: asText(value.updated_at, now),
  };
}

function normalizeSponsors(value: unknown): SponsorLogo[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item, index) => normalizeSponsor(item as Partial<SponsorLogo>, index + 1))
    .filter((item): item is SponsorLogo => Boolean(item))
    .sort((left, right) => left.ordem - right.ordem)
    .map((item, index) => ({ ...item, ordem: index + 1 }));
}

function getFrameUrl(value: LegacyAnuncioSettings | null) {
  return (
    asText(value?.frame_url).trim() ||
    asText(value?.horizontal_frame_url).trim() ||
    asText(value?.vertical_frame_url).trim()
  );
}

function normalizeSettings(value: LegacyAnuncioSettings | null): AnuncioSettings {
  return {
    frame_url: getFrameUrl(value),
    duration_seconds: clamp(
      Math.round(asNumber(value?.duration_seconds, defaultAnuncioSettings.duration_seconds)),
      MIN_DURATION_SECONDS,
      MAX_DURATION_SECONDS,
    ),
    transition_ms: clamp(
      Math.round(asNumber(value?.transition_ms, defaultAnuncioSettings.transition_ms)),
      MIN_TRANSITION_MS,
      MAX_TRANSITION_MS,
    ),
    transition_style: isTransitionStyle(value?.transition_style)
      ? value.transition_style
      : defaultAnuncioSettings.transition_style,
    sponsors: normalizeSponsors(value?.sponsors),
    updated_at: asText(value?.updated_at, "") || null,
  };
}

async function readAnuncioSettings() {
  const supabaseAdmin = getSupabaseAdmin();
  const stored = await readSettingsJson<LegacyAnuncioSettings>(
    supabaseAdmin,
    ANUNCIO_SETTINGS_PATH,
    defaultAnuncioSettings,
  );

  return { supabaseAdmin, settings: normalizeSettings(stored) };
}

export async function GET() {
  try {
    const { settings } = await readAnuncioSettings();
    return NextResponse.json(settings);
  } catch (error) {
    console.error("Anuncio settings fetch error:", error);
    return NextResponse.json({ error: "Erro ao buscar configurações do anúncio" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;

  try {
    const { supabaseAdmin, settings } = await readAnuncioSettings();
    const body = (await request.json()) as AnuncioRequestBody;
    const nextSettings = normalizeSettings({
      ...settings,
      ...body,
      sponsors: Array.isArray(body.sponsors) ? body.sponsors : settings.sponsors,
      updated_at: new Date().toISOString(),
    });

    await writeSettingsJson(supabaseAdmin, ANUNCIO_SETTINGS_PATH, nextSettings);
    await touchConfigUpdatedAt(supabaseAdmin);

    return NextResponse.json(nextSettings);
  } catch (error) {
    console.error("Anuncio settings save error:", error);
    return NextResponse.json({ error: "Erro ao salvar configurações do anúncio" }, { status: 500 });
  }
}
