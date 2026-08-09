"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { appRoutes } from "@/config/routes";
import { getMe } from "@/services/auth";

type GuardStatus = "loading" | "authorized" | "forbidden";

export default function OrganizerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<GuardStatus>("loading");

  useEffect(() => {
    getMe()
      .then(({ user }) => {
        setStatus(user.role === "ORGANIZER" ? "authorized" : "forbidden");
      })
      .catch(() => {
        router.replace(appRoutes.login);
      });
  }, [router]);

  if (status === "loading") {
    return (
      <main className="flex min-h-dvh items-center justify-center px-6">
        <p className="text-sm text-text-dim">Carregando...</p>
      </main>
    );
  }

  if (status === "forbidden") {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-sm text-text-dim">
          Acesso restrito a organizadores.
        </p>
        <Link href={appRoutes.profile} className="text-sm text-accent-cyan">
          Voltar ao perfil
        </Link>
      </main>
    );
  }

  return <>{children}</>;
}
