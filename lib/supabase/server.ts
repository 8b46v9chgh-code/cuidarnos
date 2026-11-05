// Cliente de Supabase para el servidor (páginas, acciones de servidor).
// Lee y escribe la sesión en las cookies del pedido.
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Desde una página no se pueden escribir cookies. No pasa nada:
            // el proxy ya renueva la sesión en cada pedido.
          }
        },
      },
    },
  );
}
