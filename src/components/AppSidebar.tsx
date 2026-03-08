import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { LayoutDashboard, Users, Target, FolderKanban, Clock, Receipt, BookOpen, Settings, ChevronLeft, ChevronRight, Sparkles, LogOut, Globe, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

const staffNavItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/" },
  { icon: Users, label: "Clientes", path: "/clients" },
  { icon: Target, label: "Oportunidades", path: "/opportunities" },
  { icon: FolderKanban, label: "Projetos", path: "/projects" },
  { icon: Clock, label: "Timesheets", path: "/timesheets" },
  { icon: Receipt, label: "Despesas", path: "/expenses" },
  { icon: BookOpen, label: "Conhecimento", path: "/knowledge" },
  { icon: Settings, label: "Configurações", path: "/settings" },
];

const clientNavItems = [
  { icon: Globe, label: "Portal", path: "/portal" },
  { icon: Settings, label: "Configurações", path: "/settings" },
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { profile, signOut } = useAuth();

  const navItems = profile?.role === "client_user" ? clientNavItems : staffNavItems;

  return (
    <aside className={cn("fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 z-50", collapsed ? "w-[72px]" : "w-[260px]")}>
      <div className="h-16 flex items-center px-5 border-b border-sidebar-border">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-gradient-gold flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-4 h-4 text-primary-foreground" />
          </div>
          {!collapsed && <span className="font-heading text-lg font-semibold text-foreground whitespace-nowrap">Apex<span className="text-gradient-gold">Consult</span></span>}
        </div>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== "/" && location.pathname.startsWith(item.path));
          return (
            <Link key={item.path} to={item.path} className={cn("flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group", isActive ? "bg-secondary text-foreground shadow-gold border-gold-subtle border" : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground")}>
              <item.icon className={cn("w-5 h-5 flex-shrink-0 transition-colors", isActive ? "text-gold" : "text-muted-foreground group-hover:text-foreground")} />
              {!collapsed && <span className="text-sm font-medium whitespace-nowrap">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* User info + logout */}
      <div className="p-3 border-t border-sidebar-border space-y-2">
        {!collapsed && profile && (
          <div className="px-3 py-2">
            <p className="text-sm font-medium text-foreground truncate">{profile.name}</p>
            <p className="text-xs text-muted-foreground capitalize">{profile.role.replace("_", " ")}</p>
          </div>
        )}
        <button onClick={signOut} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-sidebar-accent hover:text-destructive transition-colors">
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span className="text-sm">Sair</span>}
        </button>
        <button onClick={() => setCollapsed(!collapsed)} className="w-full flex items-center justify-center py-2 rounded-lg text-muted-foreground hover:bg-sidebar-accent hover:text-foreground transition-colors">
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  );
}
