import Image from "next/image";
import Link from "next/link";
import { appRoutes } from "@/config/routes";
import { formatCurrency, formatEventDateTime } from "@/lib/format";
import { venueLabels } from "@/lib/venue";
import type { EventSummary } from "@/types/event";

const sessionStatusLabel: Record<EventSummary["sessionStatus"], string> = {
  SCHEDULED: "Em breve",
  STARTED: "Em cartaz",
  ENDED: "Encerrado",
};

export function EventHero({ event }: { event: EventSummary }) {
  const soldOut = event.seatsAvailable <= 0;
  const badgeLabel = soldOut ? "Esgotado" : sessionStatusLabel[event.sessionStatus];

  return (
    <div className="relative h-[320px] w-full overflow-hidden bg-surface-2 sm:h-[420px]">
      {event.catalogItem.imageUrl && (
        <Image
          src={event.catalogItem.imageUrl}
          alt={event.catalogItem.title}
          fill
          priority
          sizes="100vw"
          className="object-cover object-top"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/75 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />

      <div className="absolute bottom-8 left-6 max-w-lg pr-6 sm:bottom-11 sm:left-10 sm:pr-0">
        <span
          className={`mb-4 inline-block rounded-md px-2.5 py-1 text-xs font-bold ${
            soldOut
              ? "border border-red-500/30 bg-background text-red-400"
              : "bg-accent-green text-[#05070a]"
          }`}
        >
          {badgeLabel}
        </span>
        <h1 className="mb-2.5 font-heading text-2xl font-bold leading-tight text-foreground sm:text-4xl">
          {event.title}
        </h1>
        <p className="mb-5 text-sm text-text-dim">
          {formatEventDateTime(event.startsAt)} · {venueLabels[event.venue]} · Sala{" "}
          {event.room} · {formatCurrency(event.price)}
        </p>
        <Link
          href={appRoutes.eventDetails(event.id)}
          className="inline-flex items-center gap-2 rounded-[10px] bg-accent-lime px-6 py-3.5 text-sm font-bold text-[#05070a] hover:brightness-95 active:brightness-90"
        >
          {soldOut ? "Ver evento" : "Comprar ingresso"}
        </Link>
      </div>
    </div>
  );
}
