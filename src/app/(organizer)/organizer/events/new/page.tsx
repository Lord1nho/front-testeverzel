import Link from "next/link";
import { appRoutes } from "@/config/routes";
import { EventForm } from "@/features/organizer/EventForm";

export default function NewOrganizerEventPage() {
  return (
    <main className="min-h-dvh">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-4 sm:px-6 lg:px-10 lg:py-5">
        <div className="flex flex-wrap items-center gap-3 sm:gap-5">
          <Link
            href={appRoutes.organizerEvents}
            className="text-sm text-text-dim hover:text-foreground"
          >
            ← Voltar aos eventos
          </Link>
          <span className="font-heading text-lg font-bold">Novo evento</span>
        </div>
        <span className="text-sm text-text-dim">Etapa 1 de 2</span>
      </div>
      <EventForm />
    </main>
  );
}
