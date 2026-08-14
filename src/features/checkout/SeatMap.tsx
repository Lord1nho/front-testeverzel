import type { Seat } from "@/types/event";

interface SeatMapProps {
  seats: Seat[];
  selectedIds: string[];
  onToggle: (seat: Seat) => void;
  maxSelectable: number;
}

function groupSeatsByRow(seats: Seat[]) {
  const rows = new Map<string, Seat[]>();
  for (const seat of seats) {
    const row = seat.code.match(/^[A-Za-z]+/)?.[0] ?? seat.code;
    if (!rows.has(row)) rows.set(row, []);
    rows.get(row)!.push(seat);
  }
  return Array.from(rows.entries());
}

export function SeatMap({ seats, selectedIds, onToggle, maxSelectable }: SeatMapProps) {
  const rows = groupSeatsByRow(seats);
  const limitReached = selectedIds.length >= maxSelectable;

  return (
    <div>
      <div className="mb-8 flex justify-center">
        <div className="h-2 w-3/4 max-w-md rounded-full bg-gradient-to-r from-transparent via-border to-transparent" />
      </div>
      <p className="mb-6 text-center text-[11px] uppercase tracking-widest text-text-mute">
        Tela
      </p>

      <div className="custom-scrollbar flex flex-col items-center gap-2 overflow-x-auto px-1 pb-1">
        {rows.map(([row, rowSeats]) => (
          <div key={row} className="flex items-center gap-2">
            <span className="w-4 flex-none text-xs font-semibold text-text-mute">
              {row}
            </span>
            <div className="flex gap-1 sm:gap-1.5">
              {rowSeats.map((seat) => {
                const selected = selectedIds.includes(seat.id);
                const available = seat.status === "AVAILABLE";
                const disabled = !available || (!selected && limitReached);

                return (
                  <button
                    key={seat.id}
                    type="button"
                    disabled={disabled}
                    onClick={() => onToggle(seat)}
                    title={seat.code}
                    className={`flex h-7 w-7 flex-none items-center justify-center rounded-md border text-[10px] font-semibold transition-colors sm:h-8 sm:w-8 ${
                      selected
                        ? "cursor-pointer border-accent-lime bg-accent-lime text-[#05070a]"
                        : available
                          ? "cursor-pointer border-border bg-surface text-text-dim hover:border-accent-lime hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
                          : "cursor-not-allowed border-border bg-surface-2 text-text-mute opacity-50"
                    }`}
                  >
                    {seat.code.replace(row, "")}
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        {rows.length === 0 && (
          <p className="py-8 text-sm text-text-dim">
            Nenhum assento cadastrado para este evento.
          </p>
        )}
      </div>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-5 text-xs text-text-dim">
        <span className="flex items-center gap-2">
          <span className="h-4 w-4 rounded border border-border bg-surface" />
          Disponível
        </span>
        <span className="flex items-center gap-2">
          <span className="h-4 w-4 rounded border border-accent-lime bg-accent-lime" />
          Selecionado
        </span>
        <span className="flex items-center gap-2">
          <span className="h-4 w-4 rounded border border-border bg-surface-2 opacity-50" />
          Ocupado
        </span>
      </div>
    </div>
  );
}
