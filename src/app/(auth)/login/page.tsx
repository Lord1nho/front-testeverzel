"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { appRoutes } from "@/config/routes";
import { ApiError } from "@/lib/api-client";
import { login } from "@/services/auth";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login(email, password);
      router.push(appRoutes.profile);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Não foi possível conectar ao servidor.",
      );
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <span className="mb-9 block font-heading text-xl font-bold">
          Cine<span className="text-accent-lime">Verzel</span>
        </span>

        <h1 className="mb-2 font-heading text-[26px] font-bold">
          Bem-vindo de volta
        </h1>
        <p className="mb-7 text-sm text-text-dim">
          Entre para ver seus ingressos e continuar de onde parou.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          <div>
            <label
              htmlFor="email"
              className="mb-1.5 block text-xs text-text-mute"
            >
              E-mail
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="voce@email.com"
              className="w-full rounded-[9px] border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none placeholder:text-text-dim focus:border-accent-cyan"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="mb-1.5 block text-xs text-text-mute"
            >
              Senha
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="********"
              className="w-full rounded-[9px] border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none placeholder:text-text-dim focus:border-accent-cyan"
            />
          </div>

          <Link
            href="#"
            className="-mt-1 self-end text-xs text-accent-cyan hover:text-accent-lime"
          >
            Esqueci minha senha
          </Link>

          {error && (
            <p className="rounded-[9px] border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-2 rounded-[10px] bg-accent-lime py-3.5 text-center text-sm font-bold text-[#05070a] hover:brightness-95 active:brightness-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Entrando..." : "Entrar"}
          </button>

          <span className="mt-2 text-center text-[13px] text-text-mute">
            Não tem conta?{" "}
            <Link
              href="#"
              className="font-semibold text-foreground hover:text-accent-lime"
            >
              Cadastre-se
            </Link>
          </span>
        </form>
      </div>
    </main>
  );
}
