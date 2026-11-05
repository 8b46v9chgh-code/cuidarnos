// Acá llega la persona cuando toca el link del mail.
// Supabase manda un "code" en la dirección; lo cambiamos por una sesión y la llevamos al inicio.
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const inicio = new URL("/", request.url);
  const conError = new URL("/entrar?error=link", request.url);

  if (!code) {
    return NextResponse.redirect(conError);
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  return NextResponse.redirect(error ? conError : inicio);
}
