import Link from "next/link";
import { LogOut, UserRound } from "lucide-react";

import { sair } from "@/app/login/actions";
import { AlternarTema } from "@/components/alternar-tema";
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";
import type { UsuarioAtual } from "@/lib/services/sessao";

const ROTULO_PAPEL = {
  proprietario: "Proprietário",
  funcionario: "Funcionário",
} as const;

type Props = {
  usuario: UsuarioAtual;
};

export function RodapeUsuario({ usuario }: Props) {
  return (
    <SidebarMenu>
      <AlternarTema />
      <SidebarMenuItem>
        {/* Nome e papel levam a "Minha conta" (trocar senha). */}
        <SidebarMenuButton asChild tooltip="Minha conta" className="h-auto py-1.5">
          <Link href="/conta">
            <UserRound />
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium">{usuario.nome}</span>
              <span className="block truncate text-xs text-sidebar-foreground/70">
                {ROTULO_PAPEL[usuario.papel]} · Minha conta
              </span>
            </span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <form action={sair}>
          <SidebarMenuButton type="submit" tooltip="Sair">
            <LogOut />
            <span>Sair</span>
          </SidebarMenuButton>
        </form>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
