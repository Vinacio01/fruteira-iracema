"use server";

import { executarAcao } from "@/lib/acao";
import type { EstadoFormulario } from "@/lib/estado-formulario";
import { pedirRecuperacao } from "@/lib/services/recuperacao";
import { esquemaEsqueciSenha } from "@/lib/validations/auth";
import { errosPorCampo } from "@/lib/validations/comum";

/**
 * Pede o e-mail de recuperação. A resposta é a mesma exista o e-mail ou não,
 * para a tela não servir de lista de quem tem cadastro.
 */
export async function esqueciSenhaAcao(
  _anterior: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const dados = esquemaEsqueciSenha.safeParse({ email: String(formData.get("email") ?? "") });
  if (!dados.success) {
    return {
      ok: false,
      erro: "Confira o e-mail informado.",
      campos: errosPorCampo(dados.error),
      versao: Date.now(),
    };
  }

  return executarAcao(async () => {
    await pedirRecuperacao(dados.data.email);
    return "Se esse e-mail tem cadastro, enviamos um link para criar uma nova senha.";
  }, "esqueciSenhaAcao");
}
