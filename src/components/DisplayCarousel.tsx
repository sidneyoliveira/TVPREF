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
      <div className="tv-legacy tv-panel tv-empty-carousel">
        <p className="tv-empty-text">Nenhuma imagem no carrossel</p>
      </div>
    );
  }

  const currentImage = images[currentIndex];
  const isVideo = currentImage.imagem_url.match(/\.(mp4|webm|ogg)$/i);

  return (
    <div className="tv-legacy tv-panel tv-carousel">
      {/* Mídia atual */}
      {isVideo ? (
        <video
          src={currentImage.imagem_url}
          className="tv-media tv-media-cover"
          autoPlay
          muted
          playsInline
          onEnded={goToNext}
        />
      ) : (
        <img
          src={currentImage.imagem_url}
          alt={currentImage.titulo || 'Carrossel'}
          className="tv-media tv-media-cover"
        />
      )}

      {/* Overlay com título e descrição */}
      {(currentImage.titulo || currentImage.descricao) && (
        <div className="tv-overlay-bottom">
          {currentImage.titulo && (
            <h2 className="tv-overlay-title">{currentImage.titulo}</h2>
          )}
          {currentImage.descricao && (
            <p className="tv-overlay-desc">{currentImage.descricao}</p>
          )}
        </div>
      )}

      {/* Indicadores */}
      <div className="tv-indicators">
        {images.map((_, i) => (
          <div key={i} className={`tv-indicator ${i === currentIndex ? 'active' : ''}`} />
        ))}
      </div>

      {/* Contador */}
      <div className="tv-counter">
        {currentIndex + 1} / {images.length}
      </div>
    </div>
  );
}
