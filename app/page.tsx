export default function Home() {
  return (
    <main className="flex min-h-full flex-1 flex-col items-center justify-center px-6 py-16">
      <div className="max-w-lg text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Solara
        </h1>
        <p className="mt-3 text-muted-foreground text-sm leading-relaxed">
          App en construcción. Documentación del reto en{" "}
          <code className="rounded bg-foreground/10 px-1.5 py-0.5 text-xs font-mono">
            docs/
          </code>
          .
        </p>
      </div>
    </main>
  );
}
