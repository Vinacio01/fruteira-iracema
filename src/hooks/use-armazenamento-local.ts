"use client";

import { useCallback, useSyncExternalStore } from "react";

const EVENTO = "iracema:armazenamento";

/**
 * Cópia em memória: se o navegador bloquear o `localStorage` (janela privada,
 * dados do site bloqueados), a escolha ainda vale até recarregar a página.
 */
const memoria = new Map<string, string>();

function ler(chave: string): string | null {
  try {
    return window.localStorage.getItem(chave) ?? memoria.get(chave) ?? null;
  } catch {
    return memoria.get(chave) ?? null;
  }
}

function assinar(aviso: () => void) {
  window.addEventListener("storage", aviso);
  window.addEventListener(EVENTO, aviso);
  return () => {
    window.removeEventListener("storage", aviso);
    window.removeEventListener(EVENTO, aviso);
  };
}

/**
 * Lê e grava um valor de texto no navegador (para lembrar, por exemplo, que o
 * tour já foi visto).
 *
 * O valor é `undefined` no servidor e na primeira pintura, `null` quando nada
 * foi gravado e o texto gravado depois disso. Quem usa deve tratar `undefined`
 * como "ainda não sei", para não piscar o tour nem o assistente.
 */
export function useArmazenamentoLocal(chave: string) {
  const valor = useSyncExternalStore<string | null | undefined>(
    assinar,
    () => ler(chave),
    () => undefined,
  );

  const gravar = useCallback(
    (novo: string) => {
      memoria.set(chave, novo);
      try {
        window.localStorage.setItem(chave, novo);
      } catch {
        // Sem localStorage: a cópia em memória acima já guarda a escolha.
      }
      window.dispatchEvent(new Event(EVENTO));
    },
    [chave],
  );

  return [valor, gravar] as const;
}
