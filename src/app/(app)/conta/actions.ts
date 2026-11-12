"use server";

import { executarAcao } from "@/lib/acao";
import type { EstadoFormulario } from "@/lib/estado-formulario";
import { trocarSenha } from "@/lib/services/conta";
import { exigirUsuario } from "@/lib/services/sessao";
import { errosPorCampo } from "@/lib/validations/comum";
import { esquemaTrocaSenha } from "@/lib/validations/auth";

/** Troca a senha do usuário logado (proprietário ou funcionário). */
export async function trocarSenhaAcao(
  _anterior: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const usuario = await exigirUsuario();

  const dados = esquemaTrocaSenha.safeParse({
    senha_atual: String(formData.get("senha_atual") ?? ""),
    nova_senha: String(formData.get("nova_senha") ?? ""),
    confirmacao: String(formData.get("confirmacao") ?? ""),
  });
  if (!dados.success) {
    return {
      ok: false,
      erro: "Confira os campos destacados.",
      campos: errosPorCampo(dados.error),
      versao: Date.now(),
    };
  }

  return executarAcao(async () => {
    await trocarSenha(usuario.email, dados.data);
    return "Senha trocada. Use a nova senha no próximo login.";
  }, "trocarSenhaAcao");
}
