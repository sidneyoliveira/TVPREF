import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('instagram_links')
      .select('*')
      .order('ordem', { ascending: true });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar links' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { url } = body;

    const { data: links } = await supabaseAdmin
      .from('instagram_links')
      .select('ordem')
      .order('ordem', { ascending: false })
      .limit(1);

    const maxOrdem = links && links.length > 0 ? links[0].ordem : 0;

    const { data, error } = await supabaseAdmin
      .from('instagram_links')
      .insert([{ url, ordem: maxOrdem + 1 }])
      .select();

    if (error) throw error;
    return NextResponse.json(data[0]);
  } catch (error) {
    console.error('Instagram add error:', error);
    return NextResponse.json({ error: 'Erro ao adicionar link' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    const { error } = await supabaseAdmin
      .from('instagram_links')
      .delete()
      .eq('id', id);

    if (error) throw error;
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Instagram delete error:', error);
    return NextResponse.json({ error: 'Erro ao remover link' }, { status: 500 });
  }
}
