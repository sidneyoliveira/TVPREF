import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import {
  isMissingColumnError,
  isMissingRelationError,
  readSettingsJson,
  SETTINGS_PATHS,
  touchConfigUpdatedAt,
  writeSettingsJson,
} from "@/lib/settings-storage";
import type { Announcement } from "@/lib/types";

type AnnouncementBody = {
  id?: unknown;
  title?: unknown;
  text?: unknown;
  bg_color?: unknown;
  text_color?: unknown;
  ordem?: unknown;
  is_active?: unknown;
};

const ANNOUNCEMENT_COLUMNS = "id,title,text,bg_color,text_color,ordem,is_active,created_at,updated_at";

function asText(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function asColor(value: unknown, fallback: string) {
  if (typeof value !== "string") return fallback;
  return /^#[0-9a-f]{6}$/i.test(value) ? value : fallback;
}

function asOrder(value: unknown) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function shouldUseStorageFallback(error: unknown) {
  return isMissingRelationError(error) || isMissingColumnError(error);
}

function normalizeAnnouncement(value: Partial<Announcement>): Announcement {
  const now = new Date().toISOString();

  return {
    id: asText(value.id) || crypto.randomUUID(),
    title: asText(value.title),
    text: asText(value.text),
    bg_color: asColor(value.bg_color, "#123a70"),
    text_color: asColor(value.text_color, "#ffffff"),
    ordem: asOrder(value.ordem),
    is_active: value.is_active !== false,
    created_at: asText(value.created_at, now),
    updated_at: asText(value.updated_at, now),
  };
}

function sortAnnouncements(announcements: Announcement[]) {
  return [...announcements].sort((left, right) => left.ordem - right.ordem);
}

async function readStoredAnnouncements() {
  const supabaseAdmin = getSupabaseAdmin();
  const stored = await readSettingsJson<Partial<Announcement>[]>(
    supabaseAdmin,
    SETTINGS_PATHS.announcements,
    [],
  );

  if (!Array.isArray(stored)) return [];
  return sortAnnouncements(stored.map(normalizeAnnouncement));
}

async function writeStoredAnnouncements(announcements: Announcement[]) {
  const supabaseAdmin = getSupabaseAdmin();
  await writeSettingsJson(
    supabaseAdmin,
    SETTINGS_PATHS.announcements,
    sortAnnouncements(announcements),
  );
  await touchConfigUpdatedAt(supabaseAdmin);
}

function buildAnnouncement(body: AnnouncementBody, existing?: Announcement, fallbackOrder = 1) {
  const now = new Date().toISOString();
  const title = asText(body.title).trim();
  const text = asText(body.text).trim();

  return normalizeAnnouncement({
    id: existing?.id || asText(body.id).trim() || crypto.randomUUID(),
    title,
    text,
    bg_color: asColor(body.bg_color, existing?.bg_color || "#123a70"),
    text_color: asColor(body.text_color, existing?.text_color || "#ffffff"),
    ordem: asOrder(body.ordem) || existing?.ordem || fallbackOrder,
    is_active: body.is_active !== false,
    created_at: existing?.created_at || now,
    updated_at: now,
  });
}

async function createStoredAnnouncement(body: AnnouncementBody) {
  const announcements = await readStoredAnnouncements();
  const nextOrder =
    announcements.length > 0
      ? Math.max(...announcements.map((announcement) => announcement.ordem)) + 1
      : 1;
  const announcement = buildAnnouncement(body, undefined, nextOrder);

  await writeStoredAnnouncements([...announcements, announcement]);
  return announcement;
}

async function updateStoredAnnouncement(body: AnnouncementBody) {
  const id = asText(body.id).trim();

  if (!id) {
    return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });
  }

  const announcements = await readStoredAnnouncements();
  const existing = announcements.find((announcement) => announcement.id === id);

  if (!existing) {
    return NextResponse.json({ error: "Aviso não encontrado" }, { status: 404 });
  }

  const updated = buildAnnouncement(body, existing);

  await writeStoredAnnouncements(
    announcements.map((announcement) =>
      announcement.id === id ? updated : announcement,
    ),
  );

  return NextResponse.json(updated);
}

export async function GET() {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from("announcements")
      .select(ANNOUNCEMENT_COLUMNS)
      .order("ordem", { ascending: true });

    if (error) {
      if (shouldUseStorageFallback(error)) {
        return NextResponse.json(await readStoredAnnouncements());
      }

      throw error;
    }

    return NextResponse.json(data ?? []);
  } catch (error) {
    console.error("Announcements fetch error:", error);
    return NextResponse.json({ error: "Erro ao buscar avisos" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const body = (await request.json()) as AnnouncementBody;
    const title = asText(body.title).trim();
    const text = asText(body.text).trim();

    if (!title || !text) {
      return NextResponse.json({ error: "Título e texto são obrigatórios" }, { status: 400 });
    }

    const { data: lastItems, error: orderError } = await supabaseAdmin
      .from("announcements")
      .select("ordem")
      .order("ordem", { ascending: false })
      .limit(1);

    if (orderError) {
      if (shouldUseStorageFallback(orderError)) {
        return NextResponse.json(await createStoredAnnouncement(body));
      }

      throw orderError;
    }

    const nextOrder = lastItems && lastItems.length > 0 ? Number(lastItems[0].ordem) + 1 : 1;

    const { data, error } = await supabaseAdmin
      .from("announcements")
      .insert([
        {
          title,
          text,
          bg_color: asColor(body.bg_color, "#123a70"),
          text_color: asColor(body.text_color, "#ffffff"),
          ordem: asOrder(body.ordem) || nextOrder,
          is_active: body.is_active !== false,
          updated_at: new Date().toISOString(),
        },
      ])
      .select(ANNOUNCEMENT_COLUMNS);

    if (error) {
      if (shouldUseStorageFallback(error)) {
        return NextResponse.json(await createStoredAnnouncement(body));
      }

      throw error;
    }

    return NextResponse.json(data[0]);
  } catch (error) {
    console.error("Announcements add error:", error);
    return NextResponse.json({ error: "Erro ao criar aviso" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const body = (await request.json()) as AnnouncementBody;
    const id = asText(body.id).trim();

    if (!id) {
      return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });
    }

    const title = asText(body.title).trim();
    const text = asText(body.text).trim();

    if (!title || !text) {
      return NextResponse.json({ error: "Título e texto são obrigatórios" }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from("announcements")
      .update({
        title,
        text,
        bg_color: asColor(body.bg_color, "#123a70"),
        text_color: asColor(body.text_color, "#ffffff"),
        ordem: asOrder(body.ordem),
        is_active: body.is_active !== false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select(ANNOUNCEMENT_COLUMNS);

    if (error) {
      if (shouldUseStorageFallback(error)) {
        return updateStoredAnnouncement(body);
      }

      throw error;
    }

    return NextResponse.json(data[0]);
  } catch (error) {
    console.error("Announcements update error:", error);
    return NextResponse.json({ error: "Erro ao atualizar aviso" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from("announcements").delete().eq("id", id);

    if (error) {
      if (shouldUseStorageFallback(error)) {
        const announcements = await readStoredAnnouncements();
        await writeStoredAnnouncements(
          announcements.filter((announcement) => announcement.id !== id),
        );
        return NextResponse.json({ success: true });
      }

      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Announcements delete error:", error);
    return NextResponse.json({ error: "Erro ao remover aviso" }, { status: 500 });
  }
}
