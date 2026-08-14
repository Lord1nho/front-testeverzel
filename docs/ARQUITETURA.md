# CineVerzel — Arquitetura do Frontend (Next.js)

> Documentação estrutural do frontend, baseada exclusivamente no código presente na branch `dev`. Descreve como o projeto está organizado hoje — pastas, módulos, rotas, componentes, comunicação com a API e fluxo de dados — sem propor mudanças.

## Stack

- **Next.js 16** (App Router), **React 19**, **TypeScript**
- **Tailwind CSS v4** (tokens de cor via `globals.css`, sem biblioteca de componentes)
- **jsqr** — decodificação de QR Code pela câmera (portaria)
- **react-qr-code** — geração do QR Code do ingresso
- Sem gerenciador de estado global (Redux/Zustand/Context de dados) e sem biblioteca de data-fetching (React Query/SWR) — cada página controla seu próprio estado com `useState`/`useEffect`

## 1. Estrutura geral de pastas

```
src/
├── app/                  # Rotas (App Router) — uma pasta por rota, agrupadas por papel
│   ├── (auth)/login/
│   ├── (customer)/       # rotas do cliente: events, checkout, my-tickets, tickets
│   ├── (organizer)/      # rotas do organizador + layout.tsx com guarda de papel
│   ├── (gate)/gate/       # rota da portaria
│   ├── profile/           # perfil (comum aos 3 papéis)
│   ├── layout.tsx         # layout raiz (fontes, ToastProvider, <html>/<body>)
│   ├── page.tsx           # "/" — redireciona pra /events
│   └── globals.css        # tokens de cor, tema, scrollbar/flip customizados
├── components/            # componentes de UI reutilizáveis entre páginas
│   └── toast/              # ToastProvider (contexto global de notificação)
├── features/               # componentes específicos de um domínio/fluxo
│   ├── checkout/, events/, gate/, organizer/, tickets/
├── services/               # uma função por chamada à API (camada de acesso a dados)
├── lib/                     # api-client, formatação, agrupamento, tokens de UI
├── types/                   # tipos TypeScript espelhando os contratos da API
├── config/                  # rotas nomeadas (routes.ts)
└── hooks/                   # pasta existe (scaffold), sem hooks customizados hoje
```

Grupos de rota entre parênteses — `(auth)`, `(customer)`, `(organizer)`, `(gate)` — são só organização de pastas do App Router: não aparecem na URL. `profile/` fica fora de qualquer grupo porque é comum aos três papéis.

## 2. Responsabilidade de cada pasta principal

| Pasta | Responsabilidade |
|---|---|
| `app/` | Uma página por rota (`page.tsx`), sempre Client Component (`"use client"`). Cada página busca seus próprios dados, guarda seu próprio estado de autenticação/carregamento/erro e monta o JSX final. Não há camada de "container/view" separada. |
| `components/` | Componentes usados por **mais de uma página**, sem lógica de negócio própria — recebem dados prontos via props (`MovieCard`, `TicketCard`, `ToastProvider`). |
| `features/` | Componentes **acoplados a um fluxo específico** (ex.: `SeatMap` só existe no checkout, `EventForm` só no organizador). Organizados em subpastas por domínio. |
| `services/` | Uma função por endpoint da API. Nenhuma tem estado — só chamam `apiClient` e devolvem a Promise tipada. É a única camada que sabe o *path* de cada rota da API. |
| `lib/` | Utilitários puros sem dependência de React: cliente HTTP (`api-client.ts`), formatação de data/moeda (`format.ts`), agrupamento de eventos por filme/data (`group-events.ts`), rótulos de cinema (`venue.ts`). |
| `types/` | Interfaces/types TypeScript que espelham exatamente o formato de resposta da API (um arquivo por domínio: `auth`, `event`, `reservation`, `payment`, `ticket`, `gate`, `catalog`). |
| `config/routes.ts` | Único lugar com os *paths* de página do Next (`appRoutes`) e a lógica de "home por papel" (`roleHomeRoute`). Nenhuma página tem uma URL hardcoded. |
| `hooks/` | Existe como pasta (scaffold do projeto), mas não há nenhum hook customizado implementado — toda a lógica de estado fica direto nos componentes de página com `useState`/`useEffect`. |

