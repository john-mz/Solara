"use client";

import {
  useInfiniteQuery,
  useQuery,
  type InfiniteData,
} from "@tanstack/react-query";
import {
  Timestamp,
  collection,
  doc,
  getCountFromServer,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  updateDoc,
  where,
  type DocumentData,
  type QueryDocumentSnapshot,
  type QueryConstraint,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type {
  AlarmDoc,
  AlarmSeverity,
  AlarmStatus,
  AlarmType,
  DailySummaryDoc,
  DeviceDoc,
  PlantBrand,
  PlantDoc,
  TelemetryDoc,
  TelemetryStatus,
} from "@/lib/types";

const ALARMS_PAGE = 20;

/** TanStack Query cache tiers aligned with Cloud Functions write cadence */
const STALE = {
  /** Alarms + telemetry — poll jobs run every minute */
  LIVE: 30_000,
  /** Device list metadata — inventory sync is daily */
  DEVICE: 5 * 60_000,
  /** Plants — inventory sync is daily */
  PLANT: 10 * 60_000,
  /** Past daily/monthly summaries — immutable after aggregation */
  HISTORY: Infinity,
  /** Today / current month — may update until daily job at 23:55 */
  TODAY: 5 * 60_000,
} as const;

/** Mirrors telemetry polling interval (1 min) */
const REFETCH_LIVE = 60_000;

export function getTodayDateString() {
  return new Date().toISOString().split("T")[0];
}

function summaryStaleTime(dateStr: string): number {
  return dateStr === getTodayDateString() ? STALE.TODAY : STALE.HISTORY;
}

function monthlyStaleTime(year: number, monthIndex0: number): number {
  const now = new Date();
  return now.getFullYear() === year && now.getMonth() === monthIndex0
    ? STALE.TODAY
    : STALE.HISTORY;
}

function isPlantBrand(value: unknown): value is PlantBrand {
  return value === "deye" || value === "huawei" || value === "growatt";
}

export function mapPlantDoc(docId: string, data: DocumentData): PlantDoc {
  const brand = data.brand;
  if (!isPlantBrand(brand)) {
    throw new Error("Marca de planta inválida");
  }
  const rawCc = data.contract_commitments;
  let contract_commitments: PlantDoc["contract_commitments"];
  if (rawCc && typeof rawCc === "object") {
    const m = rawCc as Record<string, unknown>;
    contract_commitments = {
      expected_energy_kwh_month:
        typeof m.expected_energy_kwh_month === "number"
          ? m.expected_energy_kwh_month
          : undefined,
      expected_uptime_percent:
        typeof m.expected_uptime_percent === "number"
          ? m.expected_uptime_percent
          : undefined,
      target_pr:
        typeof m.target_pr === "number" ? m.target_pr : undefined,
    };
  }
  return {
    id: docId,
    original_plant_id: String(data.original_plant_id ?? ""),
    name: String(data.name ?? ""),
    brand,
    location: String(data.location ?? ""),
    installed_capacity_kw: Number(data.installed_capacity_kw ?? 0),
    ...(contract_commitments ? { contract_commitments } : {}),
  };
}

const ALARM_TYPES: AlarmType[] = [
  "FREQUENCY_OUT_OF_RANGE",
  "VOLTAGE_OUT_OF_RANGE",
  "DEVICE_OFFLINE",
  "LOW_GENERATION",
];

function isAlarmType(v: unknown): v is AlarmType {
  return typeof v === "string" && ALARM_TYPES.includes(v as AlarmType);
}

export function mapAlarmDoc(docId: string, data: DocumentData): AlarmDoc | null {
  const typeRaw = data.type ?? data.rule_type;
  if (!isAlarmType(typeRaw)) return null;

  const statusRaw = data.status;
  let status: AlarmStatus;
  if (statusRaw === "ACTIVE" || statusRaw === "ACKNOWLEDGED" || statusRaw === "RESOLVED") {
    status = statusRaw;
  } else if (typeof data.resolved === "boolean") {
    status = data.resolved ? "RESOLVED" : "ACTIVE";
  } else {
    status = "ACTIVE";
  }

  const sev = data.severity;
  const severity: AlarmSeverity =
    sev === "CRITICAL" || sev === "WARNING" ? sev : "WARNING";

  const created =
    data.created_at instanceof Timestamp
      ? data.created_at
      : data.timestamp instanceof Timestamp
        ? data.timestamp
        : null;
  if (!created) return null;

  let resolved_at: Timestamp | null = null;
  if (data.resolved_at instanceof Timestamp) resolved_at = data.resolved_at;

  const detailsRaw = data.details;
  const details =
    detailsRaw && typeof detailsRaw === "object"
      ? (detailsRaw as AlarmDoc["details"])
      : undefined;

  const readingFromLegacy =
    typeof data.value === "number" ? data.value : undefined;

  return {
    id: docId,
    device_id: String(data.device_id ?? ""),
    plant_id: String(data.plant_id ?? ""),
    type: typeRaw,
    severity,
    status,
    created_at: created,
    resolved_at,
    details: {
      ...details,
      ...(readingFromLegacy != null && details?.reading_value == null
        ? { reading_value: readingFromLegacy }
        : {}),
    },
  };
}

/** Marca una alarma como resuelta en Firestore. */
export async function resolveAlarm(alarmId: string): Promise<void> {
  await updateDoc(doc(db, "alarms", alarmId), {
    status: "RESOLVED",
    resolved_at: Timestamp.now(),
  });
}

function isDeviceType(v: unknown): v is DeviceDoc["type"] {
  return v === "inverter" || v === "microinverter" || v === "collector";
}

function mapDeviceDoc(docId: string, data: DocumentData): DeviceDoc | null {
  const brand = data.brand;
  if (!isPlantBrand(brand)) return null;
  const t = data.type;
  if (!isDeviceType(t)) return null;
  return {
    id: docId,
    plant_id: String(data.plant_id ?? ""),
    original_id: String(data.original_id ?? ""),
    brand,
    type: t,
    model: String(data.model ?? ""),
    last_sync_metadata:
      data.last_sync_metadata instanceof Timestamp
        ? data.last_sync_metadata
        : undefined,
    last_telemetry_at:
      data.last_telemetry_at instanceof Timestamp
        ? data.last_telemetry_at
        : undefined,
  };
}

function mapTelemetryDoc(
  docId: string,
  data: DocumentData
): TelemetryDoc | null {
  const ts = data.timestamp;
  if (!(ts instanceof Timestamp)) return null;
  const kpis = data.kpis;
  if (!kpis || typeof kpis !== "object") return null;
  const k = kpis as Record<string, unknown>;
  const status = k.status;
  const st: TelemetryStatus =
    status === "ONLINE" || status === "OFFLINE" || status === "ERROR"
      ? status
      : "OFFLINE";
  return {
    id: docId,
    timestamp: ts,
    kpis: {
      energy_today_kwh: Number(k.energy_today_kwh ?? 0),
      voltage_ac: Number(k.voltage_ac ?? 0),
      current_ac: Number(k.current_ac ?? 0),
      frequency_hz: Number(k.frequency_hz ?? 0),
      status: st,
    },
  };
}

function mapDailySummary(
  docId: string,
  data: DocumentData
): DailySummaryDoc | null {
  return {
    plant_id: String(data.plant_id ?? ""),
    date: String(data.date ?? ""),
    total_energy_kwh: Number(data.total_energy_kwh ?? 0),
    avg_uptime_percent: Number(data.avg_uptime_percent ?? 0),
    co2_mitigated_tons: Number(data.co2_mitigated_tons ?? 0),
    financial_savings: Number(data.financial_savings ?? 0),
    computed_at:
      data.computed_at instanceof Timestamp ? data.computed_at : undefined,
  };
}

export type AlarmsFilter =
  | "ALL"
  | "CRITICAL"
  | "OFFLINE"
  | { plantId: string };

function alarmQueryConstraints(filter: AlarmsFilter): QueryConstraint[] {
  const baseActive: QueryConstraint[] = [
    where("status", "==", "ACTIVE"),
    orderBy("created_at", "desc"),
  ];

  if (filter === "ALL") {
    return baseActive;
  }
  if (filter === "CRITICAL") {
    return [
      where("status", "==", "ACTIVE"),
      where("severity", "==", "CRITICAL"),
      orderBy("created_at", "desc"),
    ];
  }
  if (filter === "OFFLINE") {
    const fiveMinAgo = Timestamp.fromDate(
      new Date(Date.now() - 5 * 60 * 1000)
    );
    return [
      where("status", "==", "ACTIVE"),
      where("type", "==", "DEVICE_OFFLINE"),
      where("created_at", "<=", fiveMinAgo),
      orderBy("created_at", "desc"),
    ];
  }
  return [
    where("status", "==", "ACTIVE"),
    where("plant_id", "==", filter.plantId),
    orderBy("created_at", "desc"),
  ];
}

/** @internal — exported for tests */
export async function fetchAlarmsPage(
  filter: AlarmsFilter,
  pageParam: QueryDocumentSnapshot | undefined
): Promise<{ items: AlarmDoc[]; lastDoc: QueryDocumentSnapshot | null }> {
  const alarmsRef = collection(db, "alarms");
  const constraints = alarmQueryConstraints(filter);
  const qy = pageParam
    ? query(
        alarmsRef,
        ...constraints,
        startAfter(pageParam),
        limit(ALARMS_PAGE)
      )
    : query(alarmsRef, ...constraints, limit(ALARMS_PAGE));

  const snap = await getDocs(qy);
  const items: AlarmDoc[] = [];
  let lastDoc: QueryDocumentSnapshot | null = null;
  for (const doc of snap.docs) {
    lastDoc = doc;
    const mapped = mapAlarmDoc(doc.id, doc.data());
    if (mapped && mapped.status === "ACTIVE") items.push(mapped);
  }
  return { items, lastDoc: snap.docs.length > 0 ? lastDoc : null };
}

export function useAlarms(filter: AlarmsFilter, enabled = true) {
  return useInfiniteQuery({
    queryKey: ["alarms", filter] as const,
    enabled,
    staleTime: STALE.LIVE,
    refetchInterval: REFETCH_LIVE,
    initialPageParam: undefined as QueryDocumentSnapshot | undefined,
    queryFn: async ({ pageParam }) => fetchAlarmsPage(filter, pageParam),
    getNextPageParam: (lastPage) => {
      if (lastPage.items.length < ALARMS_PAGE || !lastPage.lastDoc) {
        return undefined;
      }
      return lastPage.lastDoc;
    },
  });
}

export function flattenAlarmPages(
  data: InfiniteData<{ items: AlarmDoc[]; lastDoc: QueryDocumentSnapshot | null }> | undefined
): AlarmDoc[] {
  if (!data?.pages) return [];
  return data.pages.flatMap((p) => p.items);
}

export type AlarmKpis = {
  totalActive: number;
  criticalActive: number;
  offlineActive: number;
  avgUnresolvedMs: number | null;
};

export function useAlarmKpis() {
  return useQuery({
    queryKey: ["alarm-kpis"],
    staleTime: STALE.LIVE,
    refetchInterval: REFETCH_LIVE,
    queryFn: async (): Promise<AlarmKpis> => {
      const alarmsRef = collection(db, "alarms");
      const [totalSnap, critSnap, offSnap] = await Promise.all([
        getCountFromServer(query(alarmsRef, where("status", "==", "ACTIVE"))),
        getCountFromServer(
          query(
            alarmsRef,
            where("status", "==", "ACTIVE"),
            where("severity", "==", "CRITICAL")
          )
        ),
        getCountFromServer(
          query(
            alarmsRef,
            where("status", "==", "ACTIVE"),
            where("type", "==", "DEVICE_OFFLINE")
          )
        ),
      ]);

      const activeSnap = await getDocs(
        query(alarmsRef, where("status", "==", "ACTIVE"), limit(500))
      );
      let sumMs = 0;
      let n = 0;
      const now = Date.now();
      for (const doc of activeSnap.docs) {
        const a = mapAlarmDoc(doc.id, doc.data());
        if (!a || a.status !== "ACTIVE") continue;
        sumMs += now - a.created_at.toMillis();
        n += 1;
      }

      return {
        totalActive: totalSnap.data().count,
        criticalActive: critSnap.data().count,
        offlineActive: offSnap.data().count,
        avgUnresolvedMs: n > 0 ? sumMs / n : null,
      };
    },
  });
}

export function usePlants(brand: PlantBrand | "ALL") {
  return useQuery({
    queryKey: ["plants", brand],
    staleTime: STALE.PLANT,
    queryFn: async (): Promise<PlantDoc[]> => {
      const plantsRef = collection(db, "plants");
      const qy =
        brand === "ALL"
          ? query(plantsRef, orderBy("name"))
          : query(plantsRef, where("brand", "==", brand), orderBy("name"));
      const snap = await getDocs(qy);
      return snap.docs
        .map((d) => {
          try {
            return mapPlantDoc(d.id, d.data());
          } catch {
            return null;
          }
        })
        .filter((p): p is PlantDoc => p != null);
    },
  });
}

export function useAllPlantsForSearch() {
  return useQuery({
    queryKey: ["plants-all-search"],
    staleTime: STALE.PLANT,
    queryFn: async (): Promise<PlantDoc[]> => {
      const snap = await getDocs(
        query(collection(db, "plants"), orderBy("name"))
      );
      return snap.docs
        .map((d) => {
          try {
            return mapPlantDoc(d.id, d.data());
          } catch {
            return null;
          }
        })
        .filter((p): p is PlantDoc => p != null);
    },
  });
}

export function useDailySummariesForDate(dateStr: string) {
  return useQuery({
    queryKey: ["daily-summaries-date", dateStr],
    staleTime: summaryStaleTime(dateStr),
    queryFn: async (): Promise<DailySummaryDoc[]> => {
      const snap = await getDocs(
        query(
          collection(db, "daily_summaries"),
          where("date", "==", dateStr)
        )
      );
      return snap.docs
        .map((d) => mapDailySummary(d.id, d.data()))
        .filter((x): x is DailySummaryDoc => x != null && x.date === dateStr);
    },
  });
}

/** Plants with avg_uptime_percent < 90 for a given date */
export function useSlaBreachedSummaries(dateStr: string) {
  return useQuery({
    queryKey: ["daily-summaries-sla", dateStr],
    staleTime: summaryStaleTime(dateStr),
    queryFn: async (): Promise<DailySummaryDoc[]> => {
      const snap = await getDocs(
        query(
          collection(db, "daily_summaries"),
          where("date", "==", dateStr),
          where("avg_uptime_percent", "<", 90)
        )
      );
      return snap.docs
        .map((d) => mapDailySummary(d.id, d.data()))
        .filter((x): x is DailySummaryDoc => x != null);
    },
  });
}

export function useDevices(
  plantId: string | null,
  deviceType: "inverter" | "microinverter" | "ALL"
) {
  return useQuery({
    queryKey: ["devices", plantId, deviceType],
    enabled: Boolean(plantId),
    staleTime: STALE.DEVICE,
    queryFn: async (): Promise<DeviceDoc[]> => {
      if (!plantId) return [];
      const devRef = collection(db, "devices");
      const qy =
        deviceType === "ALL"
          ? query(devRef, where("plant_id", "==", plantId), orderBy("type"))
          : query(
              devRef,
              where("plant_id", "==", plantId),
              where("type", "==", deviceType),
              orderBy("original_id")
            );
      const snap = await getDocs(qy);
      return snap.docs
        .map((d) => mapDeviceDoc(d.id, d.data()))
        .filter((x): x is DeviceDoc => x != null);
    },
  });
}

export function useDeviceTelemetry(
  deviceId: string | null,
  errorsOnly: boolean
) {
  return useQuery({
    queryKey: ["telemetry", deviceId, errorsOnly],
    enabled: Boolean(deviceId),
    staleTime: STALE.LIVE,
    refetchInterval: REFETCH_LIVE,
    queryFn: async (): Promise<TelemetryDoc[]> => {
      if (!deviceId) return [];
      const telRef = collection(db, "devices", deviceId, "telemetry");
      const qy = errorsOnly
        ? query(
            telRef,
            where("kpis.status", "==", "ERROR"),
            orderBy("timestamp", "desc"),
            limit(10)
          )
        : query(telRef, orderBy("timestamp", "desc"), limit(10));
      const snap = await getDocs(qy);
      return snap.docs
        .map((d) => mapTelemetryDoc(d.id, d.data()))
        .filter((x): x is TelemetryDoc => x != null);
    },
  });
}

/** Latest telemetry doc per device (parallel, for KPIs) */
export function useLatestTelemetryForDevices(deviceIds: string[]) {
  return useQuery({
    queryKey: ["latest-telemetry-batch", ...deviceIds.sort()],
    enabled: deviceIds.length > 0,
    staleTime: STALE.LIVE,
    refetchInterval: REFETCH_LIVE,
    queryFn: async (): Promise<Map<string, TelemetryDoc>> => {
      const map = new Map<string, TelemetryDoc>();
      await Promise.all(
        deviceIds.map(async (id) => {
          const snap = await getDocs(
            query(
              collection(db, "devices", id, "telemetry"),
              orderBy("timestamp", "desc"),
              limit(1)
            )
          );
          const doc = snap.docs[0];
          if (!doc) return;
          const t = mapTelemetryDoc(doc.id, doc.data());
          if (t) map.set(id, t);
        })
      );
      return map;
    },
  });
}

function monthBounds(year: number, monthIndex0: number) {
  const start = new Date(year, monthIndex0, 1);
  const end = new Date();
  const endClamped =
    end.getFullYear() === year && end.getMonth() === monthIndex0
      ? end
      : new Date(year, monthIndex0 + 1, 0, 23, 59, 59, 999);
  const pad = (n: number) => String(n).padStart(2, "0");
  const startStr = `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())}`;
  const endStr = `${endClamped.getFullYear()}-${pad(endClamped.getMonth() + 1)}-${pad(endClamped.getDate())}`;
  return { startStr, endStr };
}

export function useMonthlySummaries(year: number, monthIndex0: number) {
  const { startStr, endStr } = monthBounds(year, monthIndex0);
  return useQuery({
    queryKey: ["monthly-summaries", startStr, endStr],
    staleTime: monthlyStaleTime(year, monthIndex0),
    queryFn: async (): Promise<DailySummaryDoc[]> => {
      const snap = await getDocs(
        query(
          collection(db, "daily_summaries"),
          where("date", ">=", startStr),
          where("date", "<=", endStr),
          orderBy("date")
        )
      );
      return snap.docs
        .map((d) => mapDailySummary(d.id, d.data()))
        .filter((x): x is DailySummaryDoc => x != null);
    },
  });
}

export function useFrequencyAlarmsForMonth(
  year: number,
  monthIndex0: number
) {
  const start = new Date(year, monthIndex0, 1);
  const end = new Date(year, monthIndex0 + 1, 0, 23, 59, 59, 999);
  const startTs = Timestamp.fromDate(start);
  const endTs = Timestamp.fromDate(end);

  const now = new Date();
  const isCurrentMonth =
    now.getFullYear() === year && now.getMonth() === monthIndex0;

  return useQuery({
    queryKey: ["alarms-frequency-month", year, monthIndex0],
    staleTime: monthlyStaleTime(year, monthIndex0),
    refetchInterval: isCurrentMonth ? REFETCH_LIVE : false,
    queryFn: async (): Promise<AlarmDoc[]> => {
      const snap = await getDocs(
        query(
          collection(db, "alarms"),
          where("type", "==", "FREQUENCY_OUT_OF_RANGE"),
          where("created_at", ">=", startTs),
          where("created_at", "<=", endTs),
          orderBy("created_at", "desc"),
          limit(2000)
        )
      );
      return snap.docs
        .map((d) => mapAlarmDoc(d.id, d.data()))
        .filter((x): x is AlarmDoc => x != null);
    },
  });
}

export async function fetchPlantsCount(): Promise<number> {
  const snap = await getCountFromServer(collection(db, "plants"));
  return snap.data().count;
}

export function usePlantsCount() {
  return useQuery({
    queryKey: ["plants-count"],
    staleTime: STALE.PLANT,
    queryFn: fetchPlantsCount,
  });
}
