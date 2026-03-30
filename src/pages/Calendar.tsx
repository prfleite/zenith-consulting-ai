import { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Plus, Brain, CalendarDays, Clock, Target, Star, Zap, AlertTriangle } from "lucide-react";
import { AIAssistantPanel } from "@/components/AIAssistantPanel";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface CalEvent {
  id: string;
  title: string;
  start_date: string;
  end_date: string;
  event_type: string;
  is_all_day: boolean;
}

const typeConfig: Record<string, { bg: string; text: string; border: string; icon: any; dot: string }> = {
  meeting:   { bg: "bg-info/15",        text: "text-info",        border: "border-info/30",        icon: CalendarDays, dot: "bg-info" },
  deadline:  { bg: "bg-destructive/15", text: "text-destructive", border: "border-destructive/30", icon: AlertTriangle, dot: "bg-destructive" },
  task:      { bg: "bg-warning/15",     text: "text-warning",     border: "border-warning/30",     icon: Clock, dot: "bg-warning" },
  milestone: { bg: "bg-success/15",     text: "text-success",     border: "border-success/30",     icon: Star, dot: "bg-success" },
  other:     { bg: "bg-secondary/60",   text: "text-muted-foreground", border: "border-border",    icon: Zap, dot: "bg-muted-foreground" },
};

const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

const stagger = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.025 } },
};

const dayVariant = {
  hidden: { opacity: 0, scale: 0.9 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] as any } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as any } },
};

