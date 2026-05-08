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

  const pureCss = `
    #tv-legacy-root, #tv-legacy-root * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: Arial, Helvetica, sans-serif !important;
    }
    #tv-legacy-root {
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: #0d1a2f;
      background: linear-gradient(180deg, #0d1a2f 0%, #123a6d 50%, #0d1a2f 100%);
      overflow: hidden;
      color: #ffffff;
    }
    .tv-header {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 120px;
      background: linear-gradient(90deg, #0d1a2f 0%, #123a6d 50%, #0d1a2f 100%);
      border-bottom: 2px solid #1a2a44;
      z-index: 10;
      box-shadow: 0 4px 15px rgba(0,0,0,0.5);
    }
    .tv-header-left {
      position: absolute;
      left: 4vw;
      top: 0;
      height: 100%;
      display: table;
    }
    .tv-header-left-inner {
      display: table-cell;
      vertical-align: middle;
    }
    .tv-header-logo {
      height: 80px;
      width: auto;
    }
    .tv-header-right {
      position: absolute;
      right: 4vw;
      top: 0;
      height: 100%;
      display: table;
      text-align: right;
    }
    .tv-header-right-inner {
      display: table-cell;
      vertical-align: middle;
    }
    .tv-clock-time {
      font-size: 4.5rem;
      font-weight: bold;
      color: #ffffff;
      line-height: 1;
      text-shadow: 0 4px 12px rgba(0,0,0,0.5);
    }
    .tv-clock-date {
      display: block;
      font-size: 1.5rem;
      font-weight: bold;
      color: #bfdbfe;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      margin-top: 4px;
    }
    .tv-main {
      position: absolute;
      top: 120px;
      bottom: 120px; 
      left: 0;
      width: 100%;
      padding: 24px;
      overflow: hidden;
    }
    .tv-content-wrapper {
      width: 100%;
      height: 100%;
      background: rgba(7, 17, 33, 0.8);
      border: 1px solid #1a2a44;
      border-radius: 24px;
      box-shadow: inset 0 0 20px rgba(0,0,0,0.5);
      position: relative;
      overflow: hidden;
    }
    .tv-footer {
      position: absolute;
      bottom: 0;
      left: 0;
      width: 100%;
      height: 120px;
      background: linear-gradient(90deg, #091324 0%, #123a6d 50%, #091324 100%);
      border-top: 1px solid #1a2a44;
      z-index: 10;
      box-shadow: 0 -10px 30px rgba(0,0,0,0.4);
      padding: 0 4vw;
    }
    .tv-footer-inner {
      position: relative;
      width: 100%;
      height: 100%;
    }
    .tv-footer-left {
      position: absolute;
      left: 0;
      top: 0;
      height: 100%;
      display: table;
      width: 60%;
    }
    .tv-footer-left-inner {
      display: table-cell;
      vertical-align: middle;
    }
    .tv-footer-text-aviso {
      font-size: 2.5rem;
      font-weight: 800;
      text-transform: uppercase;
      text-shadow: 0 2px 4px rgba(0,0,0,0.5);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      color: #ffffff;
    }
    .tv-footer-text-default {
      font-size: 1.875rem;
      color: rgba(191, 219, 254, 0.8);
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .tv-footer-right {
      position: absolute;
      right: 0;
      top: 0;
      height: 100%;
      display: table;
    }
    .tv-footer-right-inner {
      display: table-cell;
      vertical-align: middle;
    }
    .tv-widget {
      background: rgba(16, 32, 64, 0.95);
      border: 1px solid #1a2a44;
      border-radius: 16px;
      padding: 12px 24px;
      display: inline-block;
      box-shadow: 0 4px 15px rgba(0,0,0,0.5);
      white-space: nowrap;
    }
    .tv-widget-item {
      display: inline-block;
      vertical-align: middle;
      text-align: center;
      padding: 0 16px;
    }
    .tv-widget-divider {
      display: inline-block;
      vertical-align: middle;
      width: 2px;
      height: 48px;
      background: rgba(59, 130, 246, 0.3);
    }
    .tv-widget-label {
      display: block;
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      font-weight: bold;
      color: #93c5fd;
      margin-bottom: 6px;
    }
    .tv-widget-value {
      display: block;
      font-size: 1.75rem;
      font-weight: 900;
      color: #ffffff;
      text-shadow: 0 2px 4px rgba(0,0,0,0.5);
    }
    .tv-loading {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: #0d1a2f;
      display: table;
    }
    .tv-loading-inner {
      display: table-cell;
      vertical-align: middle;
      text-align: center;
      color: #ffffff;
      font-size: 2rem;
      font-weight: bold;
    }
  `;

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
      <div id="tv-legacy-root">
        <style dangerouslySetInnerHTML={{ __html: pureCss }} />
        <div className="tv-loading">
          <div className="tv-loading-inner">
            Iniciando sistema...
          </div>
        </div>
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
    <div id="tv-legacy-root">
      <style dangerouslySetInnerHTML={{ __html: pureCss }} />
      
      {/* HEADER */}
      <header className="tv-header">
        <div className="tv-header-left">
          <div className="tv-header-left-inner">
            <Image
              src={logoBranca}
              alt="Logo Prefeitura"
              priority
              className="tv-header-logo"
            />
          </div>
        </div>
        <div className="tv-header-right">
          <div className="tv-header-right-inner">
            <span className="tv-clock-time">
              {format(currentDateTime, 'HH:mm:ss')}
            </span>
            <span className="tv-clock-date">
              {headerDate}
            </span>
          </div>
        </div>
      </header>

      {/* MAIN */}
      <main className="tv-main">
        <div className="tv-content-wrapper">
           {renderDisplayMode()}
        </div>
      </main>

      {/* FOOTER */}
      <footer className="tv-footer">
        <div className="tv-footer-inner">
          <div className="tv-footer-left">
            <div className="tv-footer-left-inner">
              {config.texto_aviso ? (
                <span
                  className="tv-footer-text-aviso"
                  style={{ color: config.aviso_text_color || '#ffffff' }}
                >
                  {config.texto_aviso}
                </span>
              ) : (
                <span className="tv-footer-text-default">
                  Prefeitura de Itarema
                </span>
              )}
            </div>
          </div>

          <div className="tv-footer-right">
            <div className="tv-footer-right-inner">
              <div className="tv-widget">
                <div className="tv-widget-item">
                  <span className="tv-widget-label">Temp</span>
                  <span className="tv-widget-value">
                    {weather.temperatureC === null ? '--' : `${Math.round(weather.temperatureC)}°C`}
                  </span>
                </div>

                <div className="tv-widget-divider"></div>

                <div className="tv-widget-item">
                  <span className="tv-widget-label">
                    MARÉ {tide.tendencia}
                  </span>
                  <span className="tv-widget-value">
                    {tide.tipo} ÀS {tide.horario}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
