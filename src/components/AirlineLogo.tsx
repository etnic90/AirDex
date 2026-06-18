"use client";

import { useState } from "react";

interface AirlineLogoProps {
  src: string | null;
  alt: string;
  airlineName: string;
}

export default function AirlineLogo({ src, alt, airlineName }: AirlineLogoProps) {
  const [hasError, setHasError] = useState(false);

  // Estrae le iniziali in modo pulito ed elegante (massimo 2 lettere)
  const initials = useMemoInitials(airlineName);

  if (!src || hasError) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-slate-950 text-purple-400 font-mono font-black text-lg select-none border border-purple-500/20 shadow-[inset_0_0_10px_rgba(168,85,247,0.15)] uppercase">
        {initials}
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className="max-w-full max-h-full object-contain relative z-10"
      onError={() => {
        setHasError(true);
      }}
    />
  );
}

function useMemoInitials(name: string): string {
  if (!name) return "AP";
  const cleanName = name.replace(/[^a-zA-Z0-9\s]/g, "");
  const parts = cleanName.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase().slice(0, 2);
  }
  return cleanName.slice(0, 2).toUpperCase();
}