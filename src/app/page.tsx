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
import { DisplayWithOptionalInstagram } from '@/components/DisplayWithOptionalInstagram';
import Image from 'next/image';
import logoBranca from '@/img/logo_branca.png';

export default function TvScreen() {
  const { config, instagramLinks, carouselImages, loading } = useTvData();
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-dark-bg-primary text-dark-text-primary">
        <p className="text-3xl animate-pulse font-medium">Iniciando sistema...</p>
      </div>
    );
  }

  const renderDisplayMode = () => {
    // Instagram opcional ao lado: só aplicamos nos modos "conteúdo principal" (não no carousel,
    // porque o carousel já ocupa 100% da tela).
    if (config.show_instagram && config.display_mode !== 'carousel') {
      return <DisplayWithOptionalInstagram config={config} instagramLinks={instagramLinks} />;
    }

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
    <div className="flex flex-col h-screen overflow-hidden bg-black text-dark-text-primary font-sans">
      <header className="flex justify-between items-center px-6 py-3 bg-dark-bg-primary border-b border-dark-border z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <div>
            <Image src={logoBranca} alt="Logo" height={50} className="object-contain" priority />
          </div>
        </div>

        <div className="bg-dark-bg-secondary px-5 py-2 rounded-xl border border-dark-border flex flex-col items-center min-w-[180px]">
          <p className="text-5xl font-bold tracking-tight text-white tabular-nums leading-none mb-1">
            {format(currentDateTime, 'HH:mm')}
          </p>
          <p className="text-sm text-dark-text-secondary font-medium whitespace-nowrap text-center w-full uppercase tracking-wider">
            {format(currentDateTime, 'EEEE', { locale: ptBR }).split('-')[0]} - {format(currentDateTime, 'dd/MM/yyyy')}
          </p>
        </div>
      </header>

      <main className="flex-1 overflow-hidden bg-black">{renderDisplayMode()}</main>

      {config.texto_aviso && (
        <footer className="bg-dark-bg-secondary py-3 px-6 border-t border-dark-border flex items-center shadow-lg z-10">
          <div className="flex-1 min-w-0">
            <p className="text-2xl font-bold text-white uppercase tracking-wide leading-tight truncate">
              {config.texto_aviso}
            </p>
          </div>
        </footer>
      )}
    </div>
  );
}