## 3. Principais módulos e funcionalidades do sistema

| Módulo (pasta em `features/`) | Funcionalidade |
|---|---|
| `features/checkout/` | Seleção de assentos (`SeatMap`), resumo do pedido (`CheckoutSummary`), formulário de cartão simulado (`PaymentForm`), resultado do pagamento (`PaymentOutcome`) |
| `features/events/` | Hero de destaque na listagem (`EventHero`), botão de horário com efeito de flip (`SessionTimeButton`) |
| `features/gate/` | Validação de ingresso na portaria: formulário de código manual (`GateValidationForm`), leitor de câmera (`QrCodeScanner`), exibição do resultado (`ValidationResult`) |
| `features/organizer/` | Formulário único de criação **e** edição de evento (`EventForm`) — decide o modo pela presença de `eventId` |
| `features/tickets/` | QR Code do ingresso (`QrTicket`), cartão de detalhe do ingresso (`TicketDetailCard`) |

Funcionalidades cobertas pelo conjunto do app: login, listagem e detalhe de eventos publicados, reserva de assentos, pagamento simulado com retentativa, emissão e listagem de ingressos, compartilhamento público de ingresso, validação de ingresso na portaria (manual ou por câmera), CRUD de eventos pelo organizador (criar a partir de catálogo TMDb, editar, publicar, excluir), perfil do usuário.

## 4. Rotas / páginas existentes

| Rota | Arquivo | Papel | O que representa |
|---|---|---|---|
| `/` | `app/page.tsx` | — | Redireciona (`redirect`) direto pra `/events`; não renderiza nada |
| `/login` | `app/(auth)/login/page.tsx` | público | Formulário de e-mail/senha; se veio de um redirecionamento com origem (`?from=`), mostra link pra voltar |
| `/events` | `app/(customer)/events/page.tsx` | público | Vitrine de filmes em cartaz (hero + carrossel), agrupados por filme; header muda conforme o papel logado |
| `/events/[id]` | `app/(customer)/events/[id]/page.tsx` | público | Detalhe do filme/evento: sinopse, sessões agrupadas por data e cinema |
| `/checkout/[eventId]` | `app/(customer)/checkout/[eventId]/page.tsx` | CUSTOMER | Fluxo completo: mapa de assentos → reserva → pagamento (até 3 tentativas) → resultado |
| `/my-tickets` | `app/(customer)/my-tickets/page.tsx` | CUSTOMER | Lista de ingressos do cliente, com abas "Próximos"/"Anteriores" |
| `/tickets/[ticketId]` | `app/(customer)/tickets/[ticketId]/page.tsx` | CUSTOMER | Detalhe de um ingresso (QR + dados) e geração de link de compartilhamento |
| `/tickets/shared/[token]` | `app/(customer)/tickets/shared/[token]/page.tsx` | público | Visualização do ingresso via link compartilhado, sem exigir login |
| `/organizer/events` | `app/(organizer)/organizer/events/page.tsx` | ORGANIZER | Painel do organizador: abas "Meus eventos"/"Todos os eventos" |
| `/organizer/events/new` | `app/(organizer)/organizer/events/new/page.tsx` | ORGANIZER | Criação de evento a partir do catálogo TMDb (usa `EventForm` sem `eventId`) |
| `/organizer/events/[id]` | `app/(organizer)/organizer/events/[id]/page.tsx` | ORGANIZER | Edição de evento existente (usa `EventForm` com `eventId`) |
| `/gate` | `app/(gate)/gate/page.tsx` | GATE | Validação de ingresso — leitura por câmera ou digitação manual, em duas etapas (buscar sessão → confirmar) |
| `/profile` | `app/profile/page.tsx` | qualquer autenticado | Dados do usuário, atalhos de navegação por papel, logout |

`app/(organizer)/layout.tsx` é o único guard de acesso centralizado: envolve todas as rotas de `/organizer/*` e redireciona/bloqueia antes mesmo da página específica renderizar. Nas demais áreas (`/checkout`, `/my-tickets`, `/tickets/[ticketId]`, `/gate`), cada página faz sua própria checagem de papel via `getMe()`.

