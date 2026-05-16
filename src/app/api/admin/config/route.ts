import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import {
  isMissingColumnError,
  readSettingsJson,
  SETTINGS_PATHS,
  writeSettingsJson,
} from "@/lib/settings-storage";
import { defaultConfig, DISPLAY_MODES, type Configuracoes } from "@/lib/types";

type ConfigRequestBody = Partial<Configuracoes>;

function isDisplayMode(value: unknown): value is Configuracoes["display_mode"] {
  return typeof value === "string" && DISPLAY_MODES.includes(value as Configuracoes["display_mode"]);
}

function optionalText(value: unknown) {
  return typeof value === "string" ? value : "";
}

function optionalColor(value: unknown, fallback: string) {
  if (typeof value !== "string") return fallback;
  return /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
}

function needsStorageColorFallback(data: Record<string, unknown> | null) {
  if (!data) return true;

  return (
    !("show_instagram" in data) ||
    !("aviso_bg_color" in data) ||
    !("aviso_text_color" in data) ||
    !("theme_primary_color" in data) ||
    !("theme_secondary_color" in data) ||
    !("theme_accent_color" in data)
  );
}

function getOptionalOverrides(body: ConfigRequestBody): Partial<Configuracoes> {
  return {
    show_instagram: Boolean(body.show_instagram),
    aviso_bg_color: optionalColor(body.aviso_bg_color, defaultConfig.aviso_bg_color || "#123a70"),
    aviso_text_color: optionalColor(body.aviso_text_color, defaultConfig.aviso_text_color || "#ffffff"),
    theme_primary_color: optionalColor(body.theme_primary_color, defaultConfig.theme_primary_color || "#08244f"),
    theme_secondary_color: optionalColor(body.theme_secondary_color, defaultConfig.theme_secondary_color || "#04142e"),
    theme_accent_color: optionalColor(body.theme_accent_color, defaultConfig.theme_accent_color || "#2b7be4"),
    tts_enabled: Boolean(body.tts_enabled),
    tts_volume: typeof body.tts_volume === "number" ? body.tts_volume : 1.0,
    tts_voice: optionalText(body.tts_voice),
  };
}

async function getCurrentConfigForMerge() {
  const supabaseAdmin = getSupabaseAdmin();
  const { data, error } = await supabaseAdmin.from("configuracoes").select("*").eq("id", 1).single();

  if (error) throw error;

  const storageOverrides = needsStorageColorFallback(data)
    ? await readSettingsJson<Partial<Configuracoes>>(
        supabaseAdmin,
        SETTINGS_PATHS.configOverrides,
        {},
      )
    : {};

  return { supabaseAdmin, currentConfig: { ...defaultConfig, ...data, ...storageOverrides } };
}

export async function GET() {
  try {
    const { currentConfig } = await getCurrentConfigForMerge();

    return NextResponse.json(currentConfig);
  } catch (error) {
    console.error("Admin config fetch error:", error);
    return NextResponse.json({ error: "Erro ao buscar configurações" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;

  try {
    const { supabaseAdmin, currentConfig } = await getCurrentConfigForMerge();
    const body = {
      ...currentConfig,
      ...((await request.json()) as ConfigRequestBody),
    } as ConfigRequestBody;

    const baseUpdate = {
      youtube_link: optionalText(body.youtube_link),
      texto_aviso: optionalText(body.texto_aviso),
      display_mode: isDisplayMode(body.display_mode) ? body.display_mode : defaultConfig.display_mode,
      updated_at: new Date().toISOString(),
    };

    const optionalOverrides = getOptionalOverrides(body);

    try {
      const fullUpdate = {
        ...baseUpdate,
        ...optionalOverrides,
      };

      const { data, error } = await supabaseAdmin
        .from("configuracoes")
        .update(fullUpdate)
        .eq("id", 1)
        .select("*");

      if (error) throw error;
      return NextResponse.json({ ...defaultConfig, ...data[0] });
    } catch (error) {
      if (isMissingColumnError(error)) {
        const updateWithInstagram = {
          ...baseUpdate,
          show_instagram: Boolean(body.show_instagram),
        };

        let { data, error: errorWithout } = await supabaseAdmin
          .from("configuracoes")
          .update(updateWithInstagram)
          .eq("id", 1)
          .select("*");

        if (errorWithout && isMissingColumnError(errorWithout)) {
          const retry = await supabaseAdmin
            .from("configuracoes")
            .update(baseUpdate)
            .eq("id", 1)
            .select("*");

          data = retry.data;
          errorWithout = retry.error;
        }

        if (errorWithout) throw errorWithout;

        await writeSettingsJson(
          supabaseAdmin,
          SETTINGS_PATHS.configOverrides,
          optionalOverrides,
        );

        return NextResponse.json({ ...defaultConfig, ...(data?.[0] ?? {}), ...optionalOverrides });
      }

      throw error;
    }
  } catch (error) {
    console.error("Admin config save error:", error);
    return NextResponse.json({ error: "Erro ao salvar configurações" }, { status: 500 });
  }
}
