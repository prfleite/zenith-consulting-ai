import { useState } from "react";
import { Search, Plus, MoreHorizontal, Building2, Mail, Phone, MapPin, TrendingUp, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const clients = [
  {
    id: 1, name: "TechCorp Brasil", sector: "Tecnologia", contact: "Carlos Silva",
    email: "carlos@techcorp.com.br", phone: "+55 11 9999-0001", city: "São Paulo",
    revenue: "R$ 2.4M", status: "ativo", rating: 5, projects: 4,
  },
  {
    id: 2, name: "Indústria Global", sector: "Manufatura", contact: "Ana Pereira",
    email: "ana@industriaglobal.com", phone: "+55 21 9999-0002", city: "Rio de Janeiro",
    revenue: "R$ 1.8M", status: "ativo", rating: 4, projects: 3,
  },
  {
    id: 3, name: "Banco Nova Era", sector: "Financeiro", contact: "Roberto Santos",
    email: "roberto@banconovaera.com", phone: "+55 11 9999-0003", city: "São Paulo",
    revenue: "R$ 5.1M", status: "ativo", rating: 5, projects: 6,
  },
  {
    id: 4, name: "Varejo Express", sector: "Varejo", contact: "Marina Costa",
    email: "marina@varejoexpress.com", phone: "+55 31 9999-0004", city: "Belo Horizonte",
    revenue: "R$ 890K", status: "prospect", rating: 3, projects: 1,
  },
  {
    id: 5, name: "Saúde Prime", sector: "Saúde", contact: "Dr. Paulo Mendes",
    email: "paulo@saudeprime.com", phone: "+55 41 9999-0005", city: "Curitiba",
    revenue: "R$ 1.2M", status: "ativo", rating: 4, projects: 2,
  },
  {
    id: 6, name: "Energia Sustentável", sector: "Energia", contact: "Lucia Ferreira",
    email: "lucia@energiasust.com", phone: "+55 51 9999-0006", city: "Porto Alegre",
    revenue: "R$ 3.6M", status: "inativo", rating: 4, projects: 5,
  },
];

const statusColors: Record<string, string> = {
  ativo: "bg-success/20 text-success",
  prospect: "bg-warning/20 text-warning",
  inativo: "bg-muted text-muted-foreground",
};

export default function Clients() {
  const [search, setSearch] = useState("");
  const [selectedClient, setSelectedClient] = useState<typeof clients[0] | null>(null);

  const filtered = clients.filter(
    (c) =>
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.sector.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 space-y-6 animate-fade-in">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Clientes</h1>
          <p className="text-muted-foreground mt-1">{clients.length} clientes registrados</p>
        </div>
        <Button variant="gold" size="sm">
          <Plus className="w-4 h-4" /> Novo Cliente
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome ou setor..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-10 bg-card border-border"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Client List */}
        <div className="lg:col-span-2 space-y-3">
          {filtered.map((client) => (
            <div
              key={client.id}
              onClick={() => setSelectedClient(client)}
              className={`bg-card rounded-xl p-5 border cursor-pointer transition-all duration-200 hover:border-gold-subtle hover:shadow-gold ${
                selectedClient?.id === client.id ? "border-gold/40 shadow-gold" : "border-border"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 rounded-lg bg-secondary flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{client.name}</h3>
                    <p className="text-sm text-muted-foreground">{client.sector} · {client.city}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium capitalize ${statusColors[client.status]}`}>
                    {client.status}
                  </span>
                  <Button variant="ghost" size="icon" className="w-8 h-8">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-6 mt-3 text-sm text-muted-foreground">
                <span className="flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5" /> {client.revenue}
                </span>
                <span>{client.projects} projetos</span>
                <span className="flex items-center gap-0.5">
                  {Array.from({ length: client.rating }).map((_, i) => (
                    <Star key={i} className="w-3 h-3 fill-gold text-gold" />
                  ))}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Client Detail Panel */}
        <div className="bg-card rounded-xl p-6 border border-border shadow-card h-fit sticky top-8">
          {selectedClient ? (
            <div className="space-y-5 animate-fade-in">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-lg bg-gradient-gold flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="font-heading text-lg font-semibold text-foreground">{selectedClient.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedClient.sector}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="text-foreground">{selectedClient.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span className="text-foreground">{selectedClient.phone}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="text-foreground">{selectedClient.city}</span>
                </div>
              </div>

              <div className="border-t border-border pt-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Contato Principal</span>
                  <span className="text-foreground">{selectedClient.contact}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Receita</span>
                  <span className="text-foreground font-medium">{selectedClient.revenue}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Projetos</span>
                  <span className="text-foreground">{selectedClient.projects}</span>
                </div>
              </div>

              <Button variant="gold-outline" className="w-full" size="sm">
                Ver Perfil Completo
              </Button>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Building2 className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">Selecione um cliente para ver detalhes</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
