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
import type { PlantBrand, PlantDoc } from "./types";

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

function mapPlantDoc(docId: string, data: DocumentData): PlantDoc {
  const brand = data.brand;
  if (!isPlantBrand(brand)) {
    throw new Error("Documento de planta con marca inválida.");
  }
  return {
    id: docId,
    original_plant_id: String(data.original_plant_id ?? ""),
    name: String(data.name ?? ""),
    brand,
    location: String(data.location ?? ""),
    installed_capacity_kw: Number(data.installed_capacity_kw ?? 0),
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
