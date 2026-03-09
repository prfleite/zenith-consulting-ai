import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import emptyClientsImg from "@/assets/empty-clients.png";
import emptyPipelineImg from "@/assets/empty-pipeline.png";
import emptyProjectsImg from "@/assets/empty-projects.png";
import emptyTimesheetsImg from "@/assets/empty-timesheets.png";
import emptyExpensesImg from "@/assets/empty-expenses.png";
import emptyDocumentsImg from "@/assets/empty-documents.png";

interface EmptyStateProps {
  icon?: ReactNode;
  image?: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, image, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {image ? (
        <img src={image} alt={title} className="w-32 h-32 object-contain mb-4 opacity-80" />
      ) : icon ? (
        <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
          {icon}
        </div>
      ) : null}
      <h3 className="text-lg font-heading font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-4">{description}</p>
      {actionLabel && onAction && (
        <Button variant="gold" size="sm" onClick={onAction}>
          <Plus className="w-4 h-4 mr-1" /> {actionLabel}
        </Button>
      )}
    </div>
  );
}

export const emptyStates = {
  clients: { image: emptyClientsImg, title: "Nenhum cliente ainda", description: "Adicione seu primeiro cliente para começar a gerenciar projetos e oportunidades." },
  projects: { image: emptyProjectsImg, title: "Nenhum projeto", description: "Crie um projeto para organizar tarefas, horas e entregas." },
  opportunities: { image: emptyPipelineImg, title: "Pipeline vazio", description: "Importe oportunidades ou crie manualmente para acompanhar seu funil de vendas." },
  timesheets: { image: emptyTimesheetsImg, title: "Sem registros de horas", description: "Registre horas trabalhadas para acompanhar produtividade e faturamento." },
  expenses: { image: emptyExpensesImg, title: "Nenhuma despesa", description: "Registre despesas de projetos para controle financeiro." },
  documents: { image: emptyDocumentsImg, title: "Nenhum documento", description: "Adicione documentos, relatórios e materiais de referência." },
};
