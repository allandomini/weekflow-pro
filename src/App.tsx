import React from 'react';
import { AuthProvider } from './hooks/useAuth';
import { SupabaseAppProvider } from './contexts/SupabaseAppContext';
import { AnimationProvider } from './contexts/AnimationContext';
import TranslationProvider from './components/TranslationProvider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from './components/ui/toaster';
import { TooltipProvider } from './components/ui/tooltip';
import { Layout } from './components/Layout';
import { useAuth } from "./hooks/useAuth";
import AppLoadingWrapper from './components/AppLoadingWrapper';
import Dashboard from "./pages/Dashboard";
import Calendar from "./pages/Calendar";
import Projects from "./pages/Projects";
import Finances from "./pages/Finances";
import Network from "./pages/Network";
import NotFound from "./pages/NotFound";
import Settings from "./pages/Settings";
import ProjectDetail from "./pages/ProjectDetail";
import ProjectCanvas from "./pages/ProjectCanvas";
import Clockify from "./pages/Clockify";
import Plaky from "./pages/Plaky";
import Auth from "./pages/Auth";
import Historico from "./pages/Historico";
import Routines from "./pages/Routines";
import { GeminiChat } from "./components/GeminiChat";

const queryClient = new QueryClient();

// Protected route component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  
  // Wait for auth to finish loading before redirecting
  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="text-lg">Verificando autenticação...</div>
    </div>;
  }
  
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TranslationProvider>
        <AnimationProvider>
          <SupabaseAppProvider>
            <TooltipProvider>
              <Toaster />
              <BrowserRouter future={{
                v7_startTransition: true,
                v7_relativeSplatPath: true
              }}>
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
                        <Route path="/projects/:projectId/canvas" element={<ProjectCanvas />} />
                        <Route path="/routines" element={<Routines />} />
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
                    <AppLoadingWrapper />
                  </ProtectedRoute>
                } />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </SupabaseAppProvider>
      </AnimationProvider>
    </TranslationProvider>
  </AuthProvider>
</QueryClientProvider>
);

export default App;
