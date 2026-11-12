"use client";

import { startTransition as iniciarTransicao, useActionState } from "react";
import { Loader2 } from "lucide-react";

import { Campo } from "@/components/campo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ESTADO_INICIAL } from "@/lib/estado-formulario";
import { SENHA_MINIMO } from "@/lib/validations/auth";

import { redefinirSenhaAcao } from "./actions";

export function FormularioRedefinir() {
  const [estado, enviar, pendente] = useActionState(redefinirSenhaAcao, ESTADO_INICIAL);
  const erros = estado.campos ?? {};

  const propsCampo = (nome: string) => ({
    id: nome,
    name: nome,
    type: "password",
    autoComplete: "new-password",
    "aria-invalid": erros[nome] ? true : undefined,
    "aria-describedby": erros[nome] ? `${nome}-erro` : undefined,
  });

  return (
    <form
      noValidate
      className="space-y-4"
      onSubmit={(e) => {
        // Sem `action={...}`: assim o React não limpa os campos quando há erro.
        e.preventDefault();
        const dados = new FormData(e.currentTarget);
        iniciarTransicao(() => enviar(dados));
      }}
    >
      <Campo
        id="nova_senha"
        rotulo="Nova senha"
        erro={erros.nova_senha}
        ajuda={`Pelo menos ${SENHA_MINIMO} caracteres.`}
      >
        <Input {...propsCampo("nova_senha")} autoFocus />
      </Campo>
      <Campo id="confirmacao" rotulo="Repita a nova senha" erro={erros.confirmacao}>
        <Input {...propsCampo("confirmacao")} />
      </Campo>

      {estado.erro && !estado.campos ? (
        <p role="alert" className="text-sm text-destructive">
          {estado.erro}
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={pendente}>
        {pendente ? <Loader2 className="animate-spin" /> : null}
        Salvar nova senha
      </Button>
    </form>
  );
}
