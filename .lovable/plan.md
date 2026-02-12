

# Decorador.net — Plano de Implementação Frontend

## Fase 1: Design System & Fundação
Configurar os tokens visuais (CSS variables) com a paleta magenta (#FC2F68), gradiente rosa→roxo, azul acinzentado (#658095), backgrounds claros. Fonte Poppins via Google Fonts. Criar todos os componentes base reutilizáveis: Button (primário magenta, secundário outline), Card (border-radius 12px, sombra leve), Badge, Input, Textarea, Select, Switch, Tabs, Modal (Dialog), Toast, Skeleton, EmptyState. Criar rota `/ui-kit` (dev only) exibindo todos os componentes para validação visual.

## Fase 2: Layout & Navegação
- **Navbar pública** fixa: logo "decoradornet", links (Explorar, Decoradores, Blog, Entrar), CTA magenta "Começar agora". Hambúrguer no mobile.
- **Footer** limpo com links (Termos, Help Desk, Contato, redes sociais).
- **Layout Portal** (logado): topbar clara com logo "d" em quadrado, menus horizontais (Projetos, Vitrine, Mensagens, Ganhe Tips), avatar do usuário.

## Fase 3: Landing Page Completa (/)
Reproduzir fielmente as telas de referência, mobile-first:
1. **Hero** com título display gigante "decor ação online" sobrepondo imagem de ambiente, subtexto cinza, CTAs magenta + link outline
2. **Seção "Porque morar bem, faz bem pra alma"** com ênfase em magenta
3. **Seção 1/2/3 passos** com números grandes translúcidos ao fundo ("Descubra seu estilo", "Conte o que você precisa", "Seu sonho se torna realidade")
4. **Seção projetos** com grid de imagens + CTA "Veja mais projetos"
5. **Seção parceiros** com logos (placeholders) + botões outline "Quer ser um parceiro?" e "Cupons de desconto"
6. **Seção stats/depoimentos** fundo azul acinzentado (#658095): +40.000 projetos, +7.000 decoradores, cards de testimonials com estrelas
7. **Seção Pricing** gradiente rosa→roxo com preço "R$ 319,00" e checklist de itens inclusos
8. **Seção "Você é decorador?"** com CTA "Cadastrar como decorador"

## Fase 4: Rotas Públicas
- **/explorar**: listagem de projetos em cards com imagens
- **/explorar/:id**: viewer de projeto fullscreen com margens escuras, barra de thumbnails, perfil do decorador, lista de compras, controles Produtos/Infos com switch toggle
- **/login, /cadastro, /esqueci-senha**: formulários com react-hook-form + zod, role selector (Cliente ou Profissional)

## Fase 5: Integração API & Auth
- Configurar HTTP client com interceptor de token (Bearer), refresh em 401 → redirect /login
- Context de autenticação: signup, signin, forgot-password, GET /me
- Guard de rotas protegidas baseado em role (CLIENT, PROFESSIONAL, ADMIN)
- Tratamento padronizado de erros com toasts amigáveis
- Paginação padrão (page/limit) e estados de loading (skeletons)

## Fase 6: Portal do Cliente
- **Dashboard**: cards resumo, projetos recentes, CTA "Criar projeto"
- **Criar Briefing (wizard/stepper)**: cards quadrados selecionáveis (magenta quando ativo com ícone branco), switches on/off, input de metragem, upload de fotos, textarea de observações. Painel lateral "Projeto Completo" em gradiente rosa→roxo com checklist (sticky desktop, colapsável mobile)
- **Lista de projetos**: paginada com filtros por status (badges coloridos)
- **Detalhe do projeto**: header com status, área de chat, botões condicionais (Aprovar/Revisão quando DELIVERED, Avaliar quando COMPLETED)
- **Match de profissionais**: cards com avatar, tags de estilo, CTA "Atribuir" com modal de preço

## Fase 7: Portal do Profissional
- **Dashboard**: projetos atribuídos, status e ações rápidas
- **Meu Perfil**: edição de bio, cidade/estado, experiência, dados bancários
- **Portfólio CRUD**: upload de imagens, descrição, gerenciamento
- **Estilos CRUD**: gerenciar estilos de decoração
- **Projetos atribuídos**: listagem paginada, ações aceitar/entregar
- **Pagamentos**: saldo atual, histórico, solicitar saque

## Fase 8: Portal Admin
- **Dashboard KPIs**: métricas gerais da plataforma
- **Aprovação de profissionais**: lista de pendentes com ações aprovar/rejeitar
- **Saques pendentes**: processar pagamentos
- **Gerenciamento de usuários**: toggle ativo/inativo

## Fase 9: Chat Realtime (Socket.IO)
- Conexão socket.io-client no namespace /chat
- joinProject, sendMessage, listener newMessage
- UI de chat com bolhas estilizadas, timestamps, anexos (imagem/pdf), indicador de envio, empty state

## Fase 10: Tela "Seu projeto está pronto!"
Tela de entrega inspirada na referência: fundo com imagem de ambiente, overlay claro, título grande com "está pronto!" em magenta, grid de thumbnails do projeto, bloco do profissional (avatar, handle), CTA magenta "Avaliar entrega", links para pagamentos e visualização.

## Fase 11: Polimento & Responsividade
- Revisão mobile (320px → desktop) em todas as telas
- Ajustar clamp() nos títulos, line-wrap em cards
- Painéis laterais colapsáveis no mobile
- Microinterações (transitions 150-250ms)
- Acessibilidade: foco visível, ARIA labels, contraste
- `.env.example` com VITE_API_URL e README atualizado

