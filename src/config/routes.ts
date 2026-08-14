import type { UserRole } from "@/types/auth";

export const appRoutes = {
  login: "/login",
  profile: "/profile",
  events: "/events",
  eventDetails: (id: string) => `/events/${id}`,
  checkout: (eventId: string) => `/checkout/${eventId}`,
  myTickets: "/my-tickets",
  ticketDetails: (ticketId: string) => `/tickets/${ticketId}`,
  sharedTicket: (token: string) => `/tickets/shared/${token}`,
  organizerEvents: "/organizer/events",
  organizerEventNew: "/organizer/events/new",
  organizerEventDetails: (id: string) => `/organizer/events/${id}`,
  gate: "/gate",
} as const;

// Preserva a origem ao mandar um visitante pro login (ex.: tentou comprar
// ingresso sem estar logado) — a tela de login usa isso pra mostrar um link
// de volta e o usuário não precisa navegar manualmente de novo até o evento.
export function loginWithOrigin(from: string): string {
  return `${appRoutes.login}?from=${encodeURIComponent(from)}`;
}

export function roleHomeRoute(role: UserRole): string {
  switch (role) {
    case "ORGANIZER":
      return appRoutes.organizerEvents;
    case "CUSTOMER":
      return appRoutes.events;
    case "GATE":
      return appRoutes.gate;
  }
}
