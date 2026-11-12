"use client";

import { startTransition as iniciarTransicao, useActionState } from "react";
import { Loader2, MailCheck } from "lucide-react";

import { Campo } from "@/components/campo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ESTADO_INICIAL } from "@/lib/estado-formulario";

import { esqueciSenhaAcao } from "./actions";

export function FormularioEsqueci({ aviso }: { aviso?: string }) {
  const [estado, enviar, pendente] = useActionState(esqueciSenhaAcao, ESTADO_INICIAL);
  const erros = estado.campos ?? {};
  const erro = estado.ok ? undefined : (estado.erro ?? aviso);

  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={(e) => {
        // Sem `action={...}`: assim o React não limpa o e-mail depois do envio.
        e.preventDefault();
        const dados = new FormData(e.currentTarget);
        iniciarTransicao(() => enviar(dados));
      }}
    >
      <Campo id="email" rotulo="E-mail de acesso" erro={erros.email}>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          autoFocus
          aria-invalid={erros.email ? true : undefined}
          aria-describedby={erros.email ? "email-erro" : undefined}
        />
      </Campo>

      {estado.ok ? (
        <p
          role="status"
          className="flex gap-2 rounded-md border border-iracema/30 bg-broto/40 p-3 text-sm"
        >
          <MailCheck className="mt-0.5 size-4 shrink-0" />
          <span>
            {estado.mensagem} O link vale por 1 hora; se não chegar, olhe a caixa de spam.
          </span>
        </p>
      ) : erro ? (
        <p role="alert" className="text-sm text-destructive">
          {erro}
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={pendente}>
        {pendente ? <Loader2 className="animate-spin" /> : null}
        {estado.ok ? "Enviar de novo" : "Enviar link por e-mail"}
      </Button>
    </form>
  );
}
