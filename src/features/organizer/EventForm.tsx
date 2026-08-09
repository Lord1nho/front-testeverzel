"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { appRoutes } from "@/config/routes";
import { ApiError } from "@/lib/api-client";
import {
  formatCurrency,
  fromDateTimeLocalValue,
  toDateTimeLocalValue,
} from "@/lib/format";
import { getMovieDetails, getNowPlaying, searchMovies } from "@/services/catalog";
import {
  createEvent,
  deleteEvent,
  getEvent,
  publishEvent,
  updateEvent,
  type CreateEventInput,
  type UpdateEventInput,
} from "@/services/events";
import type { MovieDetails, MovieSummary } from "@/types/catalog";
import type { EventDetail } from "@/types/event";

const inputClassName =
  "w-full rounded-[9px] border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none placeholder:text-text-dim focus:border-accent-cyan";

interface EventFormProps {
  eventId?: string;
}

export function EventForm({ eventId }: EventFormProps) {
  const router = useRouter();
  const isEditMode = Boolean(eventId);

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [locked, setLocked] = useState(false);
  const [loading, setLoading] = useState(isEditMode);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [query, setQuery] = useState("");
  const [movies, setMovies] = useState<MovieSummary[]>([]);
  const [moviesLoading, setMoviesLoading] = useState(!isEditMode);
  const [moviesError, setMoviesError] = useState<string | null>(null);
  const [selectedMovie, setSelectedMovie] = useState<MovieDetails | null>(null);
  const [selectedMovieLoading, setSelectedMovieLoading] = useState(false);

  const [title, setTitle] = useState("");
  const [startsAtLocal, setStartsAtLocal] = useState("");
  const [location, setLocation] = useState("");
  const [capacity, setCapacity] = useState("");
  const [price, setPrice] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!eventId) return;
    getEvent(eventId)
      .then(({ event: loaded }) => {
        setEvent(loaded);
        setLocked(new Date(loaded.startsAt).getTime() < Date.now());
        setTitle(loaded.title);
        setStartsAtLocal(toDateTimeLocalValue(loaded.startsAt));
        setLocation(loaded.location);
        setCapacity(String(loaded.capacity));
        setPrice(String(loaded.price));
      })
      .catch((err) => {
        setLoadError(
          err instanceof ApiError ? err.message : "Não foi possível carregar o evento.",
        );
      })
      .finally(() => setLoading(false));
  }, [eventId]);

  useEffect(() => {
    if (isEditMode) return;
    const handle = setTimeout(() => {
      setMoviesLoading(true);
      setMoviesError(null);
      const request = query.trim() ? searchMovies(query.trim()) : getNowPlaying();
      request
        .then((data) => setMovies(data.results))
        .catch((err) => {
          setMoviesError(
            err instanceof ApiError ? err.message : "Não foi possível carregar o catálogo.",
          );
        })
        .finally(() => setMoviesLoading(false));
    }, 400);

    return () => clearTimeout(handle);
  }, [query, isEditMode]);

  async function handleSelectMovie(summary: MovieSummary) {
    setError(null);
    setSelectedMovie(null);
    setSelectedMovieLoading(true);
    try {
      const { movie } = await getMovieDetails(summary.tmdbId);
      setSelectedMovie(movie);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Não foi possível carregar os detalhes do filme.",
      );
    } finally {
      setSelectedMovieLoading(false);
    }
  }

  function validateSharedFields(): string | null {
    if (!startsAtLocal) return "Informe a data e hora do evento.";
    if (new Date(fromDateTimeLocalValue(startsAtLocal)).getTime() <= Date.now()) {
      return "A data do evento precisa ser no futuro.";
    }
    if (!location.trim()) return "Informe o local do evento.";
    const capacityNumber = Number(capacity);
    if (!Number.isFinite(capacityNumber) || capacityNumber <= 0) {
      return "Capacidade deve ser maior que zero.";
    }
    if (capacityNumber > 260) return "Capacidade máxima é 260 lugares.";
    const priceNumber = Number(price);
    if (!Number.isFinite(priceNumber) || priceNumber < 0) {
      return "Preço deve ser zero ou positivo.";
    }
    return null;
  }

  function buildCreateInput(): CreateEventInput {
    return {
      tmdbId: selectedMovie!.tmdbId,
      title: title.trim() || undefined,
      startsAt: fromDateTimeLocalValue(startsAtLocal),
      location: location.trim(),
      capacity: Number(capacity),
      price: Number(price),
    };
  }

  async function handleCreate(publishAfter: boolean) {
    if (!selectedMovie) {
      setError("Selecione um filme do catálogo externo.");
      return;
    }
    const validationError = validateSharedFields();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const { event: created } = await createEvent(buildCreateInput());
      if (publishAfter) {
        await publishEvent(created.id);
      }
      router.push(appRoutes.organizerEvents);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Não foi possível criar o evento.",
      );
      setSubmitting(false);
    }
  }

  async function handleSaveChanges() {
    if (!eventId || !event) return;
    const validationError = validateSharedFields();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const input: UpdateEventInput = {
        title: title.trim() || undefined,
        startsAt: fromDateTimeLocalValue(startsAtLocal),
        location: location.trim(),
        price: Number(price),
      };
      if (event.status === "DRAFT") {
        input.capacity = Number(capacity);
      }
      await updateEvent(eventId, input);
      router.push(appRoutes.organizerEvents);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Não foi possível salvar as alterações.",
      );
      setSubmitting(false);
    }
  }

  async function handlePublishExisting() {
    if (!eventId) return;
    setSubmitting(true);
    setError(null);
    try {
      await publishEvent(eventId);
      router.push(appRoutes.organizerEvents);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Não foi possível publicar o evento.",
      );
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!eventId) return;
    const confirmed = window.confirm(
      "Excluir este evento? Essa ação não pode ser desfeita.",
    );
    if (!confirmed) return;

    setSubmitting(true);
    setError(null);
    try {
      await deleteEvent(eventId);
      router.push(appRoutes.organizerEvents);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Não foi possível excluir o evento.",
      );
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="p-10">
        <p className="text-sm text-text-dim">Carregando evento...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="p-10">
        <p className="text-sm text-text-dim">{loadError}</p>
      </div>
    );
  }

  if (locked && event) {
    return (
      <div className="p-10">
        <p className="text-sm text-text-dim">
          Este evento já foi encerrado e não pode mais ser editado.
        </p>
      </div>
    );
  }

  const capacityNumber = Number(capacity);
  const priceNumber = Number(price);
  const reviewTitle = isEditMode ? event?.catalogItem.title : selectedMovie?.title;
  const reviewImage = isEditMode ? event?.catalogItem.imageUrl : selectedMovie?.posterUrl;

  return (
    <div className="flex gap-8 p-10">
      <div className="flex-1">
        {isEditMode ? (
          <>
            <h3 className="mb-4 font-heading text-base font-semibold">
              Filme vinculado
            </h3>
            <div className="mb-8 flex max-w-sm items-center gap-4 rounded-xl border border-border bg-surface p-3">
              <div className="h-[90px] w-[60px] flex-none overflow-hidden rounded-lg bg-surface-2">
                {reviewImage && (
                  <Image
                    src={reviewImage}
                    alt={reviewTitle ?? ""}
                    width={60}
                    height={90}
                    className="h-full w-full object-cover"
                  />
                )}
              </div>
              <div>
                <span className="block text-sm font-semibold">{reviewTitle}</span>
                <span className="text-xs text-text-mute">
                  O filme não pode ser trocado depois que o evento é criado.
                </span>
              </div>
            </div>
          </>
        ) : (
          <>
            <h3 className="mb-1.5 font-heading text-base font-semibold">
              1. Selecionar item do catálogo externo
            </h3>
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar filme por título..."
              className={`${inputClassName} mb-4 max-w-sm`}
            />
            {moviesError && (
              <p className="mb-4 text-sm text-red-400">{moviesError}</p>
            )}
            {moviesLoading ? (
              <p className="mb-8 text-sm text-text-dim">Carregando catálogo...</p>
            ) : (
              <div className="mb-8 grid grid-cols-3 gap-4">
                {movies.map((movie) => (
                  <button
                    key={movie.tmdbId}
                    type="button"
                    onClick={() => handleSelectMovie(movie)}
                    className={`overflow-hidden rounded-xl border text-left ${
                      selectedMovie?.tmdbId === movie.tmdbId
                        ? "border-2 border-accent-cyan"
                        : "border-border hover:border-text-mute"
                    }`}
                  >
                    <div className="flex h-[160px] items-center justify-center bg-surface-2 text-xs text-text-mute">
                      {movie.posterUrl ? (
                        <Image
                          src={movie.posterUrl}
                          alt={movie.title}
                          width={160}
                          height={160}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        "Sem imagem"
                      )}
                    </div>
                    <div className="bg-surface p-3">
                      <span className="block text-sm font-semibold">
                        {movie.title}
                      </span>
                      <span className="text-[11px] text-text-mute">
                        TMDB · {movie.releaseDate?.slice(0, 4) ?? "—"}
                      </span>
                    </div>
                  </button>
                ))}
                {movies.length === 0 && (
                  <p className="col-span-3 text-sm text-text-dim">
                    Nenhum resultado para essa busca.
                  </p>
                )}
              </div>
            )}
          </>
        )}

        <h3 className="mb-4 font-heading text-base font-semibold">
          {isEditMode ? "Configurar evento" : "2. Configurar evento"}
        </h3>
        <div className="grid max-w-xl grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="mb-1.5 block text-xs text-text-mute">
              Título (opcional — padrão é o título do filme)
            </label>
            <input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder={selectedMovie?.title ?? event?.catalogItem.title}
              className={inputClassName}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-text-mute">
              Data e hora
            </label>
            <input
              type="datetime-local"
              value={startsAtLocal}
              onChange={(event) => setStartsAtLocal(event.target.value)}
              className={inputClassName}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-text-mute">
              Local
            </label>
            <input
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="Cine Verzel - Sala 3"
              className={inputClassName}
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs text-text-mute">
              Capacidade (máx. 260)
            </label>
            <input
              type="number"
              min={1}
              max={260}
              value={capacity}
              onChange={(event) => setCapacity(event.target.value)}
              placeholder="40"
              disabled={Boolean(event && event.status !== "DRAFT")}
              className={`${inputClassName} disabled:opacity-50`}
            />
            {event && event.status !== "DRAFT" && (
              <span className="mt-1 block text-[11px] text-text-mute">
                Só é possível mudar a capacidade enquanto o evento está em rascunho.
              </span>
            )}
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
              placeholder="35.50"
              className={inputClassName}
            />
          </div>
        </div>
      </div>

      <div className="w-80 flex-none self-start rounded-2xl border border-border bg-surface p-6">
        <h3 className="mb-4 font-heading text-base font-semibold">Revisão</h3>
        {reviewTitle ? (
          <>
            <span className="mb-1.5 block text-sm font-semibold">
              {title.trim() || reviewTitle}
            </span>
            <span className="mb-4 block text-xs text-text-mute">
              {location || "Local não definido"}
              {startsAtLocal
                ? ` · ${new Date(fromDateTimeLocalValue(startsAtLocal)).toLocaleString("pt-BR")}`
                : ""}
              {capacityNumber > 0 ? ` · ${capacityNumber} lugares` : ""}
              {priceNumber > 0 ? ` · ${formatCurrency(priceNumber)}` : ""}
            </span>
          </>
        ) : selectedMovieLoading ? (
          <p className="mb-4 text-sm text-text-dim">Carregando filme...</p>
        ) : (
          <p className="mb-4 text-sm text-text-dim">
            Selecione um filme do catálogo para começar.
          </p>
        )}

        <div className="mb-4 h-px bg-border" />

        {error && (
          <p className="mb-4 rounded-[9px] border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
            {error}
          </p>
        )}

        {isEditMode ? (
          <>
            <button
              type="button"
              disabled={submitting}
              onClick={handleSaveChanges}
              className="mb-2.5 w-full rounded-[10px] bg-accent-lime py-3.5 text-center text-sm font-bold text-[#05070a] hover:brightness-95 active:brightness-90 disabled:opacity-60"
            >
              Salvar alterações
            </button>
            {event?.status === "DRAFT" && (
              <button
                type="button"
                disabled={submitting}
                onClick={handlePublishExisting}
                className="mb-2.5 w-full rounded-[10px] border border-border bg-surface-2 py-3.5 text-center text-sm font-semibold text-foreground hover:bg-border disabled:opacity-60"
              >
                Publicar evento
              </button>
            )}
            <button
              type="button"
              disabled={submitting}
              onClick={handleDelete}
              className="w-full rounded-[10px] border border-red-500/30 bg-red-500/10 py-3 text-center text-sm font-semibold text-red-400 hover:bg-red-500/20 disabled:opacity-60"
            >
              Excluir evento
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              disabled={submitting}
              onClick={() => handleCreate(true)}
              className="mb-2.5 w-full rounded-[10px] bg-accent-lime py-3.5 text-center text-sm font-bold text-[#05070a] hover:brightness-95 active:brightness-90 disabled:opacity-60"
            >
              Publicar evento
            </button>
            <button
              type="button"
              disabled={submitting}
              onClick={() => handleCreate(false)}
              className="w-full rounded-[10px] border border-border bg-surface-2 py-3.5 text-center text-sm font-semibold text-foreground hover:bg-border disabled:opacity-60"
            >
              Salvar como rascunho
            </button>
          </>
        )}
      </div>
    </div>
  );
}
