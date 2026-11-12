import { NextResponse, type NextRequest } from "next/server";

import { confirmarLinkRecuperacao } from "@/lib/services/recuperacao";

/**
 * Destino do link do e-mail de recuperação de senha
 * (`/auth/confirmar?token_hash=...&type=recovery`).
 *
 * Troca o código por uma sessão e leva para a tela de senha nova. O link vale
 * uma vez só e funciona mesmo se for aberto em outro aparelho que não pediu a
 * recuperação (por isso usa token_hash, e não o fluxo PKCE).
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const tokenHash = searchParams.get("token_hash");
  const tipo = searchParams.get("type");

  const destino = request.nextUrl.clone();
  destino.search = "";

  if (tipo === "recovery" && tokenHash && (await confirmarLinkRecuperacao(tokenHash))) {
    destino.pathname = "/redefinir-senha";
  } else {
    destino.pathname = "/esqueci-senha";
    destino.searchParams.set("erro", "link");
  }

  const resposta = NextResponse.redirect(destino);
  // O link tem um código secreto na URL: nada de guardar em cache.
  resposta.headers.set("Cache-Control", "no-store");
  return resposta;
}
