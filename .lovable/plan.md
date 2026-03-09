

# Auditoria Completa + Plano de Implementacao - ApexConsult

## 1. RESUMO DA ARQUITETURA

```text
src/
├── pages/           22 paginas (Dashboard, Clients, Projects, etc.)
├── components/      UI components + layout + shared
├── contexts/        AuthContext (auth state + profile)
├── hooks/           use-mobile, use-toast
├── lib/ai/          useAIChat (streaming SSE client)
├── integrations/    Supabase client + auto-generated types
supabase/
├── functions/       9 edge functions (ai-chat, analyze-website, etc.)
├── migrations/      Database schema
```

**Modulos de negocio:** CRM (Clients, Opportunities), Project Management (Projects, Tasks, Timesheets), Finance (Billing, Expenses, Subscriptions), Marketing (Campaigns, Flows, Strategies), Knowledge Base, Reports, Contracts, Proposals, Calendar, Resources, Portal do Cliente, AI Insights, Analytics.

---

## 2. AUDITORIA - PROBLEMAS ENCONTRADOS

### A. BUGS ATIVOS (Console Errors)

| Problema | Arquivo | Impacto |
|----------|---------|---------|
| `forwardRef` warning no `Skeleton` usado em `TableSkeleton` | `SkeletonLoaders.tsx:22` | Warning no console, nao bloqueia |
| `forwardRef` warning nos lazy-loaded pages | `App.tsx` + paginas | Warning no console |

### B. FUNCIONALIDADES INCOMPLETAS/QUEBRADAS

| # | Feature | Onde para | Tipo |
|---|---------|-----------|------|
| 1 | **Botao "Novo Cliente"** em `/clients` nao faz nada | `Clients.tsx:66` - Button sem onClick/Dialog | Critico - nao cria clientes |
| 2 | **Botao "Nova Oportunidade"** em `/opportunities` nao faz nada | `Opportunities.tsx:73` - Button sem handler | Critico - nao cria deals |
| 3 | **Botao "Alterar Senha"** em Settings | `Settings.tsx:126` - Button sem onClick | Incompleto |
| 4 | **Botao "Convidar Membro"** em Settings > Equipe | `Settings.tsx:247` - disabled, sem logica | Incompleto |
| 5 | **Botoes "Conectar" integracao** em Settings | `Settings.tsx:191` - Button sem handler | Cosmetic |
| 6 | **Botoes "Upgrade"/"Comprar"** em Subscription | `Subscription.tsx:103,123` - sem checkout real | Nao-funcional |
| 7 | **Edit/Delete contacts** em ClientDetail | `ClientDetail.tsx:143-144` - botoes sem handler | Incompleto |
| 8 | **`decrement_ai_credits` RPC** chamado no ai-chat | `ai-chat/index.ts:124` - funcao nao existe no DB | Bug silencioso (catch vazio) |
| 9 | **AppLayout sidebar fixo ml-[260px]** | `AppLayout.tsx:55,98` - nao responde ao collapse da sidebar | Layout quebra em mobile |
| 10 | **Proposals page sem padding** | `Proposals.tsx:132` - falta `p-8` wrapper | Inconsistencia visual |

### C. DIVIDAS TECNICAS

| Problema | Impacto | Solucao |
|----------|---------|---------|
| Componentes monoliticos (Dashboard 352 linhas, Marketing 800 linhas, Analytics 508 linhas) | Manutencao dificil | Extrair sub-componentes |
| Chamadas Supabase diretas em todos os `useEffect` sem React Query (Dashboard, Clients, Timesheets, etc.) | Sem cache, sem dedup, sem loading states adequados | Migrar para `useQuery` |
| Tipagem `any` extensiva (30+ ocorrencias) | Type-safety reduzida | Tipar corretamente |
| Sidebar nao responde ao estado `collapsed` no layout | UI quebra quando sidebar colapsa | Sincronizar estado |
| Dark mode toggle referenciado nos batches anteriores mas `ThemeContext` nao esta no App.tsx | Feature incompleta | Integrar se existir, ou implementar |

---

## 3. PLANO DE IMPLEMENTACAO (Priorizado)

### Batch 1 - BUGS CRITICOS (implementar agora)

