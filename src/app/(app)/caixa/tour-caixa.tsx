"use client";

import { Tour, type PassoTour } from "@/components/tour";

const PASSOS: PassoTour[] = [
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

/** Tour de três passos do caixa (proprietário e funcionário). */
export function TourCaixa({ usuarioId }: { usuarioId: string }) {
  return <Tour nome="caixa" usuarioId={usuarioId} passos={PASSOS} />;
}
