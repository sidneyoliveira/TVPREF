// src/app/api/tide/route.ts
import * as cheerio from 'cheerio';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // 1. Acessa a página de Acaraú invisivelmente.
    // O Next.js fará um cache de 1 hora (3600s), ou seja, a TV pode dar F5 o dia todo 
    // que o sistema só visita o site deles 1 vez por hora. Zero bloqueios!
    const response = await fetch('https://tabuademares.com/br/ceara/itarema', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept-Language': 'pt-BR,pt;q=0.9'
      },
      next: { revalidate: 3600 } 
    });

    if (!response.ok) throw new Error('Falha ao acessar tabuademares.com');

    const html = await response.text();
    const $ = cheerio.load(html);
    const bodyText = $('body').text().replace(/\s+/g, ' '); 

    // 2. Caça os horários das SEGUINTES marés no meio do texto
    const matchBaixa = bodyText.match(/seguinte baixa-mar será às (\d{1,2}:\d{2})/i);
    const matchAlta = bodyText.match(/seguinte preia-mar será às (\d{1,2}:\d{2})/i);

    const proximaBaixa = matchBaixa ? matchBaixa[1] : null;
    const proximaAlta = matchAlta ? matchAlta[1] : null;

    if (!proximaBaixa && !proximaAlta) {
      return NextResponse.json({ tendencia: '--', tipo: '--', horario: '--:--' });
    }

    // 3. Descobre quem vem primeiro baseando-se no horário atual de Fortaleza
    const brtTime = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Fortaleza" }));
    const currentMins = brtTime.getHours() * 60 + brtTime.getMinutes();

    const getAbsoluteMinutes = (timeStr: string | null) => {
      if (!timeStr) return Infinity;
      const [h, m] = timeStr.split(':').map(Number);
      let mins = h * 60 + m;
      
      // Se a maré for na madrugada seguinte, soma um dia
      if (mins < currentMins) mins += 24 * 60; 
      
      return mins;
    };

    const minsBaixa = getAbsoluteMinutes(proximaBaixa);
    const minsAlta = getAbsoluteMinutes(proximaAlta);

    // 4. Devolve o dado certinho para o Front-End
    if (minsAlta < minsBaixa) {
      return NextResponse.json({ tendencia: 'SUBINDO', tipo: 'CHEIA', horario: proximaAlta });
    } else {
      return NextResponse.json({ tendencia: 'DESCENDO', tipo: 'BAIXA', horario: proximaBaixa });
    }

  } catch (error) {
    console.error("Erro no Scraper de Maré:", error);
    return NextResponse.json({ error: 'Falha ao buscar maré oficial' }, { status: 500 });
  }
}