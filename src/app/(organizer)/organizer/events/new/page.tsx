import Link from "next/link";
import { appRoutes } from "@/config/routes";
import { EventForm } from "@/features/organizer/EventForm";

export default function NewOrganizerEventPage() {
  return (
    <main className="min-h-dvh">
      <div className="flex items-center justify-between border-b border-border px-10 py-5">
        <div className="flex items-center gap-5">
          <Link
            href={appRoutes.organizerEvents}
            className="text-sm text-text-dim hover:text-foreground"
          >
            ← Meus eventos
          </Link>
          <span className="font-heading text-lg font-bold">Novo evento</span>
        </div>
        <span className="text-sm text-text-dim">Etapa 1 de 2</span>
      </div>
      <EventForm />
    </main>
  );
}
