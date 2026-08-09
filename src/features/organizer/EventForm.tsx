"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { appRoutes } from "@/config/routes";
import { formatCurrency, formatEventDateTime } from "@/lib/format";
import { searchCatalogItems } from "@/lib/mock-data/catalog";
import {
  createOrganizerEvent,
  deleteOrganizerEvent,
  getOrganizerEvent,
  isPastEvent,
  updateOrganizerEvent,
} from "@/lib/mock-data/organizer-events";
import type { CatalogItem } from "@/types/event";

const inputClassName =
  "w-full rounded-[9px] border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none placeholder:text-text-dim focus:border-accent-cyan";

interface EventFormProps {
  eventId?: string;
}

export function EventForm({ eventId }: EventFormProps) {
  const router = useRouter();
  const isEditMode = Boolean(eventId);
  const existingEvent = eventId ? getOrganizerEvent(eventId) : undefined;
  const notFound = isEditMode && !existingEvent;
  const locked = Boolean(
    existingEvent &&
      existingEvent.status === "PUBLISHED" &&
      isPastEvent(existingEvent.date),
  );

  const [catalogSearch, setCatalogSearch] = useState(
    existingEvent?.catalogItem.title ?? "trovão",
  );
  const [selectedCatalogItem, setSelectedCatalogItem] =
    useState<CatalogItem | null>(existingEvent?.catalogItem ?? null);
  const [date, setDate] = useState(existingEvent?.date ?? "");
  const [venue, setVenue] = useState(existingEvent?.venue ?? "");
  const [capacity, setCapacity] = useState(
    existingEvent ? String(existingEvent.capacity) : "",
  );
  const [price, setPrice] = useState(
    existingEvent ? String(existingEvent.price) : "",
  );
  const [error, setError] = useState<string | null>(null);

  const catalogResults = searchCatalogItems(catalogSearch);
  const capacityNumber = Number(capacity);
  const priceNumber = Number(price);

  function handleSubmit(status: "DRAFT" | "PUBLISHED") {
    setError(null);

    if (!selectedCatalogItem) {
      setError("Selecione um item do catálogo externo.");
      return;
    }

    if (status === "PUBLISHED") {
      if (!date) {
        setError("Informe a data e hora do evento.");
        return;
      }
      if (!venue.trim()) {
        setError("Informe o local do evento.");
        return;
      }
      if (!Number.isFinite(capacityNumber) || capacityNumber <= 0) {
        setError("Capacidade deve ser maior que zero.");
        return;
      }
      if (!Number.isFinite(priceNumber) || priceNumber < 0) {
        setError("Preço deve ser zero ou positivo.");
        return;
      }
    }

    const input = {
      catalogItem: selectedCatalogItem,
      date,
      venue: venue.trim(),
      capacity: Number.isFinite(capacityNumber) && capacityNumber > 0 ? capacityNumber : 0,
      price: Number.isFinite(priceNumber) && priceNumber >= 0 ? priceNumber : 0,
      status,
    };

    if (isEditMode && eventId) {
      updateOrganizerEvent(eventId, input);
    } else {
      createOrganizerEvent(input);
    }

    router.push(appRoutes.organizerEvents);
  }

  function handleDelete() {
    if (!eventId) return;
    const confirmed = window.confirm(
      "Excluir este evento? Essa ação não pode ser desfeita.",
    );
    if (!confirmed) return;

    deleteOrganizerEvent(eventId);
    router.push(appRoutes.organizerEvents);
  }

  if (notFound) {
    return (
      <div className="p-10">
        <p className="text-sm text-text-dim">Evento não encontrado.</p>
      </div>
    );
  }

  if (locked) {
    return (
      <div className="p-10">
        <p className="text-sm text-text-dim">
          Este evento já foi encerrado e não pode mais ser editado.
        </p>
      </div>
    );
  }

  return (
    <div className="flex gap-8 p-10">
      <div className="flex-1">
        <h3 className="mb-1.5 font-heading text-base font-semibold">
          1. Selecionar item do catálogo externo
        </h3>
        <input
          value={catalogSearch}
          onChange={(event) => setCatalogSearch(event.target.value)}
          placeholder="Buscar show ou filme..."
          className={`${inputClassName} mb-4 max-w-sm`}
        />
        <div className="mb-8 grid grid-cols-3 gap-4">
          {catalogResults.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setSelectedCatalogItem(item)}
              className={`overflow-hidden rounded-xl border text-left ${
                selectedCatalogItem?.id === item.id
                  ? "border-2 border-accent-cyan"
                  : "border-border hover:border-text-mute"
              }`}
            >
              <div className="flex h-[120px] items-center justify-center bg-surface-2 text-xs text-text-mute">
                Imagem
              </div>
              <div className="bg-surface p-3">
                <span className="block text-sm font-semibold">
                  {item.title}
                </span>
                <span className="text-[11px] text-text-mute">
                  {item.provider} · {item.genre}
                </span>
              </div>
            </button>
          ))}
          {catalogResults.length === 0 && (
            <p className="col-span-3 text-sm text-text-dim">
              Nenhum resultado para essa busca.
            </p>
          )}
        </div>

        <h3 className="mb-4 font-heading text-base font-semibold">
          2. Configurar evento
        </h3>
        <div className="grid max-w-xl grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-xs text-text-mute">
              Data e hora
            </label>
            <input
              type="datetime-local"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              className={inputClassName}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-text-mute">
              Local
            </label>
            <input
              value={venue}
              onChange={(event) => setVenue(event.target.value)}
              placeholder="Allianz Parque, São Paulo"
              className={inputClassName}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-text-mute">
              Capacidade
            </label>
            <input
              type="number"
              min={0}
              value={capacity}
              onChange={(event) => setCapacity(event.target.value)}
              placeholder="500"
              className={inputClassName}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-text-mute">
              Preço do ingresso
            </label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={price}
              onChange={(event) => setPrice(event.target.value)}
              placeholder="180.00"
              className={inputClassName}
            />
          </div>
        </div>
      </div>

      <div className="w-80 flex-none self-start rounded-2xl border border-border bg-surface p-6">
        <h3 className="mb-4 font-heading text-base font-semibold">Revisão</h3>
        {selectedCatalogItem ? (
          <>
            <span className="mb-1.5 block text-sm font-semibold">
              {selectedCatalogItem.title}
            </span>
            <span className="mb-4 block text-xs text-text-mute">
              {venue || "Local não definido"}
              {date ? ` · ${formatEventDateTime(date)}` : ""}
              {capacityNumber > 0 ? ` · ${capacityNumber} lugares` : ""}
              {priceNumber > 0 ? ` · ${formatCurrency(priceNumber)}` : ""}
            </span>
          </>
        ) : (
          <p className="mb-4 text-sm text-text-dim">
            Selecione um item do catálogo para começar.
          </p>
        )}

        <div className="mb-4 h-px bg-border" />

        {error && (
          <p className="mb-4 rounded-[9px] border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={() => handleSubmit("PUBLISHED")}
          className="mb-2.5 w-full rounded-[10px] bg-accent-lime py-3.5 text-center text-sm font-bold text-[#05070a] hover:brightness-95 active:brightness-90"
        >
          Publicar evento
        </button>
        <button
          type="button"
          onClick={() => handleSubmit("DRAFT")}
          className="w-full rounded-[10px] border border-border bg-surface-2 py-3.5 text-center text-sm font-semibold text-foreground hover:bg-border"
        >
          Salvar como rascunho
        </button>

        {isEditMode && (
          <button
            type="button"
            onClick={handleDelete}
            className="mt-4 w-full rounded-[10px] border border-red-500/30 bg-red-500/10 py-3 text-center text-sm font-semibold text-red-400 hover:bg-red-500/20"
          >
            Excluir evento
          </button>
        )}
      </div>
    </div>
  );
}
