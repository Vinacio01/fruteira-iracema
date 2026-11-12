"use client";

import { Tour, type PassoTour } from "@/components/tour";

const PASSOS: PassoTour[] = [
  {
    alvo: "periodo",
    titulo: "1. Escolha o período",
    texto:
      "Hoje, últimos 7 ou 30 dias, este mês ou o mês anterior. Todos os números da tela seguem o período escolhido.",
  },
  {
    alvo: "faturamento",
    titulo: "2. Quanto a loja vendeu",
    texto:
      "Faturamento do dia e do período. Vendas canceladas não entram em nenhum número do painel.",
  },
  {
    alvo: "variacao",
    titulo: "3. Melhor ou pior que antes?",
    texto:
      "Compara com o mesmo trecho do período anterior. Por exemplo, no dia 11 este mês é comparado com os dias 1 a 11 do mês passado. Verde subiu, vermelho caiu.",
  },
  {
    alvo: "estoque-baixo",
    titulo: "4. O que precisa repor",
    texto:
      "A etiqueta amarela mostra quantos produtos chegaram ao estoque mínimo. Clique para ver a lista e registrar a entrada.",
  },
  {
    alvo: "menu",
    titulo: "5. O resto da loja",
    texto:
      "Produtos para cadastrar e mudar preços, Estoque para entradas e ajustes, Vendas para ver e cancelar, Configurações para o e-mail de alerta.",
  },
];

/**
 * Tour do painel do proprietário. Não abre sozinho com a loja vazia: aí quem
 * aparece é o assistente de configuração, e os dois juntos atrapalhariam.
 */
export function TourPainel({ usuarioId, abrirSozinho }: { usuarioId: string; abrirSozinho: boolean }) {
  return <Tour nome="painel" usuarioId={usuarioId} passos={PASSOS} abrirSozinho={abrirSozinho} />;
}
