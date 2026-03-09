import { useState, useEffect, useMemo } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
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

const typeColors: Record<string, string> = {
  meeting: "bg-info/20 text-info border-info/30",
  deadline: "bg-destructive/20 text-destructive border-destructive/30",
  task: "bg-warning/20 text-warning border-warning/30",
  milestone: "bg-success/20 text-success border-success/30",
  other: "bg-secondary text-muted-foreground border-border",
};

const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
const MONTHS = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

const Calendar = () => {
  const { profile } = useAuth();
  const { toast } = useToast();
  const [events, setEvents] = useState<CalEvent[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ title: "", start_date: "", end_date: "", event_type: "meeting" });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => {
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
    fetchEvents();
  }, [year, month]);

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
    // re-fetch
    const start = new Date(year, month, 1).toISOString();
    const end = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
    const { data } = await supabase.from("calendar_events").select("id, title, start_date, end_date, event_type, is_all_day").gte("start_date", start).lte("start_date", end).order("start_date");
    setEvents(data || []);
  };

  return (
    <div className="p-8 space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold text-foreground">Calendário</h1>
          <p className="text-muted-foreground mt-1">Visualize eventos, tarefas e deadlines</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="gold"><Plus className="w-4 h-4 mr-1" /> Novo Evento</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo Evento</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>Título *</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Início *</Label><Input type="datetime-local" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></div>
                <div><Label>Fim</Label><Input type="datetime-local" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></div>
              </div>
              <div><Label>Tipo</Label>
                <Select value={form.event_type} onValueChange={(v) => setForm({ ...form, event_type: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
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

      {/* Month Navigation */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={prev}><ChevronLeft className="w-4 h-4" /></Button>
        <h2 className="text-xl font-heading font-semibold text-foreground min-w-[200px] text-center">
          {MONTHS[month]} {year}
        </h2>
        <Button variant="outline" size="icon" onClick={next}><ChevronRight className="w-4 h-4" /></Button>
        <Button variant="outline" size="sm" onClick={goToday}>Hoje</Button>
      </div>

      {/* Calendar Grid */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="grid grid-cols-7">
          {DAYS.map((d) => (
            <div key={d} className="p-3 text-center text-xs font-medium text-muted-foreground border-b border-border bg-secondary/50">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {calendarDays.map((day, i) => {
            const dayEvents = day ? getEventsForDay(day) : [];
            return (
              <div key={i} className={`min-h-[100px] p-1.5 border-b border-r border-border last:border-r-0 ${!day ? "bg-secondary/20" : ""} ${day && isToday(day) ? "bg-gold/5" : ""}`}>
                {day && (
                  <>
                    <span className={`text-xs font-medium inline-flex items-center justify-center w-6 h-6 rounded-full ${isToday(day) ? "bg-gold text-primary-foreground" : "text-foreground"}`}>{day}</span>
                    <div className="mt-1 space-y-0.5">
                      {dayEvents.slice(0, 3).map((e) => (
                        <div key={e.id} className={`text-[10px] px-1.5 py-0.5 rounded border truncate ${typeColors[e.event_type] || typeColors.other}`}>
                          {e.title}
                        </div>
                      ))}
                      {dayEvents.length > 3 && <span className="text-[10px] text-muted-foreground px-1">+{dayEvents.length - 3}</span>}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Calendar;
