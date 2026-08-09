import { EventForm } from "@/features/organizer/EventForm";

export default async function EditOrganizerEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <main className="min-h-dvh">
      <div className="flex items-center justify-between border-b border-border px-10 py-5">
        <span className="font-heading text-lg font-bold">Editar evento</span>
      </div>
      <EventForm key={id} eventId={id} />
    </main>
  );
}
