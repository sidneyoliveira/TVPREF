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

  const tvLegacyCss = `
    #tv-legacy-root, #tv-legacy-root * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      color: #ffffff !important;
      font-family: Arial, Helvetica, sans-serif !important;
    }
    #tv-legacy-root {
      background: #0d1a2f !important;
      min-height: 100vh;
      width: 100%;
      color: #ffffff;
    }
    #tv-legacy-root header,
    #tv-legacy-root footer,
    #tv-legacy-root .tv-main,
    #tv-legacy-root .tv-panel,
    #tv-legacy-root .tv-content,
    #tv-legacy-root .tv-header-left,
    #tv-legacy-root .tv-header-right,
    #tv-legacy-root .tv-footer-box {
      display: block !important;
      width: 100% !important;
      background: transparent !important;
    }
    #tv-legacy-root header {
      background: #0d1a2f !important;
      border-bottom: 2px solid #123a6d !important;
      padding: 16px !important;
    }
    #tv-legacy-root footer {
      background: #0d1a2f !important;
      border-top: 2px solid #123a6d !important;
      padding: 16px !important;
    }
    #tv-legacy-root .tv-header-left {
      display: inline-block !important;
      vertical-align: middle !important;
      width: 55% !important;
    }
    #tv-legacy-root .tv-header-right {
      display: inline-block !important;
      vertical-align: middle !important;
      width: 40% !important;
      text-align: right !important;
    }
    #tv-legacy-root .tv-main {
      background: #071121 !important;
      padding: 16px !important;
    }
    #tv-legacy-root .tv-content {
      background: #071121 !important;
      border: 1px solid #1d2b47 !important;
      padding: 16px !important;
      border-radius: 12px !important;
      min-height: 60vh !important;
    }
    #tv-legacy-root .tv-panel {
      background: #071121 !important;
      border: 1px solid #1d2b47 !important;
      padding: 16px !important;
      margin-bottom: 16px !important;
      border-radius: 12px !important;
    }
    #tv-legacy-root .tv-footer-box {
      background: rgba(16, 32, 64, 0.9) !important;
      padding: 16px !important;
      border-radius: 16px !important;
      border: 1px solid #1a2a44 !important;
    }
    #tv-legacy-root .tv-title {
      font-size: 3rem !important;
      font-weight: bold !important;
      margin-bottom: 12px !important;
    }
    #tv-legacy-root .tv-subtitle {
      font-size: 1.5rem !important;
      margin-bottom: 8px !important;
    }
    #tv-legacy-root .tv-text-large {
      font-size: 2rem !important;
      line-height: 1.1 !important;
    }
    #tv-legacy-root .tv-text-medium {
      font-size: 1.25rem !important;
    }
    #tv-legacy-root img,
    #tv-legacy-root iframe,
    #tv-legacy-root video {
      width: 100% !important;
      max-width: 100% !important;
      height: auto !important;
      display: block !important;
      border: none !important;
    }
  `;

  // Carrega Clima e Maré (Scraper Oficial)
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
        <p className="text-3xl animate-pulse font-medium">Iniciando sistema...</p>
      </div>
    );
  }
  

  const renderDisplayMode = () => {
    let mainComponent;
    switch (config.display_mode) {
      case 'image': mainComponent = <DisplayImage imageUrl={config.image_url || ''} title={config.announcement_title} description={config.announcement_text} />; break;
      case 'announcement': mainComponent = <DisplayAnnouncement title={config.announcement_title || 'Aviso Importante'} text={config.announcement_text || 'Nenhum aviso configurado'} />; break;
      case 'carousel': mainComponent = <DisplayCarousel images={carouselImages} />; break;
      case 'split': mainComponent = <DisplaySplit config={config} instagramLinks={instagramLinks} />; break;
      case 'youtube': default: mainComponent = <DisplayYoutube youtubeLink={config.youtube_link || ''} />; break;
    }
    if (config.show_instagram) {
      return <DisplayWithOptionalInstagram config={config} instagramLinks={instagramLinks}>{mainComponent}</DisplayWithOptionalInstagram>;
    }
    return mainComponent;
  };

  return (
    <div id="tv-legacy-root" className="flex flex-col h-screen w-full bg-linear-to-b from-[#0d1a2f] via-[#123a6d] to-[#0d1a2f] text-white font-sans overflow-hidden">
      <style dangerouslySetInnerHTML={{ __html: tvLegacyCss }} />
      {/* HEADER */}
      <header className="tv-header relative flex items-center justify-between w-full h-30 z-10 shadow-lg bg-linear-to-r from-[#0d1a2f] via-[#123a6d] to-[#0d1a2f]">
        <div className="tv-header-left flex items-center h-full pl-[4vw]">
          <Image
            src={logoBranca}
            alt="Logo Prefeitura"
            priority
            className="object-contain h-24 w-auto max-w-55 drop-shadow-xl"
          />
        </div>
        <div className="flex flex-col items-end justify-center h-full pr-[4vw] select-none">
          <span className="text-[4rem] font-bold text-white tracking-tight tabular-nums leading-none drop-shadow-2xl" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {format(currentDateTime, 'HH:mm:ss')}
          </span>
          <span className="text-xl font-bold text-blue-100 tracking-widest drop-shadow-md">
            {headerDate}
          </span>
        </div>
      </header>

      {/* MAIN */}
      <main className="tv-main flex-1 w-full min-h-0 h-0 overflow-hidden relative flex">
        <div className="flex-1 h-full w-full flex flex-col justify-stretch items-stretch">
          <div className="tv-content">
            {renderDisplayMode()}
          </div>
        </div>
      </main>

      {/* FOOTER BLINDADO */}
      <footer className="tv-footer w-full py-4 px-[4vw] bg-linear-to-r from-[#0d1a2f] via-[#123a6d] to-[#0d1a2f] border-t border-[#1a2a44] flex items-center justify-between gap-6 shadow-lg z-10 min-h-[100px]">
        
        {/* TEXTO DA PREFEITURA / AVISO */}
        <div className="flex-1 text-left overflow-hidden pr-4">
          {config.texto_aviso ? (
            <span
              className="text-3xl md:text-4xl font-bold uppercase leading-tight drop-shadow-md line-clamp-2"
              style={{ color: config.aviso_text_color || '#fff' }}
            >
              {config.texto_aviso}
            </span>
          ) : (
            <span className="text-base text-blue-200 opacity-80 truncate block">
              Prefeitura de Itarema
            </span>
          )}
        </div>

        {/* WIDGET DO CLIMA E MARÉ (Com shrink-0 para não amassar) */}
        <div className="flex items-center justify-center gap-5 shrink-0 bg-[#102040]/90 px-6 py-2.5 rounded-2xl border border-[#1a2a44] w-max">
          
          <div className="flex flex-col items-center min-w-[80px]">
            <span className="text-[10px] uppercase tracking-widest font-bold text-blue-300 mb-0.5">Temp</span>
            <span className="text-2xl font-black tabular-nums text-white">
              {weather.temperatureC === null ? '--' : `${Math.round(weather.temperatureC)}°C`}
            </span>
          </div>

          <div className="h-10 w-px bg-blue-500/30"></div>

          <div className="flex flex-col items-center min-w-[150px]">
            <span className="text-xs uppercase tracking-wider font-bold text-blue-100 mb-0.5">
              MARÉ {tide.tendencia}
            </span>
            <span className="text-sm font-bold text-white tracking-wide">
              MARÉ {tide.tipo} ÀS {tide.horario}
            </span>
          </div>

        </div>
      </footer>
    </div>
  );
}