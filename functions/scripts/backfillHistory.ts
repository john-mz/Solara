/**
 * Backfill últimos 30 días de `daily_summaries` y agregados en `monthly_summaries`.
 *
 * Autenticación: usa el access_token de firebase-tools (misma máquina que `firebase login`).
 * Alternativa: credenciales de aplicación por defecto (gcloud / SA) vía GOOGLE_APPLICATION_CREDENTIALS
 * si migras este script a firebase-admin.
 *
 * Uso: desde /functions → npm run backfill
 */
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID ?? "hackathon-cursor";
const DAYS = 30;
const COMMIT_MAX_WRITES = 450;

type FirestoreValue =
  | { stringValue: string }
  | { doubleValue: number }
  | { integerValue: string }
  | { timestampValue: string };

type FirestoreFields = Record<string, FirestoreValue>;

interface DailyRow {
  plantId: string;
  date: string;
  total_energy_kwh: number;
  avg_uptime_percent: number;
  co2_mitigated_tons: number;
  financial_savings: number;
}

function firebaseToolsTokenPath(): string | null {
  const candidates = [
    path.join(os.homedir(), ".config", "configstore", "firebase-tools.json"),
    process.platform === "win32" && process.env.APPDATA
      ? path.join(
          process.env.APPDATA,
          "config",
          "configstore",
          "firebase-tools.json"
        )
      : "",
  ].filter(Boolean) as string[];

  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

function readAccessToken(): string {
  const p = firebaseToolsTokenPath();
  if (!p) {
    throw new Error(
      "No se encontró firebase-tools.json. Ejecuta `firebase login` en esta máquina."
    );
  }
  const raw = JSON.parse(fs.readFileSync(p, "utf8")) as {
    tokens?: { access_token?: string };
  };
  const t = raw.tokens?.access_token;
  if (!t) throw new Error("firebase-tools.json no contiene access_token.");
  return t;
}

function todayUtcDateString(): string {
  return new Date().toISOString().split("T")[0];
}

function addDaysUtc(isoDate: string, deltaDays: number): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + deltaDays);
  const yy = dt.getUTCFullYear();
  const mm = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(dt.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

function hash01(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) | 0;
  }
  return (Math.abs(h) % 10_000) / 10_000;
}

function numFromField(v: unknown): number {
  if (!v || typeof v !== "object") return 0;
  const o = v as Record<string, unknown>;
  if (typeof o.doubleValue === "number") return o.doubleValue;
  if (typeof o.integerValue === "string") return parseInt(o.integerValue, 10) || 0;
  if (typeof o.integerValue === "number") return o.integerValue;
  return 0;
}

async function restFetch(
  token: string,
  url: string,
  init?: RequestInit
): Promise<Response> {
  const headers = new Headers(init?.headers);
  headers.set("Authorization", `Bearer ${token}`);
  headers.set("Content-Type", "application/json");
  return fetch(url, { ...init, headers });
}

async function listPlants(token: string): Promise<
  { id: string; installed_capacity_kw: number }[]
> {
  const out: { id: string; installed_capacity_kw: number }[] = [];
  let url: string | null =
    `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/plants?pageSize=300`;

  while (url) {
    const res = await restFetch(token, url);
    if (!res.ok) {
      throw new Error(`list plants ${res.status}: ${await res.text()}`);
    }
    const body = (await res.json()) as {
      documents?: { name: string; fields?: Record<string, unknown> }[];
      nextPageToken?: string;
    };
    for (const doc of body.documents ?? []) {
      const id = doc.name.split("/").pop() ?? "";
      const cap = numFromField(doc.fields?.installed_capacity_kw);
      out.push({ id, installed_capacity_kw: cap });
    }
    url = body.nextPageToken
      ? `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/plants?pageSize=300&pageToken=${body.nextPageToken}`
      : null;
  }
  return out;
}

