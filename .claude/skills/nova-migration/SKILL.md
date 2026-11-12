---
name: nova-migration
description: Use sempre que precisar mudar o banco (tabela, coluna, índice, enum, função, view, política RLS ou permissão). Passo a passo seguro para criar uma migration nova, testar no Supabase local e manter os tipos em dia, sem nunca tocar a produção.
---

# Mudar o banco com segurança

## Regras que não mudam

- **Nunca edite uma migration já commitada.** Ela já rodou na produção; editar não muda
  o banco de lá e deixa o repositório mentindo. Um hook bloqueia isso. Toda mudança é
  uma migration **nova**.
- **Nunca** `supabase db push`, `supabase link`, `--linked` ou `--remote`: aplicar na
  produção é decisão do desenvolvedor. O README explica como ele faz.
- Nomes em português, sem acentos (CLAUDE.md).

## Passo a passo

1. Criar o arquivo:
   ```bash
   npx supabase migration new descricao_curta
   ```
2. Escrever o SQL. Conferir, para cada objeto novo:
   - **Tabela**: `enable row level security`; políticas para proprietário e funcionário
     conforme a tabela de papéis do CLAUDE.md; usuário com `perfis.ativo = false` não
     acessa nada; anônimo não acessa nada.
   - **Permissões**: o projeto retira as permissões padrão e libera tabela por tabela
     (veja as migrations existentes). Coluna que não pode mudar por update direto
     (como `produtos.quantidade`) → `revoke update (...)`.
   - **Custo**: nada que exponha `preco_custo`/`custo_*` ao funcionário (use a view
     `produtos_catalogo` como modelo).
   - **Função `security definer`**: `set search_path = ''` (ou fixo), valida o papel
     logo no início, `revoke execute ... from public` e `grant` só para quem usa.
   - **Dinheiro** sempre `numeric`; datas pensando em `America/Sao_Paulo`.
3. Aplicar do zero no banco local (apaga os dados locais, recria tudo):
   ```bash
   npx supabase db reset
   npm run usuarios:dev
   ```
4. Regenerar os tipos e conferir o diff:
   ```bash
   npm run db:tipos
   ```
5. Escrever ou ajustar testes em `tests/` (os de banco rodam contra o Supabase local):
   permissão negada para quem não pode, caminho feliz para quem pode.
6. Pedir revisão ao agente `revisor-seguranca`.
7. Fechar com a skill `fechar-fase`. No relatório, diga ao desenvolvedor que a
   migration precisa ser aplicada na produção **por ele** (`npx supabase db push`), e
   em que ordem em relação ao deploy do código.
