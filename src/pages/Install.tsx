import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { Building2, User, FolderKanban, Users, CheckCircle2, ChevronRight, SkipForward } from "lucide-react";

const STEPS = [
  { id: 1, label: "Empresa", icon: Building2, description: "Configure sua consultoria" },
  { id: 2, label: "Cliente", icon: User, description: "Adicione seu primeiro cliente" },
  { id: 3, label: "Projeto", icon: FolderKanban, description: "Crie o primeiro projeto" },
  { id: 4, label: "Equipe", icon: Users, description: "Convide sua equipe" },
];

const industries = ["Tecnologia", "Saúde", "Financeiro", "Varejo", "Educação", "Manufatura", "Serviços", "Energia", "Agro", "Outro"];

const Install = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [completed, setCompleted] = useState<Set<number>>(new Set());

  const [companyForm, setCompanyForm] = useState({ name: "", industry: "", website: "", phone: "" });
  const [clientForm, setClientForm] = useState({ name: "", email: "", phone: "" });
  const [projectForm, setProjectForm] = useState({ name: "", description: "", start_date: "", end_date_planned: "" });
  const [teamForm, setTeamForm] = useState({ emails: "" });

  const progress = ((step - 1) / STEPS.length) * 100;

  const markCompleted = (s: number) => setCompleted(prev => new Set([...prev, s]));

  const handleSkip = () => {
    if (step < STEPS.length) {
      setStep(s => s + 1);
    } else {
      navigate("/");
    }
  };

  const handleStep1 = async () => {
    if (!companyForm.name || !profile?.company_id) return;
    setSaving(true);
    const { error } = await supabase.from("companies").update({
      name: companyForm.name,
    }).eq("id", profile.company_id);
    setSaving(false);
    if (error) {
      toast({ title: "Erro ao salvar empresa", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Empresa configurada!" });
    markCompleted(1);
    setStep(2);
  };

  const handleStep2 = async () => {
    if (!clientForm.name || !profile?.company_id) return;
    setSaving(true);
    const { error } = await supabase.from("client_accounts").insert({
      company_id: profile.company_id,
      name: clientForm.name,
      notes: clientForm.phone ? `Tel: ${clientForm.phone}` : null,
      owner_id: profile.id,
    });
    setSaving(false);
    if (error) {
      toast({ title: "Erro ao criar cliente", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Cliente criado!" });
    markCompleted(2);
    setStep(3);
  };

  const handleStep3 = async () => {
    if (!projectForm.name || !profile?.company_id) return;
    const { data: clients } = await supabase.from("client_accounts").select("id").eq("company_id", profile.company_id).limit(1).single();
    if (!clients) { toast({ title: "Crie um cliente primeiro", variant: "destructive" }); return; }
    setSaving(true);
    const { error } = await supabase.from("projects").insert({
      company_id: profile.company_id,
      name: projectForm.name,
      description: projectForm.description || null,
      start_date: projectForm.start_date || null,
      end_date_planned: projectForm.end_date_planned || null,
      client_account_id: clients.id,
      status: "planning",
    });
    setSaving(false);
    if (error) {
      toast({ title: "Erro ao criar projeto", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Projeto criado!" });
    markCompleted(3);
    setStep(4);
  };

  const handleFinish = () => {
    markCompleted(4);
    toast({ title: "Setup completo! Bem-vindo ao Zenith." });
    navigate("/");
  };

  const currentStepConfig = STEPS[step - 1];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl font-heading font-bold text-gradient-gold mb-2">Configuração Inicial</h1>
          <p className="text-muted-foreground text-sm">Configure sua consultoria em 4 passos rápidos</p>
        </motion.div>

        {/* Step Indicators */}
        <div className="flex items-center justify-between mb-6">
          {STEPS.map((s, i) => {
            const isActive = s.id === step;
            const isDone = completed.has(s.id);
            return (
              <div key={s.id} className="flex items-center flex-1">
                <div className="flex flex-col items-center gap-1">
                  <motion.div
                    animate={{
                      scale: isActive ? 1.1 : 1,
                      backgroundColor: isDone ? "hsl(43,74%,55%)" : isActive ? "hsl(43,74%,55%,0.2)" : "transparent",
                    }}
                    className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${
                      isDone ? "border-gold" : isActive ? "border-gold" : "border-border"
                    }`}
                  >
                    {isDone ? (
                      <CheckCircle2 className="w-5 h-5 text-primary-foreground" />
                    ) : (
                      <s.icon className={`w-4 h-4 ${isActive ? "text-gold" : "text-muted-foreground"}`} />
                    )}
                  </motion.div>
                  <span className={`text-[10px] font-medium ${isActive ? "text-gold" : "text-muted-foreground"}`}>
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className="flex-1 h-px bg-border mx-2 mb-4" />
                )}
              </div>
            );
          })}
        </div>

        {/* Progress */}
        <Progress value={progress} className="h-1.5 mb-6" />

        {/* Step Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="bg-card rounded-2xl border border-border p-6 shadow-card"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-gold-subtle border border-[var(--border-gold)] flex items-center justify-center">
                <currentStepConfig.icon className="w-5 h-5 text-gold" />
              </div>
              <div>
                <h2 className="text-lg font-heading font-semibold text-foreground">
                  Passo {step}: {currentStepConfig.label}
                </h2>
                <p className="text-sm text-muted-foreground">{currentStepConfig.description}</p>
              </div>
            </div>

            {step === 1 && (
              <div className="space-y-4">
                <div>
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">Nome da Empresa *</Label>
                  <Input
                    value={companyForm.name}
                    onChange={e => setCompanyForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Ex: Zenith Consulting"
                    className="mt-1 bg-secondary border-border"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground">Indústria</Label>
                    <Select value={companyForm.industry} onValueChange={v => setCompanyForm(f => ({ ...f, industry: v }))}>
                      <SelectTrigger className="mt-1 bg-secondary border-border"><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>{industries.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground">Telefone</Label>
                    <Input
                      value={companyForm.phone}
                      onChange={e => setCompanyForm(f => ({ ...f, phone: e.target.value }))}
                      placeholder="+55 11 99999-9999"
                      className="mt-1 bg-secondary border-border"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">Website</Label>
                  <Input
                    value={companyForm.website}
                    onChange={e => setCompanyForm(f => ({ ...f, website: e.target.value }))}
                    placeholder="https://..."
                    className="mt-1 bg-secondary border-border"
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div>
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">Nome do Cliente *</Label>
                  <Input
                    value={clientForm.name}
                    onChange={e => setClientForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Ex: Empresa ABC"
                    className="mt-1 bg-secondary border-border"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground">E-mail</Label>
                    <Input
                      type="email"
                      value={clientForm.email}
                      onChange={e => setClientForm(f => ({ ...f, email: e.target.value }))}
                      placeholder="contato@empresa.com"
                      className="mt-1 bg-secondary border-border"
                    />
                  </div>
                  <div>
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground">Telefone</Label>
                    <Input
                      value={clientForm.phone}
                      onChange={e => setClientForm(f => ({ ...f, phone: e.target.value }))}
                      placeholder="+55 11 9999-9999"
                      className="mt-1 bg-secondary border-border"
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-4">
                <div>
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">Nome do Projeto *</Label>
                  <Input
                    value={projectForm.name}
                    onChange={e => setProjectForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="Ex: Transformação Digital"
                    className="mt-1 bg-secondary border-border"
                  />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">Descrição</Label>
                  <Input
                    value={projectForm.description}
                    onChange={e => setProjectForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Breve descrição do projeto..."
                    className="mt-1 bg-secondary border-border"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground">Data de Início</Label>
                    <Input
                      type="date"
                      value={projectForm.start_date}
                      onChange={e => setProjectForm(f => ({ ...f, start_date: e.target.value }))}
                      className="mt-1 bg-secondary border-border"
                    />
                  </div>
                  <div>
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground">Término Previsto</Label>
                    <Input
                      type="date"
                      value={projectForm.end_date_planned}
                      onChange={e => setProjectForm(f => ({ ...f, end_date_planned: e.target.value }))}
                      className="mt-1 bg-secondary border-border"
                    />
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-4">
                <div>
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">E-mails para convidar</Label>
                  <p className="text-xs text-muted-foreground mb-2">Separe múltiplos e-mails com vírgula</p>
                  <textarea
                    value={teamForm.emails}
                    onChange={e => setTeamForm({ emails: e.target.value })}
                    placeholder="joao@empresa.com, maria@empresa.com"
                    rows={4}
                    className="w-full mt-1 bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-gold/40 resize-none"
                  />
                </div>
                <div className="p-3 bg-gold/5 border border-gold/20 rounded-xl">
                  <p className="text-xs text-muted-foreground">
                    Os convites serão enviados por e-mail. Cada membro receberá acesso ao sistema após aceitar o convite.
                  </p>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
              <Button variant="ghost" size="sm" onClick={handleSkip} className="text-muted-foreground gap-1">
                <SkipForward className="w-3.5 h-3.5" />
                {step < STEPS.length ? "Pular este passo" : "Pular e finalizar"}
              </Button>
              <Button
                variant="gold"
                onClick={
                  step === 1 ? handleStep1 :
                  step === 2 ? handleStep2 :
                  step === 3 ? handleStep3 :
                  handleFinish
                }
                disabled={saving || (step === 1 && !companyForm.name) || (step === 2 && !clientForm.name) || (step === 3 && !projectForm.name)}
                className="gap-2"
              >
                {saving ? "Salvando..." : step < STEPS.length ? "Próximo" : "Finalizar Setup"}
                {!saving && <ChevronRight className="w-4 h-4" />}
              </Button>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Step counter */}
        <p className="text-center text-xs text-muted-foreground mt-4">
          Passo {step} de {STEPS.length}
        </p>
      </div>
    </div>
  );
};

export default Install;