async function getDailySummaryDoc(
  token: string,
  docId: string
): Promise<FirestoreFields | null> {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/daily_summaries/${encodeURIComponent(docId)}`;
  const res = await restFetch(token, url);
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`get summary ${res.status}: ${await res.text()}`);
  const body = (await res.json()) as { fields?: FirestoreFields };
  return body.fields ?? null;
}

function fieldsToDailyPartial(fields: FirestoreFields): {
  total_energy_kwh: number;
  avg_uptime_percent: number;
} {
  return {
    total_energy_kwh: numFromField(fields.total_energy_kwh),
    avg_uptime_percent: numFromField(fields.avg_uptime_percent),
  };
}

function businessFromEnergy(kwh: number): {
  co2_mitigated_tons: number;
  financial_savings: number;
} {
  return {
    co2_mitigated_tons: (kwh * 0.4) / 1000,
    financial_savings: kwh * 500,
  };
}

function dailyVariationFactor(plantId: string, date: string, dayOffset: number): number {
  const wave = 0.82 + 0.18 * Math.sin(dayOffset * 0.65);
  const noise = (hash01(`${plantId}|${date}`) - 0.5) * 0.12;
  return Math.max(0.35, Math.min(1.35, wave + noise));
}

function uptimeForSynthetic(plantId: string, date: string, dayOffset: number): number {
  const base = 92 + hash01(`up|${plantId}|${date}`) * 7;
  const dip =
    dayOffset % 11 === 3 ? -8 * hash01(`dip|${plantId}|${date}`) : 0;
  return Math.max(72, Math.min(100, base + dip));
}

function buildDailyRowsForPlant(
  plantId: string,
  capacityKw: number,
  todayStr: string,
  existingToday: FirestoreFields | null
): DailyRow[] {
  const rows: DailyRow[] = [];
  let baselineEnergy = 0;
  let baselineUptime = 95;

  if (existingToday) {
    const p = fieldsToDailyPartial(existingToday);
    baselineEnergy = p.total_energy_kwh;
    baselineUptime = p.avg_uptime_percent;
  }

  if (baselineEnergy <= 0) {
    baselineEnergy = Math.max(0, capacityKw * 3.5);
  }
  if (baselineUptime <= 0 || baselineUptime > 100) {
    baselineUptime = 94 + hash01(`defup|${plantId}`) * 5;
  }

  for (let off = 0; off < DAYS; off++) {
    const date = addDaysUtc(todayStr, -off);
    let energy: number;
    let uptime: number;

    if (off === 0 && existingToday) {
      const p = fieldsToDailyPartial(existingToday);
      energy = p.total_energy_kwh;
      uptime = p.avg_uptime_percent;
    } else {
      const factor = dailyVariationFactor(plantId, date, off);
      energy = baselineEnergy * factor;
      uptime = uptimeForSynthetic(plantId, date, off);
    }

    const { co2_mitigated_tons, financial_savings } = businessFromEnergy(energy);

    rows.push({
      plantId,
      date,
      total_energy_kwh: Math.round(energy * 1000) / 1000,
      avg_uptime_percent: Math.round(uptime * 10) / 10,
      co2_mitigated_tons: Math.round(co2_mitigated_tons * 1_000_000) / 1_000_000,
      financial_savings: Math.round(financial_savings),
    });
  }
  return rows;
}

function dailyToWrite(
  row: DailyRow,
  computedAt: string
): Record<string, unknown> {
  return {
    update: {
      name: `projects/${PROJECT_ID}/databases/(default)/documents/daily_summaries/${row.plantId}_${row.date}`,
      fields: {
        plant_id: { stringValue: row.plantId },
        date: { stringValue: row.date },
        total_energy_kwh: { doubleValue: row.total_energy_kwh },
        avg_uptime_percent: { doubleValue: row.avg_uptime_percent },
        co2_mitigated_tons: { doubleValue: row.co2_mitigated_tons },
        financial_savings: { doubleValue: row.financial_savings },
        computed_at: { timestampValue: computedAt },
      } satisfies FirestoreFields,
    },
    updateMask: {
      fieldPaths: [
        "plant_id",
        "date",
        "total_energy_kwh",
        "avg_uptime_percent",
        "co2_mitigated_tons",
        "financial_savings",
        "computed_at",
      ],
    },
  };
}

function monthKeyFromDate(date: string): string {
  return date.slice(0, 7);
}

interface MonthlyAgg {
  plantId: string;
  month: string;
  days: number;
  total_energy_kwh: number;
  avg_uptime_percent: number;
  co2_mitigated_tons: number;
  financial_savings: number;
}

function aggregateMonthly(allRows: DailyRow[]): Map<string, MonthlyAgg> {
  type Acc = {
    plantId: string;
    month: string;
    total_energy_kwh: number;
    co2_mitigated_tons: number;
    financial_savings: number;
    uptimeSum: number;
    days: number;
  };
  const map = new Map<string, Acc>();

  for (const r of allRows) {
    const month = monthKeyFromDate(r.date);
    const key = `${r.plantId}_${month}`;
    let a = map.get(key);
    if (!a) {
      a = {
        plantId: r.plantId,
        month,
        total_energy_kwh: 0,
        co2_mitigated_tons: 0,
        financial_savings: 0,
        uptimeSum: 0,
        days: 0,
      };
      map.set(key, a);
    }
    a.total_energy_kwh += r.total_energy_kwh;
    a.co2_mitigated_tons += r.co2_mitigated_tons;
    a.financial_savings += r.financial_savings;
    a.uptimeSum += r.avg_uptime_percent;
    a.days += 1;
  }

  const out = new Map<string, MonthlyAgg>();
  for (const [key, a] of map) {
    const avgUptime = a.days > 0 ? a.uptimeSum / a.days : 0;
    out.set(key, {
      plantId: a.plantId,
      month: a.month,
      days: a.days,
      total_energy_kwh: Math.round(a.total_energy_kwh * 1000) / 1000,
      avg_uptime_percent: Math.round(avgUptime * 10) / 10,
      co2_mitigated_tons:
        Math.round(a.co2_mitigated_tons * 1_000_000) / 1_000_000,
      financial_savings: Math.round(a.financial_savings),
    });
  }
  return out;
}

function monthlyToWrite(
  plantId: string,
  month: string,
  agg: {
    total_energy_kwh: number;
    avg_uptime_percent: number;
    co2_mitigated_tons: number;
    financial_savings: number;
    days: number;
  },
  computedAt: string
): Record<string, unknown> {
  const docId = `${plantId}_${month}`;
  return {
    update: {
      name: `projects/${PROJECT_ID}/databases/(default)/documents/monthly_summaries/${docId}`,
      fields: {
        plant_id: { stringValue: plantId },
        month: { stringValue: month },
        total_energy_kwh: { doubleValue: agg.total_energy_kwh },
        avg_uptime_percent: { doubleValue: agg.avg_uptime_percent },
        co2_mitigated_tons: { doubleValue: agg.co2_mitigated_tons },
        financial_savings: { doubleValue: agg.financial_savings },
        days_with_data: { integerValue: String(agg.days) },
        computed_at: { timestampValue: computedAt },
      } satisfies FirestoreFields,
    },
    updateMask: {
      fieldPaths: [
        "plant_id",
        "month",
        "total_energy_kwh",
        "avg_uptime_percent",
        "co2_mitigated_tons",
        "financial_savings",
        "days_with_data",
        "computed_at",
      ],
    },
  };
}

async function commitWrites(
  token: string,
  writes: Record<string, unknown>[]
): Promise<void> {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents:commit`;
  const res = await restFetch(token, url, {
    method: "POST",
    body: JSON.stringify({ writes }),
  });
  if (!res.ok) {
    throw new Error(`commit ${res.status}: ${await res.text()}`);
  }
}

