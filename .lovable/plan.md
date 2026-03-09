

# Oportunidades de IA e Melhorias

## Mapa atual de IA

Paginas **com** IA: Dashboard (briefing executivo), AIInsights (chat global), Knowledge (chat de metodologia), Resources (sugestao de alocacao), OpportunityDetail (gerador de proposta), Portal (chat do cliente).

Paginas **sem** IA: Billing, Timesheets, Contracts, Proposals, Calendar, Analytics, ClientDetail, ProjectDetail, Reports, Expenses, Settings.

---

## Proposta de implementacao (6 features)

### 1. IA no ProjectDetail — Gerador de plano de projeto
Botao "Gerar Plano com IA" que envia nome do projeto, cliente, orcamento e tasks existentes para o `ai-chat` com `contextType: "planning"`. Retorna sugestao de tasks, estimativas de horas e cronograma. Usuario pode aceitar e criar as tasks automaticamente.

### 2. IA no ClientDetail — Resumo executivo do cliente
Botao "Resumo IA" que agrega oportunidades, projetos, NPS, faturamento do cliente e envia ao chat. Retorna analise de saude do relacionamento, riscos e proximas acoes recomendadas.

### 3. IA no Contracts — Gerador de contratos
Botao "Gerar Contrato com IA" que usa dados da proposta/oportunidade vinculada para gerar um rascunho de contrato completo com clausulas padrao.

### 4. IA no Timesheets — Preenchimento inteligente
Botao "Sugerir Horas" que analisa calendar_events e project_tasks do usuario na semana e pre-preenche entradas de timesheet com descricoes automaticas.

### 5. IA no Analytics — Insights automaticos
Ao carregar a pagina de Analytics, enviar KPIs agregados para IA e exibir um painel de 3-5 insights textuais (tendencias, anomalias, recomendacoes) no topo.

### 6. IA no Calendar — Agendamento inteligente
Botao "Sugerir Agenda" que analisa projetos ativos, deadlines proximos e disponibilidade da equipe para sugerir reunioes e blocos de trabalho.

---

## Outras melhorias (nao-IA)

### 7. Drag-and-drop no Kanban de tasks (ProjectDetail)
Atualmente as tasks nao tem drag-and-drop real. Implementar com HTML5 drag API para mover entre colunas (backlog/todo/in_progress/done).

### 8. Bulk actions nas tabelas
Selecao multipla com checkboxes em Clients, Invoices, Expenses para acoes em lote (marcar como pago, exportar selecionados, deletar).

### 9. Historico de atividades (Activity Feed)
Componente reutilizavel que mostra ultimas acoes no ClientDetail e ProjectDetail usando a tabela `activity_log`.

---

## Arquivos afetados

| Feature | Arquivos |
|---------|----------|
| 1. Plano IA (ProjectDetail) | `src/pages/ProjectDetail.tsx` |
| 2. Resumo IA (ClientDetail) | `src/pages/ClientDetail.tsx` |
| 3. Contrato IA (Contracts) | `src/pages/Contracts.tsx` |
| 4. Timesheet IA (Timesheets) | `src/pages/Timesheets.tsx` |
| 5. Insights IA (Analytics) | `src/pages/Analytics.tsx` |
| 6. Agenda IA (Calendar) | `src/pages/Calendar.tsx` |
| 7. Drag-drop Kanban | `src/pages/ProjectDetail.tsx` |
| 8. Bulk actions | `src/pages/Clients.tsx`, `Billing.tsx`, `Expenses.tsx` |
| 9. Activity Feed | Novo `src/components/ActivityFeed.tsx`, editar `ClientDetail.tsx`, `ProjectDetail.tsx` |

Todas as features de IA usam o hook `useAIChat` e edge function `ai-chat` existentes — sem necessidade de novas edge functions. O `contextType` ja tem prompts para `planning`, `proposal`, `global`.

