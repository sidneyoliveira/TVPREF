import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

export async function GET() {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from("carousel_images")
      .select("id,imagem_url,titulo,descricao,ordem")
      .order("ordem", { ascending: true });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error("Carousel fetch error:", error);
    return NextResponse.json({ error: "Erro ao buscar imagens do carrossel" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const body = await request.json();
    const { imagem_url, titulo, descricao } = body;

    if (typeof imagem_url !== "string" || !imagem_url.trim()) {
      return NextResponse.json({ error: "URL da mídia é obrigatória" }, { status: 400 });
    }

    const { data: images } = await supabaseAdmin
      .from("carousel_images")
      .select("ordem")
      .order("ordem", { ascending: false })
      .limit(1);

    const maxOrdem = images && images.length > 0 ? images[0].ordem : 0;

    const { data, error } = await supabaseAdmin
      .from("carousel_images")
      .insert([{ imagem_url, titulo, descricao, ordem: maxOrdem + 1 }])
      .select("id,imagem_url,titulo,descricao,ordem");

    if (error) throw error;
    return NextResponse.json(data[0]);
  } catch (error) {
    console.error("Carousel add error:", error);
    return NextResponse.json({ error: "Erro ao adicionar imagem ao carrossel" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const unauthorized = requireAdmin(request);
  if (unauthorized) return unauthorized;

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID é obrigatório" }, { status: 400 });
    }

    const { error } = await supabaseAdmin
      .from("carousel_images")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Carousel delete error:", error);
    return NextResponse.json({ error: "Erro ao remover imagem do carrossel" }, { status: 500 });
  }
}
