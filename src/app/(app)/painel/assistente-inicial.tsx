"use client";

import { startTransition as iniciarTransicao, useActionState, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Campo } from "@/components/campo";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useArmazenamentoLocal } from "@/hooks/use-armazenamento-local";
import { useResultadoAcao } from "@/hooks/use-resultado-acao";
import { ESTADO_INICIAL } from "@/lib/estado-formulario";
import { cn } from "@/lib/utils";
import { ROTULO_UNIDADE, UNIDADES } from "@/lib/validations/produtos";

import { salvarConfiguracoesAcao } from "../configuracoes/actions";
import {
  cadastrarProdutoAcao,
  criarCategoriaAcao,
  listarCategoriasAtivasAcao,
} from "../produtos/actions";
import { FormularioNomeCategoria } from "../produtos/categorias/formulario-categoria";

type Etapa = "boas-vindas" | "categoria" | "produto" | "alertas" | "pronto";

const ETAPAS: Etapa[] = ["boas-vindas", "categoria", "produto", "alertas", "pronto"];
/** Etapas que pedem algo do dono (as que aparecem na barra de progresso). */
const ETAPAS_DE_TRABALHO: Etapa[] = ["categoria", "produto", "alertas"];

const CLASSE_SELECT =
  "h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50";

type Props = {
  usuarioId: string;
};

/**
 * Assistente de primeiro uso: aparece sozinho para o proprietário de uma loja
 * ainda sem produtos e leva até o primeiro produto cadastrado. Cada etapa usa a
 * mesma Server Action da tela correspondente, então validação e permissões são
 * as de sempre. Dá para pular; a escolha fica gravada neste navegador.
 */
