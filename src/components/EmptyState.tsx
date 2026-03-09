import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Plus, Users, FolderKanban, Target, FileText, Receipt, Clock } from "lucide-react";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-2xl bg-secondary flex items-center justify-center mb-4">
        {icon || <FileText className="w-8 h-8 text-muted-foreground" />}
      </div>
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
  clients: { icon: <Users className="w-8 h-8 text-muted-foreground" />, title: "Nenhum cliente ainda", description: "Adicione seu primeiro cliente para começar a gerenciar projetos e oportunidades." },
  projects: { icon: <FolderKanban className="w-8 h-8 text-muted-foreground" />, title: "Nenhum projeto", description: "Crie um projeto para organizar tarefas, horas e entregas." },
  opportunities: { icon: <Target className="w-8 h-8 text-muted-foreground" />, title: "Pipeline vazio", description: "Importe oportunidades ou crie manualmente para acompanhar seu funil de vendas." },
  timesheets: { icon: <Clock className="w-8 h-8 text-muted-foreground" />, title: "Sem registros de horas", description: "Registre horas trabalhadas para acompanhar produtividade e faturamento." },
  expenses: { icon: <Receipt className="w-8 h-8 text-muted-foreground" />, title: "Nenhuma despesa", description: "Registre despesas de projetos para controle financeiro." },
  documents: { icon: <FileText className="w-8 h-8 text-muted-foreground" />, title: "Nenhum documento", description: "Adicione documentos, relatórios e materiais de referência." },
};
