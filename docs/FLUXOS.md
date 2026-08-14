# CineVerzel — Documentação de Fluxos e Integração Frontend ↔ Backend

> Documentação técnica gerada a partir do código-fonte real do frontend (branch `dev`), com foco em fluxos de uso e integração com a API. Nenhum endpoint, regra ou comportamento aqui descrito foi inventado — tudo é rastreável a um arquivo específico do repositório.

## Arquitetura de comunicação (visão rápida)

Toda chamada HTTP passa por um único cliente central: [`src/lib/api-client.ts`](../src/lib/api-client.ts).

- **Base URL**: `NEXT_PUBLIC_API_URL` (padrão `http://localhost:3333`).
- **Autenticação**: cookie de sessão (`credentials: "include"` em toda requisição). Não há token manual em header — o backend seta/lê o cookie.
- **Erros**: toda resposta não-OK vira uma `ApiError` (`message`, `status`, `issues?`), lançada como exceção e tratada em cada tela.
- **Sem camada de hooks customizados**: as páginas usam `useState`/`useEffect` diretamente, chamando funções de `src/services/*.ts`, que por sua vez chamam `apiClient`.

Papéis (`src/types/auth.ts`): `ORGANIZER`, `CUSTOMER`, `GATE`. Não há cadastro público nem recuperação de senha — usuários são seedados no backend; o frontend não expõe nenhuma rota para essas ações (por isso elas não aparecem nos fluxos abaixo).

---

## Índice de fluxos identificados

| # | Fluxo | Perfil |
|---|---|---|
| 1 | Login | Todos (não autenticado) |
| 2 | Verificação de sessão / navegação protegida | Todos |
| 3 | Logout | Todos (autenticado) |
| 4 | Listagem pública de eventos | Todos |
| 5 | Detalhes do evento e escolha de sessão | Todos |
| 6 | Reserva de assentos + Pagamento (com retentativa) | CUSTOMER |
| 7 | Cancelamento de reserva | CUSTOMER |
| 8 | Meus ingressos (listagem) | CUSTOMER |
| 9 | Detalhes do ingresso + Compartilhamento | CUSTOMER |
| 10 | Visualização pública de ingresso compartilhado | Todos (sem login) |
| 11 | Perfil do usuário | Todos (autenticado) |
| 12 | Listagem de eventos do organizador (Meus / Todos) | ORGANIZER |
| 13 | Criação de evento a partir do catálogo TMDb | ORGANIZER |
| 14 | Edição e publicação de evento | ORGANIZER |
| 15 | Exclusão de evento | ORGANIZER |
| 16 | Validação de ingresso na portaria | GATE |

Não existem no código: cadastro de usuário, recuperação/troca de senha, busca/filtro textual de eventos (a listagem não tem campo de busca), edição/exclusão de conta, notificações, avaliações. Esses fluxos **não foram documentados** por não existirem.

---

## 1. Login

### Fluxo
```
Usuário acessa /login
   ↓
Preenche e-mail e senha
   ↓
Frontend valida apenas campos obrigatórios (required do HTML)
   ↓
Usuário confirma (Entrar)
   ↓
Frontend chama POST /api/auth/login
   ↓
Backend valida credenciais e define cookie de sessão
   ↓
Frontend recebe o usuário autenticado
   ↓
Interface redireciona para a home do papel (roleHomeRoute)
```

### Funcionalidade
- **Objetivo**: autenticar um usuário seedado e redirecioná-lo para a área do seu papel.
- **Rota**: `/login` — [`src/app/(auth)/login/page.tsx`](../src/app/(auth)/login/page.tsx)
- **Perfil**: qualquer um (tela pública, pré-login)
- **Ação do usuário**: informa e-mail e senha, clica em "Entrar".

### Integração com Backend

| Etapa | Frontend | Backend |
|---|---|---|
| Submissão | `login(email, password)` em [`src/services/auth.ts`](../src/services/auth.ts) | `POST /api/auth/login` |
| Sucesso | recebe `{ user }`, chama `router.push(roleHomeRoute(user.role))` | valida credenciais, seta cookie de sessão httpOnly |
| Falha | captura `ApiError`, dispara `toast.error(err.message)` | responde 4xx com mensagem de erro |

- **Método/Endpoint**: `POST /api/auth/login`
- **Body**: `{ email, password }`
- **Resposta usada**: `{ user: AuthenticatedUser }` → `user.role` decide o redirecionamento (`organizerEvents` / `events` / `gate`)
- **Autenticação necessária**: nenhuma (rota pública)
- **Tratamento de erro**: qualquer erro (credenciais inválidas, servidor fora do ar) vira `toast.error`; formulário reabilita (`isSubmitting=false`)

### Estados do fluxo
- **Carregamento**: botão mostra "Entrando..." e fica desabilitado.
- **Sucesso**: redirecionamento imediato, sem tela intermediária.
- **Erro**: toast com a mensagem da API (ou "Não foi possível conectar ao servidor." se não for `ApiError`); campos permanecem preenchidos.
- **Dados inválidos**: bloqueados no nível do HTML (`required`) antes de chamar a API.

---

## 2. Verificação de sessão / navegação protegida

### Fluxo
```
Usuário acessa uma rota autenticada
   ↓
Frontend chama GET /api/auth/me ao montar a página
   ↓
Backend valida o cookie de sessão
   ↓
   ├─ 200: Frontend libera a tela para o papel correspondente
   ├─ 401 (sem cookie/expirado): Frontend trata como visitante
   └─ role diferente do esperado: Frontend mostra tela de acesso restrito
```

### Funcionalidade
- **Objetivo**: proteger cada tela por papel sem um middleware central — cada página/layout resolve isso individualmente.
- **Rotas envolvidas**: todas as rotas fora de `/login` e `/tickets/shared/[token]`.
- **Perfil**: verificação vale para os três papéis.
- **Ação do usuário**: nenhuma — é automático ao carregar a página.

### Integração com Backend

| Etapa | Frontend | Backend |
|---|---|---|
| Checagem | `getMe()` em `src/services/auth.ts`, chamado em `useEffect` de cada página/layout | `GET /api/auth/me` |
| Sucesso | guarda `user` no estado local; compara `user.role` com o papel esperado da tela | retorna usuário do cookie de sessão |
| Falha (401) | trata como visitante — cada tela decide: tela de login inline, `router.replace(appRoutes.login)`, etc. | responde 401 |

