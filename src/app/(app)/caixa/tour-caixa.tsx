"use client";

import { useEffect, useState } from "react";
import { CircleHelp } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useArmazenamentoLocal } from "@/hooks/use-armazenamento-local";

type Passo = {
  /** Valor do atributo `data-tour` do elemento que o balão aponta. */
  alvo: "busca" | "pagamento" | "finalizar";
  titulo: string;
  texto: string;
};

const PASSOS: Passo[] = [
  {
    alvo: "busca",
    titulo: "1. Busque o produto",
    texto:
      "Passe o leitor no código de barras (ele digita e aperta Enter sozinho) ou digite o nome e aperte Enter.",
  },
  {
    alvo: "pagamento",
    titulo: "2. Escolha o pagamento",
    texto: "O cartão continua na maquininha. Aqui você só registra como o cliente pagou.",
  },
  {
    alvo: "finalizar",
    titulo: "3. Finalize com F2",
    texto: "Confira o total e aperte F2 ou o botão. O estoque baixa sozinho. Esc cancela a venda.",
  },
];

const LARGURA_BALAO = 320;
const FOLGA = 12;

/**
 * Tour de três passos do caixa. Abre sozinho na primeira vez que o usuário vê o
 * caixa (a escolha fica gravada neste navegador, por usuário) e pode ser
 * repetido pelo botão "Ver tour".
 */
export function TourCaixa({ usuarioId }: { usuarioId: string }) {
  const [visto, marcarComoVisto] = useArmazenamentoLocal(`iracema-tour-caixa:${usuarioId}`);
  const [manual, setManual] = useState(false);
  const [passo, setPasso] = useState(0);

  // `visto === null`: já sei que este usuário nunca viu. `undefined` = ainda não sei.
  const aberto = manual || visto === null;

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
          passo={PASSOS[passo]}
          indice={passo}
          total={PASSOS.length}
          aoVoltar={() => setPasso((p) => Math.max(p - 1, 0))}
          aoAvancar={() => (passo === PASSOS.length - 1 ? encerrar() : setPasso(passo + 1))}
          aoEncerrar={encerrar}
        />
      ) : null}
    </>
  );
}

type PropsBalao = {
  passo: Passo;
  indice: number;
  total: number;
  aoVoltar: () => void;
  aoAvancar: () => void;
  aoEncerrar: () => void;
};

function Balao({ passo, indice, total, aoVoltar, aoAvancar, aoEncerrar }: PropsBalao) {
  const [alvo, setAlvo] = useState<DOMRect | null>(null);
  const ultimo = indice === total - 1;

  // Leva o elemento à vista e acompanha rolagem e redimensionamento.
  useEffect(() => {
    const elemento = document.querySelector<HTMLElement>(`[data-tour="${passo.alvo}"]`);
    elemento?.scrollIntoView({ block: "center" });

    const medir = () => setAlvo(elemento ? elemento.getBoundingClientRect() : null);
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
  const esquerda = alvo
    ? Math.min(Math.max(alvo.left, FOLGA), window.innerWidth - largura - FOLGA)
    : (window.innerWidth - largura) / 2;
  // Abaixo do alvo quando cabe; senão acima.
  const cabeAbaixo = alvo ? alvo.bottom + 14 + 200 < window.innerHeight : true;
  const posicao: React.CSSProperties = alvo
    ? cabeAbaixo
      ? { top: alvo.bottom + 14 }
      : { bottom: window.innerHeight - alvo.top + 14 }
    : { top: window.innerHeight / 3 };

  // O tour NÃO bloqueia o caixa: nada aqui captura cliques (pointer-events-none),
  // só o balão; e o foco continua na busca. Assim a primeira leitura do código
  // de barras (que termina com Enter) adiciona o produto em vez de avançar o tour,
  // e o Esc continua sendo o atalho do caixa.
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
            boxShadow: "0 0 0 9999px rgb(0 0 0 / 0.5)",
          }}
        />
      ) : (
        <div aria-hidden="true" className="fixed inset-0 bg-black/50" />
      )}

      <div
        role="dialog"
        aria-modal="false"
        aria-live="polite"
        aria-label={`Tour do caixa, passo ${indice + 1} de ${total}`}
        className="pointer-events-auto fixed rounded-xl bg-folha p-4 text-white shadow-2xl"
        style={{ left: esquerda, width: largura, ...posicao }}
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
