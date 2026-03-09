import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Building2, Mail, Phone, Star, Plus, Edit2, Trash2 } from "lucide-react";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";

const ClientDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [client, setClient] = useState<any>(null);
  const [contacts, setContacts] = useState<any[]>([]);
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [projects, setProjects] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [nps, setNps] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);

  // Contact form
  const [showContactForm, setShowContactForm] = useState(false);
  const [editingContact, setEditingContact] = useState<any>(null);
  const [contactForm, setContactForm] = useState({ name: "", role_title: "", email: "", phone: "", is_primary: false });
  const [savingContact, setSavingContact] = useState(false);

  const loadData = async () => {
    if (!id) return;
    const [clientRes, contactsRes, oppsRes, projRes, docsRes, npsRes] = await Promise.all([
      supabase.from("client_accounts").select("*, owner:profiles!client_accounts_owner_id_fkey(name)").eq("id", id).single(),
      supabase.from("client_contacts").select("*").eq("client_account_id", id).order("is_primary", { ascending: false }),
      supabase.from("opportunities").select("*").eq("client_account_id", id).order("created_at", { ascending: false }),
      supabase.from("projects").select("*").eq("client_account_id", id).order("created_at", { ascending: false }),
      supabase.from("documents").select("*").eq("related_client_account_id", id).order("created_at", { ascending: false }),
      supabase.from("nps_surveys").select("*").eq("client_account_id", id).order("created_at", { ascending: false }),
    ]);
    if (clientRes.data) setClient(clientRes.data);
    if (contactsRes.data) setContacts(contactsRes.data);
    if (oppsRes.data) setOpportunities(oppsRes.data);
    if (projRes.data) setProjects(projRes.data);
    if (docsRes.data) setDocuments(docsRes.data);
    if (npsRes.data) setNps(npsRes.data);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [id]);

  const openCreateContact = () => {
    setEditingContact(null);
    setContactForm({ name: "", role_title: "", email: "", phone: "", is_primary: false });
    setShowContactForm(true);
  };

  const openEditContact = (c: any) => {
    setEditingContact(c);
    setContactForm({ name: c.name, role_title: c.role_title || "", email: c.email || "", phone: c.phone || "", is_primary: c.is_primary });
    setShowContactForm(true);
  };

  const handleSaveContact = async () => {
    if (!contactForm.name || !id) return;
    setSavingContact(true);
    if (editingContact) {
      const { error } = await supabase.from("client_contacts").update({
        name: contactForm.name,
        role_title: contactForm.role_title || null,
        email: contactForm.email || null,
        phone: contactForm.phone || null,
        is_primary: contactForm.is_primary,
      }).eq("id", editingContact.id);
      if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); }
      else { toast({ title: "Contato atualizado!" }); }
    } else {
      const { error } = await supabase.from("client_contacts").insert({
        client_account_id: id,
        name: contactForm.name,
        role_title: contactForm.role_title || null,
        email: contactForm.email || null,
        phone: contactForm.phone || null,
        is_primary: contactForm.is_primary,
      });
      if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); }
      else { toast({ title: "Contato criado!" }); }
    }
    setSavingContact(false);
    setShowContactForm(false);
    // Reload contacts
    const { data } = await supabase.from("client_contacts").select("*").eq("client_account_id", id).order("is_primary", { ascending: false });
    if (data) setContacts(data);
  };

  const handleDeleteContact = async (contactId: string) => {
    const { error } = await supabase.from("client_contacts").delete().eq("id", contactId);
    if (error) { toast({ title: "Erro ao excluir", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Contato excluído" });
    setContacts(prev => prev.filter(c => c.id !== contactId));
  };

  if (loading) return <div className="flex justify-center items-center h-96"><div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" /></div>;
  if (!client) return <div className="p-8 text-muted-foreground">Cliente não encontrado</div>;

  const tabs = [
    { key: "overview", label: "Visão Geral" },
    { key: "contacts", label: `Contatos (${contacts.length})` },
    { key: "opportunities", label: `Oportunidades (${opportunities.length})` },
    { key: "projects", label: `Projetos (${projects.length})` },
    { key: "documents", label: `Documentos (${documents.length})` },
    { key: "nps", label: `NPS (${nps.length})` },
  ];

  const healthColor = (client.health_score || 0) >= 80 ? "text-success" : (client.health_score || 0) >= 60 ? "text-warning" : "text-destructive";
  const avgNps = nps.length ? (nps.reduce((a: number, n: any) => a + n.score, 0) / nps.length).toFixed(1) : "—";

  const stageLabels: Record<string, string> = { lead: "Lead", qualified: "Qualificado", proposal: "Proposta", negotiation: "Negociação", won: "Ganho", lost: "Perdido" };
  const statusLabels: Record<string, string> = { planning: "Planejamento", active: "Ativo", on_hold: "Em Espera", completed: "Concluído", cancelled: "Cancelado" };

  return (
    <div className="p-8 space-y-6 animate-fade-in">
      <Breadcrumbs entityName={client.name} />
      <Link to="/clients" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Voltar para Clientes
      </Link>

      {/* Header */}
      <div className="flex items-center gap-5">
        <div className="w-16 h-16 rounded-xl bg-gradient-gold flex items-center justify-center shadow-gold">
          <Building2 className="w-8 h-8 text-primary-foreground" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-heading font-bold text-foreground">{client.name}</h1>
          <p className="text-muted-foreground">{client.industry} · {client.segment} · {client.country}</p>
        </div>
        <div className={`text-center ${healthColor}`}>
          <p className="text-3xl font-bold">{client.health_score}</p>
          <p className="text-xs">Health Score</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border overflow-x-auto">
        {tabs.map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-[1px] whitespace-nowrap ${activeTab === tab.key ? "border-gold text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-card rounded-xl p-6 border border-border space-y-4">
            <h3 className="font-heading font-semibold text-foreground">Informações</h3>
            {[
              ["Segmento", client.segment],
              ["Indústria", client.industry],
              ["Porte", client.size],
              ["País", client.country],
              ["Website", client.website],
              ["Receita Anual", client.annual_revenue ? `R$ ${(client.annual_revenue/1000000).toFixed(1)}M` : "—"],
              ["Owner", (client.owner as any)?.name || "—"],
            ].map(([label, value]) => (
              <div key={label as string} className="flex justify-between text-sm">
                <span className="text-muted-foreground">{label}</span>
                <span className="text-foreground">{value as string}</span>
              </div>
            ))}
          </div>
          <div className="bg-card rounded-xl p-6 border border-border space-y-4">
            <h3 className="font-heading font-semibold text-foreground">Resumo</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                ["Oportunidades", opportunities.length],
                ["Projetos", projects.length],
                ["NPS Médio", avgNps],
                ["Documentos", documents.length],
              ].map(([label, value]) => (
                <div key={label as string} className="bg-secondary rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-foreground">{value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "contacts" && (
        <div className="space-y-3">
          <div className="flex justify-end">
            <Button variant="gold" size="sm" onClick={openCreateContact}><Plus className="w-4 h-4 mr-1" />Novo Contato</Button>
          </div>
          {contacts.map((c) => (
            <div key={c.id} className="bg-card rounded-xl p-5 border border-border flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-foreground">{c.name}</h4>
                  {c.is_primary && <span className="text-xs bg-gold/20 text-gold px-2 py-0.5 rounded-full">Principal</span>}
                </div>
                <p className="text-sm text-muted-foreground">{c.role_title}</p>
                <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                  {c.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{c.email}</span>}
                  {c.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{c.phone}</span>}
                </div>
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="w-8 h-8" onClick={() => openEditContact(c)}><Edit2 className="w-3.5 h-3.5" /></Button>
                <Button variant="ghost" size="icon" className="w-8 h-8 text-destructive" onClick={() => handleDeleteContact(c.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
              </div>
            </div>
          ))}
          {contacts.length === 0 && <p className="text-center py-8 text-muted-foreground">Nenhum contato cadastrado</p>}
        </div>
      )}

      {activeTab === "opportunities" && (
        <div className="space-y-3">
          {opportunities.map((o) => (
            <Link key={o.id} to={`/opportunities/${o.id}`} className="bg-card rounded-xl p-5 border border-border flex items-center justify-between hover:border-gold-subtle transition-colors block">
              <div>
                <h4 className="font-semibold text-foreground">{o.title}</h4>
                <p className="text-sm text-muted-foreground capitalize">{stageLabels[o.stage]} · {o.probability}%</p>
              </div>
              <p className="text-lg font-bold text-foreground">R$ {((o.expected_value || 0) / 1000).toFixed(0)}K</p>
            </Link>
          ))}
        </div>
      )}

      {activeTab === "projects" && (
        <div className="space-y-3">
          {projects.map((p) => (
            <div key={p.id} className="bg-card rounded-xl p-5 border border-border">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold text-foreground">{p.name}</h4>
                  <p className="text-sm text-muted-foreground">{p.code} · {statusLabels[p.status]}</p>
                </div>
                <p className="text-sm text-muted-foreground">R$ {((p.budget_fee || 0) / 1000).toFixed(0)}K</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === "documents" && (
        <div className="space-y-3">
          {documents.map((d) => (
            <div key={d.id} className="bg-card rounded-xl p-5 border border-border">
              <h4 className="font-semibold text-foreground">{d.title}</h4>
              <p className="text-sm text-muted-foreground capitalize">{d.type.replace("_", " ")}</p>
            </div>
          ))}
        </div>
      )}

      {activeTab === "nps" && (
        <div className="space-y-3">
          <div className="bg-card rounded-xl p-6 border border-border text-center">
            <p className="text-4xl font-bold text-gold">{avgNps}</p>
            <p className="text-muted-foreground mt-1">NPS Médio</p>
          </div>
          {nps.map((n) => (
            <div key={n.id} className="bg-card rounded-xl p-5 border border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground">{n.comment}</p>
                  <p className="text-xs text-muted-foreground mt-1">— {n.responded_by_name}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-gold text-gold" />
                  <span className="text-lg font-bold text-foreground">{n.score}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Contact Create/Edit Dialog */}
      <Dialog open={showContactForm} onOpenChange={setShowContactForm}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>{editingContact ? "Editar Contato" : "Novo Contato"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label>Nome *</Label><Input value={contactForm.name} onChange={e => setContactForm(f => ({ ...f, name: e.target.value }))} className="bg-secondary border-border" /></div>
            <div><Label>Cargo</Label><Input value={contactForm.role_title} onChange={e => setContactForm(f => ({ ...f, role_title: e.target.value }))} className="bg-secondary border-border" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Email</Label><Input type="email" value={contactForm.email} onChange={e => setContactForm(f => ({ ...f, email: e.target.value }))} className="bg-secondary border-border" /></div>
              <div><Label>Telefone</Label><Input value={contactForm.phone} onChange={e => setContactForm(f => ({ ...f, phone: e.target.value }))} className="bg-secondary border-border" /></div>
            </div>
            <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
              <input type="checkbox" checked={contactForm.is_primary} onChange={e => setContactForm(f => ({ ...f, is_primary: e.target.checked }))} className="rounded" />
              Contato principal
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowContactForm(false)}>Cancelar</Button>
            <Button variant="gold" onClick={handleSaveContact} disabled={savingContact || !contactForm.name}>{savingContact ? "Salvando..." : editingContact ? "Salvar" : "Criar"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientDetail;