- **Método/Endpoint**: `GET /api/auth/me`
- **Parâmetros**: nenhum (autenticação via cookie)
- **Resposta usada**: `{ user: AuthenticatedUser }`
- **Autenticação necessária**: cookie de sessão
- **Tratamento de erro**: varia por tela — ver tabela de comportamento por página abaixo.

Não existe um componente `RoleGuard` único reaproveitado em todo o projeto — o padrão se repete manualmente:

| Local | Comportamento no 401 | Comportamento no papel errado |
|---|---|---|
| `(organizer)/layout.tsx` (guarda todas as rotas `/organizer/*`) | `router.replace("/login")` | tela "Acesso restrito a organizadores." |
| `/gate` | tela "Entre com uma conta da portaria..." com link de login | tela "Acesso restrito à equipe de portaria." |
| `/checkout/[eventId]` | mantém a tela, mas com `loginHref` no resumo ("Entrar para reservar") | mensagem bloqueando a reserva |
| `/my-tickets` | `router.replace("/login")` | tela "Acesso restrito a clientes." |
| `/tickets/[ticketId]` | `router.replace("/login")` | tela "Acesso restrito a clientes." |
| `/profile` | `router.replace("/login")` | (não se aplica — qualquer papel autenticado acessa) |

### Estados do fluxo
- **Carregamento**: cada tela tem seu próprio estado `"loading"` (`AuthState` union), exibindo "Carregando...".
- **Sucesso**: tela real do papel é renderizada.
- **Sessão expirada / não autenticado**: tratado como estado `"guest"` (visitante).
- **Sem permissão**: tratado como estado `"wrong-role"`, com tela de acesso restrito e link de volta.

---

## 3. Logout

### Fluxo
```
Usuário clica em "Sair" (menu/topo da página) ou "Sair da conta" (perfil)
   ↓
Frontend chama POST /api/auth/logout
   ↓
Backend invalida o cookie de sessão
   ↓
Frontend redireciona para /login
```

### Funcionalidade
- **Objetivo**: encerrar a sessão do usuário.
- **Rotas envolvidas**: presente em `/events`, `/my-tickets`, `/organizer/events`, `/gate`, `/profile`.
- **Perfil**: qualquer usuário autenticado.
- **Ação do usuário**: clica no botão "Sair".

### Integração com Backend

| Etapa | Frontend | Backend |
|---|---|---|
| Clique | `logout()` em `src/services/auth.ts` | `POST /api/auth/logout` |
| Sempre (sucesso ou falha) | `.catch(() => {})` — erro é ignorado — e `router.push(appRoutes.login)` | invalida o cookie |

- **Método/Endpoint**: `POST /api/auth/logout`
- **Body**: nenhum
- **Resposta usada**: nenhuma (o frontend redireciona independentemente do resultado)
- **Autenticação necessária**: cookie de sessão
- **Tratamento de erro**: silencioso por design — falha de rede não impede o redirecionamento para `/login`.

### Estados do fluxo
- Não há estado de carregamento visível nem tela de erro — a ação é imediata e sempre termina em redirecionamento.

---

## 4. Listagem pública de eventos

### Fluxo
```
Usuário acessa /events (ou é redirecionado da home "/")
   ↓
Frontend chama GET /api/public/events
   ↓
Frontend agrupa sessões por filme (groupEventsByMovie)
   ↓
Backend retorna eventos publicados
   ↓
Interface exibe destaque (hero) do primeiro filme + carrossel de cartazes
```

### Funcionalidade
- **Objetivo**: vitrine pública de filmes em cartaz (sessões publicadas).
- **Rota**: `/events` — [`src/app/(customer)/events/page.tsx`](../src/app/(customer)/events/page.tsx)
- **Perfil**: público (não exige login; header muda conforme autenticado ou não)
- **Ação do usuário**: navega pelo carrossel e escolhe um filme.

### Integração com Backend

| Etapa | Frontend | Backend |
|---|---|---|
| Carregamento da lista | `listPublishedEvents()` em `src/services/public-events.ts` | `GET /api/public/events` |
| Verificação de login (paralela, só para exibir "Perfil"/"Fazer login" no header) | `getMe()` | `GET /api/auth/me` |
| Agrupamento | `groupEventsByMovie(events)` em `src/lib/group-events.ts` — agrupa `EventSummary[]` por `catalogItem.id`, ordenando por próxima sessão | — (lógica 100% no frontend) |

- **Método/Endpoint**: `GET /api/public/events`
- **Parâmetros**: nenhum
- **Resposta usada**: `{ events: EventSummary[] }`
- **Autenticação necessária**: nenhuma
- **Tratamento de erro**: mensagem inline na página (`err.message` ou "Não foi possível carregar os eventos.")

### Estados do fluxo
- **Carregamento**: "Carregando eventos..." enquanto `movieGroups` é `null`.
- **Sucesso**: hero do primeiro filme + carrossel `MovieCard` por filme agrupado.
- **Vazio**: "Nenhum evento publicado no momento."
- **Erro**: mensagem em vermelho inline (não usa toast aqui, diferente de outras telas).
- **Sessão**: cabeçalho mostra "Perfil"/"Sair" se autenticado, ou "Fazer login" se não — decidido por `getMe()` em paralelo, sem bloquear a listagem.

---

## 5. Detalhes do evento e escolha de sessão

### Fluxo
```
Usuário clica em um filme na listagem
   ↓
Frontend acessa /events/[id]
   ↓
Frontend chama GET /api/public/events/:id (detalhe) e GET /api/public/events (todas sessões do mesmo filme)
   ↓
Frontend agrupa sessões por data e cinema (groupSessionsByDateAndVenue)
   ↓
Usuário escolhe uma data (abas) e depois um horário
   ↓
Interface navega para /checkout/[eventId] da sessão escolhida
```

### Funcionalidade
- **Objetivo**: mostrar sinopse do filme e todas as sessões (datas/salas/horários) disponíveis para reserva.
- **Rota**: `/events/[id]` — [`src/app/(customer)/events/[id]/page.tsx`](../src/app/(customer)/events/[id]/page.tsx)
- **Perfil**: público
- **Ação do usuário**: seleciona data e depois clica no horário desejado (cada horário é uma sessão/evento específico).

