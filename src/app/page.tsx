'use client';

import { useTvData } from '@/hooks/useTvData';
import { useEffect, useMemo, useState } from 'react';
import { format } from 'date-fns';
import { DisplayYoutube } from '@/components/DisplayYoutube';
import { DisplayImage } from '@/components/DisplayImage';
import { DisplayAnnouncement } from '@/components/DisplayAnnouncement';
import { DisplayCarousel } from '@/components/DisplayCarousel';
import { DisplaySplit } from '@/components/DisplaySplit';
import { DisplayWithOptionalInstagram } from '@/components/DisplayWithOptionalInstagram';
import Image from 'next/image';
import logoBranca from '@/img/logo_branca.png';

type CurrentWeather = {
  temperatureC: number | null;
  waveHeight: number | null;
};

type TideInfo = {
  tendencia: string;
  tipo: string;
  horario: string;
};

export default function TvScreen() {
  const { config, instagramLinks, carouselImages, loading } = useTvData();
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  const weatherLat = process.env.NEXT_PUBLIC_WEATHER_LAT;
  const weatherLon = process.env.NEXT_PUBLIC_WEATHER_LON;

  const [weather, setWeather] = useState<CurrentWeather>({
    temperatureC: null,
    waveHeight: null,
  });

  const [tide, setTide] = useState<TideInfo>({
    tendencia: '--',
    tipo: '--',
    horario: '--:--',
  });

  useEffect(() => {
    const timer = setInterval(() => setCurrentDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const headerDate = useMemo(() => {
    return format(currentDateTime, 'dd/MM/yyyy');
  }, [currentDateTime]);

  // Carrega Clima e Maré
  useEffect(() => {
    let cancelled = false;

    async function loadData() {
      try {
        const [resWeather, resTide] = await Promise.all([
          weatherLat && weatherLon ? fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(weatherLat)}&longitude=${encodeURIComponent(weatherLon)}&current=temperature_2m&timezone=UTC`,
            { cache: 'no-store' }
          ).catch(() => null) : null,
          
          fetch('/api/tide', { cache: 'no-store' }).catch(() => null)
        ]);

        if (cancelled) return;

        if (resWeather?.ok) {
          const jsonW = await resWeather.json();
          if (typeof jsonW.current?.temperature_2m === 'number') {
            setWeather(prev => ({ ...prev, temperatureC: jsonW.current.temperature_2m }));
          }
        }

        if (resTide?.ok) {
          const tideData = await resTide.json();
          if (tideData.horario) {
            setTide(tideData);
          }
        }
      } catch (err) {
        console.error("Erro ao carregar dados:", err);
      }
    }

    loadData();
    const t = setInterval(loadData, 10 * 60 * 1000); 
    
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [weatherLat, weatherLon]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0d1a2f] text-white">
        <p className="text-4xl animate-pulse font-semibold tracking-wider">Iniciando sistema...</p>
      </div>
    );
  }

  const renderDisplayMode = () => {
    let mainComponent;
    switch (config.display_mode) {
      case 'image': 
        mainComponent = <DisplayImage imageUrl={config.image_url || ''} title={config.announcement_title} description={config.announcement_text} />; 
        break;
      case 'announcement': 
        mainComponent = <DisplayAnnouncement title={config.announcement_title || 'Aviso Importante'} text={config.announcement_text || 'Nenhum aviso configurado'} />; 
        break;
      case 'carousel': 
        mainComponent = <DisplayCarousel images={carouselImages} />; 
        break;
      case 'split': 
        mainComponent = <DisplaySplit config={config} instagramLinks={instagramLinks} />; 
        break;
      case 'youtube': 
      default: 
        mainComponent = <DisplayYoutube youtubeLink={config.youtube_link || ''} />; 
        break;
    }
    if (config.show_instagram) {
      return (
        <DisplayWithOptionalInstagram config={config} instagramLinks={instagramLinks}>
          {mainComponent}
        </DisplayWithOptionalInstagram>
      );
    }
    return mainComponent;
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-gradient-to-b from-[#0d1a2f] via-[#123a6d] to-[#0d1a2f] text-white font-sans overflow-hidden">
      
      {/* HEADER */}
      <header className="flex-none flex items-center justify-between w-full h-32 px-10 shadow-2xl bg-[#091324]/80 border-b border-[#1a2a44] backdrop-blur-md z-10">
        <div className="flex items-center h-full py-4">
          <Image
            src={logoBranca}
            alt="Logo Prefeitura"
            priority
            className="object-contain h-full w-auto max-w-[280px] drop-shadow-[0_0_15px_rgba(255,255,255,0.15)]"
          />
        </div>
        
        <div className="flex flex-col items-end justify-center h-full select-none">
          <span className="text-[4.5rem] font-bold text-white tracking-tight tabular-nums leading-none drop-shadow-[0_4px_12px_rgba(0,0,0,0.5)]">
            {format(currentDateTime, 'HH:mm:ss')}
          </span>
          <span className="text-2xl font-bold text-blue-200 tracking-widest drop-shadow-md uppercase mt-1">
            {headerDate}
          </span>
        </div>
      </header>

      {/* MAIN */}
      <main className="flex-1 w-full p-6 overflow-hidden relative flex flex-col">
        <div className="flex-1 w-full bg-[#071121]/80 rounded-3xl border border-[#1a2a44] shadow-inner overflow-hidden flex relative">
           {renderDisplayMode()}
        </div>
      </main>

      {/* FOOTER */}
      <footer className="flex-none w-full h-36 px-10 bg-[#091324]/90 border-t border-[#1a2a44] backdrop-blur-md flex items-center justify-between gap-8 shadow-[0_-10px_30px_rgba(0,0,0,0.3)] z-10">
        
        {/* TEXTO DA PREFEITURA / AVISO */}
        <div className="flex-1 text-left overflow-hidden">
          {config.texto_aviso ? (
            <span
              className="text-4xl md:text-5xl font-extrabold uppercase leading-tight drop-shadow-lg line-clamp-2"
              style={{ color: config.aviso_text_color || '#ffffff' }}
            >
              {config.texto_aviso}
            </span>
          ) : (
            <span className="text-3xl text-blue-200/80 uppercase font-bold tracking-wider truncate block">
              Prefeitura de Itarema
            </span>
          )}
        </div>

        {/* WIDGET DO CLIMA E MARÉ */}
        <div className="flex-none flex items-center justify-center gap-8 bg-[#102040] px-8 py-4 rounded-3xl border border-[#1a2a44] shadow-lg">
          
          <div className="flex flex-col items-center justify-center min-w-[100px]">
            <span className="text-sm uppercase tracking-widest font-bold text-blue-300 mb-1">Temp</span>
            <span className="text-4xl font-black tabular-nums text-white drop-shadow-md">
              {weather.temperatureC === null ? '--' : `${Math.round(weather.temperatureC)}°C`}
            </span>
          </div>

          <div className="h-16 w-[2px] bg-blue-500/30 rounded-full"></div>

          <div className="flex flex-col items-center justify-center min-w-[200px]">
            <span className="text-sm uppercase tracking-wider font-bold text-blue-300 mb-1">
              MARÉ {tide.tendencia}
            </span>
            <span className="text-2xl font-extrabold text-white tracking-wide drop-shadow-md whitespace-nowrap">
              {tide.tipo} ÀS {tide.horario}
            </span>
          </div>

        </div>
      </footer>
    </div>
  );
}
