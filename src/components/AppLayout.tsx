import { ReactNode, useState } from "react";
import { AppSidebar } from "./AppSidebar";
import { GlobalSearch } from "./GlobalSearch";
import { Search, Menu, Sun, Moon, Monitor } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTheme } from "@/contexts/ThemeContext";
import { NotificationBell } from "./NotificationBell";

interface AppLayoutProps {
  children: ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMobile = useIsMobile();
  const { theme, resolvedTheme, setTheme } = useTheme();

  const marginLeft = isMobile ? "ml-0" : sidebarCollapsed ? "ml-[72px]" : "ml-[260px]";

  return (
    <div className="min-h-screen bg-background">
      {isMobile && mobileOpen && (
        <div className="fixed inset-0 bg-black/50 z-40" onClick={() => setMobileOpen(false)} />
      )}

      <AppSidebar
        collapsed={isMobile ? false : sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(c => !c)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        isMobile={isMobile}
      />
      <GlobalSearch />

      {/* Top bar */}
      <div className={`${marginLeft} h-12 border-b border-border flex items-center justify-between px-4 md:px-6 bg-card/50 transition-all duration-300`}>
        <div className="flex items-center gap-2">
          {isMobile && (
            <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
              <Menu className="w-5 h-5" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground" title="Tema">
                {resolvedTheme === "dark" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme("light")} className={theme === "light" ? "bg-accent/20" : ""}>
                <Sun className="w-4 h-4 mr-2" /> Claro
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")} className={theme === "dark" ? "bg-accent/20" : ""}>
                <Moon className="w-4 h-4 mr-2" /> Escuro
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")} className={theme === "system" ? "bg-accent/20" : ""}>
                <Monitor className="w-4 h-4 mr-2" /> Sistema
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <button onClick={() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary text-muted-foreground text-sm hover:text-foreground transition-colors">
            <Search className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Buscar...</span>
            <kbd className="hidden md:inline text-[10px] px-1.5 py-0.5 rounded bg-background border border-border ml-2">⌘K</kbd>
          </button>
          <NotificationBell />
        </div>
      </div>
      <main className={`${marginLeft} transition-all duration-300`}>
        {children}
      </main>
    </div>
  );
}
