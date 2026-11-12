import "server-only";

import { criarClienteServidor } from "@/lib/supabase/server";

import { ErroAmigavel } from "./banco";
import { ehContaDemo } from "./conta";

/**
 * "Esqueci minha senha" por e-mail, em três passos:
 *  1. `pedirRecuperacao`: o Supabase manda um e-mail com um link de uso único;
 *  2. `confirmarLinkRecuperacao`: a rota /auth/confirmar troca o link por uma
 *     sessão de recuperação;
 *  3. `redefinirSenha`: só quem tem essa sessão define a senha nova, sem
 *     precisar da antiga.
 */

/** Por quanto tempo, depois de clicar no link, a tela de senha nova continua valendo. */
const JANELA_RECUPERACAO_MS = 30 * 60 * 1000;

/**
 * Pede o e-mail de recuperação. Quem chama não deve revelar se o e-mail tem
 * cadastro: o Supabase também responde "ok" para e-mails desconhecidos.
 */
export async function pedirRecuperacao(email: string): Promise<void> {
  // As contas da demonstração têm senha pública e não recebem e-mail.
  if (ehContaDemo(email)) return;

  const supabase = await criarClienteServidor();
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (!error) return;

  if (error.code === "over_email_send_rate_limit" || error.code === "over_request_rate_limit") {
    throw new ErroAmigavel("Muitos pedidos seguidos. Espere um minuto e tente de novo.");
  }
  console.error("[pedirRecuperacao] erro do Supabase Auth", error);
  throw new ErroAmigavel("Não foi possível enviar o e-mail agora. Tente novamente em instantes.");
}

/** Troca o código do link do e-mail por uma sessão. `false` se o link não vale mais. */
export async function confirmarLinkRecuperacao(tokenHash: string): Promise<boolean> {
  const supabase = await criarClienteServidor();
  const { error } = await supabase.auth.verifyOtp({ type: "recovery", token_hash: tokenHash });
  if (!error) return true;

  // Link usado, expirado ou adulterado: não é erro do sistema.
  if (error.status && error.status >= 500) {
    console.error("[confirmarLinkRecuperacao] erro do Supabase Auth", error);
  }
  return false;
}

/**
 * Esta sessão nasceu de um link de recuperação (e não de um login com senha)?
 * O Supabase marca no token o jeito de entrar: "otp" quando veio do link do
 * e-mail. Sem isso, qualquer pessoa diante de um computador já logado poderia
 * trocar a senha sem saber a atual.
 */
export async function sessaoEhDeRecuperacao(): Promise<boolean> {
  const supabase = await criarClienteServidor();
  const { data } = await supabase.auth.getClaims();
  const metodos = data?.claims?.amr;
  if (!Array.isArray(metodos)) return false;

  const agora = Date.now();
  return metodos.some(
    (m) =>
      typeof m === "object" &&
      (m.method === "otp" || m.method === "recovery") &&
      typeof m.timestamp === "number" &&
      agora - m.timestamp * 1000 <= JANELA_RECUPERACAO_MS,
  );
}

/** Define a senha nova e encerra todas as sessões abertas (neste e em outros aparelhos). */
export async function redefinirSenha(email: string, novaSenha: string): Promise<void> {
  if (ehContaDemo(email)) {
    throw new ErroAmigavel(
      "Esta é uma conta da demonstração pública: a senha não pode ser trocada.",
    );
  }
  if (!(await sessaoEhDeRecuperacao())) {
    throw new ErroAmigavel("O link expirou. Peça um novo em “Esqueci minha senha”.");
  }

  const supabase = await criarClienteServidor();
  const { error } = await supabase.auth.updateUser({ password: novaSenha });
  if (error) {
    if (error.code === "same_password") {
      throw new ErroAmigavel("A nova senha precisa ser diferente da atual.");
    }
    if (error.code === "weak_password") {
      throw new ErroAmigavel("Essa senha é fraca demais. Use uma mais longa, misturando letras e números.");
    }
    console.error("[redefinirSenha] erro ao atualizar a senha", error);
    throw new ErroAmigavel("Não foi possível salvar a senha agora. Tente novamente.");
  }

  // Quem pede recuperação pode ter perdido o aparelho: derruba todas as sessões.
  await supabase.auth.signOut({ scope: "global" });
}
