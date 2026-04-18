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

export async function getMockSolarOverview(): Promise<SolarOverview> {
  await new Promise((resolve) => setTimeout(resolve, 250));

  return {
    ...baseOverview,
    updatedAt: new Date().toISOString(),
  };
}
