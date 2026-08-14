# front-testeverzel

## 🔗 Repositórios

### [Frontend — front-testeverzel](https://github.com/Lord1nho/front-testeverzel)
### [Backend — backend-testeverzel](https://github.com/Lord1nho/backend-testeverzel)

Frontend em Next.js para a Plataforma de Eventos e Ingressos do teste técnico Verzel.

> **[Acessar aplicação em produção](https://vzel-cinema.vercel.app/)**

### ⚠️ Observação sobre o ambiente de produção

A aplicação frontend está publicada na **Vercel** e o backend está hospedado no **Render**.

Como o backend pode entrar em modo de *sleep* após um período de inatividade, **a primeira requisição pode levar alguns segundos a mais para responder**. Caso a aplicação pareça estar carregando por mais tempo no primeiro acesso ou após um período sem utilização, aguarde alguns instantes e tente novamente. As requisições seguintes tendem a responder normalmente após o backend ser reativado.

> **Branch para rodar localmente:** use a `master`. É a branch estável e atualizada do projeto — as instruções de instalação e execução abaixo partem dela.

## Stack

* Next.js com App Router
* TypeScript
* Tailwind CSS
* ESLint
* API HTTP externa em Express

## Requisitos

* Node.js 22 ou superior
* npm
* Backend Express rodando localmente

## Instalação

```bash
npm install
cp .env.local.example .env.local
# No Windows:
# copy .env.local.example .env.local

npm run dev
```

No Windows PowerShell, se `npm` for bloqueado pela política de scripts, use:

```bash
npm.cmd install
npm.cmd run dev
```

## Ambiente

Crie `.env.local` a partir de `.env.local.example`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3333
```

O token do TMDb pertence somente ao backend. Não exponha `TMDB_ACCESS_TOKEN` no frontend.

## Estrutura Inicial

* `src/app`: rotas do App Router, organizadas por route groups.
* `src/lib/api-client.ts`: cliente HTTP central para chamadas ao backend.
* `src/config/routes.ts`: mapa central das rotas planejadas.
* `src/features`: módulos por domínio.
* `src/components`: componentes compartilhados.
* `src/types`: tipos globais do frontend.

## Rotas Planejadas

* `/login`
* `/events`
* `/events/[id]`
* `/checkout/[eventId]`
* `/my-tickets`
* `/tickets/[code]`
* `/organizer/events`
* `/organizer/events/new`
* `/organizer/events/[id]`
* `/gate`

## Usuários de Teste

Usuários seedados pelo backend (`prisma/seed.ts`), senha `123456` para todos:

| Papel       | E-mail               | Senha    | Observação                         |
| ----------- | -------------------- | -------- | ---------------------------------- |
| Organizador | `organizer@demo.com` | `123456` | `ORGANIZER`                        |
| Cliente 1   | `cliente1@demo.com`  | `123456` | `CUSTOMER`, já com 1 ingresso pago |
| Cliente 2   | `cliente2@demo.com`  | `123456` | `CUSTOMER`                         |
| Portaria    | `portaria@demo.com`  | `123456` | `GATE`                             |

## Fluxo de Avaliação

Quando os casos de uso forem implementados, validar:

* login por papel;
* listagem e busca de eventos publicados;
* compra aprovada;
* compra recusada;
* meus ingressos;
* visualização de QR Code ou código do ingresso;
* validação pela portaria;
* responsividade básica.

## Decisões de UI

* Primeira experiência deve parecer produto, não landing page genérica.
* Telas devem priorizar tarefa, leitura rápida e estados claros.
* O mapa de assentos deve ter legenda sempre visível.
* A portaria deve apresentar retorno de validação muito evidente.

## Uso de IA

Este repositório pode registrar apoio de IA na organização inicial, documentação e implementação assistida. As decisões finais de escopo, comportamento e validação devem permanecer documentadas no projeto.

## Limitações Conhecidas

* Backend precisa estar disponível para qualquer chamada real.
* No login, um e-mail com formato inválido (mas que passa pela validação nativa do navegador) recebe uma mensagem diferente ("E-mail inválido.", erro de validação do Zod, 400) da mensagem de senha errada ("Credenciais inválidas.", 401). É um comportamento conhecido e aceito, não um bug — o formulário já usa `type="email"`, então a maioria dos formatos inválidos é barrada pelo próprio navegador antes mesmo de chegar no backend.
