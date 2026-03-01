# Backend: Projeto IN_PROGRESS sem aceite do profissional

## Fluxo correto

O projeto **só** deve ir para IN_PROGRESS quando o **admin confirmar o recebimento do PIX** do cliente. Até lá, fica em PROFESSIONAL_ASSIGNED.

## O que o backend precisa fazer

### 1. POST /proposals/:proposalId/respond (action: accept)

Ao cliente aceitar a proposta:

- Proposta → **ACCEPTED**
- Projeto → **PROFESSIONAL_ASSIGNED** (não IN_PROGRESS)
- Pagamento → novo registro com status **PENDING** (amount, platformFee, professionalAmount calculados da proposta)
- Profissional → continua atribuído via professionalProfileId

O profissional não precisa clicar em "Aceitar projeto"; o projeto já aparece atribuído a ele, mas ainda sem botão "Entregar".

### 2. PATCH /admin/payments/:id/mark-received

Quando o admin marcar o pagamento como recebido:

- Pagamento → **IN_ESCROW**
- Projeto → **IN_PROGRESS**

Somente a partir daí o profissional pode clicar em "Entregar".

### 3. POST /professionals/me/projects/:id/accept

Pode ser removido ou mantido sem uso; o frontend não chama mais.

### 4. POST /professionals/me/projects/:id/deliver

Permitir entrega quando o status for **IN_PROGRESS** ou **REVISION_REQUESTED**.  
(PROFESSIONAL_ASSIGNED pode ser mantido para compatibilidade com projetos antigos que já tenham pagamento confirmado.)

## Resumo do fluxo

| Etapa | Status do projeto | Pagamento |
|-------|-------------------|-----------|
| Cliente aceita proposta | PROFESSIONAL_ASSIGNED | PENDING |
| Cliente paga PIX | PROFESSIONAL_ASSIGNED | PENDING |
| Admin confirma recebimento | **IN_PROGRESS** | IN_ESCROW |
| Profissional clica "Entregar" | DELIVERED | IN_ESCROW |

## Motivo

O profissional não deve poder entregar o projeto antes do pagamento estar confirmado. IN_PROGRESS só faz sentido após o valor estar com a plataforma (admin marcou recebido).
