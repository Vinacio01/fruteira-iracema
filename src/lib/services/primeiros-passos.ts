import "server-only";

import { criarClienteServidor } from "@/lib/supabase/server";

import { erroDoBanco } from "./banco";

export type PassoInicial = {
  id: "categorias" | "produtos" | "alertas" | "venda";
  titulo: string;
  descricao: string;
  href: string;
  rotuloAcao: string;
  feito: boolean;
};

/**
 * Situação do "primeiros passos" do proprietário. Cada passo é calculado a
 * partir do que já existe no banco (nada é gravado à parte), então o
 * checklist se marca sozinho e não fica desatualizado.
 */
export async function obterPrimeirosPassos(): Promise<PassoInicial[]> {
  const supabase = await criarClienteServidor();

  const [categorias, produtos, vendas, configuracoes] = await Promise.all([
    supabase.from("categorias").select("id", { count: "exact", head: true }),
    supabase.from("produtos").select("id", { count: "exact", head: true }),
    supabase.from("vendas").select("id", { count: "exact", head: true }),
    supabase.from("configuracoes").select("alertas_ativos, email_alerta").eq("id", 1).maybeSingle(),
  ]);

  for (const [contexto, resposta] of [
    ["categorias", categorias],
    ["produtos", produtos],
    ["vendas", vendas],
    ["configuracoes", configuracoes],
  ] as const) {
    if (resposta.error) throw erroDoBanco(resposta.error, `obterPrimeirosPassos.${contexto}`);
  }

  const alertasConfigurados = Boolean(
    configuracoes.data?.alertas_ativos && configuracoes.data.email_alerta?.trim(),
  );

  return [
    {
      id: "categorias",
      titulo: "Crie as categorias",
      descricao: "Ex.: Bebidas, Hortifrúti, Mercearia. Ajudam a achar e filtrar produtos.",
      href: "/produtos/categorias",
      rotuloAcao: "Criar categorias",
      feito: (categorias.count ?? 0) > 0,
    },
    {
      id: "produtos",
      titulo: "Cadastre os produtos",
      descricao: "Com preço, código de barras e a quantidade que você tem na prateleira.",
      href: "/produtos/novo",
      rotuloAcao: "Cadastrar produto",
      feito: (produtos.count ?? 0) > 0,
    },
    {
      id: "alertas",
      titulo: "Receba aviso de estoque baixo",
      descricao: "Informe o e-mail que recebe o alerta quando um produto chega ao mínimo.",
      href: "/configuracoes",
      rotuloAcao: "Configurar alertas",
      feito: alertasConfigurados,
    },
    {
      id: "venda",
      titulo: "Registre a primeira venda",
      descricao: "No caixa, leia o código de barras, escolha o pagamento e aperte F2.",
      href: "/caixa",
      rotuloAcao: "Abrir o caixa",
      feito: (vendas.count ?? 0) > 0,
    },
  ];
}