### Integração com Backend

| Etapa | Frontend | Backend |
|---|---|---|
| Detalhe do evento | `getPublishedEvent(id)` | `GET /api/public/events/:id` |
| Sessões do mesmo filme | `listPublishedEvents()`, filtradas no frontend por `catalogItem.id` igual ao do evento aberto | `GET /api/public/events` |
| Escolha de horário | `<SessionTimeButton href={appRoutes.checkout(session.id)}>` — navegação client-side, sem chamada de API | — |

- **Método/Endpoint**: `GET /api/public/events/:id`
- **Parâmetros**: `id` (path)
- **Resposta usada**: `{ event: PublicEventDetail }` — inclui `catalogItem`, `seatsAvailable`, `sessionStatus`
- **Autenticação necessária**: nenhuma
- **Tratamento de erro**: 404 → tela "Evento não encontrado."; outros erros → mensagem inline em vermelho.

### Estados do fluxo
- **Carregamento**: "Carregando evento..." / "Carregando sessões...".
- **Sucesso**: pôster, sinopse, abas de data e cartões de sessão por cinema.
- **Vazio**: "Nenhuma sessão disponível para este filme no momento."
- **Erro**: 404 → tela dedicada com link "← Voltar para eventos"; outros erros → mensagem + mesmo link.
- **Sessão esgotada/indisponível**: botão de horário aparece desabilitado com rótulo "Esgotado" (`seatsAvailable <= 0`) ou não clicável se `sessionStatus !== "SCHEDULED"`.

---

## 6. Reserva de assentos + Pagamento (com retentativa)

Este é o fluxo mais complexo do sistema — concentrado em [`src/app/(customer)/checkout/[eventId]/page.tsx`](../src/app/(customer)/checkout/[eventId]/page.tsx), com sub-componentes `SeatMap`, `CheckoutSummary`, `PaymentForm`, `PaymentOutcome`.

### Fluxo
```
Usuário chega em /checkout/[eventId] a partir de uma sessão escolhida
   ↓
Frontend carrega o evento e o mapa de assentos (GET .../seats)
   ↓
Usuário seleciona até 10 assentos disponíveis no mapa visual
   ↓
Usuário confirma a reserva
   ↓
Frontend chama POST /api/reservations
   ↓
Backend reserva os assentos (bloqueio temporário) e retorna a reserva
   ↓
Interface mostra formulário de pagamento (cartão simulado)
   ↓
Usuário preenche o cartão e confirma
   ↓
Frontend chama POST /api/payments
   ↓
   ├─ Aprovado → Backend emite ingresso(s) → Interface mostra "Pagamento aprovado" + link dos ingressos
   ├─ Recusado, ainda com tentativa disponível (até 3) → assento continua reservado → Interface mostra motivo + tentativa X de 3, permite tentar de novo
   └─ Recusado na 3ª tentativa → Backend encerra a reserva e libera assentos → Interface mostra "Pagamento recusado" definitivo
```

### Funcionalidade
- **Objetivo**: reservar assentos de uma sessão e concluir a compra com pagamento simulado.
- **Rota**: `/checkout/[eventId]`
- **Perfil**: `CUSTOMER` (organizador/portaria veem mensagem de bloqueio; visitante vê "Entrar para reservar")
- **Ação do usuário**: seleciona assentos → confirma reserva → preenche cartão → confirma pagamento (até 3 vezes se recusado).

### Integração com Backend

| Etapa | Frontend | Backend |
|---|---|---|
| Carregar evento | `getPublishedEvent(eventId)` | `GET /api/public/events/:id` |
| Carregar assentos | `getEventSeats(eventId)` (`loadSeats`) | `GET /api/public/events/:id/seats` |
| Confirmar reserva | `createReservation({eventId, seatIds})` | `POST /api/reservations` |
| Pagar | `createPayment({reservationId, card})` | `POST /api/payments` |
| Cancelar (botão explícito) | `cancelReservation(reservation.id)` | `POST /api/reservations/:id/cancel` |
| Cancelar (saída sem confirmar — voltar, fechar aba) | `apiClient.postBeacon(\`/api/reservations/${id}/cancel\`)` no cleanup do `useEffect` de unmount | mesmo endpoint, requisição "fire-and-forget" com `keepalive: true` |

- **`POST /api/reservations`**
  - Body: `{ eventId, seatIds: string[] }`
  - Resposta usada: `{ reservation: Reservation }`
  - Erros: `401` → volta pro estado visitante + toast informativo; `409` (assento já ocupado por outra pessoa) → toast de erro + assentos recarregados; outros → toast com a mensagem da API.

- **`POST /api/payments`**
  - Body: `{ reservationId, card: CardInput }` (`CardInput`: número, nome impresso, mês/ano de validade, cvv — cartões terminados em `0000` são recusados pela simulação do backend)
  - Resposta usada: `PaymentResult` — `{ payment, tickets, attempt, maxAttempts, reservationStatus }`
  - Regra de negócio (validada pelo backend, refletida no front): se `reservationStatus === "PENDING_PAYMENT"`, a reserva **não** foi encerrada — a pessoa ainda tem tentativas e o formulário é remontado limpo; qualquer outro `reservationStatus` (`PAID` ou `PAYMENT_DECLINED` final) fecha o fluxo e mostra `PaymentOutcome`.
  - Erros: `401` → aviso fixo na tela ("Sua sessão expirou.") com link de login (não usa toast, pois a pessoa precisa de tempo para agir); `409` → toast ("reserva já está sendo processada..."); outros → toast genérico.

- **Autenticação necessária**: cookie de sessão (papel `CUSTOMER`) em todas as chamadas de escrita; leitura de evento/assentos é pública.

