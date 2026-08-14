import Image from "next/image";
import Link from "next/link";
import { appRoutes } from "@/config/routes";
import type { MovieGroup } from "@/lib/group-events";

// Prioridade: Encerrado (sessão já terminou) > Esgotado (sem assentos, mas
// ainda válida) > Em Cartaz (futura ou em andamento). "Em Breve" e "Em
// Cartaz" foram unificados numa única tag -- não há mais distinção entre
// sessão futura e em andamento na vitrine.
function getAvailability(group: MovieGroup) {
  const active = group.sessions.filter((session) => session.sessionStatus !== "ENDED");

  // Todas as sessões desse filme já encerraram -- não deve aparecer na
  // vitrine (quem chama filtra o grupo inteiro fora quando isso acontece).
  if (active.length === 0) {
    return null;
  }

  const hasAvailableSeats = active.some((session) => session.seatsAvailable > 0);

  if (!hasAvailableSeats) {
    return {
      label: "Esgotado",
      className: "border border-red-500/30 text-red-400",
      count: active.length,
    };
  }

  return {
    label: "Em Cartaz",
    className: "bg-accent-lime text-[#05070a]",
    count: active.length,
  };
}

export function MovieCard({ group }: { group: MovieGroup }) {
  const { catalogItem, sessions } = group;
  const availability = getAvailability(group);
  const primarySession = sessions[0];

  if (!availability) return null;

  return (
    <Link
      href={appRoutes.eventDetails(primarySession.id)}
      className="group flex w-[152px] flex-none flex-col gap-2.5 sm:w-[168px]"
    >
      <div className="relative aspect-[2/3] w-full flex-none overflow-hidden rounded-lg bg-surface-2 ring-1 ring-border transition-shadow group-hover:ring-accent-cyan">
        {catalogItem.imageUrl ? (
          <Image
            src={catalogItem.imageUrl}
            alt={catalogItem.title}
            fill
            sizes="168px"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-text-mute">
            Sem imagem
          </div>
        )}
        <span
          className={`absolute right-2 top-2 rounded-md px-1.5 py-0.5 text-[10px] font-bold ${availability.className}`}
        >
          {availability.label}
        </span>
      </div>

      <div>
        <span className="block truncate text-[13px] font-semibold leading-tight">
          {catalogItem.title}
        </span>
        <span className="mt-0.5 block text-[11px] text-text-mute">
          {availability.count > 0
            ? availability.count > 1
              ? `${availability.count} sessões`
              : "1 sessão"
            : "Sem sessões"}
        </span>
      </div>

      <span className="rounded-[8px] bg-accent-lime py-2 text-center text-xs font-bold text-[#05070a] transition-opacity group-hover:opacity-90">
        Ver sessões
      </span>
    </Link>
  );
}
