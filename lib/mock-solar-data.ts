export type SolarPoint = {
  timestamp: string;
  generationKw: number;
  targetKw: number;
};

export type SolarOverview = {
  siteName: string;
  status: "online" | "warning";
  updatedAt: string;
  currentPowerKw: number;
  dailyGenerationKwh: number;
  efficiency: number;
  activeAlerts: number;
  points: SolarPoint[];
};

/** Mirrors Firestore `plants` + rolled-up telemetry for dashboard display */
export type Plant = {
  id: string;
  name: string;
  brand: "deye" | "huawei" | "growatt";
  location: string;
  installed_capacity_kw: number;
  status: "ONLINE" | "OFFLINE" | "WARNING";
  energy_today_kwh: number;
  avg_uptime_percent: number;
};

/** Mirrors Firestore `alarms` (ruleEngine + seed shapes) */
export type Alarm = {
  id: string;
  plant_id: string;
  device_id: string;
  type:
    | "DEVICE_OFFLINE"
    | "FREQUENCY_OUT_OF_RANGE"
    | "VOLTAGE_OUT_OF_RANGE"
    | "LOW_GENERATION";
  severity: "CRITICAL" | "WARNING";
  description: string;
  created_at: string;
};

/** Mirrors Firestore `daily_summaries` */
export type DailySummary = {
  plant_id: string;
  total_energy_kwh: number;
  avg_uptime_percent: number;
  co2_mitigated_tons: number;
  financial_savings: number;
};

export type FleetOverview = {
  plants: Plant[];
  activeAlarms: Alarm[];
  summaries: DailySummary[];
  totalInstalledKw: number;
  totalEnergyTodayKwh: number;
  totalCo2Tons: number;
  totalFinancialSavings: number;
  avgFleetUptimePercent: number;
  updatedAt: string;
};

const basePoints: SolarPoint[] = [
  { timestamp: "2026-04-18T06:00:00-05:00", generationKw: 22, targetKw: 20 },
  { timestamp: "2026-04-18T07:00:00-05:00", generationKw: 31, targetKw: 28 },
  { timestamp: "2026-04-18T08:00:00-05:00", generationKw: 48, targetKw: 42 },
  { timestamp: "2026-04-18T09:00:00-05:00", generationKw: 61, targetKw: 56 },
  { timestamp: "2026-04-18T10:00:00-05:00", generationKw: 74, targetKw: 68 },
  { timestamp: "2026-04-18T11:00:00-05:00", generationKw: 88, targetKw: 80 },
  { timestamp: "2026-04-18T12:00:00-05:00", generationKw: 95, targetKw: 91 },
  { timestamp: "2026-04-18T13:00:00-05:00", generationKw: 92, targetKw: 93 },
  { timestamp: "2026-04-18T14:00:00-05:00", generationKw: 81, targetKw: 86 },
  { timestamp: "2026-04-18T15:00:00-05:00", generationKw: 65, targetKw: 71 },
];

const baseOverview: Omit<SolarOverview, "updatedAt"> = {
  siteName: "Parque Solar Norte",
  status: "warning",
  currentPowerKw: 81.4,
  dailyGenerationKwh: 624.7,
  efficiency: 93.8,
  activeAlerts: 2,
  points: basePoints,
};

/** Same IDs as `functions/src/api/seedMockData.ts` for parity with Firestore mocks */
const basePlants: Plant[] = [
  {
    id: "mock_deye_1",
    name: "Planta Piloto Deye",
    brand: "deye",
    location: "Bogotá",
    installed_capacity_kw: 10,
    status: "WARNING",
    energy_today_kwh: 42.8,
    avg_uptime_percent: 99.2,
  },
  {
    id: "mock_huawei_1",
    name: "Planta Piloto Huawei",
    brand: "huawei",
    location: "Medellín",
    installed_capacity_kw: 15,
    status: "WARNING",
    energy_today_kwh: 64.1,
    avg_uptime_percent: 99.6,
  },
  {
    id: "mock_growatt_1",
    name: "Planta Piloto Growatt",
    brand: "growatt",
    location: "Cali",
    installed_capacity_kw: 8,
    status: "ONLINE",
    energy_today_kwh: 34.2,
    avg_uptime_percent: 98.9,
  },
];

function buildSummariesFromPlants(plants: Plant[]): DailySummary[] {
  return plants.map((p) => {
    const total_energy_kwh = p.energy_today_kwh;
    return {
      plant_id: p.id,
      total_energy_kwh,
      avg_uptime_percent: p.avg_uptime_percent,
      co2_mitigated_tons: (total_energy_kwh * 0.4) / 1000,
      financial_savings: total_energy_kwh * 500,
    };
  });
}

function alarmCreatedAtMinutesAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60_000).toISOString();
}

const baseFleetAlarms: Alarm[] = [
  {
    id: "alarm_mock_1",
    plant_id: "mock_deye_1",
    device_id: "mock_dev_deye_1",
    type: "VOLTAGE_OUT_OF_RANGE",
    severity: "WARNING",
    description:
      "Voltaje AC fuera del rango permitido (108–132 V). Lectura: 134.2 V",
    created_at: alarmCreatedAtMinutesAgo(18),
  },
  {
    id: "alarm_mock_2",
    plant_id: "mock_huawei_1",
    device_id: "mock_dev_huawei_1",
    type: "VOLTAGE_OUT_OF_RANGE",
    severity: "WARNING",
    description:
      "Voltaje AC fuera del rango permitido (108–132 V). Lectura: 135.0 V",
    created_at: alarmCreatedAtMinutesAgo(14),
  },
  {
    id: "alarm_mock_3",
    plant_id: "mock_growatt_1",
    device_id: "mock_dev_growatt_1",
    type: "FREQUENCY_OUT_OF_RANGE",
    severity: "CRITICAL",
    description:
      "Frecuencia fuera de rango (54–66 Hz). Lectura: 52.8 Hz",
    created_at: alarmCreatedAtMinutesAgo(7),
  },
];

function computeFleetTotals(plants: Plant[], summaries: DailySummary[]) {
  const totalInstalledKw = plants.reduce(
    (s, p) => s + p.installed_capacity_kw,
    0
  );
  const totalEnergyTodayKwh = summaries.reduce(
    (s, x) => s + x.total_energy_kwh,
    0
  );
  const totalCo2Tons = summaries.reduce((s, x) => s + x.co2_mitigated_tons, 0);
  const totalFinancialSavings = summaries.reduce(
    (s, x) => s + x.financial_savings,
    0
  );
  const avgFleetUptimePercent =
    plants.length > 0
      ? plants.reduce((s, p) => s + p.avg_uptime_percent, 0) / plants.length
      : 0;
  return {
    totalInstalledKw,
    totalEnergyTodayKwh,
    totalCo2Tons,
    totalFinancialSavings,
    avgFleetUptimePercent,
  };
}

export async function getMockSolarOverview(): Promise<SolarOverview> {
  await new Promise((resolve) => setTimeout(resolve, 250));

  return {
    ...baseOverview,
    updatedAt: new Date().toISOString(),
  };
}

export async function getMockFleetOverview(): Promise<FleetOverview> {
  await new Promise((resolve) => setTimeout(resolve, 280));

  const summaries = buildSummariesFromPlants(basePlants);
  const totals = computeFleetTotals(basePlants, summaries);

  return {
    plants: basePlants,
    activeAlarms: baseFleetAlarms,
    summaries,
    ...totals,
    updatedAt: new Date().toISOString(),
  };
}