### Estados do fluxo
- **Carregamento inicial**: "Carregando reserva..." até evento e assentos chegarem.
- **Seleção de assentos**: mapa visual (`SeatMap`) com 3 estados por assento — disponível, selecionado, ocupado; limite de 10 assentos reforçado tanto na UI quanto implicitamente no backend.
- **Confirmando reserva**: botão "Reservando..." desabilitado.
- **Pagando**: botão "Processando...".
- **Sucesso (aprovado)**: `PaymentOutcome` com selo verde, lista de ingressos emitidos, link para "Meus ingressos".
- **Recusado (com tentativas restantes)**: erro inline no formulário ("Tentativa X de 3 — você ainda pode tentar com outro cartão"), campos do cartão limpos automaticamente.
- **Recusado (definitivo)**: `PaymentOutcome` com selo vermelho, aviso de que a reserva foi encerrada e os assentos liberados; botão "Escolher assentos novamente" reinicia o fluxo do zero.
- **Dados inválidos**: validação client-side do cartão antes de chamar a API (regex de número/cvv, mês/ano, cartão vencido) — mensagem de erro no próprio formulário, sem round-trip ao backend.
- **Sem permissão / não logado**: `CheckoutSummary` substitui o botão de confirmar por "Entrar para reservar" (visitante) ou mostra `blockedReason` (papel errado, evento esgotado ou fora do período de venda).
- **Sessão expirada durante o pagamento**: banner fixo vermelho com link de login (distinto do padrão de toast usado no resto da tela).
- **Cancelada**: tela dedicada "Reserva cancelada" com link de volta ao evento.

---

## 7. Cancelamento de reserva

### Fluxo
```
Usuário está na etapa de pagamento (reserva já criada, ainda não paga)
   ↓
Usuário clica em "Cancelar reserva"
   ↓
Frontend chama POST /api/reservations/:id/cancel
   ↓
Backend libera os assentos reservados
   ↓
Interface mostra confirmação de cancelamento
```
Variante implícita (sem clique): se o usuário sai da tela de pagamento por qualquer outro meio (botão "voltar", navegação do browser, fechar aba), o mesmo cancelamento é dispararado via `navigator.sendBeacon` no unmount do componente — ver seção 6.

### Funcionalidade
- **Objetivo**: liberar assentos de uma reserva ainda não paga.
- **Rota**: `/checkout/[eventId]` (mesma tela do pagamento)
- **Perfil**: `CUSTOMER`
- **Ação do usuário**: clique explícito em "Cancelar reserva", ou simplesmente sair da tela.

### Integração com Backend
- **Método/Endpoint**: `POST /api/reservations/:id/cancel`
- **Parâmetros**: `id` da reserva (path)
- **Body**: nenhum
- **Resposta usada**: nenhuma — apenas o sucesso da chamada muda o estado local para `cancelled=true`
- **Autenticação necessária**: cookie de sessão
- **Tratamento de erro**: toast de erro (clique explícito); no cleanup via `postBeacon`, erros são ignorados silenciosamente (é fire-and-forget, sem callback de resposta).

### Estados do fluxo
- **Carregando**: botão "Cancelando..." desabilitado.
- **Sucesso**: tela "Reserva cancelada" com link de volta ao evento.
- **Erro**: toast com a mensagem da API.

---

## 8. Meus ingressos (listagem)

### Fluxo
```
Usuário acessa /my-tickets
   ↓
Frontend verifica sessão (GET /api/auth/me)
   ↓
Frontend chama GET /api/tickets
   ↓
Frontend busca os pôsteres dos eventos únicos (GET /api/public/events/:id por evento)
   ↓
Usuário alterna entre abas "Próximos" e "Anteriores"
   ↓
Interface filtra os ingressos localmente por data da sessão
```

### Funcionalidade
- **Objetivo**: listar os ingressos comprados pelo cliente autenticado.
- **Rota**: `/my-tickets` — [`src/app/(customer)/my-tickets/page.tsx`](../src/app/(customer)/my-tickets/page.tsx)
- **Perfil**: `CUSTOMER`
- **Ação do usuário**: alterna abas "Próximos"/"Anteriores"; clica em um ingresso para ver detalhes.

### Integração com Backend

| Etapa | Frontend | Backend |
|---|---|---|
| Sessão | `getMe()` | `GET /api/auth/me` |
| Listagem | `listTickets()` | `GET /api/tickets` |
| Pôsteres (best-effort, um por evento único) | `Promise.allSettled(eventIds.map(getPublishedEvent))` | `GET /api/public/events/:id` (N chamadas, uma por evento distinto entre os ingressos) |
| Filtro por aba | comparação local `ticket.event.startsAt >= now` | — (sem chamada nova à API) |

- **Método/Endpoint**: `GET /api/tickets`
- **Parâmetros**: nenhum (escopo implícito: ingressos do usuário logado)
- **Resposta usada**: `{ tickets: TicketSummary[] }`
- **Autenticação necessária**: cookie de sessão, papel `CUSTOMER`
- **Tratamento de erro**: 401 no `getMe()` inicial → `router.replace("/login")`; erro em `listTickets()` → mensagem inline; falha ao buscar pôster de um evento específico é ignorada (`Promise.allSettled`, sem afetar a listagem).

### Estados do fluxo
- **Carregamento**: "Carregando..." (sessão) → "Carregando ingressos...".
- **Sucesso**: grade de `TicketCard` com pôster, status (Válido/Utilizado/Cancelado), local e assento.
- **Vazio**: "Nenhum ingresso próximo/anterior encontrado." (mensagem muda conforme a aba).
- **Erro**: mensagem inline em vermelho.
- **Sem permissão**: papel diferente de `CUSTOMER` → tela "Acesso restrito a clientes."
- **Sessão expirada**: redireciona direto para `/login`.

---

## 9. Detalhes do ingresso + Compartilhamento

### Fluxo
```
Usuário clica em um ingresso na listagem
   ↓
Frontend acessa /tickets/[ticketId]
   ↓
Frontend chama GET /api/tickets/:id
   ↓
Interface exibe QR code + dados do ingresso
   ↓
Usuário clica em "Compartilhar ingresso"
   ↓
Frontend chama POST /api/tickets/:id/share
   ↓
Backend gera um token de compartilhamento público
   ↓
Interface monta a URL pública e mostra botão "Copiar link"
   ↓
Usuário clica em "Copiar link" → link vai para a área de transferência
```

### Funcionalidade
- **Objetivo**: exibir o QR code do ingresso (para validação na portaria) e permitir gerar um link público para compartilhar com terceiros.
- **Rota**: `/tickets/[ticketId]` — [`src/app/(customer)/tickets/[ticketId]/page.tsx`](../src/app/(customer)/tickets/[ticketId]/page.tsx)
- **Perfil**: `CUSTOMER` (dono do ingresso)
- **Ação do usuário**: visualiza o QR, opcionalmente gera e copia o link de compartilhamento.

