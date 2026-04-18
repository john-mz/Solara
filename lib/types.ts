import type { User } from "firebase/auth";
import type { Timestamp } from "firebase/firestore";

export type UserRole = "owner" | "plant";

export type PlantBrand = "deye" | "huawei" | "growatt";

export type AlarmType =
  | "FREQUENCY_OUT_OF_RANGE"
  | "VOLTAGE_OUT_OF_RANGE"
  | "DEVICE_OFFLINE"
  | "LOW_GENERATION";

export type AlarmSeverity = "CRITICAL" | "WARNING";

export type AlarmStatus = "ACTIVE" | "ACKNOWLEDGED" | "RESOLVED";

export interface AlarmDoc {
  id: string;
  device_id: string;
  plant_id: string;
  type: AlarmType;
  severity: AlarmSeverity;
  status: AlarmStatus;
  created_at: Timestamp;
  resolved_at: Timestamp | null;
  details?: {
    reading_value?: number;
    threshold_value?: number;
    [k: string]: unknown;
  };
}

export type DeviceType = "inverter" | "microinverter" | "collector";

export type TelemetryStatus = "ONLINE" | "OFFLINE" | "ERROR";

export interface DeviceDoc {
  id: string;
  plant_id: string;
  original_id: string;
  brand: PlantBrand;
  type: DeviceType;
  model: string;
  last_sync_metadata?: Timestamp;
  last_telemetry_at?: Timestamp;
}

export interface TelemetryDoc {
  id: string;
  timestamp: Timestamp;
  kpis: {
    energy_today_kwh: number;
    voltage_ac: number;
    current_ac: number;
    frequency_hz: number;
    status: TelemetryStatus;
  };
}

export interface DailySummaryDoc {
  plant_id: string;
  date: string;
  total_energy_kwh: number;
  avg_uptime_percent: number;
  co2_mitigated_tons: number;
  financial_savings: number;
  computed_at?: Timestamp;
}

export interface ContractCommitments {
  expected_energy_kwh_month?: number;
  expected_uptime_percent?: number;
  target_pr?: number;
}

export interface PlantDoc {
  id: string;
  original_plant_id: string;
  name: string;
  brand: PlantBrand;
  location: string;
  installed_capacity_kw: number;
  contract_commitments?: ContractCommitments;
}

export type AppSession =
  | { role: "owner"; firebaseUser: User }
  | { role: "plant"; plant: PlantDoc }
  | null;
