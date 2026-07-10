"use client";

import { useState } from "react";

interface AircraftHeroImageProps {
  src: string;
  alt: string;
  className?: string;
}

export default function AircraftHeroImage({ src, alt, className = "" }: AircraftHeroImageProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError || !src) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.04)_1px,transparent_1px)] bg-[size:20px_20px] opacity-50" />
        <div className="relative z-10 text-center space-y-2 p-6">
          <span className="text-4xl block animate-pulse">✈️</span>
          <span className="text-[10px] font-mono text-cyan-500 uppercase tracking-widest block font-bold">
            Immagine Telemetria Non Disponibile
          </span>
          <p className="text-[9px] text-slate-500 font-mono max-w-xs mx-auto uppercase">
            La firma radar visiva di questo modello è in fase di sincronizzazione con l'hangar.
          </p>
        </div>
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => {
        setHasError(true);
      }}
    />
  );
}