const Calendar = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [form, setForm] = useState({ title: "", start_date: "", end_date: "", event_type: "meeting" });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const fetchEvents = async () => {
    const start = new Date(year, month, 1).toISOString();
    const end = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
    const { data } = await supabase
      .from("calendar_events")
      .select("id, title, start_date, end_date, event_type, is_all_day")
      .gte("start_date", start)
      .lte("start_date", end)
      .order("start_date");
    setEvents(data || []);
  };

  useEffect(() => { fetchEvents(); }, [year, month]);

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const today = new Date();
  const isToday = (d: number) => today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;

  const calendarDays = useMemo(() => {
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDayOfWeek; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);
    return days;
  }, [firstDayOfWeek, daysInMonth]);

  const getEventsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return events.filter((e) => e.start_date.startsWith(dateStr));
  };

  const prev = () => setCurrentDate(new Date(year, month - 1, 1));
  const next = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToday = () => setCurrentDate(new Date());

  const createEvent = async () => {
    if (!form.title || !form.start_date || !profile?.company_id) return;
    const { error } = await supabase.from("calendar_events").insert({
      company_id: profile.company_id,
      title: form.title,
      start_date: new Date(form.start_date).toISOString(),
      end_date: new Date(form.end_date || form.start_date).toISOString(),
      event_type: form.event_type,
      user_id: profile.id,
    });
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Evento criado" });
    setDialogOpen(false);
    setForm({ title: "", start_date: "", end_date: "", event_type: "meeting" });
    fetchEvents();
  };

  // Upcoming events (next 7 days)
  const upcoming = useMemo(() => {
    const now = new Date();
    const limit = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return events.filter(e => {
      const d = new Date(e.start_date);
      return d >= now && d <= limit;
    }).slice(0, 5);
  }, [events]);

  const typeCount = useMemo(() => {
    const counts: Record<string, number> = {};
    events.forEach(e => { counts[e.event_type] = (counts[e.event_type] || 0) + 1; });
    return counts;
  }, [events]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="p-6 md:p-8 space-y-6"
    >
      {/* Header */}
      <motion.div variants={fadeUp} initial="hidden" animate="show" className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl md:text-4xl font-heading font-bold text-gradient-gold">Calendário</h1>
          <p className="text-muted-foreground mt-1.5 text-sm">
            <span className="text-gold font-semibold">{events.length}</span> evento(s) em {MONTHS[month]} {year}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <AIAssistantPanel
            contextType="global"
            title="Sugerir Agenda"
            placeholder="Descreva o que precisa agendar..."
            initialPrompt="Analise os projetos ativos, deadlines próximos e eventos existentes. Sugira reuniões e blocos de trabalho para otimizar a semana."
            extraContext={`Mês atual: ${MONTHS[month]} ${year}\nEventos:\n${events.map(e => `- ${e.title} (${e.event_type}) em ${e.start_date.slice(0, 10)}`).join("\n") || "Nenhum"}`}
          />
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="gold" className="gap-2">
                <Plus className="w-4 h-4" /> Novo Evento
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader><DialogTitle className="text-gradient-gold">Novo Evento</DialogTitle></DialogHeader>
              <div className="space-y-4 mt-2">
                <div>
                  <Label className="text-muted-foreground">Título *</Label>
                  <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="mt-1 bg-secondary" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-muted-foreground">Início *</Label>
                    <Input type="datetime-local" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className="mt-1 bg-secondary" />
                  </div>
                  <div>
                    <Label className="text-muted-foreground">Fim</Label>
                    <Input type="datetime-local" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} className="mt-1 bg-secondary" />
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground">Tipo</Label>
                  <Select value={form.event_type} onValueChange={(v) => setForm({ ...form, event_type: v })}>
                    <SelectTrigger className="mt-1 bg-secondary"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="meeting">Reunião</SelectItem>
                      <SelectItem value="deadline">Deadline</SelectItem>
                      <SelectItem value="task">Tarefa</SelectItem>
                      <SelectItem value="milestone">Milestone</SelectItem>
                      <SelectItem value="other">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="gold" className="w-full" onClick={createEvent}>Criar Evento</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </motion.div>

      {/* Stats Row */}
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 md:grid-cols-5 gap-3"
      >
        {[
          { key: "all", label: "Total", count: events.length, color: "text-gold", bg: "bg-gold/10 border-gold/25" },
          { key: "meeting", label: "Reuniões", count: typeCount.meeting || 0, color: "text-info", bg: "bg-info/10 border-info/25" },
          { key: "deadline", label: "Deadlines", count: typeCount.deadline || 0, color: "text-destructive", bg: "bg-destructive/10 border-destructive/25" },
          { key: "milestone", label: "Milestones", count: typeCount.milestone || 0, color: "text-success", bg: "bg-success/10 border-success/25" },
          { key: "task", label: "Tarefas", count: typeCount.task || 0, color: "text-warning", bg: "bg-warning/10 border-warning/25" },
        ].map((s) => (
          <motion.div key={s.key} variants={dayVariant} className={`rounded-xl border p-3 text-center ${s.bg}`}>
            <div className={`text-2xl font-heading font-bold ${s.color}`}>{s.count}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        {/* Calendar Main */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          transition={{ delay: 0.15 }}
          className="xl:col-span-3"
        >
          {/* Month Nav */}
          <div className="flex items-center gap-3 mb-4">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={prev}
              className="w-9 h-9 rounded-xl border border-border bg-secondary/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-gold/40 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </motion.button>
            <AnimatePresence mode="wait">
              <motion.h2
                key={`${month}-${year}`}
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.25 }}
                className="text-xl font-heading font-semibold text-foreground min-w-[200px] text-center"
              >
                {MONTHS[month]} {year}
              </motion.h2>
            </AnimatePresence>
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={next}
              className="w-9 h-9 rounded-xl border border-border bg-secondary/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-gold/40 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              onClick={goToday}
              className="px-3 py-1.5 text-xs rounded-lg border border-gold/30 bg-gold/10 text-gold font-medium hover:bg-gold/20 transition-colors"
            >
              Hoje
            </motion.button>
          </div>

          {/* Calendar Grid */}
          <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-card">
            {/* Day Headers */}
            <div className="grid grid-cols-7 border-b border-border bg-secondary/30">
              {DAYS.map((d, i) => (
                <div key={d} className={`p-3 text-center text-xs font-semibold uppercase tracking-wider ${i === 0 || i === 6 ? "text-muted-foreground/60" : "text-muted-foreground"}`}>
                  {d}
                </div>
              ))}
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={`${month}-${year}-grid`}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="grid grid-cols-7"
              >
                {calendarDays.map((day, i) => {
                  const dayEvents = day ? getEventsForDay(day) : [];
                  const dayIsToday = day ? isToday(day) : false;
                  const isSelected = day === selectedDay;
                  const isWeekend = (i % 7 === 0) || (i % 7 === 6);
                  return (
                    <motion.div
                      key={i}
                      whileHover={day ? { backgroundColor: "hsl(43 74% 55% / 0.04)" } : {}}
                      onClick={() => day && setSelectedDay(day === selectedDay ? null : day)}
                      className={[
                        "min-h-[90px] p-1.5 border-b border-r border-border last-of-type:border-r-0 transition-colors",
                        !day ? "bg-secondary/10" : "cursor-pointer",
                        dayIsToday ? "bg-gold/5 border-gold/20" : "",
                        isSelected ? "ring-1 ring-inset ring-gold/40 bg-gold/8" : "",
                        isWeekend && day ? "bg-secondary/5" : "",
                      ].filter(Boolean).join(" ")}
                    >
                      {day && (
                        <>
                          <div className="flex items-center justify-between mb-1">
                            <span className={[
                              "text-xs font-semibold inline-flex items-center justify-center w-6 h-6 rounded-full transition-colors",
                              dayIsToday ? "bg-gradient-gold text-primary-foreground shadow-gold-sm" : "text-foreground hover:text-gold",
                            ].join(" ")}>
                              {day}
                            </span>
                            {dayEvents.length > 0 && (
                              <span className="text-[9px] text-gold font-bold bg-gold/15 rounded-full px-1">{dayEvents.length}</span>
                            )}
                          </div>
                          <div className="space-y-0.5">
                            {dayEvents.slice(0, 2).map((e) => {
                              const cfg = typeConfig[e.event_type] || typeConfig.other;
                              return (
                                <motion.div
                                  key={e.id}
                                  initial={{ opacity: 0, x: -4 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  className={`text-[10px] px-1.5 py-0.5 rounded-md border truncate font-medium ${cfg.bg} ${cfg.text} ${cfg.border}`}
                                >
                                  {e.title}
                                </motion.div>
                              );
                            })}
                            {dayEvents.length > 2 && (
                              <div className="text-[9px] text-gold px-1 font-medium">+{dayEvents.length - 2} mais</div>
                            )}
                          </div>
                        </>
                      )}
                    </motion.div>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Sidebar */}
        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="show"
          transition={{ delay: 0.25 }}
          className="space-y-4"
        >
          {/* Legend */}
          <div className="bg-card rounded-2xl border border-border p-4 shadow-card">
            <h3 className="text-sm font-semibold text-foreground mb-3">Tipos de Evento</h3>
            <div className="space-y-2">
              {Object.entries(typeConfig).map(([key, cfg]) => {
                const IconComp = cfg.icon;
                return (
                  <div key={key} className="flex items-center gap-2 text-xs">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
                    <IconComp className={`w-3 h-3 ${cfg.text}`} />
                    <span className="text-muted-foreground capitalize">
                      {key === "meeting" ? "Reunião" : key === "deadline" ? "Deadline" : key === "task" ? "Tarefa" : key === "milestone" ? "Milestone" : "Outro"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Upcoming Events */}
          <div className="bg-card rounded-2xl border border-border p-4 shadow-card">
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Target className="w-4 h-4 text-gold" />
              Próximos 7 dias
            </h3>
            {upcoming.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-4">Nenhum evento próximo</p>
            ) : (
              <motion.div
                variants={stagger}
                initial="hidden"
                animate="show"
                className="space-y-2"
              >
                {upcoming.map((e) => {
                  const cfg = typeConfig[e.event_type] || typeConfig.other;
                  const d = new Date(e.start_date);
                  return (
                    <motion.div
                      key={e.id}
                      variants={dayVariant}
                      className={`rounded-xl border p-2.5 ${cfg.bg} ${cfg.border}`}
                    >
                      <div className="flex items-start gap-2">
                        <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${cfg.dot}`} />
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-semibold truncate ${cfg.text}`}>{e.title}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })} às {d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </div>

          {/* Selected Day Events */}
          <AnimatePresence>
            {selectedDay && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-card rounded-2xl border border-gold/25 p-4 shadow-gold-sm"
              >
                <h3 className="text-sm font-semibold text-gold mb-3">
                  {selectedDay} de {MONTHS[month]}
                </h3>
                {getEventsForDay(selectedDay).length === 0 ? (
                  <p className="text-xs text-muted-foreground text-center py-2">Sem eventos</p>
                ) : (
                  <div className="space-y-2">
                    {getEventsForDay(selectedDay).map((e) => {
                      const cfg = typeConfig[e.event_type] || typeConfig.other;
                      const d = new Date(e.start_date);
                      return (
                        <div key={e.id} className={`rounded-xl border p-2.5 ${cfg.bg} ${cfg.border}`}>
                          <p className={`text-xs font-semibold ${cfg.text}`}>{e.title}</p>
                          {!e.is_all_day && (
                            <p className="text-[10px] text-muted-foreground mt-0.5">
                              {d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Calendar;
