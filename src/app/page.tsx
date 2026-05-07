'use client';

import { useTvData } from '@/hooks/useTvData';
import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DisplayYoutube } from '@/components/DisplayYoutube';
import { DisplayImage } from '@/components/DisplayImage';
import { DisplayAnnouncement } from '@/components/DisplayAnnouncement';
import { DisplayCarousel } from '@/components/DisplayCarousel';
import { DisplaySplit } from '@/components/DisplaySplit';

export default function TvScreen() {
  const { config, instagramLinks, carouselImages, loading } = useTvData();
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900 text-white">
        <p className="text-3xl animate-pulse">Carregando painel...</p>
      </div>
    );
  }

  // Renderizar o modo de exibição selecionado
  const renderDisplayMode = () => {
    switch (config.display_mode) {
      case 'image':
        return (
          <DisplayImage
            imageUrl={config.image_url || ''}
            title={config.announcement_title}
            description={config.announcement_text}
          />
        );
      case 'announcement':
        return (
          <DisplayAnnouncement
            title={config.announcement_title || 'Aviso Importante'}
            text={config.announcement_text || 'Nenhum aviso configurado'}
          />
        );
      case 'carousel':
        return <DisplayCarousel images={carouselImages} />;
      case 'split':
        return <DisplaySplit config={config} instagramLinks={instagramLinks} />;
      case 'youtube':
      default:
        return <DisplayYoutube youtubeLink={config.youtube_link || ''} />;
    }
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-black text-white">
      {/* HEADER */}
      <header className="flex justify-between items-center px-8 py-4 bg-gradient-to-r from-blue-900 via-blue-800 to-blue-900 shadow-lg z-10">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center text-blue-900 font-black text-2xl shadow-lg">
            🏛️
          </div>
          <h1 className="text-4xl font-black uppercase tracking-wider drop-shadow-lg">
            Prefeitura de Itarema
          </h1>
        </div>
        <div className="text-right bg-black/40 px-6 py-3 rounded-lg backdrop-blur-sm">
          <p className="text-4xl font-bold tabular-nums">
            {format(currentDateTime, 'HH:mm:ss')}
          </p>
          <p className="text-lg text-blue-200 capitalize font-semibold">
            {format(currentDateTime, "EEEE, d 'de' MMMM", { locale: ptBR })}
          </p>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-hidden">
        {renderDisplayMode()}
      </main>

      {/* FOOTER - Scrolling Text */}
      <footer className="bg-gradient-to-r from-blue-600 via-blue-700 to-blue-600 py-4 overflow-hidden border-t-4 border-yellow-500 shadow-xl">
        <div className="whitespace-nowrap animate-[marquee_25s_linear_infinite] flex items-center">
          <span className="text-3xl font-black mr-12 text-white uppercase drop-shadow-lg">
            📢 {config.texto_aviso || "Bem-vindo à Prefeitura Municipal de Itarema"}
          </span>
          <span className="text-3xl font-black mr-12 text-white uppercase drop-shadow-lg">
            📢 {config.texto_aviso || "Bem-vindo à Prefeitura Municipal de Itarema"}
          </span>
        </div>
      </footer>
    </div>
  );
}