## 5. Componentes compartilhados e onde são utilizados

| Componente | Local | Usado em |
|---|---|---|
| `ToastProvider` / `useToast` | `components/toast/ToastProvider.tsx` | Envolve toda a aplicação em `app/layout.tsx`; `useToast()` é chamado em praticamente toda página que faz uma ação (login, checkout, portaria, organizador, ingresso) |
| `MovieCard` | `components/MovieCard.tsx` | Carrossel de `/events` — um card por filme, com badge de status (Em Cartaz/Esgotado) |
| `TicketCard` | `components/TicketCard.tsx` | Lista de `/my-tickets` — um card por ingresso |
| `SessionTimeButton` | `features/events/SessionTimeButton.tsx` | `/events/[id]` — um botão por horário de sessão |
| `QrTicket` | `features/tickets/QrTicket.tsx` | `/tickets/[ticketId]` **e** `/tickets/shared/[token]` — mesmo componente pro dono do ingresso e pra visualização pública |
| `TicketDetailCard` | `features/tickets/TicketDetailCard.tsx` | Mesmas duas rotas acima |
| `GateValidationForm` | `features/gate/GateValidationForm.tsx` | `/gate`, usado tanto na etapa de busca quanto reaproveitado (mesmo componente, textos diferentes via props) |

## 6. Hooks, services, contexts/providers e utilitários

**Contexts/Providers**
- `ToastProvider` (`components/toast/ToastProvider.tsx`) — único Context da aplicação. Expõe `success/error/info` via `useToast()`. Fica montado no layout raiz, então sobrevive a navegações entre páginas.

**Hooks**
- Não há hooks customizados (`use*`) no projeto — pasta `hooks/` existe mas está vazia. Toda página usa `useState`/`useEffect`/`useMemo`/`useCallback` do React diretamente.

**Services** (`src/services/*.ts`) — uma função por endpoint, todas tipadas com os tipos de `types/`:
| Arquivo | Endpoints cobertos |
|---|---|
| `auth.ts` | `login`, `getMe`, `logout` |
| `catalog.ts` | `getNowPlaying`, `searchMovies`, `getMovieDetails` (proxy pro TMDb via backend) |
| `events.ts` | `listEvents`, `getEvent`, `createEvent`, `updateEvent`, `publishEvent`, `deleteEvent` (CRUD do organizador) |
| `public-events.ts` | `listPublishedEvents`, `getPublishedEvent`, `getEventSeats` (leitura pública) |
| `reservations.ts` | `createReservation`, `getReservation`, `cancelReservation` |
| `payments.ts` | `createPayment` |
| `tickets.ts` | `listTickets`, `getTicket`, `shareTicket` |
| `public-tickets.ts` | `getPublicTicket` (via token de compartilhamento) |
| `gate.ts` | `validateTicket`, `findTicketEvent` |

**Utilitários** (`src/lib/*.ts`)
- `api-client.ts` — cliente HTTP central (detalhado na seção 7)
- `format.ts` — `formatEventDate/Time/DateTime`, `formatSessionDateParts` (dia da semana + dd/mm empilhados), `formatCurrency`, conversões de `datetime-local`, `formatApiErrorMessage` (troca timestamps ISO crus dentro de mensagens de erro por data formatada em pt-BR)
- `group-events.ts` — `groupEventsByMovie` (agrupa sessões por filme pra vitrine), `isMovieFullyEnded` (filtro de exclusão), `groupSessionsByDateAndVenue` (agrupa sessões de um filme por data/cinema)
- `venue.ts` — rótulos (`venueLabels`) e opções (`venueOptions`) dos cinemas, mapeando o enum `Venue` do backend pra texto em pt-BR

## 7. Como o frontend se comunica com o backend

Toda chamada HTTP passa por **um único cliente central**: `src/lib/api-client.ts`.

