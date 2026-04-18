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

/** 3-pulse beep — louder for CRITICAL */
export function playAlertSound(severity: AlarmSeverity) {
  const ctx = getAudioContext();
  if (!ctx) return;
  if (ctx.state === "suspended") {
    void ctx.resume().catch(() => {
      /* autoplay may block until user gesture */
    });
  }

  const baseFreq = severity === "CRITICAL" ? 920 : 640;
  const gainPeak = severity === "CRITICAL" ? 0.42 : 0.28;
  const pulses = severity === "CRITICAL" ? 4 : 3;
  const spacing = 0.2;

  for (let i = 0; i < pulses; i++) {
    const start = ctx.currentTime + i * spacing;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.setValueAtTime(baseFreq, start);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(gainPeak, start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.12);
    osc.start(start);
    osc.stop(start + 0.13);
  }
}

function AlarmToastContent({ alarm }: { alarm: AlarmDoc }) {
  const critical = alarm.severity === "CRITICAL";
  return (
    <div
      className={cn(
        "pointer-events-auto flex w-[min(100vw-2rem,24rem)] flex-col gap-2 rounded-lg border-l-4 p-4 shadow-2xl",
        critical
          ? "animate-pulse border-l-red-600 bg-red-50 ring-2 ring-red-400/80 dark:bg-red-950/90 dark:ring-red-500/60"
          : "border-l-amber-500 bg-amber-50 ring-1 ring-amber-300/70 dark:bg-amber-950/80 dark:ring-amber-500/50"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="text-2xl" aria-hidden>
            {critical ? "🚨" : "⚠️"}
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-600 dark:text-neutral-300">
              Nueva alerta
            </p>
            <p className="font-semibold text-neutral-900 dark:text-neutral-50">
              {alarmTypeLabel(alarm.type)}
            </p>
          </div>
        </div>
        <span
          className={cn(
            "shrink-0 rounded px-2 py-0.5 text-[10px] font-bold uppercase",
            critical
              ? "bg-red-600 text-white"
              : "bg-amber-500 text-white"
          )}
        >
          {alarm.severity}
        </span>
      </div>
      <p className="text-sm text-neutral-700 dark:text-neutral-200">
        Dispositivo:{" "}
        <span className="font-mono text-xs">{alarm.device_id}</span>
      </p>
      <Link
        href="/dashboard/alarmas"
        className={cn(
          "inline-flex w-fit items-center rounded-md px-3 py-1.5 text-sm font-semibold text-white",
          critical ? "bg-red-600 hover:bg-red-700" : "bg-amber-600 hover:bg-amber-700"
        )}
      >
        Ver alarmas
      </Link>
    </div>
  );
}

function showAlarmToast(alarm: AlarmDoc) {
  toast.custom(() => <AlarmToastContent alarm={alarm} />, {
    duration: 15_000,
    closeButton: true,
  });
}

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