async function main(): Promise<void> {
  const token = readAccessToken();
  const todayStr = todayUtcDateString();
  const computedAt = new Date().toISOString();

  console.log(`Proyecto: ${PROJECT_ID}`);
  console.log(`Día base (UTC): ${todayStr}`);
  console.log("Listando plantas...");

  const plants = await listPlants(token);
  console.log(`Plantas: ${plants.length}`);

  const allDaily: DailyRow[] = [];

  for (const p of plants) {
    const summaryId = `${p.id}_${todayStr}`;
    const existing = await getDailySummaryDoc(token, summaryId);
    const rows = buildDailyRowsForPlant(p.id, p.installed_capacity_kw, todayStr, existing);
    allDaily.push(...rows);
  }

  console.log(`Documentos daily_summaries a escribir: ${allDaily.length}`);

  const dailyWrites = allDaily.map((r) => dailyToWrite(r, computedAt));
  for (let i = 0; i < dailyWrites.length; i += COMMIT_MAX_WRITES) {
    const chunk = dailyWrites.slice(i, i + COMMIT_MAX_WRITES);
    await commitWrites(token, chunk);
    console.log(`Commit daily_summaries ${i + 1}–${i + chunk.length} / ${dailyWrites.length}`);
  }

  const monthlyMap = aggregateMonthly(allDaily);

  const monthlyWrites: Record<string, unknown>[] = [];
  for (const [, agg] of monthlyMap) {
    monthlyWrites.push(monthlyToWrite(agg.plantId, agg.month, agg, computedAt));
  }

  console.log(`Documentos monthly_summaries a escribir: ${monthlyWrites.length}`);

  for (let i = 0; i < monthlyWrites.length; i += COMMIT_MAX_WRITES) {
    const chunk = monthlyWrites.slice(i, i + COMMIT_MAX_WRITES);
    await commitWrites(token, chunk);
    console.log(`Commit monthly_summaries ${i + 1}–${i + chunk.length} / ${monthlyWrites.length}`);
  }

  console.log("Backfill completado.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
