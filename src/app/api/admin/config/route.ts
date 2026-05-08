import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import { defaultConfig, DISPLAY_MODES, type Configuracoes } from "@/lib/types";

type ConfigRequestBody = Partial<Configuracoes>;

function isDisplayMode(value: unknown): value is Configuracoes["display_mode"] {
  return typeof value === "string" && DISPLAY_MODES.includes(value as Configuracoes["display_mode"]);
}

function optionalText(value: unknown) {
  return typeof value === "string" ? value : "";
}

function serializeError(error: unknown) {
  if (error instanceof Error) return error.message;

  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

function isMissingOptionalColumn(error: unknown) {
  const text = serializeError(error);
  return (
    text.includes("show_instagram") ||
    text.includes("aviso_bg_color") ||
    text.includes("aviso_text_color") ||
    (typeof error === "object" && error !== null && "code" in error && error.code === "PGRST204")
  );
}

export async function GET() {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from("configuracoes")
      .select("*")
      .eq("id", 1)
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ ...defaultConfig, ...data });
  } catch (error) {
    console.error("Admin config fetch error:", error);
    return NextResponse.json({ error: "Erro ao buscar configurações" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const body = (await request.json()) as ConfigRequestBody;

    const baseUpdate = {
      youtube_link: optionalText(body.youtube_link),
      texto_aviso: optionalText(body.texto_aviso),
      display_mode: isDisplayMode(body.display_mode) ? body.display_mode : defaultConfig.display_mode,
      image_url: optionalText(body.image_url),
      announcement_title: optionalText(body.announcement_title),
      announcement_text: optionalText(body.announcement_text),
      updated_at: new Date().toISOString(),
    };

    try {
      const fullUpdate = {
        ...baseUpdate,
        show_instagram: Boolean(body.show_instagram),
        aviso_bg_color: optionalText(body.aviso_bg_color) || defaultConfig.aviso_bg_color,
        aviso_text_color: optionalText(body.aviso_text_color) || defaultConfig.aviso_text_color,
      };

      const { data, error } = await supabaseAdmin
        .from("configuracoes")
        .update(fullUpdate)
        .eq("id", 1)
        .select("*");

      if (error) throw error;
      return NextResponse.json(data[0]);
    } catch (error) {
      if (isMissingOptionalColumn(error)) {
        const { data, error: errorWithout } = await supabaseAdmin
          .from("configuracoes")
          .update(baseUpdate)
          .eq("id", 1)
          .select("*");

        if (errorWithout) throw errorWithout;
        return NextResponse.json(data[0]);
      }

      throw error;
    }
  } catch (error) {
    console.error("Admin config save error:", error);
    return NextResponse.json({ error: "Erro ao salvar configurações" }, { status: 500 });
  }
}
