export default function Home() {
  return (
    <main className="flex min-h-dvh items-center justify-center bg-background px-6 py-12 text-foreground">
      <section className="w-full max-w-2xl">
        <p className="text-sm font-medium uppercase text-text-mute">
          Teste tecnico Verzel
        </p>
        <h1 className="mt-4 font-heading text-4xl font-bold tracking-normal text-foreground">
          Plataforma de Eventos e Ingressos
        </h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-text-dim">
          Projeto Next.js iniciado com TypeScript, Tailwind CSS, App Router e
          estrutura preparada para os modulos de cliente, organizador e
          portaria.
        </p>
      </section>
    </main>
  );
}
