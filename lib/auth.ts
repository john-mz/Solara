import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut as firebaseSignOut,
} from "firebase/auth";
import {
  collection,
  getDocs,
  limit,
  query,
  where,
  type DocumentData,
} from "firebase/firestore";
import { auth, db } from "./firebase";
import type { ContractCommitments, PlantBrand, PlantDoc } from "./types";

export async function signInWithGoogle() {
  const provider = new GoogleAuthProvider();
  return signInWithPopup(auth, provider);
}

export async function signOutFirebase() {
  await firebaseSignOut(auth);
}

function isPlantBrand(value: unknown): value is PlantBrand {
  return value === "deye" || value === "huawei" || value === "growatt";
}

function mapContractCommitments(
  raw: unknown
): ContractCommitments | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const m = raw as Record<string, unknown>;
  return {
    expected_energy_kwh_month:
      typeof m.expected_energy_kwh_month === "number"
        ? m.expected_energy_kwh_month
        : undefined,
    expected_uptime_percent:
      typeof m.expected_uptime_percent === "number"
        ? m.expected_uptime_percent
        : undefined,
    target_pr: typeof m.target_pr === "number" ? m.target_pr : undefined,
  };
}

function mapPlantDoc(docId: string, data: DocumentData): PlantDoc {
  const brand = data.brand;
  if (!isPlantBrand(brand)) {
    throw new Error("Documento de planta con marca inválida.");
  }
  const commitments = mapContractCommitments(data.contract_commitments);
  const hasCommitments =
    commitments &&
    (commitments.expected_energy_kwh_month != null ||
      commitments.expected_uptime_percent != null ||
      commitments.target_pr != null);
  return {
    id: docId,
    original_plant_id: String(data.original_plant_id ?? ""),
    name: String(data.name ?? ""),
    brand,
    location: String(data.location ?? ""),
    installed_capacity_kw: Number(data.installed_capacity_kw ?? 0),
    ...(hasCommitments ? { contract_commitments: commitments } : {}),
  };
}

/**
 * Busca una planta por su `original_plant_id` en Firestore (coincidencia exacta).
 * Incluye formatos como `NE=33685734` para Huawei.
 */
export async function lookupPlantById(
  originalPlantId: string
): Promise<PlantDoc | null> {
  const trimmed = originalPlantId.trim();
  if (!trimmed) return null;

  const q = query(
    collection(db, "plants"),
    where("original_plant_id", "==", trimmed),
    limit(1)
  );
  const snap = await getDocs(q);
  if (snap.empty) return null;

  const doc = snap.docs[0];
  try {
    return mapPlantDoc(doc.id, doc.data());
  } catch {
    return null;
  }
}
