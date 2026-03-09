import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Clock } from "lucide-react";

interface ActivityItem {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details_json: any;
  created_at: string;
  user_id: string | null;
  profiles?: { name: string } | null;
}

export const ActivityFeed = ({ entityType, entityId }: { entityType?: string; entityId?: string }) => {
  const [items, setItems] = useState<ActivityItem[]>([]);

  useEffect(() => {
    const fetch = async () => {
      let q = supabase.from("activity_log").select("*, profiles:user_id(name)").order("created_at", { ascending: false }).limit(20);
      if (entityType) q = q.eq("entity_type", entityType);
      if (entityId) q = q.eq("entity_id", entityId);
      const { data } = await q;
      setItems((data as any) || []);
    };
    fetch();
  }, [entityType, entityId]);

  if (items.length === 0) return <p className="text-sm text-muted-foreground text-center py-4">Nenhuma atividade registrada.</p>;

  return (
    <div className="space-y-2">
      {items.map((item) => (
        <div key={item.id} className="flex items-start gap-3 py-2 border-b border-border last:border-0">
          <Clock className="w-3.5 h-3.5 text-muted-foreground mt-1 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-foreground">
              <span className="font-medium">{(item as any).profiles?.name || "Sistema"}</span>{" "}
              {item.action}
            </p>
            <p className="text-xs text-muted-foreground">{new Date(item.created_at).toLocaleString("pt-BR")}</p>
          </div>
        </div>
      ))}
    </div>
  );
};