### Integração com Backend

| Etapa | Frontend | Backend |
|---|---|---|
| Carregar ingresso | `getTicket(ticketId)` | `GET /api/tickets/:id` |
| Pôster do evento (best-effort) | `getPublishedEvent(ticket.event.id)` | `GET /api/public/events/:id` |
| Gerar link | `shareTicket(ticketId)` | `POST /api/tickets/:id/share` |
| Copiar | `navigator.clipboard.writeText(shareLink)` | — (só no browser) |

- **`GET /api/tickets/:id`**: resposta usada `{ ticket: TicketDetail }` (inclui `qrValue`, no formato `"<code>.<hmac>"` usado pelo componente `QrTicket` para renderizar o QR — só a parte antes do ponto é exibida como código legível).
- **`POST /api/tickets/:id/share`**: resposta usada `{ shareLink: ShareLink }` → frontend monta `${window.location.origin}/tickets/shared/${shareLink.token}`.
- **Autenticação necessária**: cookie de sessão, papel `CUSTOMER`, e o ingresso precisa pertencer ao usuário (validado no backend).
- **Tratamento de erro**: `401` → `router.replace("/login")`; `404` → tela "Ingresso não encontrado."; erro ao compartilhar → `toast.error`; erro genérico de carregamento → mensagem inline.

### Estados do fluxo
- **Carregamento**: "Carregando..." (sessão) → "Carregando ingresso...".
- **Sucesso**: QR code + cartão com status, evento, assento, código.
- **Gerando link**: botão "Gerando link...".
- **Link gerado**: campo somente leitura com a URL + botão "Copiar link"; ao copiar, `toast.success("Link copiado!")`.
- **Erro ao compartilhar**: `toast.error` com a mensagem da API.
- **Não encontrado**: tela dedicada com link "← Voltar para meus ingressos".
- **Sem permissão**: papel diferente de `CUSTOMER` → "Acesso restrito a clientes."
- **Sessão expirada**: redireciona para `/login`.

---

## 10. Visualização pública de ingresso compartilhado

### Fluxo
```
Terceiro (sem login) acessa /tickets/shared/[token] a partir do link recebido
   ↓
Frontend chama GET /api/public/tickets/:token
   ↓
Backend valida o token e retorna os dados do ingresso
   ↓
Interface exibe o QR code e os dados do ingresso, sem exigir autenticação
```

### Funcionalidade
- **Objetivo**: permitir que qualquer pessoa com o link veja/apresente o ingresso, sem precisar de conta.
- **Rota**: `/tickets/shared/[token]` — [`src/app/(customer)/tickets/shared/[token]/page.tsx`](../src/app/(customer)/tickets/shared/[token]/page.tsx)
- **Perfil**: nenhum — rota pública, não passa por `getMe()`.
- **Ação do usuário**: nenhuma além de abrir o link.

### Integração com Backend
- **Método/Endpoint**: `GET /api/public/tickets/:token`
- **Parâmetros**: `token` (path, do link de compartilhamento)
- **Resposta usada**: `{ ticket: TicketDetail }`
- **Autenticação necessária**: nenhuma
- **Tratamento de erro**: `404` → "Link inválido ou expirado."; outros erros → mensagem inline em vermelho.

### Estados do fluxo
- **Carregamento**: "Carregando ingresso...".
- **Sucesso**: mesmo layout de QR + `TicketDetailCard` da tela autenticada, mas sem ações de compartilhar (`actions` não é passado).
- **Erro / link inválido**: tela dedicada com link "Ver eventos".

---

## 11. Perfil do usuário

### Fluxo
```
Usuário clica em "Perfil"
   ↓
Frontend acessa /profile
   ↓
Frontend chama GET /api/auth/me
   ↓
Interface exibe nome, e-mail, papel, data de cadastro e atalhos por papel
   ↓
Usuário pode navegar para a área do seu papel, voltar, ou sair da conta
```

### Funcionalidade
- **Objetivo**: tela central de conta, com atalhos contextuais por papel e logout.
- **Rota**: `/profile` — [`src/app/profile/page.tsx`](../src/app/profile/page.tsx)
- **Perfil**: qualquer usuário autenticado (mesma tela para os três papéis, conteúdo dos atalhos muda)
- **Ação do usuário**: navega por um atalho de área, ou clica em "Sair da conta".

### Integração com Backend

| Etapa | Frontend | Backend |
|---|---|---|
| Carregar perfil | `getMe()` | `GET /api/auth/me` |
| Logout | `logout()` | `POST /api/auth/logout` |

- **Método/Endpoint**: `GET /api/auth/me`
- **Resposta usada**: `{ user: AuthenticatedUser }` — `name`, `email`, `role`, `createdAt`
- **Autenticação necessária**: cookie de sessão
- **Tratamento de erro**: qualquer falha → `router.replace("/login")` (não há tela de "acesso restrito" aqui, pois a rota exige apenas estar autenticado, não um papel específico)

### Estados do fluxo
- **Carregamento**: "Carregando perfil...".
- **Sucesso**: cartão com iniciais do nome, badge do papel, "Membro desde", lista de atalhos (`Meus eventos` para ORGANIZER; `Ver eventos`/`Meus ingressos` para CUSTOMER; `Validação de ingressos` para GATE) e botão de sair.
- **Sessão expirada**: redireciona para `/login`.

---

## 12. Listagem de eventos do organizador (Meus / Todos)

### Fluxo
```
Organizador acessa /organizer/events
   ↓
Layout do grupo (organizer) valida papel (GET /api/auth/me)
   ↓
Frontend chama GET /api/events (aba "Meus eventos") ou GET /api/public/events (aba "Todos os eventos")
   ↓
Interface exibe tabela com status, capacidade, preço e ação por linha
   ↓
Organizador alterna de aba ou clica em "Editar"/"Ver"/"+ Novo evento"
```

### Funcionalidade
- **Objetivo**: painel do organizador para acompanhar seus próprios eventos (incluindo rascunhos) e ver todos os eventos publicados na plataforma.
- **Rota**: `/organizer/events` — [`src/app/(organizer)/organizer/events/page.tsx`](../src/app/(organizer)/organizer/events/page.tsx)
- **Perfil**: `ORGANIZER` (protegido pelo layout `(organizer)`)
- **Ação do usuário**: alterna abas; clica em "Editar" (evento próprio, ainda não iniciado), "Ver" (qualquer evento publicado, leva ao checkout) ou "+ Novo evento".

