import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({
            request: { headers: request.headers },
          });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();

  // Protezione rotte Admin
  if (request.nextUrl.pathname.includes('/admin')) {
    // 1. Controlla se l'utente è loggato
    if (!session) {
      console.log("DEBUG: Nessuna sessione trovata, reindirizzamento al login.");
      return NextResponse.redirect(new URL('/en/login', request.url));
    }

    // 2. Controllo specifico Admin
    const userEmail = session.user.email;
    const adminEmail = 'mirkogalantucci@gmail.com';
    const isAdmin = userEmail === adminEmail;
    
    console.log(`DEBUG: Tentativo accesso admin. User: ${userEmail} | IsAdmin: ${isAdmin}`);

    if (!isAdmin) {
      console.log("DEBUG: Accesso negato, reindirizzamento alla home.");
      return NextResponse.redirect(new URL('/en', request.url));
    }
  }

  return response;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};