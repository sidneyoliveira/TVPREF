// src/app/api/tide/route.ts
import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // 1. Pega os dados salvos no banco usando maybeSingle() para não dar erro se estiver vazio
    const { data: cache, error: cacheError } = await supabase
      .from('tide_cache')
      .select('*')
      .eq('id', 1)
      .maybeSingle(); 
    
    let extremes = [];
    const now = new Date();
    
    // Verifica se não tem cache ou se ele é mais velho que 12 horas
    const isCacheOld = cache ? (now.getTime() - new Date(cache.updated_at).getTime() > 12 * 60 * 60 * 1000) : true;

    if (isCacheOld || !cache?.data?.length) {
      // Baixa os dados da Stormglass
      const start = Math.floor(now.getTime() / 1000);
      const end = start + (7 * 24 * 60 * 60);
      const lat = process.env.NEXT_PUBLIC_WEATHER_LAT;
      const lng = process.env.NEXT_PUBLIC_WEATHER_LON;
      
      const res = await fetch(`https://api.stormglass.io/v2/tide/extremes/point?lat=${lat}&lng=${lng}&start=${start}&end=${end}`, {
        headers: { 'Authorization': process.env.STORMGLASS_API_KEY || '' }
      });
      
      if (res.ok) {
        const json = await res.json();
        extremes = json.data; 
        
        // Salva/Atualiza no banco de dados
        await supabase.from('tide_cache').upsert({ 
          id: 1, 
          data: extremes, 
          updated_at: now.toISOString() 
        });
      } else if (cache) {
        extremes = cache.data; // Se der erro na API, usa o banco antigo
      }
    } else {
      extremes = cache.data; // Se o banco for novo, usa ele
    }

    // 2. Acha qual é a PRÓXIMA maré
    const nextExtreme = extremes.find((t: any) => new Date(t.time).getTime() > now.getTime());
    
    if (nextExtreme) {
      const date = new Date(nextExtreme.time);
      const isHigh = nextExtreme.type === 'high';
      
      return NextResponse.json({
        tendencia: isHigh ? 'SUBINDO' : 'DESCENDO',
        tipo: isHigh ? 'CHEIA' : 'BAIXA',
        horario: date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      });
    }

    return NextResponse.json({ tendencia: '--', tipo: '--', horario: '--:--' });

  } catch (error) {
    console.error("Erro na API de Maré:", error);
    return NextResponse.json({ error: 'Falha ao buscar maré' }, { status: 500 });
  }
}