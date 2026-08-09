import Link from "next/link";
import { appRoutes } from "@/config/routes";
import { EventForm } from "@/features/organizer/EventForm";

export default async function EditOrganizerEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ publishError?: string }>;
}) {
  const { id } = await params;
  const { publishError } = await searchParams;

  return (
    <main className="min-h-dvh">
      <div className="flex items-center gap-5 border-b border-border px-10 py-5">
        <Link
          href={appRoutes.organizerEvents}
          className="text-sm text-text-dim hover:text-foreground"
        >
          ← Meus eventos
        </Link>
        <span className="font-heading text-lg font-bold">Editar evento</span>
      </div>
      <EventForm key={id} eventId={id} initialError={publishError} />
    </main>
  );
}
