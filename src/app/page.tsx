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
import { Building2, Megaphone } from 'lucide-react';

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
      <div className="flex h-screen items-center justify-center bg-dark-bg-primary text-dark-text-primary">
        <p className="text-3xl animate-pulse font-medium">Iniciando sistema...</p>
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
    <div className="flex flex-col h-screen overflow-hidden bg-black text-dark-text-primary font-sans">
      {/* HEADER - Otimizado e profissional */}
      <header className="flex justify-between items-center px-6 py-3 bg-dark-bg-primary border-b border-dark-border z-10 shadow-sm">
        <div className="flex items-center gap-4">
          <div>
            <Image src={logoBranca} alt="Logo" height={50} className="object-contain" priority />
          </div>
        </div>

        {/* Relógio e Data Otimizados - Mesma largura */}
        <div className="bg-dark-bg-secondary px-5 py-2 rounded-xl border border-dark-border flex flex-col items-center min-w-[180px]">
          <p className="text-5xl font-bold tracking-tight text-white tabular-nums leading-none mb-1">
            {format(currentDateTime, 'HH:mm')}
          </p>
          <p className="text-sm text-dark-text-secondary font-medium whitespace-nowrap text-center w-full uppercase tracking-wider">
            {format(currentDateTime, 'EEEE', { locale: ptBR }).split('-')[0]} - {format(currentDateTime, 'dd/MM/yyyy')}
          </p>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="flex-1 overflow-hidden bg-black">
        {renderDisplayMode()}
      </main>

      {/* FOOTER - Fixo e Profissional */}
      {config.texto_aviso && (
        <footer className="bg-accent-blue py-3 px-6 border-t-4 border-accent-yellow flex items-center gap-4 shadow-lg z-10">
          <div className="bg-accent-yellow p-2 rounded-lg text-dark-bg-primary">
            <Megaphone size={24} strokeWidth={2.5} />
          </div>
          <div className="flex-1">
            <p className="text-2xl font-bold text-white uppercase tracking-wide leading-tight">
              {config.texto_aviso}
            </p>
          </div>
        </footer>
      )}
    </div>
  );
}

          <div className="flex-1">
            <p className="text-2xl font-semibold text-gray-200 uppercase tracking-wide leading-tight text-center">
              {config.texto_aviso}
            </p>
          </div>
        </footer>
      )}
    </div>
  );
}
ixo e Profissional */}
      {config.texto_aviso && (
        <footer className="bg-accent-blue py-3 px-6 border-t-4 border-accent-yellow flex items-center gap-4 shadow-lg z-10">
          <div className="bg-accent-yellow p-2 rounded-lg text-dark-bg-primary">
            <Megaphone size={24} strokeWidth={2.5} />
          </div>
          <div className="flex-1">
            <p className="text-2xl font-bold text-white uppercase tracking-wide leading-tight">
              {config.texto_aviso}
            </p>
          </div>
        </footer>
      )}
    </div>
  );
}
