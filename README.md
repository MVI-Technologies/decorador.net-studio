# Decorador.net — Frontend

Frontend do **Decorador.net**, marketplace de decoração online que conecta clientes a profissionais de design de interiores. Desenvolvido com **React**, **Vite** e **TypeScript**.

## Stack

- React 18 + Vite 5 + TypeScript
- Tailwind CSS (design system com tokens: magenta, gradiente rosa→roxo, azul acinzentado)
- React Router, TanStack Query, Axios, Socket.io-client
- React Hook Form + Zod, Radix UI (shadcn/ui), Lucide React

## Pré-requisitos

- Node.js 18+
- Backend do Decorador.net rodando em `http://localhost:3000` (API em `http://localhost:3000/api/v1`)

## Configuração

1. Clone o repositório e instale as dependências:

```sh
npm install
```

2. Crie um arquivo `.env` na raiz (ou use o `.env.example` como base):

```env
# URL base da API backend
VITE_API_URL=http://localhost:3000/api/v1
```

3. **CORS**: no backend, inclua `http://localhost:5173` (ou a porta do Vite) em `CORS_ORIGINS`.

4. **WebSocket (chat)**: em desenvolvimento o Socket.io usa a mesma origem do backend (ex.: `http://localhost:3000`), namespace `/chat`.

## Desenvolvimento

```sh
npm run dev
```

Abre em [http://localhost:5173](http://localhost:5173). A API é chamada em `VITE_API_URL`; em 401 o token é limpo e o usuário é redirecionado para `/login`.

## Build

```sh
npm run build
```

Saída em `dist/`. Para preview:

```sh
npm run preview
```

## Rotas principais

| Rota | Descrição |
|------|-----------|
| `/` | Landing (hero, passos, projetos, stats, pricing, CTA decorador) |
| `/explorar` | Listagem pública de projetos/decoradores |
| `/explorar/:id` | Detalhe/viewer do profissional |
| `/login`, `/cadastro`, `/esqueci-senha` | Autenticação |
| `/ui-kit` | Design system (tipografia, botões, cards, etc.) — dev |
| `/app` | Portal logado (dashboard por role) |
| `/app/novo-briefing` | Criar briefing (cliente) |
| `/app/projetos` | Lista de projetos |
| `/app/projetos/:id` | Detalhe do projeto + chat |
| `/app/projetos/:id/match` | Match e atribuir profissional (cliente) |
| `/app/projetos/:id/pronto` | Tela “Seu projeto está pronto!” |
| `/app/meu-perfil` | Perfil profissional (estilos, portfólio) |
| `/app/pagamentos` | Saldo e saques (profissional) |
| `/app/profissionais-pendentes`, `/app/saques`, `/app/usuarios` | Admin |

## Papéis (roles)

- **CLIENT**: briefing, match, atribuir profissional, chat, aprovar/revisão, avaliar.
- **PROFESSIONAL**: perfil, portfólio, estilos, aceitar/entregar projetos, saldo/saques.
- **ADMIN**: aprovar profissionais, processar saques, gerenciar usuários.

Menus e rotas do portal são exibidos conforme `user.role` (dados de `GET /auth/me`).

## Pagamento PIX (MVP)

Fluxo manual via PIX:

1. **Admin** configura a chave PIX em **Configurações** (Chave PIX): `GET/PATCH /admin/settings/pix` (`pixKey`, `pixKeyType`: CPF, CNPJ, EMAIL, PHONE, RANDOM).
2. **Cliente** atribui profissional e valor (`POST /projects/:id/assign`) → pagamento criado com status **PENDING**.
3. Na **página de pagamento** do projeto (`/app/projetos/:id/pagamento`), o front chama `GET /payments/project/:projectId/pix-info` e exibe valor, chave e **QR code PIX** (se o backend enviar `pixPayload`).
4. Cliente paga via PIX fora do sistema. **Admin** marca recebido em **Pagamentos aguardando recebimento**: `PATCH /admin/payments/:id/mark-received` → status **IN_ESCROW**.
5. Admin repassa o valor ao profissional fora do sistema. **Admin** marca pago em **Pagamentos a repassar**: `PATCH /admin/payments/:id/mark-paid-to-professional` → status **RELEASED**; o profissional vê o valor no saldo.

## Design system

Tokens em `src/index.css`: `--primary` (magenta), gradiente brand, `--highlight` (azul acinzentado), backgrounds e tipografia display. Componentes base em `src/components/ui/`. Use `/ui-kit` para validar a fidelidade visual.

---

© Decorador.net
