import type { EventCatalogItemSummary, EventSummary, Venue } from "@/types/event";

export interface MovieGroup {
  catalogItem: EventCatalogItemSummary;
  sessions: EventSummary[];
}

export function groupEventsByMovie(events: EventSummary[]): MovieGroup[] {
  const groups = new Map<string, MovieGroup>();

  for (const event of events) {
    const key = event.catalogItem.id;
    if (!groups.has(key)) {
      groups.set(key, { catalogItem: event.catalogItem, sessions: [] });
    }
    groups.get(key)!.sessions.push(event);
  }

  const result = Array.from(groups.values());
  for (const group of result) {
    group.sessions.sort(
      (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
    );
  }
  result.sort(
    (a, b) =>
      new Date(a.sessions[0].startsAt).getTime() -
      new Date(b.sessions[0].startsAt).getTime(),
  );
  return result;
}

// Um filme cujas sessões já encerraram todas não deve aparecer na vitrine
// de "Em cartaz" -- usado pra filtrar o resultado de groupEventsByMovie
// antes de renderizar (carrossel e hero usam o mesmo filtro).
export function isMovieFullyEnded(group: MovieGroup): boolean {
  return group.sessions.every((session) => session.sessionStatus === "ENDED");
}

export interface VenueGroup {
  venue: Venue;
  sessions: EventSummary[];
}

export interface DateGroup {
  dateKey: string;
  venues: VenueGroup[];
}

function localDateKey(iso: string): string {
  const date = new Date(iso);
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function groupSessionsByDateAndVenue(sessions: EventSummary[]): DateGroup[] {
  const byDate = new Map<string, EventSummary[]>();

  for (const session of sessions) {
    const dateKey = localDateKey(session.startsAt);
    if (!byDate.has(dateKey)) byDate.set(dateKey, []);
    byDate.get(dateKey)!.push(session);
  }

  return Array.from(byDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([dateKey, dateSessions]) => {
      const byVenue = new Map<Venue, EventSummary[]>();
      for (const session of dateSessions) {
        if (!byVenue.has(session.venue)) byVenue.set(session.venue, []);
        byVenue.get(session.venue)!.push(session);
      }
      const venues = Array.from(byVenue.entries()).map(([venue, venueSessions]) => ({
        venue,
        sessions: venueSessions.sort(
          (a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime(),
        ),
      }));
      return { dateKey, venues };
    });
}
