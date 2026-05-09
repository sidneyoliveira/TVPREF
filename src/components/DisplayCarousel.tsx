'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { isVideoAsset } from '@/lib/embed';
import type { CarouselImage } from '@/lib/types';

interface DisplayCarouselProps {
  images: CarouselImage[];
}

export function DisplayCarousel({ images }: DisplayCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const goToNext = useCallback(() => {
    if (images.length > 1) {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }
  }, [images.length]);

  const safeCurrentIndex = images.length > 0 ? currentIndex % images.length : 0;

  useEffect(() => {
    if (images.length === 0) return;
    
    const currentMedia = images[safeCurrentIndex]?.imagem_url ?? "";
    const isVideo = isVideoAsset(currentMedia);

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
  }, [goToNext, images, safeCurrentIndex]);

  if (images.length === 0) {
    return (
      <div className="tv-legacy tv-panel tv-empty-carousel">
        <p className="tv-empty-text">Nenhuma imagem no carrossel</p>
      </div>
    );
  }

  const currentImage = images[safeCurrentIndex];
  const isVideo = isVideoAsset(currentImage.imagem_url);

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
        // eslint-disable-next-line @next/next/no-img-element
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
        {images.map((image, i) => (
          <div key={image.id} className={`tv-indicator ${i === safeCurrentIndex ? 'active' : ''}`} />
        ))}
      </div>

      {/* Contador */}
      <div className="tv-counter">
        {safeCurrentIndex + 1} / {images.length}
      </div>
    </div>
  );
}
