---
name: ambiente-local
description: Use antes de rodar testes, abrir o app no localhost ou testar e-mails neste projeto, ou quando algo do ambiente local falhar (Docker, Supabase local, login, porta ocupada). Explica como subir tudo no Windows desta máquina e os problemas já conhecidos.
---

# Ambiente local (Windows)

## Ligar tudo

1. **Docker Desktop** precisa estar aberto (o Supabase local roda em containers).
2. Terminal: no Bash do Claude o Node fica em `/c/Program Files/nodejs`; se `npm`
   não for encontrado:
   ```bash
   export PATH="$PATH:/c/Program Files/nodejs:/c/Program Files/Docker/Docker/resources/bin"
   ```
   No PowerShell, recarregue o PATH da máquina e do usuário antes do comando.
3. Supabase local:
   ```bash
   npx supabase start
   ```
   Se falhar com `HealthCheckTimeoutError` (pg_meta/studio lentos), rode de novo: na
   segunda vez costuma subir.
4. App: launch `next-dev` (porta 3000) pelo painel de preview; o e2e usa a 3200.

## Endereços

| O quê | Onde |
|---|---|
| App (dev) | http://localhost:3000 |
| API do Supabase | http://127.0.0.1:54321 |
| Banco (Postgres) | 127.0.0.1:54322 |
| Studio (ver tabelas) | http://127.0.0.1:54323 |
| **Mailpit** (e-mails do Auth, ex.: recuperar senha) | http://127.0.0.1:54324 |

## Usuários de teste

- `proprietario@mercadinho.test` e `funcionario@mercadinho.test`, senhas em
  `scripts/criar-usuarios-dev.mts`.
- Esqueceu ou trocou a senha local? `npm run usuarios:dev` recria e redefine. Editar o
  script não muda o banco: ele é só a receita, é preciso rodar.
- Dados de demonstração locais: `npm run db:demo`; limpar: `npm run db:limpar`.

## Problemas conhecidos

- **"Usuário desativado" logo depois de `supabase db reset`**: o cookie de sessão é de
  um usuário que não existe mais. Saia e entre de novo.
- **Alertas de estoque com status "falhou" localmente**: esperado, `RESEND_API_KEY` fica
  vazia no `.env.local`. O sistema registra a falha em vez de fingir que enviou.
- **`.env.local`**: tem as chaves locais e é protegido (o Claude não lê nem edita). Os
  testes carregam ele sozinhos.
- O banco local e o de produção são **separados**: nada feito aqui aparece no site no ar.
