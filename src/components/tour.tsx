"use client";

import { useEffect, useState } from "react";
import { CircleHelp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useArmazenamentoLocal } from "@/hooks/use-armazenamento-local";

export type PassoTour = {
  /** Valor do atributo `data-tour` do elemento que o balão aponta. */
  alvo: string;
  titulo: string;
  texto: string;
};

type Props = {
  /** Nome do tour ("caixa", "painel"): forma a chave que lembra quem já viu. */
  nome: string;
  usuarioId: string;
  passos: PassoTour[];
  /** Abre sozinho na primeira visita? (falso quando outra ajuda já está na tela) */
  abrirSozinho?: boolean;
};

const LARGURA_BALAO = 320;
const FOLGA = 12;
const ALTURA_ESTIMADA = 200;

/**
 * Tour em balões. Abre sozinho na primeira visita do usuário à tela (a escolha
 * fica gravada neste navegador, por usuário) e pode ser repetido pelo botão
 * "Ver tour".
 *
 * Não bloqueia a tela: nada captura cliques além do balão, e o foco fica onde
 * estava. No caixa isso é essencial: a primeira leitura do código de barras
 * (que termina com Enter) adiciona o produto em vez de avançar o tour, e o Esc
 * continua sendo o atalho do caixa.
 */
export function Tour({ nome, usuarioId, passos, abrirSozinho = true }: Props) {
  const [visto, marcarComoVisto] = useArmazenamentoLocal(`iracema-tour-${nome}:${usuarioId}`);
  const [manual, setManual] = useState(false);
  const [passo, setPasso] = useState(0);

  // `visto === null`: já sei que este usuário nunca viu. `undefined` = ainda não sei.
  const aberto = manual || (abrirSozinho && visto === null);

  function encerrar() {
    marcarComoVisto("1");
    setManual(false);
    setPasso(0);
  }

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          setPasso(0);
          setManual(true);
        }}
      >
        <CircleHelp /> Ver tour
      </Button>

      {aberto ? (
        <Balao
          rotulo={`Tour do ${nome}`}
          passo={passos[passo]}
          indice={passo}
          total={passos.length}
          aoVoltar={() => setPasso((p) => Math.max(p - 1, 0))}
          aoAvancar={() => (passo === passos.length - 1 ? encerrar() : setPasso(passo + 1))}
          aoEncerrar={encerrar}
        />
      ) : null}
    </>
  );
}

type PropsBalao = {
  rotulo: string;
  passo: PassoTour;
  indice: number;
  total: number;
  aoVoltar: () => void;
  aoAvancar: () => void;
  aoEncerrar: () => void;
};

/** Onde o balão fica: abaixo, acima ou ao lado do alvo, sempre dentro da tela. */
function posicionar(alvo: DOMRect | null, largura: number): React.CSSProperties {
  const { innerWidth: w, innerHeight: h } = window;
  if (!alvo) return { left: (w - largura) / 2, top: h / 3 };

  // Alvo na faixa da esquerda (o menu lateral): o balão vai ao lado, se couber,
  // para não cobrir o próprio menu.
  const naLateral = alvo.right < w * 0.3;
  if (naLateral && alvo.right + 14 + largura < w) {
    return { left: alvo.right + 14, top: Math.min(Math.max(alvo.top, FOLGA), h - ALTURA_ESTIMADA - FOLGA) };
  }

  const left = Math.min(Math.max(alvo.left, FOLGA), w - largura - FOLGA);
  return alvo.bottom + 14 + ALTURA_ESTIMADA < h
    ? { left, top: alvo.bottom + 14 }
    : { left, bottom: h - alvo.top + 14 };
}

function Balao({ rotulo, passo, indice, total, aoVoltar, aoAvancar, aoEncerrar }: PropsBalao) {
  const [alvo, setAlvo] = useState<DOMRect | null>(null);
  const ultimo = indice === total - 1;

  // Leva o elemento à vista e acompanha rolagem e redimensionamento. Um alvo
  // escondido (ex.: o menu lateral no celular) tem tamanho zero: balão no centro.
  useEffect(() => {
    const elemento = document.querySelector<HTMLElement>(`[data-tour="${passo.alvo}"]`);
    elemento?.scrollIntoView({ block: "center" });

    const medir = () => {
      const caixa = elemento?.getBoundingClientRect();
      setAlvo(caixa && caixa.width > 0 && caixa.height > 0 ? caixa : null);
    };
    const quadro = requestAnimationFrame(medir);
    window.addEventListener("resize", medir);
    window.addEventListener("scroll", medir, true);
    return () => {
      cancelAnimationFrame(quadro);
      window.removeEventListener("resize", medir);
      window.removeEventListener("scroll", medir, true);
    };
  }, [passo.alvo]);

  const largura = Math.min(LARGURA_BALAO, window.innerWidth - FOLGA * 2);

  return (
    <div className="pointer-events-none fixed inset-0 z-50" role="presentation">
      {alvo ? (
        // O sombreado ao redor vem da sombra gigante: só o alvo fica claro.
        <div
          aria-hidden="true"
          className="pointer-events-none fixed rounded-lg outline-[3px] outline-limao"
          style={{
            top: alvo.top - 4,
            left: alvo.left - 4,
            width: alvo.width + 8,
            height: alvo.height + 8,
            // Escurece pouco: o tour não bloqueia, e a tela continua legível por trás.
            boxShadow: "0 0 0 9999px rgb(0 0 0 / 0.25)",
          }}
        />
      ) : (
        <div aria-hidden="true" className="fixed inset-0 bg-black/25" />
      )}

      <div
        role="dialog"
        aria-modal="false"
        aria-live="polite"
        aria-label={`${rotulo}, passo ${indice + 1} de ${total}`}
        className="pointer-events-auto fixed rounded-xl bg-folha p-4 text-white shadow-2xl"
        style={{ width: largura, ...posicionar(alvo, largura) }}
      >
        <p className="font-display text-lg text-limao">{passo.titulo}</p>
        <p className="mt-1 text-sm leading-relaxed text-white/90">{passo.texto}</p>
        <div className="mt-4 flex items-center justify-between gap-2">
          <span className="text-xs text-white/70">
            {indice + 1} de {total}
          </span>
          <div className="flex gap-2">
            {indice === 0 ? (
              <Button size="sm" variant="ghost" onClick={aoEncerrar} className="text-white hover:bg-white/10 hover:text-white">
                Pular
              </Button>
            ) : (
              <Button size="sm" variant="ghost" onClick={aoVoltar} className="text-white hover:bg-white/10 hover:text-white">
                Voltar
              </Button>
            )}
            <Button size="sm" onClick={aoAvancar} className="bg-limao text-folha hover:bg-limao/90">
              {ultimo ? "Entendi" : "Próximo"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
