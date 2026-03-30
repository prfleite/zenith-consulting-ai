import { ReactNode, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AppSidebar } from "./AppSidebar";
import { GlobalSearch } from "./GlobalSearch";
import { Search, Menu, Sun, Moon, Monitor, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTheme } from "@/contexts/ThemeContext";
import { NotificationBell } from "./NotificationBell";
import { Breadcrumbs } from "./Breadcrumbs";

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
      <AppSidebar
        collapsed={isMobile ? false : sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(c => !c)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        isMobile={isMobile}
      />
      <GlobalSearch />

      {/* Top bar */}
      <motion.div
        layout
        className={`${marginLeft} h-12 border-b border-border flex items-center justify-between px-4 md:px-5 transition-all duration-300`}
        style={{ background: "hsl(var(--card) / 0.6)", backdropFilter: "blur(16px)" }}
      >
        <div className="flex items-center gap-2 min-w-0">
          {isMobile ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setMobileOpen(true)}
              className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground flex-shrink-0"
            >
              <Menu className="w-5 h-5" />
            </motion.button>
          ) : (
            <div className="text-sm text-muted-foreground hidden md:block">
              <Breadcrumbs />
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Search trigger */}
          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", metaKey: true }))}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-secondary/70 text-muted-foreground text-sm hover:text-foreground hover:bg-secondary transition-all duration-200 border border-border/50"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden md:inline text-xs">Buscar...</span>
            <kbd className="hidden md:inline text-[10px] px-1.5 py-0.5 rounded bg-background border border-border ml-1 font-mono">⌘K</kbd>
          </motion.button>

          {/* Theme toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-lg hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground"
                title="Alterar tema"
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={resolvedTheme}
                    initial={{ opacity: 0, rotate: -45 }}
                    animate={{ opacity: 1, rotate: 0 }}
                    exit={{ opacity: 0, rotate: 45 }}
                    transition={{ duration: 0.2 }}
                  >
                    {resolvedTheme === "dark" ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                  </motion.div>
                </AnimatePresence>
              </motion.button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuItem onClick={() => setTheme("light")} className={theme === "light" ? "text-gold" : ""}>
                <Sun className="w-3.5 h-3.5 mr-2" /> Claro
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")} className={theme === "dark" ? "text-gold" : ""}>
                <Moon className="w-3.5 h-3.5 mr-2" /> Escuro
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")} className={theme === "system" ? "text-gold" : ""}>
                <Monitor className="w-3.5 h-3.5 mr-2" /> Sistema
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <NotificationBell />
        </div>
      </motion.div>

      {/* Main content */}
      <main className={`${marginLeft} transition-all duration-300 min-h-[calc(100vh-48px)]`}>
        <AnimatePresence mode="wait">
          <motion.div
            key={typeof window !== "undefined" ? window.location.pathname : ""}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}
