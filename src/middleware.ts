import { type NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';

const intlMiddleware = createMiddleware({
  locales: ['en', 'it', 'es', 'fr'],
  defaultLocale: 'en',
  // Cambiamo localePrefix a 'always' per forzare il prefisso,
  // ma senza che debba esistere la cartella fisica [lang]
  localePrefix: 'always' 
});

export function middleware(request: NextRequest) {
  // Passiamo tutto al middleware, che ora gestirà il routing virtuale
  return intlMiddleware(request);
}

export const config = {
  // Escludiamo i file statici, ma includiamo la root
  matcher: ['/', '/(en|it|es|fr)/:path*', '/((?!api|_next|_vercel|.*\\..*).*)']
};