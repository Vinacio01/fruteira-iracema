# Estoque Mercadinho — especificação para o Claude Code

## Contexto do produto

Um mercadinho de bairro em Caxias do Sul não tem controle de estoque. O dono só descobre que um produto acabou quando o cliente pede, e não sabe se o mês está melhor ou pior que o anterior.

Este sistema resolve três coisas:
1. **Registrar as vendas no caixa**, dando baixa automática no estoque.
2. **Avisar o proprietário por e-mail** quando um produto chega ao estoque mínimo (padrão: 10 unidades).
3. **Mostrar um painel financeiro**: faturamento, lucro bruto estimado e comparação com o mês anterior.

O pagamento continua na maquininha de cartão que o mercado já usa. O sistema **não** processa pagamento; ele registra a venda e a forma de pagamento depois que o operador confirma.

## Arquitetura: estabelecimento único

O sistema atende **um único mercadinho**.
- Não implementar multi-tenant, SaaS ou suporte a vários estabelecimentos.
- Não criar tabela de estabelecimentos nem colunas `establishment_id`.
- Um banco, um estoque, um histórico de vendas, um painel e uma configuração de notificações.
- Priorizar simplicidade, segurança, organização e facilidade de manutenção.

## Papéis de usuário

| Ação | Proprietário | Funcionário |
|---|---|---|
| Registrar vendas no caixa | sim | sim |
| Consultar produtos e estoque | sim | sim |
| Cadastrar, editar e desativar produtos | sim | não |
| Entrada, saída manual e ajuste de estoque | sim | não |
| Ver painel financeiro (faturamento, custo, lucro) | sim | não |
| Configurar notificações | sim | não |
| Cancelar venda | sim | não |

- Não há cadastro público. Usuários são criados no painel do Supabase, e o papel é definido na tabela `perfis`.
- O funcionário vê os preços de venda, mas **não** vê preço de custo nem dados financeiros.
- As permissões são garantidas **no banco (RLS e funções)**, não só escondendo botões na interface.

## Regra de trabalho deste projeto

Todo o código deste repositório é escrito pelo Claude Code. O desenvolvedor define o que construir, revisa o resultado e pede ajustes por conversa, sem editar código à mão. Ele também está usando o projeto para aprender. Por isso:
- Antes de cada fase, explique a abordagem em poucas linhas, incluindo as decisões técnicas importantes e o porquê.
- Ao final de cada fase, informe:
  1. o que foi implementado;
  2. os arquivos criados ou alterados;
  3. como testar no navegador;
  4. as pendências.
- Rode os testes da fase, faça um commit com mensagem clara em português e **aguarde aprovação** antes de seguir.
- Se uma decisão de produto não estiver nesta especificação, pergunte antes de inventar.
- Não deixe botões sem função nem telas desconectadas do banco.
- Não instale dependências fora da stack sem justificar.
- Não desative mecanismos de segurança para facilitar o desenvolvimento.

## Princípios de código

- **Mudanças cirúrgicas:** altere só o que o pedido exige. Não refatore, reformate nem "melhore" código vizinho; se notar algo, avise em vez de mexer.
- **Sem excesso:** não adicione funcionalidade, abstração ou configuração que não foi pedida. Se houver solução mais simples, use-a.
- **Dúvida:** se o pedido tiver mais de uma interpretação, diga qual entendeu e pergunte antes de implementar.
- **Verificável:** toda correção começa por um teste que reproduz o problema; só diga que está pronto depois de rodar e mostrar o resultado.

## Estado atual: em produção

- As fases 0 a 8 terminaram. O app está **no ar** (Vercel + Supabase) e é usado como demonstração de portfólio. O que vier agora são melhorias sobre o que existe.
- **Todo trabalho novo é local**: Supabase local (Docker) e commits locais. **Nunca** faça push, deploy ou comando contra o Supabase de produção; publicar é decisão do desenvolvedor, que faz isso ele mesmo. O `.claude/settings.json` bloqueia esses comandos.
- **Migrations já commitadas não se editam** (já rodaram na produção): toda mudança de banco é uma migration nova. Um hook bloqueia a edição.
- Recursos do Claude neste repositório (`.claude/`):
  - skill `fechar-fase`: checklist de verificação, registro, commit e relatório ao fim de cada fase;
  - skill `nova-migration`: como mudar o banco com segurança;
  - skill `ambiente-local`: como subir Docker, Supabase local, usuários de teste e Mailpit no Windows;
  - agente `revisor-seguranca`: revisão das regras de segurança antes de commitar mudanças em banco, autenticação ou permissões.
- Decisões tomadas depois da especificação ficam em `docs/decisoes.md`; leia antes de mudar algo que já existe.

## Stack

A stack está no `package.json` (Next.js + Supabase + Tailwind/shadcn + Zod + Resend + Vitest, na Vercel). Gerenciador de pacotes: npm. Siga a documentação oficial do Supabase para Next.js.

