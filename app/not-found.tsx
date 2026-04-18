import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "404 – Página no encontrada",
};

export default function NotFound() {
  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4">
      {/* Background image — same as login */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ animation: "kenburns 22s ease-in-out infinite alternate" }}
        aria-hidden="true"
      >
        <Image
          src="/login-background.png"
          alt=""
          fill
          className="object-cover opacity-[0.10]"
          priority
          sizes="110vw"
        />
      </div>

      {/* Card */}
      <div className="relative z-10 flex w-full max-w-[400px] flex-col items-center gap-6 rounded-2xl border border-border/60 bg-card/90 px-6 py-8 shadow-lg shadow-foreground/5 ring-1 ring-border/40 backdrop-blur-sm sm:px-8 sm:py-10">
        {/* Logo */}
        <div className="flex flex-col items-center gap-2">
          <Image
            src="/solara-logo-2.webp"
            alt="Solara"
            width={72}
            height={72}
            className="size-14 rounded-xl object-contain drop-shadow-md sm:size-[72px]"
            priority
          />
          <div className="flex flex-col items-center gap-0.5">
            <span className="font-[family-name:var(--font-heading)] text-xl font-semibold tracking-tight text-foreground">
              Solara
            </span>
            <span className="text-xs text-muted-foreground">
              by Techos Rentables
            </span>
          </div>
        </div>

        {/* 404 content */}
        <div className="flex flex-col items-center gap-3 text-center">
          <p className="font-[family-name:var(--font-heading)] text-6xl font-bold tracking-tight text-primary">
            404
          </p>
          <div className="flex flex-col gap-1">
            <h1 className="font-[family-name:var(--font-heading)] text-lg font-semibold text-foreground">
              Página no encontrada
            </h1>
            <p className="text-sm text-muted-foreground">
              La página que buscas no existe o fue movida.
            </p>
          </div>
        </div>

        <Button asChild size="lg" className="w-full rounded-xl">
          <Link href="/">Volver al inicio</Link>
        </Button>
      </div>

      {/* Bottom logos */}
      <div className="relative z-10 mt-6 flex items-center justify-center gap-6">
        <Image
          src="/techos-rentables-logo.png"
          alt="Techos Rentables"
          width={220}
          height={88}
          className="h-12 w-auto object-contain"
        />
        <span className="h-8 w-px bg-border/60" />
        <Image
          src="/tinku-logo.svg"
          alt="Tinku"
          width={110}
          height={56}
          className="h-8 w-auto object-contain"
        />
      </div>
    </div>
  );
}
