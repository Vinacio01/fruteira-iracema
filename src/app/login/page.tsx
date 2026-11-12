import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { CartaoAutenticacao } from "@/components/cartao-autenticacao";
import { destinoInicial, obterSessao } from "@/lib/services/sessao";

import { FormularioLogin, type ContaDemo } from "./formulario-login";

export const metadata: Metadata = { title: "Entrar" };

/**
 * Contas públicas da demonstração (as mesmas do README). Só são enviadas ao
 * navegador quando `DEMO_MODE=true`, variável de servidor: numa loja de
 * verdade ela não existe e as senhas nunca vão para a página.
 */
const CONTAS_DEMO: ContaDemo[] = [
  {
    rotulo: "Entrar como proprietário",
    descricao: "Painel financeiro, produtos, estoque, vendas e alertas",
    email: "dono@demo-iracema.test",
    senha: "demo-iracema-dono",
  },
  {
    rotulo: "Entrar como caixa",
    descricao: "Caixa e consulta de produtos, sem custos nem finanças",
    email: "caixa@demo-iracema.test",
    senha: "demo-iracema-caixa",
  },
];

export default async function PaginaLogin({ searchParams }: PageProps<"/login">) {
  const sessao = await obterSessao();
  if (sessao.estado === "ativo") {
    redirect(destinoInicial(sessao.usuario.papel));
  }

  const { motivo } = await searchParams;
  const aviso =
    sessao.estado === "inativo" || motivo === "inativo"
      ? "Seu usuário está desativado. Fale com o proprietário."
      : undefined;

  const sucesso =
    motivo === "senha-redefinida" ? "Senha redefinida. Entre com a nova senha." : undefined;

  return (
    <CartaoAutenticacao
      titulo="Entrar"
      descricao="Use o e-mail e a senha que o proprietário cadastrou para você."
    >
      <FormularioLogin
        aviso={aviso}
        sucesso={sucesso}
        contasDemo={process.env.DEMO_MODE === "true" ? CONTAS_DEMO : []}
      />
    </CartaoAutenticacao>
  );
}
