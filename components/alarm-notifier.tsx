"use client";

import { useAlarmWatcher } from "@/lib/use-alarm-watcher";

/** Monta el listener en tiempo real de alarmas (toast + sonido). */
export function AlarmNotifier() {
  useAlarmWatcher();
  return null;
}
