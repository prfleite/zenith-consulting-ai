

# Implementação Completa: 5 Features

## 1. Filtros Avançados com Date Range Picker

Criar um componente reutilizável `DateRangeFilter` com dois date pickers (início/fim) usando Shadcn Calendar + Popover. Aplicar em 6 páginas:

**Novo componente:** `src/components/DateRangeFilter.tsx`
- Dois botões com popover/calendar para "De" e "Até"
- Props: `startDate`, `endDate`, `onChangeStart`, `onChangeEnd`, `onClear`

**Páginas alteradas:**
- `Clients.tsx` — filtro por `created_at`
- `Opportunities.tsx` — filtro por `close_date`
- `Projects.tsx` — filtro por `start_date`
- `Billing.tsx` — filtro por `issue_date`
- `Timesheets.tsx` — filtro por `date`
- `Expenses.tsx` — filtro por `date`

Cada página ganha states `dateFrom`/`dateTo` e filtra no `filtered` array.

---

## 2. Paginação Real

Criar componente reutilizável `TablePagination` com controles de página e seletor de itens por página (10/25/50).

**Novo componente:** `src/components/TablePagination.tsx`
- Props: `totalItems`, `page`, `pageSize`, `onPageChange`, `onPageSizeChange`
- Exibe "Mostrando X-Y de Z" + botões prev/next

**Páginas alteradas:** mesmas 6 acima — cada uma aplica `.slice()` no array filtrado com base em `page` e `pageSize`.

---

## 3. Automações de Workflow (Database Triggers)

**Migração SQL:**

a) **Oportunidade → Projeto automático:** Trigger `on UPDATE` na tabela `opportunities` — quando `stage` muda para `'won'`, insere automaticamente um novo `project` com status `planning`, vinculado ao mesmo `client_account_id` e `company_id`.

b) **Fatura vencida → Alerta automático:** Trigger `on UPDATE` na tabela `invoices` — quando `status` muda para `'overdue'`, insere um `ai_alert` com severity `warning` e título "Fatura {number} vencida".

c) **Função auxiliar** para gerar código do projeto automaticamente (PRJ-001, PRJ-002...).

---

## 4. Notificações In-App em Tempo Real

Usar a tabela `ai_alerts` existente com Supabase Realtime para mostrar notificações no header.

**Migração SQL:**
- Habilitar realtime na tabela `ai_alerts`: `ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_alerts;`

**Novo componente:** `src/components/NotificationBell.tsx`
- Ícone Bell no header com badge de contagem de alertas não lidos
- Dropdown com lista dos últimos 20 alertas
- Click marca como lido (`is_read = true`)
- Subscribe ao canal realtime para updates instantâneos

**Arquivo alterado:** `src/components/AppLayout.tsx` — adiciona `NotificationBell` ao header.

---

## 5. Portal do Cliente Aprimorado

**Arquivo alterado:** `src/pages/Portal.tsx`

Adicionar 3 seções novas:

a) **Gráfico de Progresso:** Para cada projeto, mostrar um `Progress` bar com % de tasks concluídas + mini chart de evolução.

b) **Timeline de Entregas:** Lista de milestones (tasks com `is_milestone = true`) ordenadas por `due_date`, com indicador visual de status (concluído/pendente/atrasado).

c) **Downloads:** Seção com documentos compartilhados (`is_public_to_client = true`), já usando a query existente mas com UI melhorada — ícones por tipo, botão de download.

---

## Resumo de Arquivos

| Ação | Arquivo |
|------|---------|
| Criar | `src/components/DateRangeFilter.tsx` |
| Criar | `src/components/TablePagination.tsx` |
| Criar | `src/components/NotificationBell.tsx` |
| Editar | `src/pages/Clients.tsx` |
| Editar | `src/pages/Opportunities.tsx` |
| Editar | `src/pages/Projects.tsx` |
| Editar | `src/pages/Billing.tsx` |
| Editar | `src/pages/Timesheets.tsx` |
| Editar | `src/pages/Expenses.tsx` |
| Editar | `src/pages/Portal.tsx` |
| Editar | `src/components/AppLayout.tsx` |
| Migração | Triggers para automação + realtime |

