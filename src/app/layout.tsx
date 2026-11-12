import type { Metadata } from "next";
import { Big_Shoulders, Figtree, Zilla_Slab } from "next/font/google";

import { ProvedorTema } from "@/components/provedor-tema";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

import "./globals.css";

// Direção visual "Etiqueta de feira" (ver docs/decisoes.md).

// Interface, formulários e tabelas: sans aberta e legível.
const figtree = Figtree({
  variable: "--font-sans",
  subsets: ["latin"],
});

// Títulos, preços e números grandes: condensada como letreiro e plaquinha de preço.
const bigShoulders = Big_Shoulders({
  variable: "--font-display",
  subsets: ["latin"],
  // O Next não tem as métricas desta fonte para gerar um substituto ajustado;
  // enquanto ela carrega, usa uma condensada do sistema (parecida em largura).
  adjustFontFallback: false,
  fallback: ["Impact", "Arial Narrow", "sans-serif"],
});

// Só o selo da loja: serifa pesada, como o "IRACEMA" da placa.
const zillaSlab = Zilla_Slab({
  variable: "--font-marca",
  subsets: ["latin"],
  weight: ["600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Fruteira Iracema",
    template: "%s | Iracema",
  },
  description: "Caixa, estoque e painel da Mini Mercado e Fruteira Iracema.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning: o next-themes põe a classe "dark" no <html> antes do React.
    <html
      lang="pt-BR"
      className={`${figtree.variable} ${bigShoulders.variable} ${zillaSlab.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full">
        <ProvedorTema>
          <TooltipProvider>{children}</TooltipProvider>
          <Toaster richColors position="top-right" />
        </ProvedorTema>
      </body>
    </html>
  );
}
