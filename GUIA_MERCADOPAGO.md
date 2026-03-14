# Guia de Integração e Configuração: Mercado Pago

Este documento contém o passo a passo completo para configurar o recebimento de pagamentos na plataforma **Decorador.net**. O guia está dividido em duas partes:

1. **Para o Cliente (Administrador da Plataforma):** Passos práticos para gerar as credenciais dentro da conta do Mercado Pago dele.
2. **Para a Equipe de Desenvolvimento (Devs):** Como pegar essas credenciais, inseri-las no ambiente e plugar o Webhook.

---

## PARTE 1: Para o Administrador da Plataforma (Cliente)

Olá! Para que a plataforma **Decorador.net** consiga processar os pagamentos dos projetos e administrar os saldos dos profissionais diretamente para a sua conta, precisamos que você gere algumas "chaves de acesso" seguras no Mercado Pago.

Por favor, siga os passos abaixo no seu computador, logado na conta do Mercado Pago que irá **receber o dinheiro**.

### Passo 1: Acesse o Painel de Desenvolvedor
1. Acesse o portal oficial: [Mercado Pago Developers](https://www.mercadopago.com.br/developers/pt/api-docs)
2. Certifique-se de estar logado na sua conta Mercado Pago empresarial/principal.

### Passo 2: Crie a Aplicação da Plataforma
1. No menu superior direito, clique em **Suas integrações**.
2. Clique no botão azul **Criar Aplicação**.
3. **Nome da aplicação:** Preencha como `Decorador net` (ou similar).
4. **Qual produto você vai integrar?** Selecione **Checkout Pro**.
5. Na pergunta sobre plataformas de e-commerce, marque a opção **Não se aplicam a você / Outra plataforma**.
6. Aceite os termos e crie a aplicação.

### Passo 3: Gere suas Credenciais de Produção
Para liberar transações financeiras reais, o Mercado Pago precisa aprovar a sua conta.
1. No menu do lado esquerdo da sua nova aplicação, clique em **Credenciais de Produção**.
2. O sistema pedirá que você preencha um formulário rápido sobre a sua indústria, site da plataforma, etc. Preencha os dados com as informações reais do seu negócio.
3. Após a aprovação, a página exibirá as suas chaves reais.
4. **AÇÃO NECESSÁRIA:** Copie o código longo chamado **`Access Token`**. Você precisará enviá-lo para a nossa equipe de desenvolvimento!

### Passo 4: Configure o "Aviso de Pagamento" (Webhook)
O Webhook é o mecanismo que avisa o nosso sistema imediatamente assim que um cliente paga (liberando o saldo no mesmo instante).
1. No painel esquerdo, clique em **Webhooks**.
2. **URL de Produção:** Nossa equipe técnica vai te passar um link (ex: `https://api.seusite.com.br/api/v1/payments/webhook/mercadopago`). Cole ele aqui.
3. Em **Eventos**, marque **APENAS** a caixa chamada: **Pagamentos (payment)**.
4. Clique em **Salvar**.
5. Logo após salvar, irá aparecer um código logo abaixo chamado **`Chave secreta`** (geralmente começa com algumas letras e números longos, ex: `b3c9bc...`).
6. **AÇÃO NECESSÁRIA:** Copie essa **`Chave secreta`**. 

> 📩 **O que enviar para os desenvolvedores?**
> Mande para nós o seu **`Access Token`** (Passo 3) e a **`Chave secreta do Webhook`** (Passo 4). Com isso a mágica acontece!

---

### Estratégia de Juros e Tarifas (Atenção no seu Caixa!)
Sua plataforma possui um sistema inteligente de simulação para evitar que o Mercado Pago engula o seu lucro de Administrador em transações parceladas no cartão de crédito.

* **Se você NÃO for oferecer parcelamento Sem Juros:** A plataforma está programada de fábrica para que os juros de parcelamento fiquem inteiramente por conta do cliente que contratou o projeto. Neste cenário, você (Admin) absorve apenas a tarifa de Recebimento na Hora do MP (cerca de 4,98%) e preserva ~30% do rendimento da sua **Taxa Administrativa livre para você**.
* **Se você FOR oferecer "Sem Juros":** Caso você decida ir nas configurações do seu App do Mercado Pago (Em "Seu Negócio" > "Custos") e configurar parcelamento sem juros, o Mercado Pago vai debitar uma taxa colossal do seu dinheiro na hora do checkout. 
    * **COMO NÃO TOMAR PREJUÍZO:** Sempre que quiser alterar peças no "Sem Juros" do MP, abra primeiro o **Simulador de Parcelas** na aba `Configurações de Taxas` do painel de Admin do Decorador.net. Insira quantas parcelas sem juros você fará, e ele calculará matematicamente pra qual valor você **terá que subir a sua Taxa Administrativa da Plataforma (Ex: Pra uns 45%)** se não quiser ter prejuízo e acabar pagando para o profissional trabalhar.

---
---

## PARTE 2: Para o Time de Desenvolvimento (Devs)

Esta é a cartilha oficial para subida de produção da API da Decorador.net.

### 1. Parametrização do `.env` no Backend
Quando o Admin (cliente) entregar as chaves, configure as seguintes chaves de ambiente no servidor (Vercel, AWS, etc):

\`\`\`env
# URL da sua API em produção (Usado na criação das Preferências do MP)
APP_URL=https://decorador-backend.vercel.app

# URL da aplicação frontend (Redirecionamento Pós-Pagamento)
FRONTEND_URL=https://sua-plataforma-decorador.com

# As chaves que o Admin forneceu
MERCADOPAGO_ACCESS_TOKEN=APP_USR-00000000000-XXXXXXXX...
MERCADOPAGO_WEBHOOK_SECRET=xxxxxxxxxxxxxxxxx
\`\`\`

> 💡 **Nota Importante sobre Segurança:** 
> O frontend NUNCA deve expor essas credenciais ou criar o pagamento. O componente `mercadopago.service.ts` do NestJS (Back-end) já está lidando integralmente com a geração dos checkouts de forma blindada por HMAC (assinatura baseada na `WEBHOOK_SECRET`).

### 2. URL Fixa para entregar ao Cliente
No **Passo 4.2** do tutorial do cliente (Webhook), forneça exatamente a seguinte rota concatenada à sua `APP_URL` configurada no ambiente de produção:

\`\`\`text
https://SEU-DOMINIO-BACKEND-PRODUCAO.com/api/v1/payments/webhook/mercadopago
\`\`\`
*(Se a API base possuir prefixos adicionais de rotas diferentes do MVP criado, adapte!)*

### 3. Checklists de Produção
- [ ] O `MERCADOPAGO_WEBHOOK_SECRET` foi devidamente setado na infraestrutura? Se essa env for omitida, a funcionalidade roda no modo "Bypass (Dev Mode)" sem verificar HMAC de Segurança das assinaturas, o que é um risco fatal num ambiente real (Falsificação Pós-PIX).
- [ ] A VITE_API_URL do frontend `.env` corresponde estritamente ao DNS em produção configurado nos CORS do NestJS?
- [ ] A porta `3000` (Padrão) foi exposta apropriadamente em Cloud?

### Dúvidas na Arquitetura MVP de Pagamentos do Flow de Projetos: 
1. Cliente encerra chat -> Profissional abre modal de Proposta -> Puxa a `platformFeePercentage` do SystemConfig do DB e calcula dinamicamente.
2. Profissional cria a `Proposal` (Estado do Projeto = Negociando).
3. Cliente Aceita e Seleciona Profissional (Estado do Projeto = Aguardando Pagamento).
4. O Backend dispara o endpoint ao Mercado Pago puxando o `maxInstallments` limitando o cartão via property `installments`, amarra com Success_URL (Front) e captura a rota Webhook (Back).
5. Tudo fica em `IN_ESCROW`. E num prazo de N Dias úteis, a tabela de admin gerencia a liquidação manual (Transferência) abatendo da carteira da plataforma.

Pronto para dar deploy! 🚀
