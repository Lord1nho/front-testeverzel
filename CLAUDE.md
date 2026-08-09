# CLAUDE.md - Frontend Plataforma de Eventos e Ingressos

@AGENTS.md

## Objetivo

Este repositorio contem o frontend da Plataforma de Eventos e Ingressos do teste tecnico Verzel.

O frontend deve ser construido com Next.js e consumir uma API Express externa. O foco e entregar um fluxo completo e testavel localmente antes de qualquer bonus.

## Stack

- Next.js
- TypeScript
- Tailwind CSS
- API HTTP externa em Express
- Postgres fica no backend, nao no frontend

## API

Todas as chamadas HTTP devem passar por um cliente central, por exemplo:

- `src/lib/api-client.ts`

A URL base deve vir de:

```env
NEXT_PUBLIC_API_URL=http://localhost:3333
```

Nao hardcode URLs da API dentro de componentes.

## Papeis

Existem tres papeis:

- `ORGANIZER`: cria e gerencia eventos.
- `CUSTOMER`: consulta eventos, reserva assentos, paga e ve ingressos.
- `GATE`: valida ingressos na entrada.

O frontend deve esconder ou bloquear telas que nao pertencem ao papel autenticado.

## Rotas Principais

- `/login`: login dos usuarios seedados.
- `/events`: lista de eventos publicados.
- `/events/[id]`: detalhes do evento.
- `/checkout/[eventId]`: mapa de assentos e pagamento simulado.
- `/my-tickets`: ingressos do cliente.
- `/tickets/[code]`: visualizacao de ingresso e link compartilhavel.
- `/organizer/events`: painel do organizador.
- `/organizer/events/new`: criacao de evento a partir do TMDb.
- `/organizer/events/[id]`: edicao/visualizacao de evento.
- `/gate`: validacao de ingresso pela portaria.

## Experiencia De Produto

Evite interface generica de landing page. A primeira experiencia deve parecer um produto real de venda de ingressos.

Diretrizes:

- telas focadas em tarefa;
- informacao clara e escaneavel;
- botoes com acoes objetivas;
- estados de loading, erro, vazio e sucesso;
- layout responsivo;
- mapa de assentos visual e facil de entender;
- retorno da portaria muito claro.

Nao usar textos explicando que a tela e feita com IA. A secao de IA fica no README.

## Componentes Sugeridos

- `LoginForm`
- `EventCard`
- `EventSearch`
- `SeatMap`
- `CheckoutSummary`
- `PaymentSimulator`
- `TicketCard`
- `QrTicket`
- `GateValidationForm`
- `ValidationResult`
- `RoleGuard`

## Antes De Finalizar

Rodar:

```bash
npm run lint
npm run build
```
