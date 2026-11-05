// Corre antes de cada página. Hace dos cosas:
// 1. Renueva la sesión de Supabase si está por vencer (así nadie tiene que volver a pedir código).
// 2. Manda a /entrar a quien no inició sesión, y saca de /entrar a quien ya la inició.
import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// /auth/confirmar tiene que ser pública: ahí llega quien todavía no tiene sesión.
const RUTAS_PUBLICAS = ["/entrar", "/auth/confirmar"];

export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
          Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value));
        },
      },
    },
  );

  // getClaims verifica la sesión de verdad (no confía a ciegas en la cookie).
  const { data } = await supabase.auth.getClaims();
  const conSesion = Boolean(data?.claims);
  const ruta = request.nextUrl.pathname;
  const esPublica = RUTAS_PUBLICAS.some((r) => ruta === r || ruta.startsWith(`${r}/`));

  if (!conSesion && !esPublica) {
    return redirigir(request, "/entrar", response);
  }
  if (conSesion && ruta === "/entrar") {
    return redirigir(request, "/", response);
  }
  return response;
}

// Redirige sin perder las cookies de sesión que Supabase acaba de renovar.
function redirigir(request: NextRequest, destino: string, response: NextResponse) {
  const url = request.nextUrl.clone();
  url.pathname = destino;
  url.search = "";
  const redirect = NextResponse.redirect(url);
  response.cookies.getAll().forEach((c) => redirect.cookies.set(c));
  return redirect;
}

export const config = {
  matcher: [
    // Todo menos archivos estáticos e imágenes.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