### Integração com Backend

| Etapa | Frontend | Backend |
|---|---|---|
| Guarda de acesso | `getMe()` no `layout.tsx` do grupo | `GET /api/auth/me` |
| Aba "Meus eventos" | `listEvents()` | `GET /api/events` (inclui rascunhos do organizador logado) |
| Aba "Todos os eventos" | `listPublishedEvents()` | `GET /api/public/events` |

- **`GET /api/events`**: resposta usada `{ events: EventSummary[] }` — inclui eventos em qualquer status (`DRAFT`, `PUBLISHED`, `CANCELLED`) pertencentes ao organizador autenticado.
- **`GET /api/public/events`**: mesma resposta, mas só eventos publicados de qualquer organizador.
- **Autenticação necessária**: cookie de sessão, papel `ORGANIZER` (garantido pelo layout — a própria página não reverifica).
- **Tratamento de erro**: usa um padrão de "primeira carga vs. troca de aba" (`hasLoadedOnceRef`): se é a primeira vez que a lista carrega e falha, mostra erro inline bloqueando a tabela; se já havia dados carregados antes (ex.: falhou ao trocar de aba), mostra `toast.error` sem derrubar a tabela anterior.

### Estados do fluxo
- **Carregamento**: "Carregando eventos...".
- **Sucesso**: tabela com colunas Evento/Data/Cinema/Capacidade/Preço/Status/Ação.
- **Vazio**: "Nenhum evento criado ainda." (dentro da própria tabela).
- **Erro na primeira carga**: mensagem inline em vermelho.
- **Erro ao trocar de aba (já havia dados)**: toast, mantendo a última lista válida na tela.
- **Ação disponível por linha**: "Editar" só aparece na aba "Meus eventos" e só se o evento ainda não começou (`startsAt > now`); "Ver" aparece na aba "Todos os eventos" e leva para `/checkout/[id]`; caso contrário, "—".

---

## 13. Criação de evento a partir do catálogo TMDb

### Fluxo
```
Organizador acessa /organizer/events/new
   ↓
Frontend busca filmes em cartaz (debounce 400ms na busca) via GET /api/catalog/now-playing ou /search
   ↓
Organizador seleciona um filme
   ↓
Frontend busca detalhes do filme (GET /api/catalog/movies/:tmdbId)
   ↓
Organizador preenche data/hora, cinema, sala, capacidade e preço
   ↓
Frontend valida os campos localmente
   ↓
Organizador confirma ("Publicar evento" ou "Salvar como rascunho")
   ↓
Frontend chama POST /api/events
   ↓
   ├─ "Salvar como rascunho": Backend cria evento em DRAFT → Interface volta para a listagem
   └─ "Publicar evento": Backend cria em DRAFT, então Frontend chama POST /api/events/:id/publish
        ├─ sucesso: Backend publica → Interface volta para a listagem
        └─ falha ao publicar: evento já existe como rascunho → Interface leva para a tela de edição dele
```

### Funcionalidade
- **Objetivo**: criar um novo evento (sessão de cinema) vinculado a um item do catálogo externo (TMDb).
- **Rota**: `/organizer/events/new` — [`src/app/(organizer)/organizer/events/new/page.tsx`](../src/app/(organizer)/organizer/events/new/page.tsx) (wrapper fino que renderiza `<EventForm />` sem `eventId`)
- **Perfil**: `ORGANIZER`
- **Ação do usuário**: busca e escolhe filme → preenche dados da sessão → escolhe publicar ou salvar rascunho.

### Integração com Backend

| Etapa | Frontend | Backend |
|---|---|---|
| Buscar catálogo (padrão, sem busca) | `getNowPlaying()` | `GET /api/catalog/now-playing?page=` |
| Buscar catálogo (com texto digitado) | `searchMovies(query)` | `GET /api/catalog/search?query=&page=` |
| Detalhes do filme selecionado | `getMovieDetails(tmdbId)` | `GET /api/catalog/movies/:tmdbId` |
| Criar evento | `createEvent(input)` | `POST /api/events` |
| Publicar (se escolhido) | `publishEvent(created.id)` | `POST /api/events/:id/publish` |

- **`POST /api/events`**
  - Body: `{ tmdbId, startsAt (ISO), venue, room, capacity, price }`
  - Resposta usada: `{ event: EventDetail }`
  - Validações client-side antes de enviar: filme selecionado; data/hora futura; cinema selecionado; sala entre 1 e 4; capacidade > 0 e ≤ 260; preço ≥ 0.
- **`POST /api/events/:id/publish`**: sem body; resposta ignorada (só o sucesso importa).
- **Autenticação necessária**: cookie de sessão, papel `ORGANIZER` (garantido pelo layout do grupo).
- **Tratamento de erro**: falha ao criar → `toast.error`, formulário permanece preenchido; falha ao publicar (evento já criado) → `toast.error` + navegação para a tela de edição do evento recém-criado (para não deixar o organizador tentar de novo e duplicar).

### Estados do fluxo
- **Carregamento do catálogo**: "Carregando catálogo...", com busca com debounce de 400ms.
- **Vazio na busca**: "Nenhum resultado para essa busca."
- **Carregando detalhes do filme**: "Carregando filme..." no card de revisão.
- **Dados inválidos**: mensagem de validação exibida no card de revisão (ex.: "Capacidade máxima é 260 lugares.", "Escolha uma data e horário futuros para o evento.").
- **Enviando**: botões desabilitados ("Publicar evento"/"Salvar como rascunho").
- **Sucesso**: toast de sucesso ("Rascunho salvo." ou "Evento publicado.") + redirecionamento para `/organizer/events`.
- **Erro de API**: toast com a mensagem (formatada por `formatApiErrorMessage`, que converte timestamps ISO crus embutidos na mensagem de erro para pt-BR).

---

## 14. Edição e publicação de evento existente

