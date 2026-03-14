import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/layouts/AppLayout";

import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import UiKit from "./pages/UiKit";
import Login from "./pages/auth/Login";
import Cadastro from "./pages/auth/Cadastro";
import EsqueciSenha from "./pages/auth/EsqueciSenha";
import ResetarSenha from "./pages/auth/ResetarSenha";
import Explorar from "./pages/explorar/Explorar";
import ExplorarDetail from "./pages/explorar/ExplorarDetail";
import BriefingChooser from "./pages/briefing/BriefingChooser";
import BriefingFlow from "./pages/briefing/BriefingFlow";

import Dashboard from "./pages/portal/Dashboard";
import EditarBriefing from "./pages/portal/EditarBriefing";
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

import ProjetosAdmin from "./pages/portal/ProjetosAdmin";
import Chats from "./pages/portal/Chats";
import Propostas from "./pages/portal/Propostas";
import ProjetosDisponiveis from "./pages/portal/ProjetosDisponiveis";
import SelectProfessional from "./pages/portal/SelectProfessional";
import MercadoPagoReturn from "./pages/portal/MercadoPagoReturn";
import AssinaturaProfissional from "./pages/portal/AssinaturaProfissional";
import ConfiguracoesPlataforma from "./pages/portal/ConfiguracoesPlataforma";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <Routes>
            {/* Público */}
            <Route path="/" element={<Index />} />
            <Route path="/explorar" element={<Explorar />} />
            <Route path="/explorar/:id" element={<ExplorarDetail />} />
            <Route path="/login" element={<Login />} />
            <Route path="/cadastro" element={<Cadastro />} />
            <Route path="/esqueci-senha" element={<EsqueciSenha />} />
            <Route path="/redefinir-senha" element={<ResetarSenha />} />
            <Route path="/ui-kit" element={<UiKit />} />
            <Route path="/comecar" element={<BriefingChooser />} />
            <Route path="/comecar/projeto-completo" element={<BriefingFlow mode="completo" />} />
            <Route path="/comecar/consultoria" element={<BriefingFlow mode="consultoria" />} />

            {/* Redirects antigos */}
            <Route path="/app/onboarding" element={<Navigate to="/comecar" replace />} />

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
              <Route path="novo-briefing" element={<Navigate to="/comecar" replace />} />
              <Route path="projetos" element={<ProjectList />} />
              <Route path="chats" element={<Chats />} />
              <Route path="propostas" element={<Propostas />} />
              <Route path="projetos-disponiveis" element={<ProtectedRoute allowedRoles={["PROFESSIONAL"]}><ProjetosDisponiveis /></ProtectedRoute>} />
              <Route path="projetos/:id" element={<ProjectDetail />} />
              <Route path="projetos/:id/editar-briefing" element={<EditarBriefing />} />
              <Route path="projetos/:id/match" element={<Match />} />
              <Route path="projetos/:id/selecionar-profissional" element={<SelectProfessional />} />
              <Route path="projetos/:id/pagamento" element={<PaymentPix />} />
              <Route path="projetos/:id/pagamento/:type" element={<MercadoPagoReturn />} />
              <Route path="projetos/:id/pronto" element={<DeliveryResult />} />
              <Route path="meu-perfil" element={<MeuPerfil />} />
              <Route path="assinatura" element={<ProtectedRoute allowedRoles={["PROFESSIONAL"]}><AssinaturaProfissional /></ProtectedRoute>} />
              <Route path="pagamentos" element={<Pagamentos />} />
              <Route path="configuracoes-pix" element={<ProtectedRoute allowedRoles={["ADMIN"]}><ConfiguracoesPix /></ProtectedRoute>} />
              <Route path="configuracoes-plataforma" element={<ProtectedRoute allowedRoles={["ADMIN"]}><ConfiguracoesPlataforma /></ProtectedRoute>} />
              <Route path="pagamentos-recebidos" element={<ProtectedRoute allowedRoles={["ADMIN"]}><PagamentosRecebidos /></ProtectedRoute>} />
              <Route path="pagamentos-repassar" element={<ProtectedRoute allowedRoles={["ADMIN"]}><PagamentosRepassar /></ProtectedRoute>} />
              <Route path="profissionais-pendentes" element={<ProtectedRoute allowedRoles={["ADMIN"]}><ProfissionaisPendentes /></ProtectedRoute>} />
              <Route path="saques" element={<ProtectedRoute allowedRoles={["ADMIN"]}><Saques /></ProtectedRoute>} />
              <Route path="projetos-admin" element={<ProtectedRoute allowedRoles={["ADMIN"]}><ProjetosAdmin /></ProtectedRoute>} />
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
