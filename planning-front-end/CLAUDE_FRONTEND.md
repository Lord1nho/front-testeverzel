# CLAUDE.md Recomendado - Frontend

Use este conteudo como base para o arquivo `CLAUDE.md` do repositorio frontend.

```md
# CLAUDE.md - Frontend Plataforma de Eventos e Ingressos

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

## Fluxo Cliente

O cliente deve conseguir:

1. logar;
2. listar eventos publicados;
3. buscar evento por titulo;
4. abrir detalhes;
5. selecionar assento disponivel;
6. fazer pagamento simulado aprovado;
7. receber ticket;
8. visualizar QR Code/codigo;
9. abrir link compartilhavel.

Tambem deve ser possivel testar pagamento recusado.

## Fluxo Organizador

O organizador deve conseguir:

1. logar;
2. buscar filme no TMDb;
3. selecionar item de catalogo;
4. configurar data, local, capacidade, preco e assentos;
5. publicar evento;
6. listar eventos criados;
7. editar evento futuro;
8. excluir apenas quando permitido pelo backend.

## Fluxo Portaria

A portaria deve conseguir:

1. logar;
2. selecionar ou informar o evento em operacao;
3. digitar codigo do ticket manualmente;
4. receber resultado:
   - valido;
   - invalido;
   - ja utilizado;
   - evento errado.

Leitura por camera e bonus. Se implementar, manter digitacao manual como alternativa obrigatoria.

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

## Regras De UI Para Mapa De Assentos

- assento disponivel: clicavel;
- assento selecionado: destaque visual;
- assento vendido: desabilitado;
- assento reservado temporariamente, se existir: desabilitado;
- legenda sempre visivel;
- resumo do assento selecionado antes de pagar.

## Tratamento De Erros

Todo erro relevante vindo da API deve virar mensagem humana:

- login invalido;
- evento indisponivel;
- assento ja vendido;
- pagamento recusado;
- ticket invalido;
- falha de conexao com backend.

## README

O README do frontend deve conter:

- requisitos;
- instalacao;
- `.env.local.example`;
- comando de desenvolvimento;
- dependencia do backend;
- usuarios de teste;
- fluxo de avaliacao;
- decisao de UI;
- uso de IA;
- limitacoes conhecidas.

## Antes De Finalizar

Rodar:

```bash
npm run lint
npm run build
```

Fazer teste manual:

- login como cliente;
- compra aprovada;
- compra recusada;
- meus ingressos;
- validacao visual do QR/codigo;
- tela da portaria;
- responsividade basica.
```

