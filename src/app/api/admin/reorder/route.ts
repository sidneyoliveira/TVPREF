import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function POST(request: Request) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;

  try {
    const { table, items } = await request.json();

    if (!["announcements", "instagram_links", "carousel_images"].includes(table)) {
      return NextResponse.json({ error: "Tabela inválida" }, { status: 400 });
    }

    if (!Array.isArray(items)) {
      return NextResponse.json({ error: "Formato inválido" }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Use multiple update calls since we only have partial data (id and ordem)
    const updatePromises = items.map((item) =>
      supabaseAdmin
        .from(table)
        .update({ ordem: item.ordem })
        .eq("id", item.id)
    );

    const results = await Promise.all(updatePromises);
    const hasError = results.some((res) => res.error);

    if (hasError) {
      const firstError = results.find((res) => res.error)?.error;
      throw firstError;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reorder error:", error);
    return NextResponse.json({ error: "Erro ao reordenar" }, { status: 500 });
  }
}
