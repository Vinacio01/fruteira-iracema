import { z } from "zod";

/** Tira espaços (comuns ao colar) e põe em minúsculas ANTES de validar o formato. */
const emailNormalizado = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.email("Informe um e-mail válido."));

export const esquemaLogin = z.object({
  email: emailNormalizado,
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

/** "Esqueci minha senha": só o e-mail. */
export const esquemaEsqueciSenha = z.object({
  email: emailNormalizado,
});

/** Senha nova depois do link do e-mail: não há senha atual para conferir. */
export const esquemaRedefinirSenha = z
  .object({
    nova_senha: z
      .string()
      .min(SENHA_MINIMO, `A nova senha precisa ter pelo menos ${SENHA_MINIMO} caracteres.`)
      .max(72, "A nova senha pode ter no máximo 72 caracteres."),
    confirmacao: z.string(),
  })
  .refine((d) => d.nova_senha === d.confirmacao, {
    path: ["confirmacao"],
    message: "A confirmação não é igual à nova senha.",
  });

export type DadosRedefinirSenha = z.infer<typeof esquemaRedefinirSenha>;