export function AssistenteInicial({ usuarioId }: Props) {
  const router = useRouter();
  const [dispensado, dispensar] = useArmazenamentoLocal(`iracema-assistente:${usuarioId}`);
  const [indice, setIndice] = useState(0);
  const etapa = ETAPAS[indice];

  // `undefined` = ainda não sei se já foi dispensado (primeira pintura).
  const aberto = dispensado === null;

  function avancar() {
    setIndice((i) => Math.min(i + 1, ETAPAS.length - 1));
  }

  function fechar() {
    dispensar("1");
    // A página do painel (checklist, indicadores) passa a refletir o que foi feito.
    router.refresh();
  }

  const posicao = ETAPAS_DE_TRABALHO.indexOf(etapa);

  return (
    <Dialog open={aberto} onOpenChange={(situacao) => !situacao && fechar()}>
      <DialogContent className="sm:max-w-md">
        {posicao >= 0 ? (
          <div
            className="flex gap-1.5 pt-1"
            role="progressbar"
            aria-label="Etapas do assistente"
            aria-valuemin={1}
            aria-valuemax={ETAPAS_DE_TRABALHO.length}
            aria-valuenow={posicao + 1}
          >
            {ETAPAS_DE_TRABALHO.map((e, i) => (
              <span
                key={e}
                className={cn("h-1.5 flex-1 rounded-full", i <= posicao ? "bg-broto" : "bg-muted")}
              />
            ))}
          </div>
        ) : null}

        {etapa === "boas-vindas" ? (
          <>
            <div className="space-y-2">
              <DialogTitle className="font-display text-2xl text-titulo">
                Vamos deixar a loja pronta
              </DialogTitle>
              <DialogDescription>
                Em poucos minutos você cria uma categoria, cadastra o primeiro produto e escolhe
                onde receber o aviso de estoque baixo. Depois é só vender no caixa.
              </DialogDescription>
            </div>
            <div className="flex flex-wrap justify-between gap-2">
              <Button variant="ghost" onClick={fechar}>
                Pular por agora
              </Button>
              <Button onClick={avancar}>Começar</Button>
            </div>
          </>
        ) : null}

        {etapa === "categoria" ? (
          <>
            <div className="space-y-2">
              <DialogTitle className="font-display text-2xl text-titulo">
                Crie uma categoria
              </DialogTitle>
              <DialogDescription>
                Categorias ajudam a achar e filtrar produtos. Ex.: Hortifrúti, Bebidas, Mercearia.
                Você cria as outras depois.
              </DialogDescription>
            </div>
            <FormularioNomeCategoria
              idCampo="assistente-categoria"
              acao={criarCategoriaAcao}
              rotuloBotao="Criar e continuar"
              aoConcluir={avancar}
              focarAoAbrir
            />
            <Button variant="ghost" onClick={avancar} className="self-start">
              Pular esta etapa
            </Button>
          </>
        ) : null}

        {etapa === "produto" ? <EtapaProduto aoConcluir={avancar} aoPular={avancar} /> : null}

        {etapa === "alertas" ? <EtapaAlertas aoConcluir={avancar} aoPular={avancar} /> : null}

        {etapa === "pronto" ? (
          <>
            <div className="space-y-2">
              <DialogTitle className="font-display text-2xl text-titulo">Tudo pronto</DialogTitle>
              <DialogDescription>
                A loja já pode vender. O painel mostra o que falta, e o caixa tem um tour rápido na
                primeira vez que for aberto.
              </DialogDescription>
            </div>
            <div className="flex flex-wrap justify-between gap-2">
              <Button variant="ghost" onClick={fechar}>
                Ficar no painel
              </Button>
              <Button asChild onClick={() => dispensar("1")}>
                <Link href="/caixa">Abrir o caixa</Link>
              </Button>
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

// -----------------------------------------------------------------------------

function EtapaProduto({ aoConcluir, aoPular }: { aoConcluir: () => void; aoPular: () => void }) {
  const [estado, enviar, pendente] = useActionState(cadastrarProdutoAcao, ESTADO_INICIAL);
  const [categorias, setCategorias] = useState<{ id: string; nome: string }[]>([]);
  const erros = estado.campos ?? {};

  useResultadoAcao(estado, aoConcluir);

  // A categoria acabou de ser criada na etapa anterior: busca a lista atual.
  useEffect(() => {
    let vivo = true;
    listarCategoriasAtivasAcao()
      .then((lista) => {
        if (vivo) setCategorias(lista);
      })
      .catch(() => {});
    return () => {
      vivo = false;
    };
  }, []);

  const propsCampo = (nome: string) => ({
    id: `assistente-${nome}`,
    name: nome,
    "aria-invalid": erros[nome] ? true : undefined,
  });

  return (
    <>
      <div className="space-y-2">
        <DialogTitle className="font-display text-2xl text-titulo">
          Cadastre o primeiro produto
        </DialogTitle>
        <DialogDescription>
          Só o essencial. Código de barras e outros detalhes você completa depois, em Produtos.
        </DialogDescription>
      </div>

      <form
        noValidate
        className="grid gap-4 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          const dados = new FormData(e.currentTarget);
          iniciarTransicao(() => enviar(dados));
        }}
      >
        {/* Valores padrão: o assistente não pergunta o que o dono ajusta depois. */}
        <input type="hidden" name="estoque_minimo" value="10" />

        <Campo id="assistente-nome" rotulo="Nome" erro={erros.nome} className="sm:col-span-2">
          <Input {...propsCampo("nome")} placeholder="Ex.: Banana prata" maxLength={120} required autoFocus />
        </Campo>

        <Campo id="assistente-preco_venda" rotulo="Preço de venda" erro={erros.preco_venda}>
          <Input {...propsCampo("preco_venda")} inputMode="decimal" placeholder="7,90" />
        </Campo>

        <Campo
          id="assistente-preco_custo"
          rotulo="Preço de custo"
          erro={erros.preco_custo}
          ajuda="Quanto você paga. Só você vê."
        >
          <Input {...propsCampo("preco_custo")} inputMode="decimal" placeholder="4,50" />
        </Campo>

        <Campo id="assistente-estoque_inicial" rotulo="Quantidade em estoque" erro={erros.estoque_inicial}>
          <Input {...propsCampo("estoque_inicial")} inputMode="numeric" placeholder="25" defaultValue="0" />
        </Campo>

        <Campo id="assistente-unidade" rotulo="Unidade" erro={erros.unidade}>
          <select {...propsCampo("unidade")} defaultValue="un" className={CLASSE_SELECT}>
            {UNIDADES.map((u) => (
              <option key={u} value={u}>
                {ROTULO_UNIDADE[u]}
              </option>
            ))}
          </select>
        </Campo>

        {categorias.length > 0 ? (
          <Campo id="assistente-categoria_id" rotulo="Categoria" erro={erros.categoria_id} className="sm:col-span-2">
            <select {...propsCampo("categoria_id")} defaultValue="" className={CLASSE_SELECT}>
              <option value="">Sem categoria</option>
              {categorias.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </Campo>
        ) : null}

        <div className="flex flex-wrap items-center justify-between gap-2 sm:col-span-2">
          <Button type="button" variant="ghost" onClick={aoPular}>
            Pular esta etapa
          </Button>
          <Button type="submit" disabled={pendente}>
            {pendente ? <Loader2 className="animate-spin" /> : null}
            Cadastrar e continuar
          </Button>
        </div>
      </form>
    </>
  );
}

function EtapaAlertas({ aoConcluir, aoPular }: { aoConcluir: () => void; aoPular: () => void }) {
  const [estado, enviar, pendente] = useActionState(salvarConfiguracoesAcao, ESTADO_INICIAL);
  useResultadoAcao(estado, aoConcluir);

  return (
    <>
      <div className="space-y-2">
        <DialogTitle className="font-display text-2xl text-titulo">
          Receba o aviso de estoque baixo
        </DialogTitle>
        <DialogDescription>
          Quando um produto chegar ao estoque mínimo (10 unidades), enviamos um e-mail para você
          repor a tempo.
        </DialogDescription>
      </div>

      <form
        noValidate
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          const dados = new FormData(e.currentTarget);
          iniciarTransicao(() => enviar(dados));
        }}
      >
        <input type="hidden" name="alertas_ativos" value="on" />
        <Campo
          id="assistente-email_alerta"
          rotulo="E-mail de destino"
          erro={estado.campos?.email_alerta}
          ajuda="Normalmente o e-mail do proprietário."
        >
          <Input
            id="assistente-email_alerta"
            name="email_alerta"
            type="email"
            autoComplete="email"
            placeholder="dono@exemplo.com"
            aria-invalid={estado.campos?.email_alerta ? true : undefined}
          />
        </Campo>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <Button type="button" variant="ghost" onClick={aoPular}>
            Pular esta etapa
          </Button>
          <Button type="submit" disabled={pendente}>
            {pendente ? <Loader2 className="animate-spin" /> : null}
            Salvar e continuar
          </Button>
        </div>
      </form>
    </>
  );
}
