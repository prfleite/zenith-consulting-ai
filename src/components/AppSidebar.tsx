import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, Users, Target, FolderKanban, Clock, Receipt,
  BookOpen, Settings, ChevronLeft, ChevronRight, Sparkles, LogOut,
  Globe, DollarSign, BarChart3, Brain, UserCheck, CreditCard,
  Megaphone, FileSignature, CalendarDays, FileCheck, FileText, X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

const staffNavItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/", group: "principal" },
  { icon: Users, label: "Clientes", path: "/clients", group: "principal" },
  { icon: Target, label: "Oportunidades", path: "/opportunities", group: "principal" },
  { icon: FolderKanban, label: "Projetos", path: "/projects", group: "principal" },
  { icon: Megaphone, label: "Marketing", path: "/marketing", group: "principal" },
  { icon: CalendarDays, label: "Calendário", path: "/calendar", group: "operacional" },
  { icon: Clock, label: "Timesheets", path: "/timesheets", group: "operacional" },
  { icon: Receipt, label: "Despesas", path: "/expenses", group: "operacional" },
  { icon: DollarSign, label: "Faturamento", path: "/billing", group: "operacional" },
  { icon: UserCheck, label: "Recursos", path: "/resources", group: "operacional" },
  { icon: BookOpen, label: "Conhecimento", path: "/knowledge", group: "estrategia" },
  { icon: FileSignature, label: "Propostas", path: "/proposals", group: "estrategia" },
  { icon: FileCheck, label: "Contratos", path: "/contracts", group: "estrategia" },
  { icon: FileText, label: "Relatórios", path: "/reports", group: "estrategia" },
  { icon: Brain, label: "IA Insights", path: "/ai-insights", group: "inteligencia" },
  { icon: BarChart3, label: "Analytics", path: "/analytics", group: "inteligencia" },
  { icon: CreditCard, label: "Planos", path: "/subscription", group: "sistema" },
  { icon: Settings, label: "Configurações", path: "/settings", group: "sistema" },
];

const clientNavItems = [
  { icon: Globe, label: "Portal", path: "/portal", group: "principal" },
  { icon: Settings, label: "Configurações", path: "/settings", group: "sistema" },
];

interface AppSidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
  isMobile: boolean;
}

const navItemVariants = {
  hidden: { opacity: 0, x: -12 },
  show: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, delay: i * 0.03, ease: [0.16, 1, 0.3, 1] as any },
  }),
};

export function AppSidebar({ collapsed, onToggleCollapse, mobileOpen, onMobileClose, isMobile }: AppSidebarProps) {
  const location = useLocation();
  const { profile, signOut } = useAuth();

  const navItems = profile?.role === "client_user" ? clientNavItems : staffNavItems;
  const sidebarVisible = isMobile ? mobileOpen : true;
  if (!sidebarVisible) return null;

  const isCollapsed = !isMobile && collapsed;

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isMobile && mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={onMobileClose}
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={isMobile ? { x: -280 } : false}
        animate={isMobile ? { x: mobileOpen ? 0 : -280 } : { width: isCollapsed ? 72 : 260 }}
        transition={{ type: "spring", stiffness: 380, damping: 38 }}
        className={cn(
          "fixed left-0 top-0 h-screen flex flex-col z-50 overflow-hidden",
          "bg-sidebar border-r border-sidebar-border",
          isMobile ? "w-[260px]" : isCollapsed ? "w-[72px]" : "w-[260px]"
        )}
        style={{ background: "var(--gradient-sidebar)" }}
      >
        {/* Logo */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-sidebar-border flex-shrink-0">
          <div className="flex items-center gap-3 overflow-hidden min-w-0">
            <motion.div
              whileHover={{ scale: 1.05, rotate: 5 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className="w-8 h-8 rounded-xl bg-gradient-gold flex items-center justify-center flex-shrink-0 shadow-gold-sm"
            >
              <Sparkles className="w-4 h-4 text-[hsl(220,22%,6%)]" />
            </motion.div>
            <AnimatePresence>
              {(!isCollapsed || isMobile) && (
                <motion.span
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.25 }}
                  className="font-heading text-[1.05rem] font-semibold text-foreground whitespace-nowrap overflow-hidden"
                >
                  Apex<span className="text-gradient-gold">Consult</span>
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          {isMobile && (
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={onMobileClose}
              className="p-1.5 rounded-lg hover:bg-sidebar-accent text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-4 h-4" />
            </motion.button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-3 px-2.5 overflow-y-auto overflow-x-hidden">
          {navItems.map((item, i) => {
            const isActive = location.pathname === item.path || (item.path !== "/" && location.pathname.startsWith(item.path));
            return (
              <motion.div
                key={item.path}
                custom={i}
                variants={navItemVariants}
                initial="hidden"
                animate="show"
              >
                <Link
                  to={item.path}
                  onClick={() => isMobile && onMobileClose()}
                  title={isCollapsed ? item.label : undefined}
                  className={cn(
                    "flex items-center gap-3 px-2.5 py-2 rounded-xl transition-all duration-200 group mb-0.5 min-h-[40px]",
                    isActive
                      ? "bg-secondary/80 text-foreground border border-[var(--border-gold)] shadow-gold-sm"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <item.icon
                    className={cn(
                      "w-4.5 h-4.5 flex-shrink-0 transition-all duration-200",
                      isActive ? "text-gold animate-glow-pulse" : "text-muted-foreground group-hover:text-foreground"
                    )}
                  />
                  <AnimatePresence>
                    {(!isCollapsed || isMobile) && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="text-sm font-medium whitespace-nowrap overflow-hidden"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {isActive && (!isCollapsed || isMobile) && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="ml-auto w-1.5 h-1.5 rounded-full bg-gold"
                    />
                  )}
                </Link>
              </motion.div>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="px-2.5 pb-3 pt-2 border-t border-sidebar-border flex-shrink-0 space-y-1">
          <AnimatePresence>
            {(!isCollapsed || isMobile) && profile && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="px-2.5 py-2 mb-1 overflow-hidden"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-gradient-gold-subtle border border-[var(--border-gold)] flex items-center justify-center flex-shrink-0">
                    <span className="text-xs font-semibold text-gold">
                      {profile.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate leading-tight">{profile.name}</p>
                    <p className="text-[11px] text-muted-foreground capitalize leading-tight">{profile.role.replace("_", " ")}</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            onClick={signOut}
            className="w-full flex items-center gap-3 px-2.5 py-2 rounded-xl text-muted-foreground hover:bg-sidebar-accent hover:text-destructive transition-all duration-200 min-h-[40px]"
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            <AnimatePresence>
              {(!isCollapsed || isMobile) && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-sm"
                >
                  Sair
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>

          {!isMobile && (
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={onToggleCollapse}
              className="w-full flex items-center justify-center py-1.5 rounded-xl text-muted-foreground hover:bg-sidebar-accent hover:text-foreground transition-colors"
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </motion.button>
          )}
        </div>
      </motion.aside>
    </>
  );
}
