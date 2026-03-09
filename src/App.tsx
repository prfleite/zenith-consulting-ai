import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/AppLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Clients from "./pages/Clients";
import ClientDetail from "./pages/ClientDetail";
import Opportunities from "./pages/Opportunities";
import OpportunityDetail from "./pages/OpportunityDetail";
import Projects from "./pages/Projects";
import ProjectDetail from "./pages/ProjectDetail";
import Timesheets from "./pages/Timesheets";
import Expenses from "./pages/Expenses";
import Billing from "./pages/Billing";
import AIInsights from "./pages/AIInsights";
import Knowledge from "./pages/Knowledge";
import Portal from "./pages/Portal";
import Analytics from "./pages/Analytics";
import Resources from "./pages/Resources";
import Subscription from "./pages/Subscription";
import Marketing from "./pages/Marketing";
import Reports from "./pages/Reports";
import Proposals from "./pages/Proposals";
import SettingsPage from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppRoutes() {
  const { session, loading, profile } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!session) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // Client users go to portal
  if (profile?.role === "client_user") {
    return (
      <AppLayout>
        <Routes>
          <Route path="/portal" element={<Portal />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/portal" replace />} />
        </Routes>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/clients" element={<Clients />} />
        <Route path="/clients/:id" element={<ClientDetail />} />
        <Route path="/opportunities" element={<Opportunities />} />
        <Route path="/opportunities/:id" element={<OpportunityDetail />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/projects/:id" element={<ProjectDetail />} />
        <Route path="/marketing" element={<Marketing />} />
        <Route path="/timesheets" element={<Timesheets />} />
        <Route path="/expenses" element={<Expenses />} />
        <Route path="/billing" element={<Billing />} />
        <Route path="/knowledge" element={<Knowledge />} />
        <Route path="/ai-insights" element={<AIInsights />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/resources" element={<Resources />} />
        <Route path="/subscription" element={<Subscription />} />
        <Route path="/reports" element={<Reports />} />
        <Route path="/proposals" element={<Proposals />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/portal" element={<Portal />} />
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AppLayout>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
