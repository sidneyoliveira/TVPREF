import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

// Use service role key for admin operations (bypasses RLS)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function GET() {
  try {
    // Tenta incluir show_instagram explicitamente
    try {
      const { data, error } = await supabaseAdmin
        .from('configuracoes')
        .select('* , show_instagram')
        .eq('id', 1)
        .single();

      if (error) throw error;
      return NextResponse.json(data);
    } catch (error) {
      const errorText = (() => {
        try {
          if (error instanceof Error) return error.message;
          return JSON.stringify(error);
        } catch {
          return String(error);
        }
      })();

      // Se a coluna não existe no schema cache, devolve sem quebrar o painel.
      if (errorText.includes('show_instagram') || (error as { code?: string })?.code === 'PGRST204') {
        const { data, error: errorWithout } = await supabaseAdmin
          .from('configuracoes')
          .select('*')
          .eq('id', 1)
          .single();

        if (errorWithout) throw errorWithout;
        return NextResponse.json({ ...data, show_instagram: false });
      }

      throw error;
    }
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
      show_instagram,
    } = body;

    const baseUpdate = {
      youtube_link,
      texto_aviso,
      display_mode,
      image_url,
      announcement_title,
      announcement_text,
      updated_at: new Date().toISOString(),
    };

    // Tenta primeiro com show_instagram (quando existir no schema)
    try {
      const updateWithInstagram = {
        ...baseUpdate,
        show_instagram,
      };

      const { data, error } = await supabaseAdmin
        .from('configuracoes')
        .update(updateWithInstagram)
        .eq('id', 1)
        .select();

      if (error) throw error;
      return NextResponse.json(data[0]);
    } catch (error) {
      const errorText = (() => {
        try {
          if (error instanceof Error) return error.message;
          return JSON.stringify(error);
        } catch {
          return String(error);
        }
      })();

      // Se a coluna ainda não existe (migration pendente), salva sem ela.
      if (errorText.includes('show_instagram') || (error as { code?: string })?.code === 'PGRST204') {
        const { data, error: errorWithout } = await supabaseAdmin
          .from('configuracoes')
          .update(baseUpdate)
          .eq('id', 1)
          .select();

        if (errorWithout) throw errorWithout;
        return NextResponse.json(data[0]);
      }

      throw error;
    }
  } catch (error) {
    console.error('Admin config error:', error);
    return NextResponse.json({ error: 'Erro ao salvar configurações' }, { status: 500 });
  }
}