### Fluxo
```
Organizador clica em "Editar" na listagem (só disponível se o evento ainda não começou)
   ↓
Frontend acessa /organizer/events/[id]
   ↓
Frontend chama GET /api/events/:id
   ↓
   ├─ evento já começou: Interface bloqueia edição ("evento já foi encerrado")
   └─ evento editável: Interface exibe formulário preenchido
   ↓
Organizador altera data/cinema/sala/preço (e capacidade, só se ainda for rascunho)
   ↓
Organizador confirma "Salvar alterações"
   ↓
Frontend chama PATCH /api/events/:id
   ↓
Backend atualiza o evento
   ↓
Interface volta para a listagem
```
Fluxo alternativo (só se o evento ainda está em rascunho): botão extra "Publicar evento" chama `POST /api/events/:id/publish` diretamente, sem precisar salvar alterações antes.

### Funcionalidade
- **Objetivo**: editar dados de um evento já criado, e publicá-lo se ainda estiver em rascunho.
- **Rota**: `/organizer/events/[id]` — [`src/app/(organizer)/organizer/events/[id]/page.tsx`](../src/app/(organizer)/organizer/events/[id]/page.tsx) (wrapper que renderiza `<EventForm eventId={id} />`)
- **Perfil**: `ORGANIZER` (dono do evento — validado no backend)
- **Ação do usuário**: ajusta campos, clica em "Salvar alterações" e/ou "Publicar evento".

### Integração com Backend

| Etapa | Frontend | Backend |
|---|---|---|
| Carregar evento | `getEvent(eventId)` | `GET /api/events/:id` |
| Salvar alterações | `updateEvent(eventId, input)` | `PATCH /api/events/:id` |
| Publicar rascunho existente | `publishEvent(eventId)` | `POST /api/events/:id/publish` |

- **`GET /api/events/:id`**: resposta usada `{ event: EventDetail }`. Frontend calcula `locked = startsAt < now` para travar a edição de eventos que já começaram.
- **`PATCH /api/events/:id`**
  - Body: `{ startsAt, venue, room, price }` — e `capacity` **somente** se `event.status === "DRAFT"` (regra refletida no formulário: campo de capacidade fica desabilitado fora do rascunho).
  - Resposta usada: nenhuma (só o sucesso importa).
- **`POST /api/events/:id/publish`**: mesmo contrato da criação — sem body.
- **Autenticação necessária**: cookie de sessão, papel `ORGANIZER`, dono do evento.
- **Tratamento de erro**: `toast.error` com `formatApiErrorMessage(err.message)` em qualquer falha de carregamento, salvamento ou publicação; falha ao carregar mostra tela substituindo o formulário.

### Estados do fluxo
- **Carregamento**: "Carregando evento...".
- **Erro ao carregar**: mensagem substitui o formulário.
- **Evento encerrado (travado)**: mensagem "Este evento já foi encerrado e não pode mais ser editado." em vez do formulário.
- **Dados inválidos**: mesmas validações client-side do fluxo de criação, exibidas no card de revisão.
- **Enviando**: botões desabilitados.
- **Sucesso**: toast ("Alterações salvas." ou "Evento publicado.") + volta para a listagem.
- **Erro de API**: toast com a mensagem formatada.

---

## 15. Exclusão de evento

### Fluxo
```
Organizador está na tela de edição de um evento
   ↓
Clica em "Excluir evento"
   ↓
Frontend pede confirmação nativa do navegador (window.confirm)
   ↓
   ├─ cancelado: nada acontece
   └─ confirmado: Frontend chama DELETE /api/events/:id
        ↓
        Backend remove o evento
        ↓
        Interface volta para a listagem
```

### Funcionalidade
- **Objetivo**: remover um evento criado pelo organizador.
- **Rota**: `/organizer/events/[id]` (mesma tela de edição)
- **Perfil**: `ORGANIZER`, dono do evento
- **Ação do usuário**: clica em "Excluir evento" e confirma o diálogo nativo.

### Integração com Backend
- **Método/Endpoint**: `DELETE /api/events/:id`
- **Parâmetros**: `id` (path)
- **Body**: nenhum
- **Resposta usada**: nenhuma
- **Autenticação necessária**: cookie de sessão, papel `ORGANIZER`, dono do evento
- **Tratamento de erro**: `toast.error` com a mensagem da API; botão reabilita.

### Estados do fluxo
- **Confirmação**: `window.confirm("Excluir este evento? Essa ação não pode ser desfeita.")` — bloqueia a execução se cancelado.
- **Enviando**: botão desabilitado durante a chamada.
- **Sucesso**: toast ("Evento excluído.") + volta para `/organizer/events`.
- **Erro**: toast com a mensagem, formulário permanece na tela.

---

## 16. Validação de ingresso na portaria

Fluxo em duas etapas deliberadamente separadas: a leitura do código só **consulta** a sessão a que ele pertence (não consome o ingresso); só a confirmação explícita de fato valida e marca o ingresso como utilizado.

### Fluxo
```
Porteiro acessa /gate
   ↓
Frontend valida sessão e papel (GET /api/auth/me)
   ↓
Porteiro digita o código do ingresso e confirma
   ↓
Frontend chama GET /api/gate/tickets/:code/event (etapa 1 — só leitura)
   ↓
   ├─ código não encontrado: Interface mostra "Ingresso inválido" imediatamente
   └─ código encontrado: Interface mostra a sessão do ingresso (filme, cinema, sala, horário)
        ↓
        Porteiro confere a sessão e clica em "Validar ingresso"
        ↓
        Frontend chama POST /api/gate/validate (etapa 2 — valida e marca como usado)
        ↓
        Backend retorna o resultado final (válido / já usado / inválido / evento errado)
        ↓
        Interface mostra o resultado com ícone e detalhes
```

### Funcionalidade
- **Objetivo**: validar a entrada de um cliente no evento, conferindo o ingresso antes de confirmar.
- **Rota**: `/gate` — [`src/app/(gate)/gate/page.tsx`](../src/app/(gate)/gate/page.tsx)
- **Perfil**: `GATE`
- **Ação do usuário**: digita o código do ingresso (`GateValidationForm`), revisa a sessão exibida, confirma ou cancela ("Ler outro código").

> Nota: na branch `dev` atual, a entrada do código é **somente manual** (não há leitura de câmera/QR nesta branch — esse recurso existe em outra branch do projeto, mas não faz parte do fluxo aqui documentado).

### Integração com Backend

