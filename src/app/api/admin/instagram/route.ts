import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

function isInstagramUrl(url: string) {
  try {
    const parsedUrl = new URL(url);
    return parsedUrl.hostname.endsWith("instagram.com");
  } catch {
    return false;
  }
}

export async function GET() {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from("instagram_links")
      .select("id,url,ordem")
      .order("ordem", { ascending: true });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error("Instagram fetch error:", error);
    return NextResponse.json({ error: "Erro ao buscar links" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const body = await request.json();
    const { url } = body;

    if (typeof url !== "string" || !isInstagramUrl(url)) {
      return NextResponse.json({ error: "URL do Instagram inválida" }, { status: 400 });
    }

    const { data: links } = await supabaseAdmin
      .from("instagram_links")
      .select("ordem")
      .order("ordem", { ascending: false })
      .limit(1);

    const maxOrdem = links && links.length > 0 ? links[0].ordem : 0;

    const { data, error } = await supabaseAdmin
      .from("instagram_links")
      .insert([{ url, ordem: maxOrdem + 1 }])
      .select("id,url,ordem");

    if (error) throw error;
    return NextResponse.json(data[0]);
  } catch (error) {
    console.error("Instagram add error:", error);
    return NextResponse.json({ error: "Erro ao adicionar link" }, { status: 500 });
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

    const { error } = await supabaseAdmin
      .from("instagram_links")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Instagram delete error:", error);
    return NextResponse.json({ error: "Erro ao remover link" }, { status: 500 });
  }
}
