"use server";

import { redirect } from "next/navigation";

import { executarAcao } from "@/lib/acao";
import type { EstadoFormulario } from "@/lib/estado-formulario";
import { redefinirSenha } from "@/lib/services/recuperacao";
import { exigirUsuario } from "@/lib/services/sessao";
import { esquemaRedefinirSenha } from "@/lib/validations/auth";
import { errosPorCampo } from "@/lib/validations/comum";

/** Define a senha nova depois do link do e-mail e manda entrar de novo. */
export async function redefinirSenhaAcao(
  _anterior: EstadoFormulario,
  formData: FormData,
): Promise<EstadoFormulario> {
  const usuario = await exigirUsuario();

  const dados = esquemaRedefinirSenha.safeParse({
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

  const resultado = await executarAcao(async () => {
    await redefinirSenha(usuario.email, dados.data.nova_senha);
    return "Senha redefinida.";
  }, "redefinirSenhaAcao");

  if (resultado.ok) redirect("/login?motivo=senha-redefinida");
  return resultado;
}
