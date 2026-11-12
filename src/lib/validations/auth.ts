import { z } from "zod";

export const esquemaLogin = z.object({
  email: z.email("Informe um e-mail válido.").trim().toLowerCase(),
  senha: z.string().min(1, "Informe a senha."),
});

export type DadosLogin = z.infer<typeof esquemaLogin>;

/** Mesmo mínimo do Supabase local (supabase/config.toml); 72 é o limite do bcrypt. */
export const SENHA_MINIMO = 8;

export const esquemaTrocaSenha = z
  .object({
    senha_atual: z.string().min(1, "Informe a senha atual."),
    nova_senha: z
      .string()
      .min(SENHA_MINIMO, `A nova senha precisa ter pelo menos ${SENHA_MINIMO} caracteres.`)
      .max(72, "A nova senha pode ter no máximo 72 caracteres."),
    confirmacao: z.string(),
  })
  .refine((d) => d.nova_senha === d.confirmacao, {
    path: ["confirmacao"],
    message: "A confirmação não é igual à nova senha.",
  })
  .refine((d) => d.nova_senha !== d.senha_atual, {
    path: ["nova_senha"],
    message: "A nova senha precisa ser diferente da atual.",
  });

export type DadosTrocaSenha = z.infer<typeof esquemaTrocaSenha>;
