import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import UiKit from "./pages/UiKit";
import Login from "./pages/auth/Login";
import Cadastro from "./pages/auth/Cadastro";
import EsqueciSenha from "./pages/auth/EsqueciSenha";
import Explorar from "./pages/explorar/Explorar";
import ExplorarDetail from "./pages/explorar/ExplorarDetail";

import Dashboard from "./pages/portal/Dashboard";
import NovoBriefing from "./pages/portal/NovoBriefing";
import ProjectList from "./pages/portal/ProjectList";
import ProjectDetail from "./pages/portal/ProjectDetail";
import Match from "./pages/portal/Match";
import DeliveryResult from "./pages/portal/DeliveryResult";
import Perfil from "./pages/portal/Perfil";
import MeuPerfil from "./pages/portal/MeuPerfil";
import Pagamentos from "./pages/portal/Pagamentos";
import PaymentPix from "./pages/portal/PaymentPix";
import ConfiguracoesPix from "./pages/portal/ConfiguracoesPix";
import PagamentosRecebidos from "./pages/portal/PagamentosRecebidos";
import PagamentosRepassar from "./pages/portal/PagamentosRepassar";
import ProfissionaisPendentes from "./pages/portal/ProfissionaisPendentes";
import Saques from "./pages/portal/Saques";
import Usuarios from "./pages/portal/Usuarios";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Público */}
            <Route path="/" element={<Index />} />
            <Route path="/explorar" element={<Explorar />} />
            <Route path="/explorar/:id" element={<ExplorarDetail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/cadastro" element={<Cadastro />} />
            <Route path="/esqueci-senha" element={<EsqueciSenha />} />
            <Route path="/ui-kit" element={<UiKit />} />

            {/* Portal (logado) */}
            <Route
              path="/app"
              element={
                <ProtectedRoute>
                  <AppLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="perfil" element={<Perfil />} />
              <Route path="novo-briefing" element={<NovoBriefing />} />
              <Route path="projetos" element={<ProjectList />} />
              <Route path="projetos/:id" element={<ProjectDetail />} />
              <Route path="projetos/:id/match" element={<Match />} />
              <Route path="projetos/:id/pagamento" element={<PaymentPix />} />
              <Route path="projetos/:id/pronto" element={<DeliveryResult />} />
              <Route path="meu-perfil" element={<MeuPerfil />} />
              <Route path="pagamentos" element={<Pagamentos />} />
              <Route path="configuracoes-pix" element={<ProtectedRoute allowedRoles={["ADMIN"]}><ConfiguracoesPix /></ProtectedRoute>} />
              <Route path="pagamentos-recebidos" element={<ProtectedRoute allowedRoles={["ADMIN"]}><PagamentosRecebidos /></ProtectedRoute>} />
              <Route path="pagamentos-repassar" element={<ProtectedRoute allowedRoles={["ADMIN"]}><PagamentosRepassar /></ProtectedRoute>} />
              <Route path="profissionais-pendentes" element={<ProtectedRoute allowedRoles={["ADMIN"]}><ProfissionaisPendentes /></ProtectedRoute>} />
              <Route path="saques" element={<ProtectedRoute allowedRoles={["ADMIN"]}><Saques /></ProtectedRoute>} />
              <Route path="usuarios" element={<ProtectedRoute allowedRoles={["ADMIN"]}><Usuarios /></ProtectedRoute>} />
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
