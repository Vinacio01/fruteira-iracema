"use client";

import { useActionState, useRef } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { entrar, type EstadoLogin } from "./actions";

const estadoInicial: EstadoLogin = {};

export type ContaDemo = {
  rotulo: string;
  descricao: string;
  email: string;
  senha: string;
};

type Props = {
  aviso?: string;
  /** Só chega preenchido na demo pública (ver `DEMO_MODE` em `.env.example`). */
  contasDemo?: ContaDemo[];
};

export function FormularioLogin({ aviso, contasDemo = [] }: Props) {
  const [estado, acao, pendente] = useActionState(entrar, estadoInicial);
  const mensagem = estado.erro ?? aviso;
  const formulario = useRef<HTMLFormElement>(null);

  /** Preenche os campos e envia o formulário pelo mesmo caminho do login normal. */
  function entrarComoDemo(conta: ContaDemo) {
    const form = formulario.current;
    if (!form) return;
    (form.elements.namedItem("email") as HTMLInputElement).value = conta.email;
    (form.elements.namedItem("senha") as HTMLInputElement).value = conta.senha;
    form.requestSubmit();
  }

  return (
    <form ref={formulario} action={acao} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">E-mail</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          autoFocus
          required
          defaultValue={estado.email}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="senha">Senha</Label>
        <Input
          id="senha"
          name="senha"
          type="password"
          autoComplete="current-password"
          required
        />
      </div>

      {mensagem ? (
        <p role="alert" className="text-sm text-destructive">
          {mensagem}
        </p>
      ) : null}

      <Button type="submit" className="w-full" disabled={pendente}>
        {pendente ? <Loader2 className="animate-spin" /> : null}
        {pendente ? "Entrando..." : "Entrar"}
      </Button>

      {contasDemo.length > 0 ? (
        <div className="space-y-2 border-t pt-4">
          <p className="text-sm font-medium">Quer só conhecer? Entre na demonstração:</p>
          <div className="grid gap-2">
            {contasDemo.map((conta) => (
              <Button
                key={conta.email}
                type="button"
                variant="outline"
                className="h-auto justify-start py-2 text-left"
                disabled={pendente}
                onClick={() => entrarComoDemo(conta)}
              >
                <span className="flex flex-col items-start">
                  <span>{conta.rotulo}</span>
                  <span className="text-xs font-normal text-muted-foreground">{conta.descricao}</span>
                </span>
              </Button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Dados fictícios, redefinidos de tempos em tempos.
          </p>
        </div>
      ) : null}
    </form>
  );
}
