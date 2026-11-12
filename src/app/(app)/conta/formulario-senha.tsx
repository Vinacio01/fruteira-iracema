"use client";

import { startTransition as iniciarTransicao, useActionState, useRef } from "react";
import { Loader2 } from "lucide-react";

import { Campo } from "@/components/campo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useResultadoAcao } from "@/hooks/use-resultado-acao";
import { ESTADO_INICIAL } from "@/lib/estado-formulario";
import { SENHA_MINIMO } from "@/lib/validations/auth";

import { trocarSenhaAcao } from "./actions";

export function FormularioSenha({ bloqueado }: { bloqueado: boolean }) {
  const [estado, enviar, pendente] = useActionState(trocarSenhaAcao, ESTADO_INICIAL);
  const formulario = useRef<HTMLFormElement>(null);
  const erros = estado.campos ?? {};

  // Senha trocada: limpa os três campos.
  useResultadoAcao(estado, () => formulario.current?.reset());

  const propsCampo = (nome: string) => ({
    id: nome,
    name: nome,
    type: "password",
    disabled: bloqueado,
    "aria-invalid": erros[nome] ? true : undefined,
    "aria-describedby": erros[nome] ? `${nome}-erro` : undefined,
  });

  return (
    <form
      ref={formulario}
      noValidate
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        const dados = new FormData(e.currentTarget);
        iniciarTransicao(() => enviar(dados));
      }}
    >
      <Campo id="senha_atual" rotulo="Senha atual" erro={erros.senha_atual}>
        <Input {...propsCampo("senha_atual")} autoComplete="current-password" />
      </Campo>
      <Campo
        id="nova_senha"
        rotulo="Nova senha"
        erro={erros.nova_senha}
        ajuda={`Pelo menos ${SENHA_MINIMO} caracteres.`}
      >
        <Input {...propsCampo("nova_senha")} autoComplete="new-password" />
      </Campo>
      <Campo id="confirmacao" rotulo="Repita a nova senha" erro={erros.confirmacao}>
        <Input {...propsCampo("confirmacao")} autoComplete="new-password" />
      </Campo>
      <Button type="submit" disabled={pendente || bloqueado}>
        {pendente ? <Loader2 className="animate-spin" /> : null}
        Trocar senha
      </Button>
    </form>
  );
}
