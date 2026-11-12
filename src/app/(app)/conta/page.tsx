import type { Metadata } from "next";
import { CircleAlert } from "lucide-react";

import { CabecalhoPagina } from "@/components/cabecalho-pagina";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ehContaDemo } from "@/lib/services/conta";
import { exigirUsuario } from "@/lib/services/sessao";

import { FormularioSenha } from "./formulario-senha";

export const metadata: Metadata = { title: "Minha conta" };

const ROTULO_PAPEL = { proprietario: "Proprietário", funcionario: "Funcionário" } as const;

/** Minha conta: dados de quem está logado e troca de senha (os dois papéis). */
export default async function PaginaConta() {
  const usuario = await exigirUsuario();
  const demo = ehContaDemo(usuario.email);

  return (
    <>
      <CabecalhoPagina titulo="Minha conta" descricao="Seus dados de acesso ao sistema." />

      <div className="grid max-w-4xl gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>{usuario.nome}</CardTitle>
            <CardDescription>{ROTULO_PAPEL[usuario.papel]}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1 text-sm">
            <p className="text-muted-foreground">E-mail de acesso</p>
            <p className="font-medium break-all">{usuario.email}</p>
            <p className="pt-3 text-muted-foreground">
              Para mudar o nome, o e-mail ou o papel, fale com quem administra o sistema.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Trocar senha</CardTitle>
            <CardDescription>Você continua conectado neste aparelho depois de trocar.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {demo ? (
              <p
                role="note"
                className="flex gap-2 rounded-md border border-laranja/50 bg-laranja/10 p-3 text-sm"
              >
                <CircleAlert className="mt-0.5 size-4 shrink-0 text-laranja-texto" />
                Esta é uma conta da demonstração pública, com a senha publicada. Para ninguém ficar sem
                acesso, a senha dela não pode ser trocada.
              </p>
            ) : null}
            <FormularioSenha bloqueado={demo} />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
