# Tela `/painel` (proprietário)

Período padrão "Este mês", com seletor: Hoje, Últimos 7 dias, Últimos 30 dias, Este mês e Mês anterior.

Cards:
1. Faturamento do dia
2. Faturamento do período
3. Variação contra o período anterior equivalente, em % (verde se subiu, vermelho se caiu). Em "Este mês", compare com o mês anterior **até o mesmo dia** (ex.: 1 a 3 de novembro contra 1 a 3 de outubro)
4. Quantidade de vendas
5. Ticket médio (faturamento ÷ vendas válidas)
6. Produtos com estoque baixo, com link para a lista

Bloco financeiro com **faturamento**, **custo das mercadorias vendidas** e **lucro bruto estimado**, rotulados assim. Nunca chame faturamento de lucro.

Gráficos (Recharts):
- Faturamento por dia no período
- Faturamento dos últimos 6 meses
- Top 10 produtos mais vendidos
- Vendas por forma de pagamento

**Vendas canceladas não entram em nenhum indicador.** Calcule os indicadores no banco (funções SQL ou views), não trazendo todas as vendas para o navegador.
