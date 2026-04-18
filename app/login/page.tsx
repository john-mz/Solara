"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/components/providers/auth-provider";
import { lookupPlantById, signInWithGoogle } from "@/lib/auth";
import { cn } from "@/lib/utils";

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={cn("size-5 shrink-0", className)}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

const TYPEWRITER_WORDS = [
  "monitorizada",
  "optimizada",
  "bajo control",
  "en tiempo real",
  "siempre activa",
  "en tus manos",
] as const;

function useTypewriter() {
  const [text, setText] = useState<string>(TYPEWRITER_WORDS[0]);

  useEffect(() => {
    const words = TYPEWRITER_WORDS;
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout>;

    let wordIdx = 0;
    let charIdx = words[0].length;
    let mode: "pausing" | "deleting" | "typing" = "pausing";

    function schedule(ms: number, fn: () => void) {
      timeoutId = setTimeout(() => {
        if (!cancelled) fn();
      }, ms);
    }

    function step() {
      const word = words[wordIdx];

      if (mode === "pausing") {
        schedule(2200, () => {
          mode = "deleting";
          step();
        });
      } else if (mode === "deleting") {
        if (charIdx > 0) {
          charIdx -= 1;
          setText(word.slice(0, charIdx));
          schedule(32, step);
        } else {
          wordIdx = (wordIdx + 1) % words.length;
          mode = "typing";
          schedule(60, step);
        }
      } else {
        const nextWord = words[wordIdx];
        if (charIdx < nextWord.length) {
          charIdx += 1;
          setText(nextWord.slice(0, charIdx));
          schedule(58, step);
        } else {
          mode = "pausing";
          schedule(2200, () => {
            mode = "deleting";
            step();
          });
        }
      }
    }

    schedule(2200, () => {
      mode = "deleting";
      step();
    });

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, []);

  return text;
}

function authErrorMessage(code: string): string {
  switch (code) {
    case "auth/popup-closed-by-user":
    case "auth/cancelled-popup-request":
      return "Inicio de sesión cancelado.";
    case "auth/popup-blocked":
      return "El navegador bloqueó la ventana emergente. Permite ventanas para este sitio.";
    case "auth/unauthorized-domain":
      return "Este dominio no está autorizado en Firebase. Revisa dominios autorizados en la consola.";
    default:
      return "No se pudo iniciar sesión. Intenta de nuevo.";
  }
}

export default function LoginPage() {
  const { session, authReady, setPlantSession } = useAuth();
  const router = useRouter();
  const [plantId, setPlantId] = useState("");
  const [plantFocused, setPlantFocused] = useState(false);
  const [plantPending, setPlantPending] = useState(false);
  const [googlePending, setGooglePending] = useState(false);
  const typewriterText = useTypewriter();

  useEffect(() => {
    if (!authReady) return;
    if (session?.role === "owner") {
      router.replace("/dashboard");
    } else if (session?.role === "plant") {
      router.replace("/");
    }
  }, [authReady, session, router]);

  const plantActive = plantFocused || plantId.length > 0;

  async function handlePlantSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPlantPending(true);
    try {
      const plant = await lookupPlantById(plantId);
      if (!plant) {
        toast.error(
          "No encontramos una instalación con ese número. Revisa el dato e intenta de nuevo."
        );
        return;
      }
      await setPlantSession(plant);
      toast.success(`Bienvenido, ${plant.name}`);
    } catch {
      toast.error("No se pudo verificar la instalación. Intenta de nuevo.");
    } finally {
      setPlantPending(false);
    }
  }

  async function handleGoogleSignIn() {
    setGooglePending(true);
    try {
      await signInWithGoogle();
      toast.success("Sesión de administrador iniciada");
    } catch (err: unknown) {
      const code =
        typeof err === "object" &&
        err !== null &&
        "code" in err &&
        typeof (err as { code: unknown }).code === "string"
          ? (err as { code: string }).code
          : "";
      toast.error(authErrorMessage(code));
    } finally {
      setGooglePending(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-2 sm:py-4 lg:py-6 sm:px-6">
      <div className="mb-3 flex w-full max-w-5xl flex-col items-center gap-1 text-center sm:mb-4 lg:mb-5">
        <h2
          className={cn(
            "font-[family-name:var(--font-heading)] text-xl font-bold tracking-tight text-foreground/90 lg:text-3xl xl:text-4xl",
            "leading-tight"
          )}
        >
          <span>Tu energía solar, </span>
          <span className="text-primary sm:whitespace-nowrap">
            {typewriterText}
            <span className="ml-0.5 animate-pulse font-light text-primary/70">|</span>
          </span>
        </h2>
      </div>

      <div
        className={cn(
          "w-full max-w-[400px] rounded-2xl border border-border/60 bg-card/90 px-5 pb-4 pt-5 shadow-lg shadow-foreground/5 backdrop-blur-sm sm:px-6 sm:pb-4 sm:pt-6 lg:px-8 lg:pb-5 lg:pt-8",
          "ring-1 ring-border/40"
        )}
      >
        <div className="flex flex-col items-center gap-3 text-center sm:gap-4 lg:gap-6">
          <div className="flex flex-col items-center gap-2 sm:gap-2 lg:gap-3">
            <Image
              src="/solara-logo-2.webp"
              alt="Solara"
              width={72}
              height={72}
              className="size-14 rounded-xl object-contain drop-shadow-md sm:size-[60px] lg:size-[72px]"
              priority
            />
            <div className="flex flex-col gap-0.5">
              <h1
                className={cn(
                  "font-[family-name:var(--font-heading)] text-xl font-semibold tracking-tight text-foreground sm:text-xl lg:text-2xl"
                )}
              >
                Solara
              </h1>
              <p className="text-xs text-muted-foreground sm:text-xs lg:text-sm">
                by Techos Rentables
              </p>
            </div>
          </div>

          <form
            onSubmit={handlePlantSubmit}
            className="flex w-full flex-col gap-2 text-left sm:gap-2 lg:gap-3"
          >
            <div className="flex flex-col gap-1">
              <div
                className={cn(
                  "relative overflow-hidden rounded-xl border transition-colors duration-300",
                  plantFocused ? "border-foreground/30" : "border-input"
                )}
              >
                {/* Diagonal shine sweep on focus */}
                <span
                  aria-hidden="true"
                  className={cn(
                    "pointer-events-none absolute inset-0 transition-opacity duration-700",
                    plantFocused ? "opacity-100" : "opacity-0"
                  )}
                  style={{
                    background:
                      "linear-gradient(to right, transparent 15%, oklch(0.88 0.18 88 / 0.55) 50%, transparent 85%)",
                    animation: plantFocused
                      ? "input-shine 5s ease-in-out 0.3s infinite"
                      : undefined,
                  }}
                />
                <div className="relative bg-background/80 rounded-xl">
                  <input
                    id="plant-id"
                    name="plant-id"
                    type="text"
                    autoComplete="off"
                    placeholder="Ej. 122825 o NE=33685734"
                    value={plantId}
                    onChange={(e) => setPlantId(e.target.value)}
                    onFocus={() => setPlantFocused(true)}
                    onBlur={() => setPlantFocused(false)}
                    className={cn(
                      "h-12 w-full rounded-xl bg-transparent px-3 pb-1.5 pt-4 text-sm text-foreground outline-none sm:h-12 lg:h-14 lg:pb-2 lg:pt-5",
                      "placeholder:text-transparent"
                    )}
                  />
                  <label
                    htmlFor="plant-id"
                    className={cn(
                      "pointer-events-none absolute left-3 origin-left text-sm transition-all duration-200",
                      plantActive
                        ? "top-[7px] scale-[0.76] font-medium text-foreground/60"
                        : "top-1/2 -translate-y-1/2 text-muted-foreground"
                    )}
                  >
                    Número de instalación
                  </label>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Es el código que te compartió el equipo de instalación.
              </p>
            </div>
            <Button
              type="submit"
              size="lg"
              className="relative h-10 w-full overflow-hidden rounded-xl transition-transform duration-150 hover:scale-[1.02] active:scale-[0.99] lg:h-11"
              disabled={plantPending || !plantId.trim()}
            >
              {!plantPending && plantId.trim() && (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-white/35 to-transparent"
                  style={{ animation: "shimmer-sweep 4.5s ease-in-out 0.8s infinite" }}
                />
              )}
              {plantPending ? "Verificando…" : "Ingresar a mi instalación"}
            </Button>
          </form>

          <div className="flex w-full items-center gap-3">
            <span className="h-px flex-1 bg-border" />
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              o
            </span>
            <span className="h-px flex-1 bg-border" />
          </div>

          <div className="flex w-full flex-col gap-2">
            <p className="text-pretty text-xs text-muted-foreground lg:text-sm">
              Accede con la cuenta de Techos Rentables
            </p>
            <Button
              type="button"
              variant="outline"
              size="lg"
              className={cn(
                "h-10 w-full gap-3 rounded-xl border-border bg-background/80 text-foreground shadow-sm lg:h-11",
                "hover:bg-muted/80"
              )}
              disabled={googlePending}
              onClick={handleGoogleSignIn}
            >
              <GoogleIcon />
              {googlePending ? "Conectando…" : "Continuar con Google"}
            </Button>
            <p className="mt-2 text-center text-xs leading-none text-muted-foreground lg:mt-4">
              <Link
                href="/privacidad"
                className="font-medium text-foreground/70 underline decoration-foreground/25 underline-offset-2 transition-colors hover:text-foreground hover:decoration-foreground/50"
              >
                Política de privacidad
              </Link>
            </p>
          </div>
        </div>
      </div>

      <div className="mt-3 flex w-full max-w-[400px] items-center justify-center gap-6 sm:mt-4 sm:gap-6 lg:mt-6 lg:gap-8">
        <Image
          src="/techos-rentables-logo.png"
          alt="Techos Rentables"
          width={220}
          height={88}
          className="h-12 w-auto object-contain sm:h-12 lg:h-16"
        />
        <span className="h-8 w-px bg-border/60 sm:h-8 lg:h-10" />
        <Image
          src="/tinku-logo.svg"
          alt="Tinku"
          width={110}
          height={56}
          className="h-8 w-auto object-contain sm:h-8 lg:h-10"
        />
      </div>
    </div>
  );
}
