"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { appRoutes } from "@/config/routes";
import { logout } from "@/services/auth";

export default function EventsPage() {
  const router = useRouter();

  async function handleLogout() {
    await logout().catch(() => {});
    router.push(appRoutes.login);
  }

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background px-6 text-center text-foreground">
      <p className="text-sm text-text-dim">Área de eventos — em construção.</p>
      <div className="flex items-center gap-5 text-sm">
        <Link href={appRoutes.profile} className="text-accent-cyan hover:text-accent-lime">
          Perfil
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          className="text-text-dim hover:text-foreground"
        >
          Sair
        </button>
      </div>
    </main>
  );
}
