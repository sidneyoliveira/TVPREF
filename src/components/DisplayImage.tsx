interface DisplayImageProps {
  imageUrl: string;
  title?: string;
  description?: string;
}

export function DisplayImage({ imageUrl, title, description }: DisplayImageProps) {
  if (!imageUrl) {
    return (
      <div className="tv-legacy tv-panel tv-empty-carousel">
        <p className="tv-empty-text">Nenhuma imagem configurada</p>
      </div>
    );
  }

  return (
    <div className="tv-legacy tv-panel tv-image-panel">
      <img
        src={imageUrl}
        alt={title || 'Imagem'}
        className="tv-media tv-media-contain"
      />
      {(title || description) && (
        <div className="tv-overlay-bottom">
          {title && (
            <h2 className="tv-overlay-title">{title}</h2>
          )}
          {description && (
            <p className="tv-overlay-desc">{description}</p>
          )}
        </div>
      )}
    </div>
  );
}
