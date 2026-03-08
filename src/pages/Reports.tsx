import { FileText, Download, Calendar, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";

const reports = [
  { name: "Relatório Mensal - Fevereiro 2026", type: "Mensal", date: "01 Mar 2026", pages: 24 },
  { name: "Análise de Performance Q4 2025", type: "Trimestral", date: "15 Jan 2026", pages: 48 },
  { name: "Due Diligence - Varejo Express", type: "Projeto", date: "20 Fev 2026", pages: 36 },
  { name: "Benchmark Setor Financeiro", type: "Pesquisa", date: "10 Fev 2026", pages: 18 },
  { name: "Relatório de Impacto - TechCorp", type: "Projeto", date: "05 Fev 2026", pages: 31 },
  { name: "Previsões Macroeconômicas 2026", type: "Pesquisa", date: "28 Jan 2026", pages: 42 },
];

const typeColors: Record<string, string> = {
  Mensal: "bg-info/20 text-info",
  Trimestral: "bg-gold/20 text-gold",
  Projeto: "bg-success/20 text-success",
  Pesquisa: "bg-muted text-muted-foreground",
};

export default function Reports() {
  return (
    <div className="p-8 space-y-6 animate-fade-in">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Relatórios</h1>
          <p className="text-muted-foreground mt-1">Documentos e análises</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm"><Filter className="w-4 h-4" /> Filtrar</Button>
          <Button variant="gold" size="sm"><FileText className="w-4 h-4" /> Gerar Relatório</Button>
        </div>
      </div>

      <div className="space-y-3">
        {reports.map((report, i) => (
          <div
            key={i}
            className="bg-card rounded-xl p-5 border border-border hover:border-gold-subtle transition-all duration-200 flex items-center justify-between animate-slide-up"
            style={{ animationDelay: `${i * 0.05}s` }}
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                <FileText className="w-5 h-5 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">{report.name}</h3>
                <div className="flex items-center gap-3 mt-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeColors[report.type]}`}>
                    {report.type}
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {report.date}
                  </span>
                  <span className="text-xs text-muted-foreground">{report.pages} páginas</span>
                </div>
              </div>
            </div>
            <Button variant="ghost" size="icon">
              <Download className="w-4 h-4" />
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
