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
      <div className="flex items-center gap-5 border-b border-border px-10 py-5">
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
