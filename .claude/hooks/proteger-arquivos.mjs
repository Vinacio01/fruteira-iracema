#!/usr/bin/env node
/**
 * Hook PreToolUse (Edit/Write/MultiEdit/NotebookEdit): impede o Claude de
 * mexer em arquivos que não podem mudar.
 *
 * 1. Migrations já commitadas (supabase/migrations/*.sql que existem no HEAD):
 *    elas já foram aplicadas no banco de produção. Editar uma não muda a
 *    produção e deixa o repositório mentindo sobre o banco. O certo é criar
 *    uma migration NOVA. Migrations ainda não commitadas podem ser editadas.
 * 2. Arquivos .env (exceto .env.example): guardam chaves secretas.
 *
 * Bloqueia com exit code 2; a mensagem no stderr volta para o Claude.
 */
import { execFileSync } from "node:child_process";
import path from "node:path";

let entrada = "";
process.stdin.setEncoding("utf8");
for await (const pedaco of process.stdin) entrada += pedaco;

let caminho;
try {
  const dados = JSON.parse(entrada);
  caminho = dados?.tool_input?.file_path ?? dados?.tool_input?.notebook_path;
} catch {
  process.exit(0); // entrada inesperada: não atrapalha
}
if (!caminho) process.exit(0);

const raiz = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
const relativo = path.relative(raiz, path.resolve(raiz, caminho)).split(path.sep).join("/");
const nome = path.basename(relativo);

function bloquear(motivo) {
  process.stderr.write(`${motivo}\n`);
  process.exit(2);
}

if (/^\.env/.test(nome) && nome !== ".env.example") {
  bloquear(
    `Bloqueado: ${relativo} guarda chaves secretas e não deve ser editado pelo Claude. ` +
      "Peça ao desenvolvedor para alterar à mão; documente novas variáveis em .env.example.",
  );
}

if (/^supabase\/migrations\/[^/]+\.sql$/.test(relativo)) {
  // Na dúvida, bloqueia: se o git falhar, tratamos a migration como commitada.
  let commitada = true;
  try {
    const saida = execFileSync("git", ["ls-tree", "--name-only", "HEAD", "--", relativo], {
      cwd: path.resolve(raiz),
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    commitada = saida.trim() !== "";
  } catch {
    commitada = true;
  }
  if (commitada) {
    bloquear(
      `Bloqueado: ${relativo} já está commitada e aplicada no banco de produção. ` +
        "Não edite migrations antigas: crie uma nova (npx supabase migration new <nome>) " +
        "com a alteração. Veja a skill nova-migration.",
    );
  }
}

process.exit(0);
