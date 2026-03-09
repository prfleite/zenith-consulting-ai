import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Users, FolderKanban, Target, FileText, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface SearchResult {
  id: string;
  title: string;
  type: "client" | "project" | "opportunity" | "task" | "document";
  subtitle?: string;
}

const typeConfig = {
  client: { icon: Users, label: "Clientes", path: "/clients" },
  project: { icon: FolderKanban, label: "Projetos", path: "/projects" },
  opportunity: { icon: Target, label: "Oportunidades", path: "/opportunities" },
  task: { icon: FileText, label: "Tarefas", path: "" },
  document: { icon: FileText, label: "Documentos", path: "" },
};

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((o) => !o);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const search = useCallback(async (q: string) => {
    if (!q || q.length < 2) { setResults([]); return; }
    const pattern = `%${q}%`;
    const [clients, projects, opps] = await Promise.all([
      supabase.from("client_accounts").select("id, name, industry").ilike("name", pattern).limit(5),
      supabase.from("projects").select("id, name, code").ilike("name", pattern).limit(5),
      supabase.from("opportunities").select("id, title, stage").ilike("title", pattern).limit(5),
    ]);
    const r: SearchResult[] = [
      ...(clients.data || []).map((c) => ({ id: c.id, title: c.name, type: "client" as const, subtitle: c.industry || "" })),
      ...(projects.data || []).map((p) => ({ id: p.id, title: p.name, type: "project" as const, subtitle: p.code || "" })),
      ...(opps.data || []).map((o) => ({ id: o.id, title: o.title, type: "opportunity" as const, subtitle: o.stage })),
    ];
    setResults(r);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => search(query), 300);
    return () => clearTimeout(t);
  }, [query, search]);

  const handleSelect = (r: SearchResult) => {
    setOpen(false);
    setQuery("");
    const cfg = typeConfig[r.type];
    if (cfg.path) navigate(`${cfg.path}/${r.id}`);
  };

  const grouped = results.reduce((acc, r) => {
    if (!acc[r.type]) acc[r.type] = [];
    acc[r.type].push(r);
    return acc;
  }, {} as Record<string, SearchResult[]>);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Buscar clientes, projetos, oportunidades..." value={query} onValueChange={setQuery} />
      <CommandList>
        <CommandEmpty>Nenhum resultado encontrado.</CommandEmpty>
        {Object.entries(grouped).map(([type, items]) => {
          const cfg = typeConfig[type as keyof typeof typeConfig];
          const Icon = cfg.icon;
          return (
            <CommandGroup key={type} heading={cfg.label}>
              {items.map((item) => (
                <CommandItem key={item.id} onSelect={() => handleSelect(item)} className="cursor-pointer">
                  <Icon className="mr-2 h-4 w-4 text-muted-foreground" />
                  <div className="flex flex-col">
                    <span>{item.title}</span>
                    {item.subtitle && <span className="text-xs text-muted-foreground">{item.subtitle}</span>}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          );
        })}
        {results.length === 0 && !query && (
          <div className="p-4 text-center text-sm text-muted-foreground">
            <Search className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
            <p>Digite para buscar em toda a plataforma</p>
            <p className="text-xs mt-1">Cmd+K para abrir a qualquer momento</p>
          </div>
        )}
      </CommandList>
    </CommandDialog>
  );
}