| Etapa | Frontend | Backend |
|---|---|---|
| Guarda de acesso | `getMe()` | `GET /api/auth/me` |
| Etapa 1 — consulta (não consome) | `findTicketEvent(code)` | `GET /api/gate/tickets/:code/event` |
| Etapa 2 — validação (consome) | `validateTicket({eventId, code})` | `POST /api/gate/validate` |

- **`GET /api/gate/tickets/:code/event`**
  - Parâmetros: `code` (path, URL-encoded)
  - Resposta usada: `{ event: GateEventLookup }` (título, cinema, sala, horário)
  - Erro `404` tratado como caso de negócio, não como falha: vira resultado `INVALID` diretamente na tela (sem toast).
- **`POST /api/gate/validate`**
  - Body: `{ eventId, code }`
  - Resposta usada: `GateValidationResponse` — `{ result: "VALID" | "INVALID" | "ALREADY_USED" | "WRONG_EVENT", ticket }`
  - Cada resultado tem ícone e texto próprios no componente `ValidationResult` (ex.: `ALREADY_USED` mostra o horário em que foi usado; `WRONG_EVENT` mostra a qual evento o ingresso pertence de fato).
- **Autenticação necessária**: cookie de sessão, papel `GATE`, em ambas as chamadas.
- **Tratamento de erro**: `401` → volta para estado visitante + `toast.info("Sua sessão expirou...")`; `403` → estado "acesso restrito"; outros erros de rede/servidor → `toast.error`.

### Estados do fluxo
- **Carregamento (sessão)**: "Carregando...".
- **Buscando código**: botão "Buscando...".
- **Código não encontrado**: resultado "Ingresso inválido" exibido imediatamente, campo de código limpo para nova tentativa.
- **Código encontrado**: card com dados da sessão + botões "Validar ingresso" / "Ler outro código".
- **Validando**: botão "Validando...".
- **Resultado válido**: destaque verde, código + assento + horário de entrada.
- **Resultado já utilizado / evento errado / inválido**: destaque neutro, com o motivo específico.
- **Sem permissão**: tela "Acesso restrito à equipe de portaria." com link para o perfil.
- **Sessão expirada**: volta para tela de "Entre com uma conta da portaria..." com link de login, mais um toast informativo.

---

## Fluxo por perfil

```
CUSTOMER
└── Login
└── /events (listagem pública, com "Perfil"/"Sair" no header)
    ├── /events/[id] (detalhes + escolha de sessão)
    │   └── /checkout/[eventId]
    │       ├── Seleção de assentos → Confirmar reserva
    │       ├── Pagamento (até 3 tentativas)
    │       ├── Cancelar reserva
    │       └── Resultado (aprovado → ingresso | recusado definitivo)
    ├── /my-tickets (abas Próximos/Anteriores)
    │   └── /tickets/[ticketId] (QR + compartilhar → /tickets/shared/[token], público)
    └── /profile → Sair da conta

ORGANIZER
└── Login
└── /organizer/events (guarda de papel no layout do grupo)
    ├── Aba "Meus eventos" (inclui rascunhos) → Editar (se ainda não começou)
    ├── Aba "Todos os eventos" (publicados de todos) → Ver (abre o checkout)
    ├── + Novo evento → /organizer/events/new
    │   └── Selecionar filme (TMDb) → Configurar → Publicar | Salvar rascunho
    └── /organizer/events/[id] (edição)
        ├── Salvar alterações
        ├── Publicar (se DRAFT)
        └── Excluir evento
    └── /profile → Sair da conta

GATE
└── Login
└── /gate (guarda de papel na própria página)
    ├── Digitar código → buscar sessão do ingresso (consulta)
    ├── Confirmar → validar e marcar como usado
    └── Ler outro código (reinicia)
    └── /profile → Sair da conta
```

Diferenças-chave entre perfis:
- **Guarda de acesso**: `ORGANIZER` é protegido centralmente pelo `layout.tsx` do grupo de rotas; `CUSTOMER` e `GATE` são protegidos individualmente em cada página.
- **`/events` e `/events/[id]`** são as únicas rotas verdadeiramente públicas entre as três áreas de papel — qualquer visitante navega até ali, mas só um `CUSTOMER` autenticado consegue avançar para o checkout.
- **`/tickets/shared/[token]`** é a única rota da aplicação sem nenhuma verificação de papel ou sessão.
- Cada papel tem sua própria "home" pós-login, resolvida por `roleHomeRoute` em `src/config/routes.ts`: `ORGANIZER → /organizer/events`, `CUSTOMER → /events`, `GATE → /gate`.

---

## Fluxo completo Frontend → Backend

Arquitetura de comunicação real do projeto (sem camada de hooks customizados — o estado vive diretamente nos componentes de página via `useState`/`useEffect`):

```
Usuário interage com a UI
   ↓
Página (src/app/**/page.tsx, "use client")
   ↓
Estado local via useState / useEffect (sem hooks customizados intermediários)
   ↓
Função de serviço (src/services/*.ts) — ex.: createReservation(), login(), publishEvent()
   ↓
apiClient (src/lib/api-client.ts) — monta a URL com NEXT_PUBLIC_API_URL, injeta credentials: "include"
   ↓
fetch() → Backend Express (rotas /api/**)
   ↓
Backend valida cookie de sessão / papel, executa a regra de negócio (Postgres via Prisma)
   ↓
Resposta JSON (200/201) ou erro (4xx/5xx com { message, issues? })
   ↓
apiClient normaliza erro em ApiError, ou retorna o JSON tipado
   ↓
Página atualiza o estado (setState) a partir do resultado ou do catch
   ↓
Interface re-renderiza: dado exibido, toast (ToastProvider) e/ou navegação (router.push)
```

Particularidades desse pipeline, presentes em mais de um fluxo:
- **Toasts** (`src/components/toast/ToastProvider.tsx`) cobrem erros não bloqueantes e confirmações de sucesso; erros bloqueantes de carregamento inicial usam mensagem inline em vez de toast.
- **`postBeacon`** é uma variação do pipeline acima usada só para o cancelamento de reserva ao sair da tela de pagamento: dispara com `keepalive: true`, sem aguardar nem tratar resposta, porque a página já está sendo desmontada.
- **Padrão "lookup depois confirm"**: usado no checkout (reservar → pagar) e na portaria (consultar → validar) — sempre uma chamada de leitura primeiro, para o usuário confirmar visualmente, seguida de uma chamada de escrita que efetivamente muda o estado no backend.
