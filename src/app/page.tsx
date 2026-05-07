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
  time: string | null;
};

export default function TvScreen() {
  const { config, instagramLinks, carouselImages, loading } = useTvData();
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  const weatherLat = process.env.NEXT_PUBLIC_WEATHER_LAT;
  const weatherLon = process.env.NEXT_PUBLIC_WEATHER_LON;

  const [weather, setWeather] = useState<CurrentWeather>({
    temperatureC: null,
    waveHeight: null,
    time: null,
  });

  useEffect(() => {
    const timer = setInterval(() => setCurrentDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const headerDate = useMemo(() => {
    return format(currentDateTime, 'dd/MM/yyyy');
  }, [currentDateTime]);

  useEffect(() => {
    let cancelled = false;

    async function loadWeather() {
      if (!weatherLat || !weatherLon) return;

      try {
        // Busca temperatura
        const resWeather = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(
            weatherLat,
          )}&longitude=${encodeURIComponent(
            weatherLon,
          )}&current=temperature_2m&timezone=UTC`,
          { cache: 'no-store' },
        );

        let tempC = null;
        if (resWeather.ok) {
          const jsonW = await resWeather.json();
          if (typeof jsonW.current?.temperature_2m === 'number') {
            tempC = jsonW.current.temperature_2m;
          }
        }

        // Busca maré (onda)
        const resMarine = await fetch(
          `https://marine-api.open-meteo.com/v1/marine?latitude=${encodeURIComponent(
            weatherLat,
          )}&longitude=${encodeURIComponent(
            weatherLon,
          )}&current=wave_height&timezone=UTC`,
          { cache: 'no-store' },
        );

        let waveH = null;
        if (resMarine.ok) {
          const jsonM = await resMarine.json();
          if (typeof jsonM.current?.wave_height === 'number') {
            waveH = jsonM.current.wave_height;
          }
        }

        if (cancelled) return;

        setWeather({
          temperatureC: tempC,
          waveHeight: waveH,
          time: new Date().toISOString(),
        });
      } catch {
        // mantemos default
      }
    }

    loadWeather();
    const t = setInterval(loadWeather, 10 * 60 * 1000); // 10 min
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, [weatherLat, weatherLon]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-dark-bg-primary text-dark-text-primary">
        <p className="text-3xl animate-pulse font-medium">Iniciando sistema...</p>
      </div>
    );
  }

  const renderDisplayMode = () => {
    let mainComponent;
    switch (config.display_mode) {
      case 'image':
        mainComponent = (
          <DisplayImage
            imageUrl={config.image_url || ''}
            title={config.announcement_title}
            description={config.announcement_text}
          />
        );
        break;
      case 'announcement':
        mainComponent = (
          <DisplayAnnouncement
            title={config.announcement_title || 'Aviso Importante'}
            text={config.announcement_text || 'Nenhum aviso configurado'}
          />
        );
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

  const bgColor = config.aviso_bg_color || 'rgba(17, 17, 17, 0.9)'; // Fallback dark bg secondary
  const textColor = config.aviso_text_color || '#ffffff';

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-black text-dark-text-primary font-sans">
      <header className="flex items-center justify-between px-8 py-4 bg-gradient-to-r from-dark-bg-primary via-[#111] to-dark-bg-primary border-b border-dark-border z-10 shadow-md h-36">
        {/* LOGO: maior e ocupando altura do cabeçario */}
        <div className="h-full flex items-center shrink-0">
          <Image
            src={logoBranca}
            alt="Logo"
            priority
            className="object-contain h-full w-auto max-h-[110px]"
          />
        </div>

        {/* BLOCO DIREITO: RELÓGIO E DATA APENAS */}
        <div className="flex items-center h-full py-1">
          <div className="bg-dark-bg-secondary/80 px-10 py-4 rounded-2xl border border-dark-border/50 flex flex-col items-center justify-center min-w-[340px] h-full shadow-inner backdrop-blur-sm">
            <div className="flex items-center gap-1">
              <p className="text-7xl font-black tracking-tight text-white tabular-nums leading-none">
                {format(currentDateTime, 'HH:mm:ss')}
              </p>
            </div>
            <p className="text-2xl text-dark-text-secondary font-bold whitespace-nowrap text-center w-full tracking-widest mt-2">
              {headerDate}
            </p>
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-hidden bg-black">{renderDisplayMode()}</main>

      {/* FOOTER */}
      {config.texto_aviso && (
        <footer 
          className="py-3 px-6 border-t border-dark-border shadow-lg z-10 flex items-center justify-between"
          style={{ backgroundColor: bgColor }}
        >
          {/* AVISO PERSONALIZADO - Sem truncate */}
          <div className="flex-1 mr-6">
            <p 
              className="text-2xl font-bold uppercase tracking-wide leading-tight break-words"
              style={{ color: textColor }}
            >
              {config.texto_aviso}
            </p>
          </div>
          
          {/* INFORMAÇÕES DO CLIMA E MARÉ */}
          <div className="flex items-center gap-6 shrink-0 bg-black/30 px-6 py-2 rounded-xl border border-white/10">
            <div className="flex items-center gap-2">
              <span className="text-sm uppercase tracking-wider font-bold text-white/70">Temp:</span>
              <span className="text-2xl font-black tabular-nums text-white">
                {weather.temperatureC === null ? '--' : `${Math.round(weather.temperatureC)}°C`}
              </span>
            </div>
            <div className="h-8 w-px bg-white/20"></div>
            <div className="flex items-center gap-2">
              <span className="text-sm uppercase tracking-wider font-bold text-white/70">Maré:</span>
              <span className="text-2xl font-black tabular-nums text-white">
                {weather.waveHeight === null ? '--' : `${weather.waveHeight.toFixed(1)}m`}
              </span>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}
