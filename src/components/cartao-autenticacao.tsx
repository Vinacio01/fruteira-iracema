import { SeloIracema } from "@/components/selo-iracema";

type Props = {
  titulo: string;
  descricao: string;
  children: React.ReactNode;
};

/** Moldura das telas fora do sistema (entrar, esqueci a senha, senha nova). */
export function CartaoAutenticacao({ titulo, descricao, children }: Props) {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-8 bg-folha p-4">
      <SeloIracema tamanho="grande" />
      <div className="w-full max-w-sm rounded-xl bg-card p-6 shadow-lg">
        <h1 className="font-display text-4xl leading-none font-extrabold text-titulo">{titulo}</h1>
        <p className="mt-1 mb-5 text-sm text-muted-foreground">{descricao}</p>
        {children}
      </div>
    </main>
  );
}
