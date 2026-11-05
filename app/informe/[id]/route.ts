// Abre el informe de un control. El bucket es privado: generamos un link
// que vence en 60 segundos y redirigimos. La seguridad (RLS) impide ver informes de otra familia.
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest, ctx: RouteContext<"/informe/[id]">) {
  const { id } = await ctx.params;
  const supabase = await createClient();

  const { data } = await supabase.from("controles_realizados").select("informe_path").eq("id", id).maybeSingle();
  if (!data?.informe_path) return new NextResponse("Informe no encontrado", { status: 404 });

  const { data: link, error } = await supabase.storage.from("informes").createSignedUrl(data.informe_path, 60);
  if (error || !link) return new NextResponse("No se pudo abrir el informe", { status: 500 });

  return NextResponse.redirect(link.signedUrl);
}
