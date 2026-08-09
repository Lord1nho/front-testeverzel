import type { EventStatus, OrganizerEvent } from "@/types/event";

let events: OrganizerEvent[] = [
  {
    id: "evt-1",
    catalogItem: {
      id: "cat-1",
      provider: "Ticketmaster",
      title: "Trovão Vermelho ao Vivo",
      genre: "Rock",
    },
    date: "2026-09-20T21:00",
    venue: "Allianz Parque",
    capacity: 500,
    price: 180,
    status: "PUBLISHED",
  },
  {
    id: "evt-2",
    catalogItem: {
      id: "cat-4",
      provider: "Ticketmaster",
      title: "Constelação — Turnê 2026",
      genre: "MPB",
    },
    date: "2026-10-05T19:00",
    venue: "Espaço das Américas",
    capacity: 320,
    price: 140,
    status: "PUBLISHED",
  },
  {
    id: "evt-3",
    catalogItem: {
      id: "cat-5",
      provider: "Ticketmaster",
      title: "Marés — Show Acústico",
      genre: "MPB",
    },
    date: "2026-11-04T20:00",
    venue: "Teatro Bradesco",
    capacity: 180,
    price: 120,
    status: "DRAFT",
  },
  {
    id: "evt-4",
    catalogItem: {
      id: "cat-6",
      provider: "Ticketmaster",
      title: "Festival de Inverno",
      genre: "Festival",
    },
    date: "2025-06-12T18:00",
    venue: "Parque Ibirapuera",
    capacity: 2000,
    price: 90,
    status: "PUBLISHED",
  },
];

export function isPastEvent(date: string): boolean {
  return new Date(date).getTime() < Date.now();
}

export function getEventStatusLabel(
  event: Pick<OrganizerEvent, "status" | "date">,
): "Publicado" | "Rascunho" | "Encerrado" {
  if (event.status === "DRAFT") return "Rascunho";
  return isPastEvent(event.date) ? "Encerrado" : "Publicado";
}

export function listOrganizerEvents(): OrganizerEvent[] {
  return events;
}

export function getOrganizerEvent(id: string): OrganizerEvent | undefined {
  return events.find((event) => event.id === id);
}

export interface OrganizerEventInput {
  catalogItem: OrganizerEvent["catalogItem"];
  date: string;
  venue: string;
  capacity: number;
  price: number;
  status: EventStatus;
}

export function createOrganizerEvent(
  input: OrganizerEventInput,
): OrganizerEvent {
  const event: OrganizerEvent = {
    ...input,
    id: crypto.randomUUID(),
  };
  events = [event, ...events];
  return event;
}

export function updateOrganizerEvent(
  id: string,
  input: OrganizerEventInput,
): OrganizerEvent | undefined {
  const index = events.findIndex((event) => event.id === id);
  if (index === -1) return undefined;

  const updated: OrganizerEvent = { ...input, id };
  events = [...events.slice(0, index), updated, ...events.slice(index + 1)];
  return updated;
}

export function deleteOrganizerEvent(id: string) {
  events = events.filter((event) => event.id !== id);
}
