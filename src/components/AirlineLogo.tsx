"use client";

interface AirlineLogoProps {
  src: string | null;
  alt: string;
  airlineName: string;
}

export default function AirlineLogo({ src, alt, airlineName }: AirlineLogoProps) {
  // Genera un avatar olografico di sicurezza basato sul nome se tutto fallisce
  const fallbackSrc = `https://avatar.oxro.io/avatar.svg?name=${encodeURIComponent(airlineName)}&background=0f172a&color=a855f7`;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src || fallbackSrc}
      alt={alt}
      className="max-w-full max-h-full object-contain relative z-10"
      onError={(e) => {
        // Se il link di Wikipedia o Clearbit si rompe nel browser, scatta lo scudo
        (e.target as HTMLImageElement).src = fallbackSrc;
      }}
    />
  );
}