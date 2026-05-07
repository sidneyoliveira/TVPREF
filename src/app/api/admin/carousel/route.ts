import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('carousel_images')
      .select('*')
      .order('ordem', { ascending: true });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar imagens do carrossel' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { imagem_url, titulo, descricao } = body;

    const { data: images } = await supabaseAdmin
      .from('carousel_images')
      .select('ordem')
      .order('ordem', { ascending: false })
      .limit(1);

    const maxOrdem = images && images.length > 0 ? images[0].ordem : 0;

    const { data, error } = await supabaseAdmin
      .from('carousel_images')
      .insert([{ imagem_url, titulo, descricao, ordem: maxOrdem + 1 }])
      .select();

    if (error) throw error;
    return NextResponse.json(data[0]);
  } catch (error) {
    console.error('Carousel add error:', error);
    return NextResponse.json({ error: 'Erro ao adicionar imagem ao carrossel' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    const { error } = await supabaseAdmin
      .from('carousel_images')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Carousel delete error:', error);
    return NextResponse.json({ error: 'Erro ao remover imagem do carrossel' }, { status: 500 });
  }
}
