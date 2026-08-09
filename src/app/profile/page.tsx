"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { appRoutes } from "@/config/routes";
import { ApiError } from "@/lib/api-client";
import { getMe, logout } from "@/services/auth";
import type { AuthenticatedUser, UserRole } from "@/types/auth";

const roleLabels: Record<UserRole, string> = {
  CUSTOMER: "Cliente",
  ORGANIZER: "Organizador",
  GATE: "Portaria",
};

const roleAreaLink: Partial<Record<UserRole, { href: string; label: string }>> = {
  ORGANIZER: { href: appRoutes.organizerEvents, label: "Ir para meus eventos" },
  CUSTOMER: { href: appRoutes.events, label: "Ver eventos" },
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
    <main className="flex min-h-dvh items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex items-center gap-4">
          <div className="flex h-[72px] w-[72px] flex-none items-center justify-center rounded-full bg-surface-2 font-heading text-xl font-semibold">
            {getInitials(user.name)}
          </div>
          <div>
            <span className="block text-[19px] font-semibold">
              {user.name}
            </span>
            <span className="text-[13px] text-text-mute">{user.email}</span>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-2 gap-3.5">
          <div className="rounded-xl border border-border bg-surface p-[18px]">
            <span className="block text-lg font-bold text-accent-lime">
              {roleLabels[user.role]}
            </span>
            <span className="text-xs text-text-mute">Papel</span>
          </div>
          <div className="rounded-xl border border-border bg-surface p-[18px]">
            <span className="block text-lg font-bold text-accent-green">
              {formatMemberSince(user.createdAt)}
            </span>
            <span className="text-xs text-text-mute">Membro desde</span>
          </div>
        </div>

        {roleAreaLink[user.role] && (
          <Link
            href={roleAreaLink[user.role]!.href}
            className="mb-2.5 block w-full rounded-xl border border-border bg-surface px-[18px] py-4 text-sm font-semibold text-accent-lime hover:bg-surface-2"
          >
            {roleAreaLink[user.role]!.label}
          </Link>
        )}

        <button
          type="button"
          onClick={handleLogout}
          className="w-full rounded-xl border border-border bg-surface px-[18px] py-4 text-left text-sm text-accent-cyan hover:bg-surface-2"
        >
          Sair da conta
        </button>
      </div>
    </main>
  );
}
