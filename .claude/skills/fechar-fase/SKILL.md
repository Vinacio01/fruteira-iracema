---
name: fechar-fase
description: Use ao terminar qualquer fase, funcionalidade ou ajuste neste projeto, antes de dizer que está pronto. Roda todas as verificações, registra as decisões, faz o commit local em português e entrega o relatório no formato que o desenvolvedor espera, parando para aprovação.
---

# Fechar uma fase (Fruteira Iracema)

A "Regra de trabalho" do CLAUDE.md, virada checklist. Siga na ordem e não pule etapas:
o desenvolvedor não edita código à mão, então a verificação é responsabilidade sua.

## 1. Verificar (tudo precisa passar)

Pré-requisito: Supabase local rodando (ver a skill `ambiente-local`).

```bash
npm run lint
npm run typecheck
npm test
npm run test:e2e
```

- O e2e faz o build de produção e sobe o app na porta 3200; leva alguns minutos.
- Se algo falhar, investigue a causa (skill `superpowers:systematic-debugging`); não
  ajuste o teste só para passar.
- Se um teste falhar uma vez e passar ao repetir, **diga isso no relatório**: não esconda
  instabilidade.
- Mudou banco, autenticação, permissões ou algo com service role? Peça a revisão do
  agente `revisor-seguranca` antes do commit e trate o que ele apontar.
- Mudou tela? Abra no navegador (launch `next-dev`, porta 3000) e confira, inclusive no
  tema escuro e no celular quando fizer sentido.

## 2. Registrar

- Decisão de produto ou técnica nova → seção nova em `docs/decisoes.md`, explicando o
  **porquê** e o que foi descartado.
- Algo que muda como rodar, publicar ou configurar → `README.md`.
- Variável de ambiente nova → `.env.example` (sem valor real) e tabela do README.

## 3. Commitar (só local)

- Mensagem em português: título curto + lista do que mudou. Escreva num arquivo do
  scratchpad e use `git commit -F <arquivo>` (no Windows o PowerShell quebra `-m` com
  várias linhas).
- **Nunca** `git push`, deploy na Vercel ou comando contra o Supabase de produção. O
  `settings.json` bloqueia, mas a regra vale mesmo se não bloqueasse. Publicar é decisão
  do desenvolvedor.

## 4. Relatório (sempre nestes 4 itens)

1. **O que foi implementado**: em linguagem de produto, não de código.
2. **Arquivos criados ou alterados**: links clicáveis.
3. **Como testar no navegador**: passo a passo com URLs do localhost e logins de teste
   (`proprietario@mercadinho.test` e `funcionario@mercadinho.test`; senhas em
   `scripts/criar-usuarios-dev.mts`; e-mails locais no Mailpit, http://127.0.0.1:54324).
4. **Pendências**: o que ficou de fora, o que depende do desenvolvedor (painel do
   Supabase, Vercel) e o que não foi verificado.

Termine com "Aguardo sua aprovação" e **pare**. Não comece a próxima fase sozinho.
