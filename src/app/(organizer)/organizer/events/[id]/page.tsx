import Link from "next/link";
import { appRoutes } from "@/config/routes";
import { EventForm } from "@/features/organizer/EventForm";

export default async function EditOrganizerEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <main className="min-h-dvh">
      <div className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-4 sm:gap-5 sm:px-6 lg:px-10 lg:py-5">
        <Link
          href={appRoutes.organizerEvents}
          className="text-sm text-text-dim hover:text-foreground"
        >
          ← Voltar aos eventos
        </Link>
        <span className="font-heading text-lg font-bold">Editar evento</span>
      </div>
      <EventForm key={id} eventId={id} />
    </main>
  );
}
