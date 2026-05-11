// src/app/api/tide/route.ts
import * as cheerio from 'cheerio';
import { NextResponse } from 'next/server';

const TIDE_URL = 'https://tabuademares.com/br/ceara/itarema';
const FORTALEZA_TIME_ZONE = 'America/Fortaleza';
const MINUTES_PER_DAY = 24 * 60;

type TideKind = 'high' | 'low';

type TideEvent = {
  kind: TideKind;
  time: string;
  minutes: number;
  absoluteMinutes: number;
};

type CheerioRoot = ReturnType<typeof cheerio.load>;

const TIDE_RESPONSE: Record<TideKind, { tendencia: string; tipo: string }> = {
  high: { tendencia: 'SUBINDO', tipo: 'MARÉ CHEIA' },
  low: { tendencia: 'DESCENDO', tipo: 'MARÉ BAIXA' },
};

export async function GET() {
  try {
    // 1. Acessa a página de Itarema invisivelmente.
    // O Next.js fará um cache de 1 hora (3600s), ou seja, a TV pode dar F5 o dia todo 
    // que o sistema só visita o site deles 1 vez por hora. Zero bloqueios!
    const response = await fetch(TIDE_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept-Language': 'pt-BR,pt;q=0.9'
      },
      next: { revalidate: 3600 } 
    });

    if (!response.ok) throw new Error('Falha ao acessar tabuademares.com');

    const html = await response.text();
    const $ = cheerio.load(html);

    // 2. Lê a tabela de marés do dia. Ela cobre casos como "única preia-mar".
    const now = getFortalezaNow();
    const events = [
      ...getTableTideEvents($, now.isoDate, 0),
      ...getTableTideEvents($, getNextIsoDate(now.isoDate), 1),
    ];

    const nextEvent =
      getNextTideEvent(events, now.currentMinutes) ??
      getNextTextTideEvent($('body').text(), now.currentMinutes);

    if (!nextEvent) {
      return NextResponse.json({ tendencia: '--', tipo: '--', horario: '--:--' });
    }

    // 3. Devolve o próximo evento de maré para o Front-End.
    return NextResponse.json({
      ...TIDE_RESPONSE[nextEvent.kind],
      horario: nextEvent.time,
    });

  } catch (error) {
    console.error("Erro no Scraper de Maré:", error);
    return NextResponse.json({ error: 'Falha ao buscar maré oficial' }, { status: 500 });
  }
}

function getFortalezaNow(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: FORTALEZA_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const hour = Number(values.hour);
  const minute = Number(values.minute);

  return {
    isoDate: `${values.year}-${values.month}-${values.day}`,
    currentMinutes: hour * 60 + minute,
  };
}

function getNextIsoDate(isoDate: string) {
  const [year, month, day] = isoDate.split('-').map(Number);
  const nextDate = new Date(Date.UTC(year, month - 1, day + 1));

  return nextDate.toISOString().slice(0, 10);
}

function getTableTideEvents($: CheerioRoot, isoDate: string, dayOffset: number): TideEvent[] {
  const row = $(`tr[onclick*="${isoDate}"]`).first();
  const events: TideEvent[] = [];

  row.find('.tabla_mareas_marea').each((_, element) => {
    const cell = $(element);
    const time = cell.find('.tabla_mareas_marea_hora').first().text().trim();
    const minutes = parseTimeToMinutes(time);
    const isHighTide = cell.find('.tabla_mareas_marea_pleamar').length > 0;
    const isLowTide = cell.find('.tabla_mareas_marea_bajamar').length > 0;
    const kind: TideKind | null = isHighTide ? 'high' : isLowTide ? 'low' : null;

    if (minutes === null || !kind) return;

    events.push({
      kind,
      time,
      minutes,
      absoluteMinutes: dayOffset * MINUTES_PER_DAY + minutes,
    });
  });

  return events;
}

function getNextTideEvent(events: TideEvent[], currentMinutes: number) {
  return events
    .filter((event) => event.absoluteMinutes >= currentMinutes)
    .sort((a, b) => a.absoluteMinutes - b.absoluteMinutes)[0];
}

function getNextTextTideEvent(bodyText: string, currentMinutes: number) {
  const normalizedText = bodyText.replace(/\s+/g, ' ');
  const tideTextRegex =
    /(?:primeira|segunda|terceira|quarta|seguinte|última|ultima|única|unica)\s+(baixa-mar|preia-mar)\s+(?:foi|será|sera)\s+às\s+(\d{1,2}:\d{2})/gi;
  const events: TideEvent[] = [];

  for (const match of normalizedText.matchAll(tideTextRegex)) {
    const kind = match[1].toLowerCase() === 'preia-mar' ? 'high' : 'low';
    const time = match[2];
    const minutes = parseTimeToMinutes(time);

    if (minutes === null) continue;

    events.push({
      kind,
      time,
      minutes,
      absoluteMinutes: minutes >= currentMinutes ? minutes : minutes + MINUTES_PER_DAY,
    });
  }

  return getNextTideEvent(events, currentMinutes);
}

function parseTimeToMinutes(time: string) {
  const match = time.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;

  const hour = Number(match[1]);
  const minute = Number(match[2]);

  if (hour > 23 || minute > 59) return null;

  return hour * 60 + minute;
}
