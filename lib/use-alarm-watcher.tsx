"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/auth-provider";
import { db } from "@/lib/firebase";
import { mapAlarmDoc } from "@/lib/firestore-hooks";
import type { AlarmDoc, AlarmSeverity, AlarmType } from "@/lib/types";
import { cn } from "@/lib/utils";

function alarmTypeLabel(type: AlarmType) {
  switch (type) {
    case "DEVICE_OFFLINE":
      return "Dispositivo offline";
    case "FREQUENCY_OUT_OF_RANGE":
      return "Frecuencia fuera de rango";
    case "VOLTAGE_OUT_OF_RANGE":
      return "Voltaje fuera de rango";
    case "LOW_GENERATION":
      return "Baja generación";
    default:
      return type;
  }
}

function alarmTypeDescription(type: AlarmType): string {
  switch (type) {
    case "DEVICE_OFFLINE":
      return "El dispositivo dejó de responder";
    case "FREQUENCY_OUT_OF_RANGE":
      return "La frecuencia salió del rango admitido";
    case "VOLTAGE_OUT_OF_RANGE":
      return "El voltaje salió del rango admitido";
    case "LOW_GENERATION":
      return "La generación está por debajo del umbral";
    default:
      return "Revisa el panel de alarmas";
  }
}

// ─── Audio ────────────────────────────────────────────────────────────────────

let sharedAudioContext: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    if (!sharedAudioContext) {
      sharedAudioContext = new AudioContext();
    }
    return sharedAudioContext;
  } catch {
    return null;
  }
}

/**
 * Synthesized alert sequence using Web Audio API.
 * CRITICAL: 5 rising-tone pulses over ~2 s, high gain.
 * WARNING:  3 steady pulses over ~1.2 s, moderate gain.
 */
export function playAlertSound(severity: AlarmSeverity) {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === "suspended") {
    void ctx.resume().catch(() => undefined);
  }

  const isCritical = severity === "CRITICAL";
  const pulses = isCritical ? 5 : 3;
  const spacing = isCritical ? 0.38 : 0.42;
  const pulseDuration = 0.22;
  const gainPeak = isCritical ? 0.55 : 0.32;

  for (let i = 0; i < pulses; i++) {
    const t = ctx.currentTime + i * spacing;

    // Main tone — frequency rises slightly each pulse for CRITICAL
    const osc = ctx.createOscillator();
    const gainNode = ctx.createGain();
    osc.connect(gainNode);
    gainNode.connect(ctx.destination);
    osc.type = isCritical ? "sawtooth" : "sine";
    osc.frequency.setValueAtTime(
      isCritical ? 880 + i * 60 : 660,
      t
    );
    gainNode.gain.setValueAtTime(0.0001, t);
    gainNode.gain.exponentialRampToValueAtTime(gainPeak, t + 0.02);
    gainNode.gain.setValueAtTime(gainPeak, t + pulseDuration * 0.6);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, t + pulseDuration);
    osc.start(t);
    osc.stop(t + pulseDuration + 0.01);

    // Sub-tone one octave lower for body
    const sub = ctx.createOscillator();
    const subGain = ctx.createGain();
    sub.connect(subGain);
    subGain.connect(ctx.destination);
    sub.type = "sine";
    sub.frequency.setValueAtTime(
      isCritical ? (880 + i * 60) / 2 : 330,
      t
    );
    subGain.gain.setValueAtTime(0.0001, t);
    subGain.gain.exponentialRampToValueAtTime(gainPeak * 0.35, t + 0.025);
    subGain.gain.exponentialRampToValueAtTime(0.0001, t + pulseDuration);
    sub.start(t);
    sub.stop(t + pulseDuration + 0.01);
  }
}

// ─── Toast UI ─────────────────────────────────────────────────────────────────

function CriticalIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function WarningIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function AlarmToastContent({ alarm, toastId }: { alarm: AlarmDoc; toastId: string | number }) {
  const critical = alarm.severity === "CRITICAL";

  return (
    <div
      className={cn(
        "pointer-events-auto flex w-[min(100vw-2rem,26rem)] flex-col overflow-hidden rounded-[var(--radius-xl)]",
        "border border-white/30 bg-white/80 shadow-[0_8px_32px_rgba(0,0,0,0.14)] backdrop-blur-xl"
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <span
          className={cn(
            "flex size-8 shrink-0 items-center justify-center rounded-full",
            critical
              ? "bg-red-100 text-red-700"
              : "bg-amber-100 text-amber-700"
          )}
        >
          {critical
            ? <CriticalIcon className="size-4" />
            : <WarningIcon className="size-4" />
          }
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-[0.62rem] font-semibold uppercase tracking-widest text-muted-foreground">
            Nueva alarma
          </p>
          <p className="truncate text-sm font-bold leading-tight text-foreground">
            {alarmTypeLabel(alarm.type)}
          </p>
        </div>

        <span
          className={cn(
            "shrink-0 rounded-full border px-2 py-0.5 text-[0.6rem] font-bold uppercase tracking-wider",
            critical
              ? "border-red-800/55 bg-red-100 text-red-950"
              : "border-amber-800/45 bg-amber-100 text-amber-950"
          )}
        >
          {alarm.severity}
        </span>

        <button
          type="button"
          onClick={() => toast.dismiss(toastId)}
          aria-label="Cerrar alerta"
          className="ml-1 flex size-6 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-black/10 hover:text-foreground"
        >
          <svg viewBox="0 0 16 16" fill="currentColor" className="size-3.5" aria-hidden>
            <path d="M3.72 3.72a.75.75 0 0 1 1.06 0L8 6.94l3.22-3.22a.75.75 0 1 1 1.06 1.06L9.06 8l3.22 3.22a.75.75 0 1 1-1.06 1.06L8 9.06l-3.22 3.22a.75.75 0 0 1-1.06-1.06L6.94 8 3.72 4.78a.75.75 0 0 1 0-1.06z" />
          </svg>
        </button>
      </div>

      {/* Divider */}
      <div className="mx-4 border-t border-black/8" />

      {/* Body */}
      <div className="flex flex-col gap-2.5 px-4 py-3">
        <p className="text-xs leading-relaxed text-muted-foreground">
          {alarmTypeDescription(alarm.type)}
        </p>

        <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 text-[0.68rem]">
          <span className="font-semibold uppercase tracking-wide text-muted-foreground/70">Dispositivo</span>
          <span className="truncate font-mono text-foreground">{alarm.device_id || "—"}</span>
          <span className="font-semibold uppercase tracking-wide text-muted-foreground/70">Planta</span>
          <span className="truncate font-mono text-foreground">{alarm.plant_id || "—"}</span>
        </div>

        <Link
          href="/dashboard/alarmas"
          onClick={() => toast.dismiss(toastId)}
          className={cn(
            "mt-0.5 inline-flex w-full items-center justify-center rounded-lg border py-2 text-sm font-semibold transition-opacity hover:opacity-85",
            critical
              ? "border-red-800/55 bg-red-100 text-red-950"
              : "border-amber-800/45 bg-amber-100 text-amber-950"
          )}
        >
          Ver alarmas
        </Link>
      </div>
    </div>
  );
}

function showAlarmToast(alarm: AlarmDoc) {
  toast.custom(
    (t) => <AlarmToastContent alarm={alarm} toastId={t} />,
    { duration: 18_000 }
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

/**
 * Escucha alarmas ACTIVE en tiempo real y muestra toast + sonido para documentos nuevos
 * (omite la primera carga para no inundar).
 */
export function useAlarmWatcher() {
  const { session, authReady } = useAuth();
  const seenIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!authReady || session === null) {
      seenIdsRef.current = new Set();
      return;
    }

    let isFirstSnapshot = true;

    const q = query(
      collection(db, "alarms"),
      where("status", "==", "ACTIVE"),
      orderBy("created_at", "desc")
    );

    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const skipToast = isFirstSnapshot;

        for (const docSnap of snapshot.docs) {
          const id = docSnap.id;
          if (seenIdsRef.current.has(id)) continue;

          seenIdsRef.current.add(id);

          if (skipToast) continue;

          const alarm = mapAlarmDoc(id, docSnap.data());
          if (!alarm || alarm.status !== "ACTIVE") continue;

          playAlertSound(alarm.severity);
          showAlarmToast(alarm);
        }

        isFirstSnapshot = false;
      },
      (err) => {
        console.error("[useAlarmWatcher]", err);
      }
    );

    return () => {
      unsub();
      seenIdsRef.current = new Set();
    };
  }, [authReady, session]);
}
