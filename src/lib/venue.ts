import type { Venue } from "@/types/event";

export const venueOptions: { value: Venue; label: string }[] = [
  { value: "CINE_VERZEL_1", label: "Cine Verzel 1" },
  { value: "CINE_VERZEL_2", label: "Cine Verzel 2" },
];

export const venueLabels: Record<Venue, string> = {
  CINE_VERZEL_1: "Cine Verzel 1",
  CINE_VERZEL_2: "Cine Verzel 2",
};
