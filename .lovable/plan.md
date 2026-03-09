

# Tema Claro/Escuro/Sistema + Sugestões de Features

## 1. Upgrade do sistema de tema (light/dark/system)

O `ThemeContext` atual suporta apenas "dark" | "light" com toggle simples. Vamos expandir para 3 modos:

**ThemeContext.tsx:**
- Tipo `Theme` passa a ser `"dark" | "light" | "system"`
- Quando `system`, escuta `window.matchMedia("(prefers-color-scheme: dark)")` e aplica automaticamente
- Persiste preferência no `localStorage`
- Expõe `theme` (preferência), `resolvedTheme` (o tema efetivo), e `setTheme(theme)`

**AppLayout.tsx:**
- Substituir o botão toggle por um dropdown com 3 opções: Sol (Claro), Lua (Escuro), Monitor (Sistema)
- Usar `DropdownMenu` do Radix (já instalado)
- Ícone exibido reflete o `resolvedTheme`, com indicador do modo sistema

## 2. Sugestões de novas features (para implementação futura)

Baseado na análise do projeto, as áreas com maior potencial:

| Feature | Impacto | Esforço |
|---------|---------|---------|
| **Notificações push** (via PWA) | Alto | Médio |
| **Dashboard customizável** (drag-and-drop widgets) | Alto | Alto |
| **Filtros avançados + busca por data** nas listagens | Alto | Médio |
| **Integração com Google Calendar** via OAuth | Médio | Alto |
| **Modo offline** com sync automático (service worker cache) | Médio | Alto |

---

## Escopo desta implementação

Apenas o upgrade do tema (item 1): expandir de 2 para 3 modos com dropdown e persistência.

### Arquivos alterados:
- `src/contexts/ThemeContext.tsx` — novo tipo, listener de `prefers-color-scheme`, `setTheme`
- `src/components/AppLayout.tsx` — dropdown com 3 opções (Sun/Moon/Monitor icons)

