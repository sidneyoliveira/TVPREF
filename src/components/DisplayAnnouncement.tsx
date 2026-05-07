interface DisplayAnnouncementProps {
  title: string;
  text: string;
}

export function DisplayAnnouncement({ title, text }: DisplayAnnouncementProps) {
  return (
    <div className="w-full h-full bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 flex items-center justify-center p-16 overflow-hidden">
      <div className="text-center max-w-4xl">
        <h1 className="text-8xl font-black text-white mb-8 drop-shadow-2xl animate-pulse">
          {title}
        </h1>
        <p className="text-5xl text-white leading-relaxed drop-shadow-lg font-bold">
          {text}
        </p>
        
        {/* Decorative elements */}
        <div className="mt-16 flex justify-center gap-8">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="w-6 h-6 rounded-full bg-white animate-bounce"
              style={{ animationDelay: `${i * 0.1}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
