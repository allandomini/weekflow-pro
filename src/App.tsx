import { Toaster } from "./components/ui/toaster";
import { TooltipProvider } from "./components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { SupabaseAppProvider } from "./contexts/SupabaseAppContext";

import { useAuth } from "./hooks/useAuth";
import { Layout } from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import Calendar from "./pages/Calendar";
import Projects from "./pages/Projects";
import Finances from "./pages/Finances";
import Network from "./pages/Network";
import NotFound from "./pages/NotFound";
import Settings from "./pages/Settings";
import ProjectDetail from "./pages/ProjectDetail";
import Clockify from "./pages/Clockify";
import Plaky from "./pages/Plaky";
import Auth from "./pages/Auth";
import Historico from "./pages/Historico";
import { GeminiChat } from "./components/GeminiChat";

const queryClient = new QueryClient();

// Protected route component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <SupabaseAppProvider>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/*" element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/calendar" element={<Calendar />} />
                    <Route path="/projects" element={<Projects />} />
                    <Route path="/projects/:projectId" element={<ProjectDetail />} />
                    <Route path="/finances" element={<Finances />} />
                    <Route path="/network" element={<Network />} />
                    <Route path="/clockify" element={<Clockify />} />
                    <Route path="/plaky" element={<Plaky />} />
                    <Route path="/historico" element={<Historico />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                  <GeminiChat />
                </Layout>
              </ProtectedRoute>
            } />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </SupabaseAppProvider>
  </QueryClientProvider>
);

export default App;