## Organização do código

- Regras de negócio ficam em `lib/services` ou em funções do Postgres, **nunca duplicadas** em componentes.
- Evite componentes gigantes; quebre em partes com uma responsabilidade cada.

## Variáveis de ambiente

A lista fica no `.env.example` (sem valores reais).

- `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY` e `CRON_SECRET` só no servidor. Nunca em componente de cliente nem com prefixo `NEXT_PUBLIC_`.
- Use a service role só onde for indispensável (ex.: processar a fila de alertas no cron).
- `.env*.local` no `.gitignore`.
- O e-mail **de destino** dos alertas fica no banco (tabela `configuracoes`), editável pelo proprietário.

## Modelo de dados

Migrations SQL em `supabase/migrations`. Nomes de tabelas e colunas em português, sem acentos.

O esquema completo (tabelas, colunas, enums, índices) está nas migrations e em `src/types/database.ts`. Decisões que o código não explica sozinho:

- **Toda alteração de estoque passa por `movimentacoes_estoque`.** A `quantidade` é sempre positiva e o `tipo` indica o sentido, exceto `ajuste`, que registra o novo total. `motivo` é obrigatório em saída manual e ajuste.
- **`vendas.chave_idempotencia`** (única, gerada no navegador ao iniciar a venda) impede venda duplicada por duplo clique ou reenvio.
- **`itens_venda.preco_unitario` e `custo_unitario` são cópia** dos valores do produto no momento da venda.
- **`alertas_estoque`**: no máximo **um alerta aberto** (`resolvido_em is null`) por produto; `resolvido_em` é preenchido quando o estoque é reposto acima do mínimo.
- **`configuracoes`** tem uma linha só (id fixo, com check).

## Segurança

- RLS ativado em **todas** as tabelas. Anônimos não acessam nada.
- Função auxiliar `eh_proprietario()` (security definer, `search_path` fixo) usada nas políticas.
- Políticas conforme a tabela de papéis acima. Usuário com `perfis.ativo = false` não acessa nada.
- **A coluna `quantidade` de `produtos` não pode ser alterada por update direto.** Revogue o privilégio de update nela para `authenticated`. O estoque só muda pelas funções do banco, que sempre registram a movimentação.
- O preço de custo não pode chegar ao funcionário. Exponha ao funcionário uma view ou função sem colunas de custo.
- Funções `security definer` validam o papel do usuário logo no início e usam `search_path` fixo.
- Valide toda entrada com Zod no servidor, mesmo que já validada no formulário.
- Erros mostrados ao usuário são mensagens amigáveis; detalhes técnicos vão só para o log do servidor.
- A rota do cron exige o cabeçalho `Authorization: Bearer ${CRON_SECRET}`.

## Regras de negócio

### Registrar venda
Função Postgres `registrar_venda(chave_idempotencia uuid, forma_pagamento, itens jsonb)`, chamada por RPC, numa **única transação**:
1. Se já existir venda com essa chave, retorna a venda existente sem processar de novo.
2. Trava as linhas dos produtos (`select ... for update`, em ordem de id para evitar deadlock).
3. Verifica estoque suficiente e produto ativo. Se algum item falhar, cancela a venda inteira e retorna erro com o nome do produto.
4. Usa preço de venda e custo **do banco**, nunca valores enviados pelo navegador.
5. Cria a venda e os itens, baixa as quantidades e registra uma movimentação 'venda' por item.
6. Para cada produto que ficou com `quantidade <= estoque_minimo` e não tem alerta aberto, cria um alerta 'pendente'.
7. Retorna a venda e os ids dos alertas criados.

### Movimentações manuais (só proprietário)
Funções `registrar_entrada`, `registrar_saida_manual` e `registrar_ajuste`, todas transacionais e registrando a movimentação. Saída manual e ajuste exigem motivo. Saída nunca deixa o estoque negativo.

Quando uma entrada ou ajuste deixa a quantidade **acima** do mínimo, o alerta aberto do produto recebe `resolvido_em = now()`. Assim um novo ciclo de alerta pode acontecer.

### Cancelar venda (só proprietário)
Função `cancelar_venda(venda_id, motivo)`: marca a venda como 'cancelada', devolve as quantidades ao estoque e registra movimentações 'cancelamento_venda'. Uma venda cancelada não pode ser cancelada de novo.

### Alertas por e-mail
- Depois de uma venda concluída, a Server Action dispara o envio dos alertas pendentes **sem bloquear a resposta da venda**. Se o e-mail falhar, a venda continua válida.
- O envio usa o Resend, com um e-mail por alerta, assunto "Alerta de estoque baixo: {produto}" e este corpo:

  ```
  ALERTA DE ESTOQUE BAIXO

  Produto: {nome}
  Estoque atual: {quantidade} {unidade}
  Estoque mínimo: {estoque_minimo} {unidade}

  Recomendamos realizar a reposição deste produto.
  ```
