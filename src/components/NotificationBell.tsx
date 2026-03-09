import { useState, useEffect } from "react";
import { Bell, AlertTriangle, Info, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast as sonnerToast } from "sonner";

export function NotificationBell() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [showAlerts, setShowAlerts] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("ai_alerts").select("*").order("created_at", { ascending: false }).limit(20);
      setAlerts(data || []);
    };
    load();

    const channel = supabase
      .channel("ai_alerts_realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "ai_alerts" }, (payload) => {
        const newAlert = payload.new as any;
        setAlerts(prev => [newAlert, ...prev].slice(0, 20));
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

  return (
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
  );
}
