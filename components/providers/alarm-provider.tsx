"use client";

import { createContext, type ReactNode, useCallback, useContext, useState } from "react";
import { useAlarmWatcher } from "@/lib/use-alarm-watcher";
import type { AlarmDoc } from "@/lib/types";

interface AlarmContextValue {
  activeAlarms: AlarmDoc[];
  dismissAlarm: (id: string) => void;
}

const ActiveAlarmsContext = createContext<AlarmContextValue>({
  activeAlarms: [],
  dismissAlarm: () => undefined,
});

export function AlarmProvider({ children }: { children: ReactNode }) {
  const { activeAlarms: rawAlarms } = useAlarmWatcher();
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const dismissAlarm = useCallback((id: string) => {
    setDismissedIds((prev) => new Set([...prev, id]));
  }, []);

  const activeAlarms = rawAlarms.filter((a) => !dismissedIds.has(a.id));

  return (
    <ActiveAlarmsContext.Provider value={{ activeAlarms, dismissAlarm }}>
      {children}
    </ActiveAlarmsContext.Provider>
  );
}

export function useActiveAlarms() {
  return useContext(ActiveAlarmsContext).activeAlarms;
}

export function useDismissAlarm() {
  return useContext(ActiveAlarmsContext).dismissAlarm;
}
