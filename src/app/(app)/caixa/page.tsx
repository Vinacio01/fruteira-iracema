import type { Metadata } from "next";
import Link from "next/link";
import { PackageSearch } from "lucide-react";

import { CabecalhoPagina } from "@/components/cabecalho-pagina";
import { Button } from "@/components/ui/button";
import { listarProdutosParaCaixa } from "@/lib/services/produtos";
import { exigirUsuario } from "@/lib/services/sessao";

import { Caixa } from "./caixa";
import { TourCaixa } from "./tour-caixa";

export const metadata: Metadata = { title: "Caixa" };

export default async function PaginaCaixa() {
  const usuario = await exigirUsuario();
  const produtos = await listarProdutosParaCaixa();

  if (produtos.length === 0) {
    const ehProprietario = usuario.papel === "proprietario";
    return (
      <>
        <CabecalhoPagina titulo="Caixa" descricao="O pagamento continua na maquininha." />
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-16 text-center">
          <PackageSearch className="size-10 text-muted-foreground" />
          <p className="font-medium">Não há produtos para vender</p>
          <p className="max-w-sm text-sm text-muted-foreground">
            {ehProprietario
              ? "Cadastre os produtos (com preço e quantidade em estoque) para começar a vender."
              : "O proprietário ainda não cadastrou produtos. Fale com ele."}
          </p>
          {ehProprietario ? (
            <Button asChild>
              <Link href="/produtos/novo">Cadastrar produto</Link>
            </Button>
          ) : null}
        </div>
      </>
    );
  }

  return (
    <>
      <CabecalhoPagina
        titulo="Caixa"
        descricao="Enter adiciona o produto · F2 finaliza · Esc cancela. O pagamento continua na maquininha."
        acoes={<TourCaixa usuarioId={usuario.id} />}
      />
      <Caixa produtos={produtos} />
    </>
  );
}
