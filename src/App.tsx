import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Login from "./pages/Login";
import Tutores from "./pages/Tutores";
import Pets from "./pages/Pets";
import Agendamentos from "./pages/Agendamentos";
import AgendaProfissional from "./pages/AgendaProfissional";
import Financeiro from "./pages/Financeiro";
import Funcionarios from "./pages/Funcionarios";
import Servicos from "./pages/Servicos";
import Hospedagens from "./pages/Hospedagens";
import NotFound from "./pages/NotFound";
import { useEffect, useState } from "react";
import { supabase } from "./integrations/supabase/client";
import { Session } from "@supabase/supabase-js";

const queryClient = new QueryClient();

// Protected Route Component
const ProtectedRoute = ({ children, session }: { children: React.ReactNode, session: Session | null }) => {
  if (!session) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

const App = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={session ? <Navigate to="/" replace /> : <Login />} />
            <Route element={<ProtectedRoute session={session}><Layout /></ProtectedRoute>}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/tutores" element={<Tutores />} />
              <Route path="/pets" element={<Pets />} />
              <Route path="/agendamentos" element={<Agendamentos />} />
              <Route path="/agenda" element={<AgendaProfissional />} />
              <Route path="/financeiro" element={<Financeiro />} />
              <Route path="/funcionarios" element={<Funcionarios />} />
              <Route path="/servicos" element={<Servicos />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
