

# Analise Completa: Oportunidades de IA e Melhorias

## Estado atual de IA por pagina

| Pagina | IA | Tipo |
|--------|-----|------|
| Dashboard | Sim | Briefing executivo |
| AIInsights | Sim | Chat global |
| Knowledge | Sim | Chat metodologia |
| Resources | Sim | Sugestao alocacao |
| OpportunityDetail | Sim | Gerador proposta |
| Portal | Sim | Chat do cliente |
| Calendar | Sim | Sugestao agenda |
| Timesheets | Sim | Sugestao horas |
| Analytics | Sim | Insights auto |
| ProjectDetail | Sim | Plano de projeto |
| ClientDetail | Sim | Resumo executivo |
| Contracts | Sim | Gerador contratos |
| **Billing** | Nao | - |
| **Proposals** | Nao | - |
| **Reports** | Parcial | Gera via edge function mas sem chat |
| **Expenses** | Nao | - |
| **Settings** | Nao | - |
| **Marketing** | Parcial | Gera estrategia via edge function |

---

## Novas funcionalidades propostas

### 1. IA no Billing — Previsao de fluxo de caixa
Botao "Previsao IA" que analisa historico de faturas (valores, prazos de pagamento, inadimplencia) e gera previsao de cash flow para os proximos 3 meses com recomendacoes de cobranca.

### 2. IA nas Proposals — Gerador de proposta completa
Botao "Gerar Proposta com IA" que usa dados do cliente e oportunidade vinculada para gerar titulo, descricao, itens com valores e prazo de validade. O usuario pode editar e salvar.

### 3. IA nas Expenses — Categorizacao e anomalias
Botao "Analisar Despesas" que envia o historico de despesas e identifica padroes anomalos, sugere otimizacoes de custos e categoriza automaticamente itens sem categoria.

### 4. Dashboard de Saude do Projeto (novo widget)
No Dashboard, adicionar um card que mostra automaticamente os 3 projetos com maior risco (baseado em: % budget consumido vs % tasks completas, atraso no cronograma, horas reais vs estimadas).

### 5. Exportacao de Relatorios em PDF aprimorada
Atualmente temos `exportToPDF` basico. Melhorar com template visual branded (usando dados da `companies` — logo, cor primaria) para Reports e Proposals.

### 6. Onboarding guiado para novos usuarios
O `OnboardingTour` existe mas pode estar incompleto. Revisar e adicionar steps para todas as funcionalidades novas (filtros, paginacao, IA, notificacoes).

### 7. Webhook/Integracao com WhatsApp
Criar edge function para enviar notificacoes via WhatsApp (Twilio ou API direta) quando: fatura vence, proposta e aceita, projeto muda de status.

### 8. Multi-moeda com conversao automatica
Ja existem campos `currency` e `conversion_rate` nas tabelas. Implementar UI para selecionar moeda e converter valores automaticamente usando API de cambio.

---

## Melhorias tecnicas necessarias

### 9. Migrar queries para React Query
Varias paginas (Expenses, Billing, Settings) ainda usam `useState` + `useEffect` para fetch. Migrar para `useQuery`/`useMutation` do TanStack para cache, revalidacao e loading states consistentes.

### 10. Tratamento de erros global
O `ErrorBoundary` existe mas nao ha tratamento consistente de erros de rede nas paginas. Adicionar toast automatico para falhas de fetch.

### 11. Testes
Apenas `example.test.ts` existe. Adicionar testes para hooks criticos (`useAIChat`, `useAuth`) e componentes reutilizaveis.

---

## Resumo de impacto

| Feature | Impacto | Esforço | Arquivos |
|---------|---------|---------|----------|
| 1. IA Billing (cash flow) | Alto | Baixo | `Billing.tsx` |
| 2. IA Proposals (gerador) | Alto | Baixo | `Proposals.tsx` |
| 3. IA Expenses (anomalias) | Medio | Baixo | `Expenses.tsx` |
| 4. Dashboard saude projetos | Alto | Medio | `Dashboard.tsx` |
| 5. PDF branded | Medio | Medio | `exportUtils.ts`, `Reports.tsx`, `Proposals.tsx` |
| 6. Onboarding completo | Medio | Baixo | `OnboardingTour.tsx` |
| 7. WhatsApp webhook | Alto | Alto | Nova edge function |
| 8. Multi-moeda | Medio | Medio | Billing, Opportunities, Projects |
| 9. React Query migration | Medio | Medio | ~6 paginas |
| 10. Error handling | Medio | Baixo | Global |
| 11. Testes | Alto | Alto | Novos arquivos test |

Todas as features de IA (1-3) usam o hook `useAIChat` e `AIAssistantPanel` existentes — sem necessidade de novas edge functions.

