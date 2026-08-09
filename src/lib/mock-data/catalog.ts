import type { CatalogItem } from "@/types/event";

export const mockCatalogItems: CatalogItem[] = [
  {
    id: "cat-1",
    provider: "Ticketmaster",
    title: "Trovão Vermelho ao Vivo",
    genre: "Rock",
  },
  {
    id: "cat-2",
    provider: "Ticketmaster",
    title: "Trovão Vermelho — Acústico",
    genre: "Rock",
  },
  {
    id: "cat-3",
    provider: "Ticketmaster",
    title: "Trovão Vermelho — Turnê 2025",
    genre: "Rock",
  },
  {
    id: "cat-4",
    provider: "Ticketmaster",
    title: "Constelação — Turnê 2026",
    genre: "MPB",
  },
  {
    id: "cat-5",
    provider: "Ticketmaster",
    title: "Marés — Show Acústico",
    genre: "MPB",
  },
];

export function searchCatalogItems(term: string): CatalogItem[] {
  const normalized = term.trim().toLowerCase();
  if (!normalized) return mockCatalogItems;
  return mockCatalogItems.filter((item) =>
    item.title.toLowerCase().includes(normalized),
  );
}
