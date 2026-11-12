import Link from "next/link";
import { CheckCircle2, Circle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { PassoInicial } from "@/lib/services/primeiros-passos";
import { cn } from "@/lib/utils";

/**
 * Checklist de primeiros passos. Some sozinho quando tudo está feito, para
 * não ocupar espaço de quem já usa o sistema todo dia.
 */
export function PrimeirosPassos({ passos }: { passos: PassoInicial[] }) {
  const feitos = passos.filter((p) => p.feito).length;
  if (feitos === passos.length) return null;

  // O botão de ação aparece só no próximo passo pendente; os demais ficam
  // como lista, para a tela não virar um muro de botões.
  const proximo = passos.find((p) => !p.feito);

  return (
    <Card aria-labelledby="titulo-primeiros-passos">
      <CardHeader>
        <CardTitle id="titulo-primeiros-passos">Primeiros passos</CardTitle>
        <CardDescription>
          {feitos} de {passos.length} concluídos. Estes passos deixam o sistema pronto para o dia a dia.
        </CardDescription>
        <div
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={passos.length}
          aria-valuenow={feitos}
          aria-label="Progresso dos primeiros passos"
          className="mt-2 h-2 overflow-hidden rounded-full bg-muted"
        >
          <div
            className="h-full rounded-full bg-broto transition-[width]"
            style={{ width: `${(feitos / passos.length) * 100}%` }}
          />
        </div>
      </CardHeader>
      <CardContent>
        <ol className="divide-y">
          {passos.map((passo) => (
            <li key={passo.id} className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0">
              {passo.feito ? (
                <CheckCircle2 className="size-5 shrink-0 text-broto" aria-label="Feito" />
              ) : (
                <Circle className="size-5 shrink-0 text-muted-foreground" aria-label="A fazer" />
              )}
              <div className="min-w-0 flex-1 basis-56">
                <p className={cn("font-medium", passo.feito && "text-muted-foreground line-through")}>
                  {passo.titulo}
                </p>
                {!passo.feito ? (
                  <p className="text-sm text-muted-foreground">{passo.descricao}</p>
                ) : null}
              </div>
              {passo.id === proximo?.id ? (
                <Button size="sm" asChild>
                  <Link href={passo.href}>{passo.rotuloAcao}</Link>
                </Button>
              ) : null}
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}
