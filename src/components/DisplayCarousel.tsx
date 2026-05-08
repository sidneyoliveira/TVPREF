import { useState, useEffect, useRef } from 'react';
import { CarouselImage } from '@/hooks/useTvData';

interface DisplayCarouselProps {
  images: CarouselImage[];
}

export function DisplayCarousel({ images }: DisplayCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const goToNext = () => {
    if (images.length > 1) {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }
  };

  useEffect(() => {
    if (images.length === 0) return;
    
    const currentMedia = images[currentIndex].imagem_url;
    const isVideo = currentMedia.match(/\.(mp4|webm|ogg)$/i);

    // Limpa timer anterior
    if (timerRef.current) clearInterval(timerRef.current);

    // Se for IMAGEM e houver mais de 1 item, passa a cada 10 segundos
    if (!isVideo && images.length > 1) {
      timerRef.current = setInterval(goToNext, 10000);
    }
    // Se for VÍDEO, quem dispara o goToNext é a função onEnded do player de vídeo.

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex, images]);

  if (images.length === 0) {
    return (
      <div className="tv-legacy tv-panel w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
        <p className="text-3xl text-gray-500">Nenhuma imagem no carrossel</p>
      </div>
    );
  }

  const currentImage = images[currentIndex];
  const isVideo = currentImage.imagem_url.match(/\.(mp4|webm|ogg)$/i);

  return (
    <div className="tv-legacy tv-panel w-full h-full relative overflow-hidden bg-black">
      {/* Mídia atual */}
      {isVideo ? (
        <video
          src={currentImage.imagem_url}
          className="w-full h-full object-cover transition-opacity duration-1000"
          autoPlay
          muted
          playsInline
          onEnded={goToNext}
        />
      ) : (
        <img
          src={currentImage.imagem_url}
          alt={currentImage.titulo || 'Carrossel'}
          className="w-full h-full object-cover transition-opacity duration-1000"
        />
      )}

      {/* Overlay com título e descrição */}
      {(currentImage.titulo || currentImage.descricao) && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-transparent to-transparent p-8 pb-12">
          {currentImage.titulo && (
            <h2 className="text-5xl font-bold text-white mb-2">{currentImage.titulo}</h2>
          )}
          {currentImage.descricao && (
            <p className="text-2xl text-gray-200">{currentImage.descricao}</p>
          )}
        </div>
      )}

      {/* Indicadores */}
      <div className="absolute top-8 right-8 flex gap-2">
        {images.map((_, i) => (
          <div
            key={i}
            className={`w-4 h-4 rounded-full transition-all ${
              i === currentIndex ? 'bg-white scale-125' : 'bg-white/40'
            }`}
          />
        ))}
      </div>

      {/* Contador */}
      <div className="absolute bottom-8 right-8 bg-black/60 px-6 py-3 rounded-full text-white text-xl font-semibold">
        {currentIndex + 1} / {images.length}
      </div>
    </div>
  );
}