- Sucesso: `status = 'enviado'`, `enviado_em = now()`. Falha: `status = 'falhou'`, incrementa `tentativas` e grava `ultimo_erro`.
- **Reenvio**: uma rota `/api/cron/alertas` (Vercel Cron) reprocessa alertas 'pendente' ou 'falhou' com menos de 5 tentativas. Consulte os limites de frequência do Cron no plano da Vercel e documente-os no README. Na tela de configurações, o proprietário também tem um botão "Reenviar alertas pendentes".
- Se `alertas_ativos = false` ou `email_alerta` estiver vazio, os alertas ficam registrados como 'pendente' e a tela de configurações avisa por que nada foi enviado.
- Se `RESEND_API_KEY` não estiver configurada, **não simule envio**: registre a falha com uma mensagem clara e mostre o aviso na tela de configurações.

### Datas, fuso e moeda
- Todo cálculo de dia e mês usa o fuso `America/Sao_Paulo`. Uma venda às 22h do dia 31 pertence ao dia 31.
- Valores em `R$ 1.234,56` e datas em `dd/mm/aaaa`, via `Intl` com locale `pt-BR`.
- Dinheiro é sempre `numeric` no banco. No TypeScript, não faça contas de dinheiro com ponto flutuante: some no banco ou trabalhe em centavos.

## Telas

Interface em português do Brasil: moderna, limpa, com sidebar, cards e boa hierarquia. Sem gradientes nem enfeites. Deve funcionar em desktop, tablet e celular, mas o caixa é pensado para desktop. Inclua estados de carregamento, mensagens de sucesso e erro (toasts) e confirmação antes de ações destrutivas.

Os detalhes de cada tela ficam num `CLAUDE.md` dentro da pasta da rota (`src/app/login/`, `src/app/(app)/caixa/`, `produtos/`, `estoque/`, `vendas/`, `painel/`, `configuracoes/`) e carregam quando você trabalha nela. **Vendas canceladas não entram em nenhum indicador**, e faturamento nunca é chamado de lucro.

## Dados de demonstração

- `supabase/seed-demo.sql` cria categorias, cerca de 30 produtos realistas de mercadinho (arroz, feijão, leite, café, refrigerante, pão etc., alguns perto do mínimo) e vendas dos últimos 90 dias com variação entre os meses.
- Esses dados existem só para a demonstração e o desenvolvimento. O script nunca roda automaticamente; o README explica como rodar e como limpar os dados antes do uso real.

## Ordem de construção

Uma fase por vez. Ao final de cada uma, siga a "Regra de trabalho" e espere aprovação.

0. **Planejamento (sem código)**: analise o ambiente e apresente a estrutura de pastas, o modelo de dados com relacionamentos, a estratégia de RLS e de alertas, os riscos e as decisões que precisam de aprovação.
1. **Base**: Next.js, TypeScript, Tailwind, shadcn/ui, clientes do Supabase, `.env.example` e layout com sidebar.
2. **Banco e autenticação**: migrations, enums, RLS, papéis, login, middleware e redirecionamento por papel.
3. **Produtos e estoque**: categorias, CRUD de produtos, entradas, saídas, ajustes e histórico.
4. **Caixa**: tela de venda e `registrar_venda`.
5. **Alertas**: envio pelo Resend, tela de configurações, reenvio e cron.
6. **Painel**: indicadores, comparativo, bloco financeiro e gráficos, mais o seed de demonstração.
7. **Deploy**: publicação na Vercel, variáveis de produção e README completo. **A demo precisa estar no ar ao fim desta fase.**
8. **Vendas**: histórico e cancelamento com estorno.

## Testes

Vitest, rodando contra o Supabase local (`supabase start`) quando o teste envolver o banco:
- `registrar_venda`: venda normal, estoque insuficiente (nada é gravado), chave de idempotência repetida (não duplica), preço vindo do banco
- Toda alteração de estoque gera movimentação; update direto em `quantidade` é negado
- Alertas: cria ao cruzar o mínimo, não duplica com alerta aberto, novo ciclo após reposição
- Cancelamento devolve o estoque e sai dos indicadores
- Permissões: funcionário não lê custo, não altera produto e não cancela venda; anônimo não lê nada
- Cálculos: comparação de períodos equivalentes e virada de mês no fuso de São Paulo

## Critérios de pronto da demo

- [ ] Projeto no ar na Vercel, com login funcionando para proprietário e funcionário
- [ ] Venda no caixa baixa o estoque e registra movimentação
- [ ] Produto chegando ao mínimo gera exatamente um e-mail
- [ ] Painel mostra faturamento, lucro bruto estimado e comparação com o mês anterior
- [ ] Repositório público no GitHub, com README explicando o problema, a solução e como rodar
- [ ] Nenhuma chave secreta no repositório
