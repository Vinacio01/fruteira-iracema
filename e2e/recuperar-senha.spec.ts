import { randomUUID } from "node:crypto";

import { expect, test, type Page } from "@playwright/test";

import { clienteAnonimo } from "../tests/helpers/supabase";
import { Cenario, entrar } from "./apoio";

/**
 * "Esqueci minha senha" de ponta a ponta. O Supabase local manda os e-mails
 * para o Mailpit (http://127.0.0.1:54324), que aqui faz o papel da caixa de
 * entrada do usuário.
 */
const MAILPIT = "http://127.0.0.1:54324/api/v1";

let cenario: Cenario;

test.beforeEach(() => {
  cenario = new Cenario();
});

test.afterEach(async () => {
  await cenario.limpar();
});

type Mensagem = { ID: string };

async function mensagensPara(email: string): Promise<Mensagem[]> {
  const resposta = await fetch(`${MAILPIT}/search?query=${encodeURIComponent(`to:${email}`)}`);
  const corpo = (await resposta.json()) as { messages: Mensagem[] };
  return corpo.messages;
}

/** Espera o e-mail chegar na caixa de entrada falsa e devolve o link do botão. */
async function linkDoEmail(email: string, baseURL: string): Promise<string> {
  let mensagens: Mensagem[] = [];
  await expect
    .poll(async () => (mensagens = await mensagensPara(email)).length, { timeout: 20_000 })
    .toBeGreaterThan(0);

  const resposta = await fetch(`${MAILPIT}/message/${mensagens[0].ID}`);
  const { HTML } = (await resposta.json()) as { HTML: string };
  const href = /href="([^"]*\/auth\/confirmar[^"]*)"/.exec(HTML)?.[1];
  if (!href) throw new Error("O e-mail não tem o link de recuperação.");

  // O link usa o endereço do Supabase (Site URL = localhost:3000); aqui o app roda em outra porta.
  const url = new URL(href.replaceAll("&amp;", "&"));
  return new URL(`${url.pathname}${url.search}`, baseURL).toString();
}

async function pedirLink(page: Page, email: string) {
  await page.goto("/login");
  await page.getByRole("link", { name: "Esqueci minha senha" }).click();
  await expect(page).toHaveURL(/\/esqueci-senha/);
  await page.getByLabel("E-mail de acesso").fill(email);
  await page.getByRole("button", { name: "Enviar link por e-mail" }).click();
  await expect(page.getByRole("status")).toContainText("Se esse e-mail tem cadastro");
}

async function senhaVale(email: string, senha: string) {
  const { error } = await clienteAnonimo().auth.signInWithPassword({ email, password: senha });
  return error === null;
}

test("quem esqueceu a senha recebe o link, cria outra e o link não vale duas vezes", async ({
  page,
  baseURL,
}) => {
  const dono = await cenario.usuario("proprietario");
  const nova = "senha-nova-recuperada-2026";

  await pedirLink(page, dono.email);
  const link = await linkDoEmail(dono.email, baseURL!);

  await page.goto(link);
  await expect(page).toHaveURL(/\/redefinir-senha/);
  await expect(page.getByRole("heading", { name: "Nova senha" })).toBeVisible();

  // Confirmação diferente: erro no campo, nada muda.
  await page.getByLabel("Nova senha", { exact: true }).fill(nova);
  await page.getByLabel("Repita a nova senha").fill(`${nova}-x`);
  await page.getByRole("button", { name: "Salvar nova senha" }).click();
  await expect(page.getByText("A confirmação não é igual à nova senha.")).toBeVisible();
  expect(await senhaVale(dono.email, dono.senha)).toBe(true);

  await page.getByLabel("Repita a nova senha").fill(nova);
  await page.getByRole("button", { name: "Salvar nova senha" }).click();
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByText("Senha redefinida. Entre com a nova senha.")).toBeVisible();

  expect(await senhaVale(dono.email, nova)).toBe(true);
  expect(await senhaVale(dono.email, dono.senha)).toBe(false);

  // A sessão da recuperação foi encerrada: o app pede login de novo.
  await page.goto("/painel");
  await expect(page).toHaveURL(/\/login/);
  await entrar(page, dono.email, nova);

  // O mesmo link, usado outra vez, não vale mais.
  await page.context().clearCookies();
  await page.goto(link);
  await expect(page).toHaveURL(/\/esqueci-senha/);
  await expect(page.getByText("Esse link não vale mais")).toBeVisible();
});

test("e-mail sem cadastro recebe a mesma resposta e nenhum e-mail sai", async ({ page }) => {
  const desconhecido = `ninguem-${randomUUID().slice(0, 8)}@mercadinho.test`;

  await pedirLink(page, desconhecido);

  await page.waitForTimeout(2_000);
  expect(await mensagensPara(desconhecido)).toHaveLength(0);
});

test("conta da demonstração pública não recebe e-mail de recuperação", async ({ page }) => {
  const demo = await cenario.usuario("proprietario", { dominio: "demo-iracema.test" });

  await pedirLink(page, demo.email);

  await page.waitForTimeout(2_000);
  expect(await mensagensPara(demo.email)).toHaveLength(0);
  expect(await senhaVale(demo.email, demo.senha)).toBe(true);
});

test("quem já está logado não troca a senha sem o link: a tela de senha nova recusa", async ({
  page,
}) => {
  const dono = await cenario.usuario("proprietario");

  await entrar(page, dono.email, dono.senha);
  await page.goto("/redefinir-senha");

  await expect(page.getByRole("heading", { name: "Link inválido" })).toBeVisible();
  await expect(page.getByLabel("Nova senha")).toHaveCount(0);
});

test("link adulterado volta para o pedido com um aviso", async ({ page }) => {
  await page.goto("/auth/confirmar?token_hash=invalido&type=recovery");
  await expect(page).toHaveURL(/\/esqueci-senha/);
  await expect(page.getByText("Esse link não vale mais")).toBeVisible();
});
