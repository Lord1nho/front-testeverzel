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

export function roleHomeRoute(role: UserRole): string {
  switch (role) {
    case "ORGANIZER":
      return appRoutes.organizerEvents;
    case "CUSTOMER":
      return appRoutes.events;
    case "GATE":
      return appRoutes.profile;
  }
}