**3.1 - Dialog "Novo Cliente" na pagina Clients**
- Adicionar Dialog com form (nome, segmento, industria, pais, website, annual_revenue, owner)
- Insert no Supabase com company_id do profile
- Re-fetch apos criacao

**3.2 - Dialog "Nova Oportunidade" na pagina Opportunities**
- Adicionar Dialog com form (titulo, cliente, valor_esperado, probabilidade, estagio, close_date)
- Insert no Supabase com company_id
- Re-fetch apos criacao

**3.3 - Corrigir layout responsivo do AppLayout**
- Sincronizar o `ml-[260px]` com o estado `collapsed` da sidebar
- Quando collapsed: `ml-[72px]`
- Adicionar mobile hamburger menu (usando estado compartilhado ou context)

**3.4 - Corrigir padding da pagina Proposals**
- Adicionar `p-8` ao wrapper

**3.5 - Criar funcao `decrement_ai_credits` no banco**
- Migration SQL para criar a RPC que decrementa 1 credito

### Batch 2 - FUNCIONALIDADES INCOMPLETAS

**3.6 - Contacts CRUD em ClientDetail**
- Adicionar Dialog para criar contato
- Implementar edit/delete handlers nos botoes existentes

**3.7 - Alterar Senha em Settings**
- Chamar `supabase.auth.updateUser({ password })` com modal de confirmacao

**3.8 - Convidar Membro em Settings > Equipe**
- Criar edge function ou usar `supabase.auth.admin.inviteUserByEmail` (service role)

### Batch 3 - MELHORIA UX

**3.9 - Sidebar state sync com AppLayout**
- Usar context ou prop drilling para compartilhar estado collapsed
- Atualizar margin-left dinamicamente

**3.10 - Loading states consistentes**
- Substituir spinners restantes por SkeletonLoaders ja criados

---

## 4. VERIFICACAO DE FLUXOS CRITICOS

| Fluxo | Status | Arquivos | Notas |
|-------|--------|----------|-------|
| Login/Auth | OK | `Login.tsx`, `AuthContext.tsx` | signIn/signUp/signOut funcionais, profile fetch ok |
| CRUD Projetos | OK | `Projects.tsx`, `ProjectDetail.tsx` | Create, list, detail, tasks kanban, membros, docs, NPS |
| CRUD Clientes | **QUEBRADO** | `Clients.tsx` | Lista funciona, **criar nao** (sem dialog) |
| CRUD Oportunidades | **QUEBRADO** | `Opportunities.tsx` | Lista/kanban ok, **criar nao** (sem dialog) |
| Timesheets | OK | `Timesheets.tsx` | Create, weekly view, approval flow |
| Faturamento | OK | `Billing.tsx` | Create invoice, status transitions, charts |
| Despesas | OK | `Expenses.tsx` | Create, approval flow, delete |
| Contratos | OK | `Contracts.tsx` | Create, list com status |
| Propostas | OK | `Proposals.tsx` | Create, AI generate, preview |
| Calendario | OK | `Calendar.tsx` | Monthly view, create events |
| Knowledge Base | OK | `Knowledge.tsx` | CRUD artigos, AI chat com busca |
| Reports | OK | `Reports.tsx` | AI generation via edge function |
| Marketing | OK | `Marketing.tsx` | Strategy AI, Flow builder, Campaigns, Ad copy |
| AI Chat | OK | `useAIChat.ts`, `ai-chat/index.ts` | Streaming SSE, credit check |
| Global Search | OK | `GlobalSearch.tsx` | Cmd+K, busca em clients/projects/opportunities |
| Portal Cliente | OK | `Portal.tsx` | Projects, invoices, documents, AI chat |
| Analytics | OK | `Analytics.tsx` | 6 tabs com graficos reais do Supabase |
| Resources | OK | `Resources.tsx` | Capacity planner, utilization, AI allocation |

---

## 5. ITENS PARA IMPLEMENTAR

Todos os itens acima serao implementados em ordem de prioridade. Os mais criticos sao:

1. **Dialog Novo Cliente** - sem isso, nao se usa a plataforma
2. **Dialog Nova Oportunidade** - pipeline CRM quebrado
3. **Layout responsivo** - sidebar state sync
4. **RPC decrement_ai_credits** - creditos nao decrementam
5. **Proposals padding fix** - visual

Estimativa: ~5 arquivos alterados, 1 migration SQL.

