import {
  collection,
  getDocs,
  orderBy,
  query,
  where,
  type DocumentData,
} from "firebase/firestore";
import { db } from "./firebase";
import type { DailySummaryDoc } from "./types";

export type DailySummaryRow = DailySummaryDoc & { id: string };

function mapDailySummary(
  docId: string,
  data: DocumentData
): DailySummaryRow {
  return {
    id: docId,
    plant_id: String(data.plant_id ?? ""),
    date: String(data.date ?? ""),
    total_energy_kwh: Number(data.total_energy_kwh ?? 0),
    avg_uptime_percent: Number(data.avg_uptime_percent ?? 0),
    co2_mitigated_tons: Number(data.co2_mitigated_tons ?? 0),
    financial_savings: Number(data.financial_savings ?? 0),
    computed_at: data.computed_at,
  };
}

/**
 * Fetches `daily_summaries` for a plant within an inclusive date range (YYYY-MM-DD).
 * Requires a composite index: plant_id ASC, date ASC.
 */
export async function fetchDailySummaries(
  plantId: string,
  startDate: string,
  endDate: string
): Promise<DailySummaryRow[]> {
  const trimmed = plantId.trim();
  if (!trimmed) return [];

  const q = query(
    collection(db, "daily_summaries"),
    where("plant_id", "==", trimmed),
    where("date", ">=", startDate),
    where("date", "<=", endDate),
    orderBy("date", "asc")
  );

  const snap = await getDocs(q);
  return snap.docs.map((d) => mapDailySummary(d.id, d.data()));
}
