import { useEffect, useState } from 'react';

interface CarImageProps {
  src: string;
  alt: string;
  label?: string;
  className?: string;
}

export function CarImage({ src, alt, label, className = '' }: CarImageProps) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (failed || !src) {
    return (
      <div
        className={`relative flex flex-col items-center justify-center overflow-hidden bg-gradient-to-br from-[#1b1415] via-[#121212] to-[#0a0a0a] text-[#aaa6a1] ${className}`}
        role="img"
        aria-label={alt}
      >
        <span className="font-latin text-[11px] font-semibold tracking-wider text-[#d5d1cc]">
          {label || alt}
        </span>
        <span className="mt-2 text-[10px] text-[#807a75]">Image unavailable</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
