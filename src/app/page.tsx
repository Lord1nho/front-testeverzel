export default function Home() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-6 py-12 text-foreground">
      <section className="w-full max-w-2xl">
        <p className="text-sm font-medium uppercase text-zinc-500">
          Teste tecnico Verzel
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-normal text-zinc-950">
          Plataforma de Eventos e Ingressos
        </h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-zinc-600">
          Projeto Next.js iniciado com TypeScript, Tailwind CSS, App Router e
          estrutura preparada para os modulos de cliente, organizador e
          portaria.
        </p>
      </section>
    </main>
  );
}
