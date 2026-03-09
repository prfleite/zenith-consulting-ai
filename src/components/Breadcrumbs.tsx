import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";

const routeLabels: Record<string, string> = {
  "": "Dashboard",
  clients: "Clientes",
  projects: "Projetos",
  opportunities: "Oportunidades",
  marketing: "Marketing",
  timesheets: "Timesheets",
  expenses: "Despesas",
  billing: "Faturamento",
  knowledge: "Conhecimento",
  proposals: "Propostas",
  contracts: "Contratos",
  reports: "Relatórios",
  "ai-insights": "IA Insights",
  analytics: "Analytics",
  resources: "Recursos",
  subscription: "Planos",
  settings: "Configurações",
  calendar: "Calendário",
};

export function Breadcrumbs({ entityName }: { entityName?: string }) {
  const location = useLocation();
  const parts = location.pathname.split("/").filter(Boolean);

  if (parts.length <= 1) return null;

  const crumbs: { label: string; path: string }[] = [{ label: "Dashboard", path: "/" }];

  let currentPath = "";
  parts.forEach((part, i) => {
    currentPath += `/${part}`;
    const label = routeLabels[part];
    if (label) {
      crumbs.push({ label, path: currentPath });
    } else if (i === parts.length - 1 && entityName) {
      crumbs.push({ label: entityName, path: currentPath });
    }
  });

  return (
    <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-4">
      {crumbs.map((crumb, i) => (
        <span key={crumb.path} className="flex items-center gap-1.5">
          {i > 0 && <ChevronRight className="w-3.5 h-3.5" />}
          {i === crumbs.length - 1 ? (
            <span className="text-foreground font-medium">{crumb.label}</span>
          ) : (
            <Link to={crumb.path} className="hover:text-foreground transition-colors">{crumb.label}</Link>
          )}
        </span>
      ))}
    </nav>
  );
}