- **Base URL**: `NEXT_PUBLIC_API_URL` (variável de ambiente), com fallback pra `http://localhost:3333`
- **Autenticação**: cookie de sessão — toda requisição usa `credentials: "include"`; não há token manual em header
- **Serialização**: se o `body` não for `FormData`/`URLSearchParams`/`Blob`/`ArrayBuffer`/`string`, é serializado como JSON automaticamente e o header `Content-Type: application/json` é setado
- **Erros**: qualquer resposta HTTP não-OK vira uma exceção `ApiError` (`message`, `status`, `issues?`), lançada e tratada em cada página (geralmente com `err instanceof ApiError ? err.message : "mensagem genérica"`)
- **Falha de rede**: se o `fetch` falhar antes de chegar resposta (servidor fora do ar), vira `ApiError("Não foi possível conectar ao servidor.", 0)`
- **`postBeacon`**: variante fire-and-forget com `keepalive: true`, usada só no cleanup do checkout (cancelar reserva ao sair da tela de pagamento sem confirmar) — não espera nem trata resposta

```ts
export const apiClient = {
  get, post, put, patch, delete, postBeacon
};
```

Nenhuma página ou componente monta URL da API diretamente — sempre passa por uma função de `services/`.

## 8. Organização das chamadas à API e gerenciamento de dados/estado

Não existe gerenciador de estado global nem cache de requisições. O padrão é sempre o mesmo, repetido em cada página:

```
useEffect(() => {
  algumService(...)
    .then((data) => setState(data))
    .catch((err) => setError(err instanceof ApiError ? err.message : "mensagem genérica"));
}, [dependências]);
```

- **Estado de autenticação por página**: cada página que exige login mantém seu próprio estado (`AuthState = "loading" | "guest" | "wrong-role" | "customer"`, por exemplo) e chama `getMe()` num `useEffect` — não há um estado de usuário compartilhado entre páginas.
- **Estado derivado**: cálculos como agrupar eventos por filme ou filtrar ingressos por aba usam `useMemo`, recalculados quando os dados brutos mudam.
- **Erros**: ou aparecem inline na própria tela (falha ao carregar a página) ou como toast via `useToast()` (falha em uma ação do usuário, sem travar a tela).
- **Dados sensíveis a mudança de rota** (ex.: página de checkout) usam `useRef` pra guardar valores que precisam sobreviver ao unmount sem disparar re-render (ex.: id da reserva pendente, usado no cleanup que cancela a reserva).

## 9. Fluxo básico das principais funcionalidades — da página até o backend

Estrutura geral, sempre a mesma:

```
Página (app/**/page.tsx, "use client")
  → useState/useEffect (estado local, sem hook/camada intermediária)
  → função de services/*.ts
  → apiClient (lib/api-client.ts) — injeta credentials/URL base, serializa body
  → fetch()
  → Backend (Express)
  → resposta JSON (ou ApiError em caso de falha)
  → setState no componente
  → re-render (dado exibido, toast, e/ou navegação via router.push)
```

**Exemplo — login**: usuário submete o formulário → `login(email, password)` (`services/auth.ts`) → `apiClient.post("/api/auth/login", ...)` → backend valida e devolve `{ user }` + cookie de sessão → página redireciona via `router.push(roleHomeRoute(user.role))`; erro vira `toast.error(...)`.

**Exemplo — reserva de assento**: usuário seleciona assentos no `SeatMap` → clica em confirmar → `createReservation({eventId, seatIds})` (`services/reservations.ts`) → `apiClient.post("/api/reservations", ...)` → backend bloqueia os assentos e devolve a reserva → página troca a tela de seleção pela de pagamento.

**Exemplo — validação na portaria**: código lido/digitado → etapa 1, `findTicketEvent(code)` (`services/gate.ts`, só leitura) → mostra a sessão pro porteiro conferir → etapa 2, `validateTicket({eventId, code, token})` → backend marca o ingresso como usado e devolve o resultado (`VALID`/`INVALID`/`ALREADY_USED`/`WRONG_EVENT` + motivo) → `ValidationResult` exibe o resultado.

Esse padrão — página busca dado num `useEffect`, ação do usuário chama um `service`, resposta atualiza estado local — se repete em todas as 13 rotas da aplicação, sem exceção.
