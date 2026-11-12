import "server-only";

import { createClient } from "@supabase/supabase-js";

import { lerEnvPublico } from "@/lib/env";
import { criarClienteServidor } from "@/lib/supabase/server";
import type { DadosTrocaSenha } from "@/lib/validations/auth";

import { ErroAmigavel } from "./banco";

/**
 * Contas da demonstração pública: a senha delas está publicada no README.
 * Se um visitante pudesse trocá-la, trancaria todos os outros (inclusive quem
 * avalia o portfólio) do lado de fora.
 */
export function ehContaDemo(email: string): boolean {
  return email.trim().toLowerCase().endsWith("@demo-iracema.test");
}

/**
 * Confere a senha atual SEM mexer na sessão aberta: usa uma conexão à parte,
 * que não grava cookies, e encerra a sessão que essa conferência criou.
 */
async function senhaConfere(email: string, senha: string): Promise<boolean> {
  const env = lerEnvPublico();
  const avulso = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { error } = await avulso.auth.signInWithPassword({ email, password: senha });
  if (error) {
    if (error.code === "invalid_credentials") return false;
    console.error("[trocarSenha] erro ao conferir a senha atual", error);
    throw new ErroAmigavel("Não foi possível conferir a senha agora. Tente novamente.");
  }
  await avulso.auth.signOut({ scope: "local" });
  return true;
}

/**
 * Troca a senha do usuário logado. Exige a senha atual: quem encontrar o
 * computador com a sessão aberta não consegue trocar a senha sem saber a atual.
 */
export async function trocarSenha(email: string, dados: DadosTrocaSenha): Promise<void> {
  if (ehContaDemo(email)) {
    throw new ErroAmigavel(
      "Esta é uma conta da demonstração pública: a senha não pode ser trocada.",
    );
  }

  if (!(await senhaConfere(email, dados.senha_atual))) {
    throw new ErroAmigavel("A senha atual está incorreta.");
  }

  const supabase = await criarClienteServidor();
  const { error } = await supabase.auth.updateUser({ password: dados.nova_senha });
  if (!error) return;

  if (error.code === "same_password") {
    throw new ErroAmigavel("A nova senha precisa ser diferente da atual.");
  }
  if (error.code === "weak_password") {
    throw new ErroAmigavel("Essa senha é fraca demais. Use uma mais longa, misturando letras e números.");
  }
  console.error("[trocarSenha] erro ao atualizar a senha", error);
  throw new ErroAmigavel("Não foi possível trocar a senha agora. Tente novamente.");
}
