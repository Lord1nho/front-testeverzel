# front-testeverzel

Frontend em Next.js para a Plataforma de Eventos e Ingressos do teste tecnico Verzel.

## Stack

- Next.js com App Router
- TypeScript
- Tailwind CSS
- ESLint
- API HTTP externa em Express

## Requisitos

- Node.js 22 ou superior
- npm
- Backend Express rodando localmente

## Instalacao

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

No Windows PowerShell, se `npm` for bloqueado pela politica de scripts, use:

```bash
npm.cmd install
npm.cmd run dev
```

## Ambiente

Crie `.env.local` a partir de `.env.local.example`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3333
```

O token do TMDb pertence somente ao backend. Nao exponha `TMDB_ACCESS_TOKEN` no frontend.

## Estrutura Inicial

- `src/app`: rotas do App Router, organizadas por route groups.
- `src/lib/api-client.ts`: cliente HTTP central para chamadas ao backend.
- `src/config/routes.ts`: mapa central das rotas planejadas.
- `src/features`: modulos por dominio.
- `src/components`: componentes compartilhados.
- `src/types`: tipos globais do frontend.

## Rotas Planejadas

- `/login`
- `/events`
- `/events/[id]`
- `/checkout/[eventId]`
- `/my-tickets`
- `/tickets/[code]`
- `/organizer/events`
- `/organizer/events/new`
- `/organizer/events/[id]`
- `/gate`

## Usuarios de Teste

Os usuarios seedados devem ser mantidos no backend e documentados aqui quando as credenciais finais estiverem definidas:

- Organizador: `ORGANIZER`
- Cliente: `CUSTOMER`
- Portaria: `GATE`

## Fluxo de Avaliacao

Quando os casos de uso forem implementados, validar:

- login por papel;
- listagem e busca de eventos publicados;
- compra aprovada;
- compra recusada;
- meus ingressos;
- visualizacao de QR Code ou codigo do ingresso;
- validacao pela portaria;
- responsividade basica.

## Decisoes de UI

- Primeira experiencia deve parecer produto, nao landing page generica.
- Telas devem priorizar tarefa, leitura rapida e estados claros.
- O mapa de assentos deve ter legenda sempre visivel.
- A portaria deve apresentar retorno de validacao muito evidente.

## Uso de IA

Este repositorio pode registrar apoio de IA na organizacao inicial, documentacao e implementacao assistida. As decisoes finais de escopo, comportamento e validacao devem permanecer documentadas no projeto.

## Limitacoes Conhecidas

- Casos de uso ainda nao implementados.
- Backend precisa estar disponivel para qualquer chamada real.
- Credenciais seedadas finais ainda dependem do backend.
- No login, um e-mail com formato invalido (mas que passa pela validacao nativa do navegador) recebe uma mensagem diferente ("E-mail invalido.", erro de validacao do Zod, 400) da mensagem de senha errada ("Credenciais invalidas.", 401). E um comportamento conhecido e aceito, nao um bug — o formulario ja usa `type="email"`, entao a maioria dos formatos invalidos e barrada pelo proprio navegador antes mesmo de chegar no backend.
