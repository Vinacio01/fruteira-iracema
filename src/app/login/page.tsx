import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { SeloIracema } from "@/components/selo-iracema";
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

  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-8 bg-folha p-4">
      <SeloIracema tamanho="grande" />
      <div className="w-full max-w-sm rounded-xl bg-card p-6 shadow-lg">
        <h1 className="font-display text-2xl font-bold text-titulo">Entrar</h1>
        <p className="mt-1 mb-5 text-sm text-muted-foreground">
          Use o e-mail e a senha que o proprietário cadastrou para você.
        </p>
        <FormularioLogin
          aviso={aviso}
          contasDemo={process.env.DEMO_MODE === "true" ? CONTAS_DEMO : []}
        />
      </div>
    </main>
  );
}
