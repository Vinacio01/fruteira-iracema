import { expect, test } from "@playwright/test";

import { clienteAnonimo } from "../tests/helpers/supabase";
import { Cenario, entrar } from "./apoio";

let cenario: Cenario;

test.beforeEach(() => {
  cenario = new Cenario();
});

test.afterEach(async () => {
  await cenario.limpar();
});

/** Tenta entrar direto no Auth: diz se a senha vale. */
async function senhaVale(email: string, senha: string) {
  const { error } = await clienteAnonimo().auth.signInWithPassword({ email, password: senha });
  return error === null;
}

test("funcionário troca a própria senha e a antiga deixa de valer", async ({ page }) => {
  const caixa = await cenario.usuario("funcionario");
  const nova = "senha-nova-do-caixa-2026";

  await entrar(page, caixa.email, caixa.senha);
  await page.getByRole("link", { name: /Minha conta/ }).click();
  await expect(page).toHaveURL(/\/conta/);

  // Senha atual errada: nada muda.
  await page.getByLabel("Senha atual").fill("nao-e-a-senha");
  await page.getByLabel("Nova senha", { exact: true }).fill(nova);
  await page.getByLabel("Repita a nova senha").fill(nova);
  await page.getByRole("button", { name: "Trocar senha" }).click();
  await expect(page.getByText("A senha atual está incorreta.")).toBeVisible();

  // Confirmação diferente: erro no campo.
  await page.getByLabel("Senha atual").fill(caixa.senha);
  await page.getByLabel("Repita a nova senha").fill(`${nova}-x`);
  await page.getByRole("button", { name: "Trocar senha" }).click();
  await expect(page.getByText("A confirmação não é igual à nova senha.")).toBeVisible();

  // Tudo certo.
  await page.getByLabel("Repita a nova senha").fill(nova);
  await page.getByRole("button", { name: "Trocar senha" }).click();
  await expect(page.getByText("Senha trocada. Use a nova senha no próximo login.")).toBeVisible();

  expect(await senhaVale(caixa.email, nova)).toBe(true);
  expect(await senhaVale(caixa.email, caixa.senha)).toBe(false);
});

test("conta da demonstração pública não troca a senha", async ({ page }) => {
  const demo = await cenario.usuario("proprietario", { dominio: "demo-iracema.test" });

  await entrar(page, demo.email, demo.senha);
  await page.goto("/conta");
  await expect(page.getByText("a senha dela não pode ser trocada")).toBeVisible();
  await expect(page.getByRole("button", { name: "Trocar senha" })).toBeDisabled();
  expect(await senhaVale(demo.email, demo.senha)).toBe(true);
});
