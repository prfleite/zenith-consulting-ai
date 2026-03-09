import { ReactNode, useState, useEffect } from "react";
import { AppSidebar } from "./AppSidebar";
import { GlobalSearch } from "./GlobalSearch";
import { Bell, AlertTriangle, Info, X, Search, Menu, Sun, Moon, Monitor } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { toast as sonnerToast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTheme } from "@/contexts/ThemeContext";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [showAlerts, setShowAlerts] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMobile = useIsMobile();
  const { theme, resolvedTheme, setTheme } = useTheme();

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("ai_alerts").select("*").order("created_at", { ascending: false }).limit(15);
      setAlerts(data || []);
    };
    load();

    const channel = supabase
      .channel("ai_alerts_realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "ai_alerts" }, (payload) => {
        const newAlert = payload.new as any;
        setAlerts(prev => [newAlert, ...prev].slice(0, 15));
        sonnerToast(newAlert.title, { description: newAlert.description });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const unread = alerts.filter(a => !a.is_read).length;

  const markAllRead = async () => {
    const ids = alerts.filter(a => !a.is_read).map(a => a.id);
    if (ids.length === 0) return;
    await supabase.from("ai_alerts").update({ is_read: true }).in("id", ids);
    setAlerts(prev => prev.map(a => ({ ...a, is_read: true })));
  };

  const severityIcon = (s: string) => {
    if (s === "critical") return <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />;
    if (s === "warning") return <AlertTriangle className="w-4 h-4 text-warning flex-shrink-0" />;
    return <Info className="w-4 h-4 text-info flex-shrink-0" />;
  };

  const marginLeft = isMobile ? "ml-0" : sidebarCollapsed ? "ml-[72px]" : "ml-[260px]";

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile overlay */}
      {isMobile && mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setMobileOpen(false)} />
      )}

      <AppSidebar
        collapsed={isMobile ? false : sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(c => !c)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        isMobile={isMobile}
      />
      <GlobalSearch />

      {/* Top bar */}
      <div className={`${marginLeft} h-12 border-b border-border flex items-center justify-between px-4 md:px-6 bg-card/50 transition-all duration-300`}>
        <div className="flex items-center gap-2">
          {isMobile && (
            <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
              <Menu className="w-5 h-5" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <button onClick={toggleTheme} className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground" title={theme === "dark" ? "Modo claro" : "Modo escuro"}>
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>
          <button onClick={() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary text-muted-foreground text-sm hover:text-foreground transition-colors">
            <Search className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Buscar...</span>
            <kbd className="hidden md:inline text-[10px] px-1.5 py-0.5 rounded bg-background border border-border ml-2">⌘K</kbd>
          </button>
          <div className="relative">
            <button onClick={() => setShowAlerts(!showAlerts)} className="relative p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
              <Bell className="w-5 h-5" />
              {unread > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center font-bold">{unread > 9 ? "9+" : unread}</span>
              )}
            </button>

            {showAlerts && (
              <div className="absolute right-0 top-full mt-2 w-[380px] bg-card border border-border rounded-xl shadow-card z-50 max-h-[420px] overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                  <span className="text-sm font-heading font-semibold text-foreground">Alertas</span>
                  <div className="flex items-center gap-2">
                    {unread > 0 && (
                      <button onClick={markAllRead} className="text-xs text-gold hover:underline">Marcar lidos</button>
                    )}
                    <button onClick={() => setShowAlerts(false)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="overflow-y-auto max-h-[360px]">
                  {alerts.length > 0 ? alerts.map(a => (
                    <div key={a.id} className={`flex items-start gap-3 px-4 py-3 border-b border-border last:border-0 ${!a.is_read ? "bg-secondary/30" : ""}`}>
                      {severityIcon(a.severity)}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-foreground font-medium">{a.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{a.description}</p>
                        <p className="text-xs text-muted-foreground/60 mt-1">{new Date(a.created_at).toLocaleDateString("pt-BR")}</p>
                      </div>
                    </div>
                  )) : (
                    <p className="text-sm text-muted-foreground p-4">Nenhum alerta.</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <main className={`${marginLeft} transition-all duration-300`}>
        {children}
      </main>
    </div>
  );
}
