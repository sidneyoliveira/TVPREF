import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Use service role key for admin operations (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function GET() {
  try {
    const { data, error } = await supabaseAdmin
      .from('configuracoes')
      .select('*')
      .eq('id', 1)
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar configurações' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      youtube_link,
      texto_aviso,
      display_mode,
      image_url,
      announcement_title,
      announcement_text,
      show_instagram
    } = body;

    const { data, error } = await supabaseAdmin
      .from('configuracoes')
      .update({
        youtube_link,
        texto_aviso,
        display_mode,
        image_url,
        announcement_title,
        announcement_text,
        show_instagram,
        updated_at: new Date().toISOString()
      })
      .eq('id', 1)
      .select();

    if (error) throw error;
    return NextResponse.json(data[0]);
  } catch (error) {
    console.error('Admin config error:', error);
    return NextResponse.json({ error: 'Erro ao salvar configurações' }, { status: 500 });
  }
}
