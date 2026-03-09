import { useState, useEffect } from "react";
import Joyride, { CallBackProps, STATUS } from "react-joyride";

const TOUR_KEY = "apex-onboarding-done";

const steps = [
  {
    target: "body",
    content: "Bem-vindo ao ApexConsult! Vamos fazer um tour rápido pelos principais módulos.",
    placement: "center" as const,
    disableBeacon: true,
  },
  {
    target: '[href="/clients"]',
    content: "Gerencie seus clientes, contatos e acompanhe o health score de cada conta.",
  },
  {
    target: '[href="/opportunities"]',
    content: "Pipeline de oportunidades com Kanban, probabilidades e previsão de receita.",
  },
  {
    target: '[href="/projects"]',
    content: "Projetos com tarefas (drag-and-drop), timesheets, membros da equipe e IA para plano de projeto.",
  },
  {
    target: '[href="/billing"]',
    content: "Faturamento com previsão de fluxo de caixa por IA, filtros avançados e ações em lote.",
  },
  {
    target: '[href="/proposals"]',
    content: "Crie propostas comerciais — ou deixe a IA gerar automaticamente com base no cliente.",
  },
  {
    target: '[href="/contracts"]',
    content: "Contratos com geração automática por IA a partir de propostas aceitas.",
  },
  {
    target: '[href="/timesheets"]',
    content: "Timesheets com preenchimento inteligente por IA baseado em tarefas e agenda.",
  },
  {
    target: '[href="/expenses"]',
    content: "Gestão de despesas com análise de anomalias e categorização automática por IA.",
  },
  {
    target: '[href="/analytics"]',
    content: "Analytics com insights automáticos gerados por IA ao carregar a página.",
  },
  {
    target: '[href="/calendar"]',
    content: "Calendário com sugestões inteligentes de reuniões e blocos de trabalho.",
  },
  {
    target: '[href="/ai-insights"]',
    content: "Chat com IA para obter insights sobre seus dados, previsões e recomendações.",
  },
  {
    target: '[href="/reports"]',
    content: "Relatórios automáticos gerados por IA com exportação em PDF branded.",
  },
  {
    target: '[href="/settings"]',
    content: "Configure sua empresa, equipe, integrações e preferências do sistema.",
  },
];

export function OnboardingTour() {
  const [run, setRun] = useState(false);

  useEffect(() => {
    const done = localStorage.getItem(TOUR_KEY);
    if (!done) {
      const timer = setTimeout(() => setRun(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleCallback = (data: CallBackProps) => {
    const { status } = data;
    if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
      setRun(false);
      localStorage.setItem(TOUR_KEY, "true");
    }
  };

  if (!run) return null;

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showSkipButton
      showProgress
      callback={handleCallback}
      locale={{
        back: "Voltar",
        close: "Fechar",
        last: "Concluir",
        next: "Próximo",
        skip: "Pular tour",
      }}
      styles={{
        options: {
          primaryColor: "hsl(43, 74%, 55%)",
          backgroundColor: "hsl(220, 18%, 12%)",
          textColor: "hsl(40, 10%, 92%)",
          arrowColor: "hsl(220, 18%, 12%)",
          overlayColor: "rgba(0, 0, 0, 0.6)",
          zIndex: 10000,
        },
        buttonNext: {
          backgroundColor: "hsl(43, 74%, 55%)",
          color: "hsl(220, 20%, 7%)",
          borderRadius: 8,
          fontWeight: 600,
        },
        buttonBack: {
          color: "hsl(40, 10%, 80%)",
        },
        buttonSkip: {
          color: "hsl(220, 10%, 50%)",
        },
        tooltip: {
          borderRadius: 12,
          border: "1px solid hsl(220, 14%, 18%)",
        },
      }}
    />
  );
}
