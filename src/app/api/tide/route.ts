import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // 1. Pega os dados salvos no banco
    const { data: cache, error: cacheError } = await supabase.from('tide_cache').select('*').eq('id', 1).single();
    
    let extremes = [];
    const now = new Date();
    
    // Verifica se não tem cache ou se ele é mais velho que 12 horas
    const isCacheOld = cache ? (now.getTime() - new Date(cache.updated_at).getTime() > 12 * 60 * 60 * 1000) : true;

    // Objeto para nos dizer o que deu errado
    let debugInfo: any = { 
      usou_cache: !isCacheOld, 
      erro_supabase: cacheError?.message || null 
    };

    if (isCacheOld || !cache?.data?.length) {
      const start = Math.floor(now.getTime() / 1000);
      const end = start + (7 * 24 * 60 * 60); // 7 dias
      const lat = process.env.NEXT_PUBLIC_WEATHER_LAT;
      const lng = process.env.NEXT_PUBLIC_WEATHER_LON;
      const apiKey = process.env.STORMGLASS_API_KEY;

      if (!apiKey || !lat || !lng) {
        return NextResponse.json({ 
          erro: "Faltam variáveis no .env (STORMGLASS_API_KEY, NEXT_PUBLIC_WEATHER_LAT ou NEXT_PUBLIC_WEATHER_LON)" 
        });
      }

      // Baixa da Stormglass
      const res = await fetch(`https://api.stormglass.io/v2/tide/extremes/point?lat=${lat}&lng=${lng}&start=${start}&end=${end}`, {
        headers: { 'Authorization': apiKey }
      });
      
      debugInfo.status_api_stormglass = res.status;

      if (res.ok) {
        const json = await res.json();
        extremes = json.data; 
        
        // Salva no banco de dados
        const { error: upsertError } = await supabase.from('tide_cache').upsert({ id: 1, data: extremes, updated_at: now.toISOString() });
        if (upsertError) debugInfo.erro_ao_salvar_cache = upsertError.message;

      } else {
        // Se a API da stormglass recusou, pegamos o motivo exato
        const errorText = await res.text();
        debugInfo.motivo_recusa_stormglass = errorText;
        if (cache) extremes = cache.data; // Tenta usar o cache antigo
      }
    } else {
      extremes = cache.data;
    }

    // 2. Acha qual é a PRÓXIMA maré
    const nextExtreme = extremes?.find((t: any) => new Date(t.time).getTime() > now.getTime());
    
    if (nextExtreme) {
      const date = new Date(nextExtreme.time);
      const isHigh = nextExtreme.type === 'high';
      
      return NextResponse.json({
        tendencia: isHigh ? 'SUBINDO' : 'DESCENDO',
        tipo: isHigh ? 'CHEIA' : 'BAIXA',
        horario: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        debug: debugInfo
      });
    }

    // Se chegou aqui, não achou maré futura
    return NextResponse.json({ 
      tendencia: '--', 
      tipo: '--', 
      horario: '--:--', 
      debug: debugInfo,
      quantidade_mares_encontradas: extremes?.length || 0
    });

  } catch (error: any) {
    return NextResponse.json({ erro_interno: error.message }, { status: 500 });
  }
}