'use client';

import { useTvData } from '@/hooks/useTvData';
import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Disable SSR for ReactPlayer to avoid hydration errors and type issues with React 19
const ReactPlayer: any = dynamic(() => import('react-player'), { ssr: false });

export default function TvScreen() {
  const { config, instagramLinks, loading } = useTvData();
  const [currentDateTime, setCurrentDateTime] = useState(new Date());
  const [currentInstaIndex, setCurrentInstaIndex] = useState(0);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentDateTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Rotate Instagram posts every 15 seconds
  useEffect(() => {
    if (instagramLinks.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentInstaIndex((prev) => (prev + 1) % instagramLinks.length);
    }, 15000);
    return () => clearInterval(timer);
  }, [instagramLinks]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-900 text-white">
        <p className="text-3xl animate-pulse">Carregando painel...</p>
      </div>
    );
  }

  // Format Instagram URL to use embed layout
  const getInstaEmbedUrl = (url: string) => {
    try {
      const parsedUrl = new URL(url);
      // Remove trailing slash and append /embed
      const cleanPath = parsedUrl.pathname.replace(/\/$/, '');
      return `https://www.instagram.com${cleanPath}/embed`;
    } catch {
      return '';
    }
  };

  const currentInstaPost = instagramLinks[currentInstaIndex];

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-gray-900 text-white">
      {/* HEADER */}
      <header className="flex justify-between items-center px-8 py-4 bg-blue-900 shadow-md z-10">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-blue-900 font-bold text-xl">
            LOGO
          </div>
          <h1 className="text-4xl font-bold uppercase tracking-wider">
            Prefeitura de Itarema
          </h1>
        </div>
        <div className="text-right">
          <p className="text-4xl font-bold">
            {format(currentDateTime, 'HH:mm:ss')}
          </p>
          <p className="text-xl text-blue-200 capitalize">
            {format(currentDateTime, "EEEE, d 'de' MMMM", { locale: ptBR })}
          </p>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      <main className="flex-1 flex flex-row overflow-hidden">
        {/* LEFT/MAIN: YouTube Live Stream */}
        <div className="flex-[3] bg-black relative shadow-inner">
          {config.youtube_link ? (
            <ReactPlayer
              url={config.youtube_link}
              playing
              muted
              controls={false}
              width="100%"
              height="100%"
              style={{ position: 'absolute', top: 0, left: 0 }}
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <p className="text-gray-500 text-2xl">Aguardando transmissão ao vivo...</p>
            </div>
          )}
        </div>

        {/* RIGHT: Sidebar (Instagram + Infos) */}
        <aside className="flex-1 flex flex-col bg-gray-800 border-l border-gray-700">
          <div className="bg-blue-800 py-3 text-center">
            <h2 className="text-2xl font-bold uppercase tracking-widest text-blue-100">
              Mural Social
            </h2>
          </div>
          
          <div className="flex-1 p-4 flex flex-col items-center justify-center relative bg-white/5">
            {currentInstaPost ? (
              <iframe
                src={getInstaEmbedUrl(currentInstaPost.url)}
                className="w-full h-full max-h-[800px] border-none rounded-xl shadow-lg bg-white"
                scrolling="no"
                allowTransparency
              ></iframe>
            ) : (
              <p className="text-gray-400 text-center text-xl">Nenhuma postagem disponível no momento.</p>
            )}
            
            {/* Carousel Indicator */}
            {instagramLinks.length > 1 && (
              <div className="absolute bottom-6 flex gap-2">
                {instagramLinks.map((_, i) => (
                  <div 
                    key={i} 
                    className={`h-3 w-3 rounded-full transition-all ${i === currentInstaIndex ? 'bg-blue-500 scale-125' : 'bg-gray-500'}`}
                  />
                ))}
              </div>
            )}
          </div>
        </aside>
      </main>

      {/* FOOTER: Scrolling Text (Marquee) */}
      <footer className="bg-blue-600 py-4 overflow-hidden border-t-4 border-yellow-400">
        <div className="whitespace-nowrap animate-[marquee_20s_linear_infinite] flex items-center">
          <span className="text-4xl font-semibold mr-16 text-white uppercase">
            {config.texto_aviso || "Bem-vindo à Prefeitura."}
          </span>
          <span className="text-4xl font-semibold mr-16 text-white uppercase">
            {config.texto_aviso || "Bem-vindo à Prefeitura."}
          </span>
        </div>
      </footer>
    </div>
  );
}
