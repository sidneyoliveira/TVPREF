interface DisplayImageProps {
  imageUrl: string;
  title?: string;
  description?: string;
}

export function DisplayImage({ imageUrl, title, description }: DisplayImageProps) {
  if (!imageUrl) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
        <p className="text-3xl text-gray-500">Nenhuma imagem configurada</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative bg-black flex flex-col items-center justify-center overflow-hidden">
      <img
        src={imageUrl}
        alt={title || 'Imagem'}
        className="w-full h-full object-contain"
      />
      
      {(title || description) && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-8">
          {title && (
            <h2 className="text-5xl font-bold text-white mb-3">{title}</h2>
          )}
          {description && (
            <p className="text-2xl text-gray-200">{description}</p>
          )}
        </div>
      )}
    </div>
  );
}
