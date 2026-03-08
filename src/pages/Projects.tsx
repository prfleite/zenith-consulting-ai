import { Plus, Clock, CheckCircle2, AlertCircle, MoreHorizontal, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

type Project = {
  id: number;
  name: string;
  client: string;
  status: "discovery" | "em_andamento" | "revisao" | "concluido";
  priority: "alta" | "media" | "baixa";
  dueDate: string;
  team: number;
  progress: number;
};

const projects: Project[] = [
  { id: 1, name: "Transformação Digital", client: "TechCorp Brasil", status: "em_andamento", priority: "alta", dueDate: "15 Mar", team: 4, progress: 65 },
  { id: 2, name: "Reestruturação Operacional", client: "Indústria Global", status: "revisao", priority: "alta", dueDate: "20 Mar", team: 3, progress: 90 },
  { id: 3, name: "Estratégia de Mercado", client: "Banco Nova Era", status: "discovery", priority: "media", dueDate: "01 Abr", team: 2, progress: 15 },
  { id: 4, name: "Otimização de Custos", client: "Varejo Express", status: "em_andamento", priority: "media", dueDate: "25 Mar", team: 3, progress: 45 },
  { id: 5, name: "Compliance & Governança", client: "Banco Nova Era", status: "concluido", priority: "alta", dueDate: "01 Mar", team: 5, progress: 100 },
  { id: 6, name: "Plano de Expansão", client: "Saúde Prime", status: "discovery", priority: "baixa", dueDate: "10 Abr", team: 2, progress: 5 },
  { id: 7, name: "Integração Pós-M&A", client: "Energia Sustentável", status: "em_andamento", priority: "alta", dueDate: "30 Mar", team: 6, progress: 55 },
  { id: 8, name: "Customer Journey Mapping", client: "TechCorp Brasil", status: "revisao", priority: "media", dueDate: "18 Mar", team: 3, progress: 85 },
];

const columns = [
  { key: "discovery" as const, label: "Discovery", icon: AlertCircle, color: "text-info" },
  { key: "em_andamento" as const, label: "Em Andamento", icon: Clock, color: "text-warning" },
  { key: "revisao" as const, label: "Revisão", icon: AlertCircle, color: "text-gold" },
  { key: "concluido" as const, label: "Concluído", icon: CheckCircle2, color: "text-success" },
];

const priorityColors = {
  alta: "bg-destructive/20 text-destructive",
  media: "bg-warning/20 text-warning",
  baixa: "bg-muted text-muted-foreground",
};

export default function Projects() {
  return (
    <div className="p-8 space-y-6 animate-fade-in">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Projetos</h1>
          <p className="text-muted-foreground mt-1">Pipeline de consultoria</p>
        </div>
        <Button variant="gold" size="sm">
          <Plus className="w-4 h-4" /> Novo Projeto
        </Button>
      </div>

      {/* Kanban Board */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        {columns.map((col) => {
          const colProjects = projects.filter((p) => p.status === col.key);
          return (
            <div key={col.key} className="space-y-3">
              <div className="flex items-center gap-2 px-1 mb-2">
                <col.icon className={`w-4 h-4 ${col.color}`} />
                <span className="text-sm font-medium text-foreground">{col.label}</span>
                <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full ml-auto">
                  {colProjects.length}
                </span>
              </div>

              <div className="space-y-3">
                {colProjects.map((project, i) => (
                  <div
                    key={project.id}
                    className="bg-card rounded-xl p-4 border border-border hover:border-gold-subtle transition-all duration-200 shadow-card cursor-pointer animate-slide-up"
                    style={{ animationDelay: `${i * 0.05}s` }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="text-sm font-semibold text-foreground leading-tight">{project.name}</h4>
                      <Button variant="ghost" size="icon" className="w-6 h-6 -mr-1 -mt-1">
                        <MoreHorizontal className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">{project.client}</p>

                    {/* Progress bar */}
                    <div className="w-full h-1.5 bg-secondary rounded-full mb-3">
                      <div
                        className="h-full bg-gradient-gold rounded-full transition-all duration-500"
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${priorityColors[project.priority]}`}>
                        {project.priority}
                      </span>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" /> {project.team}
                        </span>
                        <span>{project.dueDate}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
