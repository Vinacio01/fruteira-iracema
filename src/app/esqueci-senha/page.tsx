import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { CartaoAutenticacao } from "@/components/cartao-autenticacao";
import { destinoInicial, obterSessao } from "@/lib/services/sessao";

import { FormularioEsqueci } from "./formulario-esqueci";

export const metadata: Metadata = { title: "Esqueci minha senha" };

export default async function PaginaEsqueciSenha({ searchParams }: PageProps<"/esqueci-senha">) {
  const sessao = await obterSessao();
  if (sessao.estado === "ativo") {
    redirect(destinoInicial(sessao.usuario.papel));
  }

  const { erro } = await searchParams;
  const aviso =
    erro === "link"
      ? "Esse link não vale mais (ele só funciona uma vez e por 1 hora). Peça um novo abaixo."
      : undefined;

  return (
    <CartaoAutenticacao
      titulo="Esqueci a senha"
      descricao="Informe o e-mail de acesso. Enviamos um link para você criar uma senha nova."
    >
      <FormularioEsqueci aviso={aviso} />
      <p className="mt-4 text-center text-sm">
        <Link href="/login" className="text-muted-foreground underline underline-offset-4 hover:text-foreground">
          Voltar para o login
        </Link>
      </p>
    </CartaoAutenticacao>
  );
}
