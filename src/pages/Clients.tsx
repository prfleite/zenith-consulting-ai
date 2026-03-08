import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Search, Plus, Building2, TrendingUp, Star, MapPin, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type ClientAccount = {
  id: string;
  name: string;
  segment: string | null;
  industry: string | null;
  country: string | null;
  health_score: number | null;
  annual_revenue: number | null;
  owner_id: string | null;
  owner?: { name: string } | null;
};

export default function Clients() {
  const [clients, setClients] = useState<ClientAccount[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchClients = async () => {
      const { data, error } = await supabase
        .from("client_accounts")
        .select("*, owner:profiles!client_accounts_owner_id_fkey(name)")
        .order("name");
      if (data) setClients(data as any);
      setLoading(false);
    };
    fetchClients();
  }, []);

  const filtered = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    (c.segment || "").toLowerCase().includes(search.toLowerCase()) ||
    (c.industry || "").toLowerCase().includes(search.toLowerCase())
  );

  const getHealthColor = (score: number | null) => {
    if (!score) return "text-muted-foreground";
    if (score >= 80) return "text-success";
    if (score >= 60) return "text-warning";
    return "text-destructive";
  };

  const formatRevenue = (v: number | null) => {
    if (!v) return "—";
    if (v >= 1000000) return `R$ ${(v / 1000000).toFixed(1)}M`;
    if (v >= 1000) return `R$ ${(v / 1000).toFixed(0)}K`;
    return `R$ ${v}`;
  };

  return (
    <div className="p-8 space-y-6 animate-fade-in">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Clientes</h1>
          <p className="text-muted-foreground mt-1">{clients.length} clientes registrados</p>
        </div>
        <Button variant="gold" size="sm"><Plus className="w-4 h-4" /> Novo Cliente</Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar por nome, segmento ou indústria..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-card border-border" />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="space-y-3">
          {filtered.map((client) => (
            <div
              key={client.id}
              onClick={() => navigate(`/clients/${client.id}`)}
              className="bg-card rounded-xl p-5 border border-border cursor-pointer transition-all duration-200 hover:border-gold-subtle hover:shadow-gold"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-lg bg-secondary flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{client.name}</h3>
                    <p className="text-sm text-muted-foreground">{client.industry || client.segment} · {client.country}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-sm font-medium text-foreground">{formatRevenue(client.annual_revenue)}</p>
                    <p className="text-xs text-muted-foreground">receita anual</p>
                  </div>
                  <div className={`text-center ${getHealthColor(client.health_score)}`}>
                    <p className="text-lg font-bold">{client.health_score || "—"}</p>
                    <p className="text-xs">saúde</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                <span>{client.segment}</span>
                {client.owner && <span>Owner: {(client.owner as any).name}</span>}
              </div>
            </div>
          ))}
          {filtered.length === 0 && <p className="text-center py-12 text-muted-foreground">Nenhum cliente encontrado</p>}
        </div>
      )}
    </div>
  );
}
