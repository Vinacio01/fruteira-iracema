import type { Metadata } from "next";
import Link from "next/link";

import { CartaoAutenticacao } from "@/components/cartao-autenticacao";
import { ehContaDemo } from "@/lib/services/conta";
import { sessaoEhDeRecuperacao } from "@/lib/services/recuperacao";
import { exigirUsuario } from "@/lib/services/sessao";

import { FormularioRedefinir } from "./formulario-redefinir";

export const metadata: Metadata = { title: "Nova senha" };

const estiloLink = "text-muted-foreground underline underline-offset-4 hover:text-foreground";

/**
 * Só abre de verdade depois do link do e-mail. Quem já está logado e chegou
 * aqui pelo endereço (sem o link) não pode trocar a senha por esta tela: para
 * isso existe "Minha conta", que pede a senha atual.
 */
export default async function PaginaRedefinirSenha() {
  const usuario = await exigirUsuario();

  if (ehContaDemo(usuario.email) || !(await sessaoEhDeRecuperacao())) {
    return (
      <CartaoAutenticacao
        titulo="Link inválido"
        descricao="Esta tela só abre pelo link que enviamos por e-mail, e o link vale uma vez e por 1 hora."
      >
        <p className="text-center text-sm">
          <Link href="/esqueci-senha" className={estiloLink}>
            Pedir um link novo
          </Link>
          {" · "}
          <Link href="/conta" className={estiloLink}>
            Trocar senha em Minha conta
          </Link>
        </p>
      </CartaoAutenticacao>
    );
  }

  return (
    <CartaoAutenticacao
      titulo="Nova senha"
      descricao={`Defina a senha de ${usuario.email}. Depois, entre de novo com ela.`}
    >
      <FormularioRedefinir />
    </CartaoAutenticacao>
  );
}
