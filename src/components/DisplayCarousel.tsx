import { useState, useEffect } from 'react';
import { CarouselImage } from '@/hooks/useTvData';

interface DisplayCarouselProps {
  images: CarouselImage[];
}

export function DisplayCarousel({ images }: DisplayCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (images.length <= 1) return;
    
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length);
    }, 8000); // Troca a cada 8 segundos
    
    return () => clearInterval(timer);
  }, [images.length]);

  if (images.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
        <p className="text-3xl text-gray-500">Nenhuma imagem no carrossel</p>
      </div>
    );
  }

  const currentImage = images[currentIndex];

  return (
    <div className="w-full h-full relative overflow-hidden bg-black">
      {/* Imagem atual */}
      <img
        src={currentImage.imagem_url}
        alt={currentImage.titulo}
        className="w-full h-full object-cover transition-opacity duration-1000"
      />

      {/* Overlay com título e descrição */}
      {(currentImage.titulo || currentImage.descricao) && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-transparent to-transparent p-8">
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
          <button
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={`w-4 h-4 rounded-full transition-all ${
              i === currentIndex ? 'bg-white scale-125' : 'bg-white/40 hover:bg-white/60'
            }`}
            aria-label={`Ir para imagem ${i + 1}`}
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
