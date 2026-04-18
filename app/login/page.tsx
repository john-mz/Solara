"use client";

import Image from "next/image";
import { useState } from "react";
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
  const { setPlantSession } = useAuth();
  const [plantId, setPlantId] = useState("");
  const [plantPending, setPlantPending] = useState(false);
  const [googlePending, setGooglePending] = useState(false);

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
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
      <div
        className={cn(
          "w-full max-w-[400px] rounded-2xl border border-border/60 bg-card/90 p-8 shadow-lg shadow-foreground/5 backdrop-blur-sm",
          "ring-1 ring-border/40"
        )}
      >
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="flex flex-col items-center gap-3">
            <Image
              src="/solara-logo.webp"
              alt="Solara"
              width={72}
              height={72}
              className="size-[72px] rounded-xl object-contain drop-shadow-md"
              priority
            />
            <div className="flex flex-col gap-0.5">
              <h1
                className={cn(
                  "font-[family-name:var(--font-heading)] text-2xl font-semibold tracking-tight text-foreground"
                )}
              >
                Solara
              </h1>
              <p className="text-sm text-muted-foreground">
                by Techos Rentables
              </p>
            </div>
          </div>

          <form
            onSubmit={handlePlantSubmit}
            className="flex w-full flex-col gap-3 text-left"
          >
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="plant-id"
                className="text-sm font-medium text-foreground"
              >
                Número de instalación
              </label>
              <input
                id="plant-id"
                name="plant-id"
                type="text"
                autoComplete="off"
                placeholder="Ej. 122825 o NE=33685734"
                value={plantId}
                onChange={(e) => setPlantId(e.target.value)}
                className={cn(
                  "h-11 w-full rounded-xl border border-input bg-background/80 px-3 text-sm text-foreground outline-none",
                  "placeholder:text-muted-foreground",
                  "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                )}
              />
              <p className="text-xs text-muted-foreground">
                Es el mismo código que aparece en tu contrato o te lo compartió
                el equipo. Sin contraseña.
              </p>
            </div>
            <Button
              type="submit"
              size="lg"
              className="h-11 w-full rounded-xl"
              disabled={plantPending || !plantId.trim()}
            >
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
            <p className="text-pretty text-sm text-muted-foreground">
              <span className="font-medium text-foreground">Administradores</span>
              : accede con la cuenta de Google de Techos Rentables.
            </p>
            <Button
              type="button"
              variant="outline"
              size="lg"
              className={cn(
                "h-11 w-full gap-3 rounded-xl border-border bg-background/80 text-foreground shadow-sm",
                "hover:bg-muted/80"
              )}
              disabled={googlePending}
              onClick={handleGoogleSignIn}
            >
              <GoogleIcon />
              {googlePending ? "Conectando…" : "Continuar con Google"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
