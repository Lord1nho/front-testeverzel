"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { roleHomeRoute } from "@/config/routes";
import { ApiError } from "@/lib/api-client";
import { useToast } from "@/components/toast/ToastProvider";
import { login } from "@/services/auth";

export default function LoginPage() {
  const router = useRouter();
  const toast = useToast();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const { user } = await login(email, password);
      router.push(roleHomeRoute(user.role));
    } catch (err) {
      toast.error(
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

          <button
            type="submit"
            disabled={isSubmitting}
            className="mt-3 rounded-[10px] bg-accent-lime py-3.5 text-center text-sm font-bold text-[#05070a] hover:brightness-95 active:brightness-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Entrando..." : "Entrar"}
          </button>
        </form>
      </div>
    </main>
  );
}
