"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { appRoutes, roleHomeRoute } from "@/config/routes";
import { ApiError } from "@/lib/api-client";
import { getMe, logout } from "@/services/auth";
import type { AuthenticatedUser, UserRole } from "@/types/auth";

const roleLabels: Record<UserRole, string> = {
  CUSTOMER: "Cliente",
  ORGANIZER: "Organizador",
  GATE: "Portaria",
};

const roleAreaLinks: Partial<Record<UserRole, { href: string; label: string }[]>> = {
  ORGANIZER: [{ href: appRoutes.organizerEvents, label: "Meus eventos" }],
  CUSTOMER: [
    { href: appRoutes.events, label: "Ver eventos" },
    { href: appRoutes.myTickets, label: "Meus ingressos" },
  ],
  GATE: [{ href: appRoutes.gate, label: "Validação de ingressos" }],
};

function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function formatMemberSince(isoDate: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(new Date(isoDate));
}

function ChevronIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-4 w-4 flex-none text-text-mute"
    >
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMe()
      .then(({ user }) => setUser(user))
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : "Sessão expirada.");
        router.replace(appRoutes.login);
      });
  }, [router]);

  async function handleLogout() {
    await logout().catch(() => {});
    router.push(appRoutes.login);
  }

  if (!user) {
    return (
      <main className="flex min-h-dvh items-center justify-center px-6">
        <p className="text-sm text-text-dim">
          {error ?? "Carregando perfil..."}
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-dvh px-6 py-10">
      <div className="mx-auto w-full max-w-sm">
        <Link
          href={roleHomeRoute(user.role)}
          className="mb-6 inline-block text-sm text-text-dim hover:text-foreground"
        >
          ← Voltar
        </Link>

        <div className="mb-6 overflow-hidden rounded-2xl border border-border bg-surface">
          <div className="bg-gradient-to-br from-surface-2 to-surface px-6 pb-6 pt-7">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent-lime font-heading text-xl font-bold text-[#05070a]">
              {getInitials(user.name)}
            </div>
            <span className="block text-lg font-bold">{user.name}</span>
            <span className="block text-[13px] text-text-mute">{user.email}</span>
            <span className="mt-3 inline-block w-fit rounded-md bg-accent-lime/15 px-2.5 py-1 text-xs font-bold text-accent-lime">
              {roleLabels[user.role]}
            </span>
          </div>

          <div className="grid grid-cols-1 divide-y divide-border border-t border-border">
            <div className="flex items-center justify-between px-6 py-3.5">
              <span className="text-xs text-text-mute">Membro desde</span>
              <span className="text-sm font-semibold">
                {formatMemberSince(user.createdAt)}
              </span>
            </div>
          </div>
        </div>

        {roleAreaLinks[user.role] && roleAreaLinks[user.role]!.length > 0 && (
          <div className="mb-6 overflow-hidden rounded-2xl border border-border bg-surface">
            {roleAreaLinks[user.role]!.map((link, index) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center justify-between px-5 py-4 text-sm font-semibold text-foreground hover:bg-surface-2 ${
                  index > 0 ? "border-t border-border" : ""
                }`}
              >
                {link.label}
                <ChevronIcon />
              </Link>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={handleLogout}
          className="w-full cursor-pointer rounded-2xl border border-border bg-surface px-5 py-4 text-center text-sm font-semibold text-red-400 hover:bg-red-500/10"
        >
          Sair da conta
        </button>
      </div>
    </main>
  );
}
