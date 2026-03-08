import { TrendingUp, Users, FolderKanban, DollarSign, ArrowUpRight, ArrowDownRight, Clock, Star } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

const revenueData = [
  { month: "Jan", value: 42000 },
  { month: "Fev", value: 48000 },
  { month: "Mar", value: 55000 },
  { month: "Abr", value: 51000 },
  { month: "Mai", value: 62000 },
  { month: "Jun", value: 71000 },
  { month: "Jul", value: 68000 },
  { month: "Ago", value: 79000 },
];

const projectsData = [
  { month: "Jan", completed: 5, active: 8 },
  { month: "Fev", completed: 7, active: 10 },
  { month: "Mar", completed: 6, active: 12 },
  { month: "Abr", completed: 9, active: 11 },
  { month: "Mai", completed: 8, active: 14 },
  { month: "Jun", completed: 11, active: 13 },
];

const recentActivities = [
  { client: "TechCorp Brasil", action: "Novo diagnóstico iniciado", time: "2h atrás", type: "new" },
  { client: "Indústria Global", action: "Relatório final entregue", time: "4h atrás", type: "completed" },
  { client: "Banco Nova Era", action: "Reunião de alinhamento", time: "6h atrás", type: "meeting" },
  { client: "Varejo Express", action: "Proposta aprovada", time: "1d atrás", type: "approved" },
  { client: "Saúde Prime", action: "Sprint 3 finalizado", time: "1d atrás", type: "completed" },
];

const metrics = [
  { label: "Receita Mensal", value: "R$ 79.000", change: "+14.2%", up: true, icon: DollarSign },
  { label: "Clientes Ativos", value: "47", change: "+5", up: true, icon: Users },
  { label: "Projetos em Andamento", value: "23", change: "+3", up: true, icon: FolderKanban },
  { label: "Taxa de Retenção", value: "94.8%", change: "+2.1%", up: true, icon: TrendingUp },
];

export default function Dashboard() {
  return (
    <div className="p-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Visão geral da sua consultoria</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="w-4 h-4" />
          Atualizado agora
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="bg-card rounded-xl p-5 border border-border hover:border-gold-subtle transition-all duration-300 shadow-card group"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-muted-foreground">{metric.label}</span>
              <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center group-hover:bg-gold/10 transition-colors">
                <metric.icon className="w-4 h-4 text-muted-foreground group-hover:text-gold transition-colors" />
              </div>
            </div>
            <div className="text-2xl font-bold text-foreground font-body">{metric.value}</div>
            <div className="flex items-center gap-1 mt-2">
              {metric.up ? (
                <ArrowUpRight className="w-3.5 h-3.5 text-success" />
              ) : (
                <ArrowDownRight className="w-3.5 h-3.5 text-destructive" />
              )}
              <span className={metric.up ? "text-xs text-success" : "text-xs text-destructive"}>
                {metric.change}
              </span>
              <span className="text-xs text-muted-foreground ml-1">vs mês anterior</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-card rounded-xl p-6 border border-border shadow-card">
          <h3 className="text-lg font-heading font-semibold text-foreground mb-4">Receita Mensal</h3>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={revenueData}>
              <defs>
                <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(43, 74%, 55%)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(43, 74%, 55%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 18%)" />
              <XAxis dataKey="month" stroke="hsl(220, 10%, 50%)" fontSize={12} />
              <YAxis stroke="hsl(220, 10%, 50%)" fontSize={12} tickFormatter={(v) => `${v / 1000}k`} />
              <Tooltip
                contentStyle={{
                  background: "hsl(220, 18%, 12%)",
                  border: "1px solid hsl(220, 14%, 18%)",
                  borderRadius: "8px",
                  color: "hsl(40, 10%, 92%)",
                }}
              />
              <Area type="monotone" dataKey="value" stroke="hsl(43, 74%, 55%)" fill="url(#goldGradient)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Activity */}
        <div className="bg-card rounded-xl p-6 border border-border shadow-card">
          <h3 className="text-lg font-heading font-semibold text-foreground mb-4">Atividade Recente</h3>
          <div className="space-y-4">
            {recentActivities.map((activity, i) => (
              <div key={i} className="flex items-start gap-3 animate-slide-up" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="w-2 h-2 rounded-full bg-gold mt-2 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm text-foreground font-medium truncate">{activity.client}</p>
                  <p className="text-xs text-muted-foreground">{activity.action}</p>
                  <p className="text-xs text-muted-foreground/60 mt-0.5">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Projects Chart */}
      <div className="bg-card rounded-xl p-6 border border-border shadow-card">
        <h3 className="text-lg font-heading font-semibold text-foreground mb-4">Projetos por Mês</h3>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={projectsData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 14%, 18%)" />
            <XAxis dataKey="month" stroke="hsl(220, 10%, 50%)" fontSize={12} />
            <YAxis stroke="hsl(220, 10%, 50%)" fontSize={12} />
            <Tooltip
              contentStyle={{
                background: "hsl(220, 18%, 12%)",
                border: "1px solid hsl(220, 14%, 18%)",
                borderRadius: "8px",
                color: "hsl(40, 10%, 92%)",
              }}
            />
            <Bar dataKey="completed" fill="hsl(43, 74%, 55%)" radius={[4, 4, 0, 0]} name="Concluídos" />
            <Bar dataKey="active" fill="hsl(220, 14%, 25%)" radius={[4, 4, 0, 0]} name="Ativos" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
