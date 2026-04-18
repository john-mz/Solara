import type { User } from "firebase/auth";

export type UserRole = "owner" | "plant";

export type PlantBrand = "deye" | "huawei" | "growatt";

export interface PlantDoc {
  id: string;
  original_plant_id: string;
  name: string;
  brand: PlantBrand;
  location: string;
  installed_capacity_kw: number;
}

export type AppSession =
  | { role: "owner"; firebaseUser: User }
  | { role: "plant"; plant: PlantDoc }
  | null;
