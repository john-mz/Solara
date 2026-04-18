"use client";

import { onAuthStateChanged, type User } from "firebase/auth";
import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { auth } from "@/lib/firebase";
import { signOutFirebase } from "@/lib/auth";
import type { AppSession, PlantDoc } from "@/lib/types";

const PLANT_SESSION_KEY = "solara_plant_session";

type AuthContextValue = {
  session: AppSession;
  firebaseUser: User | null;
  /** Firebase Auth ha emitido el primer evento (útil para guards sin redirigir antes de tiempo). */
  authReady: boolean;
  setPlantSession: (plant: PlantDoc) => void;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function readPlantFromStorage(): PlantDoc | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(PLANT_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PlantDoc;
    if (
      parsed &&
      typeof parsed.id === "string" &&
      typeof parsed.original_plant_id === "string"
    ) {
      return parsed;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [firebaseUser, setFirebaseUser] = useState<User | null>(() => null);
  const [plantSession, setPlantSessionState] = useState<PlantDoc | null>(null);
  const [authReady, setAuthReady] = useState(false);

  /** Hydrate plant session after mount so SSR and first client render match (avoids hydration mismatch). */
  useEffect(() => {
    setPlantSessionState(readPlantFromStorage());
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
      if (user) {
        sessionStorage.removeItem(PLANT_SESSION_KEY);
        setPlantSessionState(null);
      }
      setAuthReady(true);
    });
    return () => unsub();
  }, []);

  const setPlantSession = useCallback(async (plant: PlantDoc) => {
    await signOutFirebase();
    sessionStorage.setItem(PLANT_SESSION_KEY, JSON.stringify(plant));
    setPlantSessionState(plant);
  }, []);

  const signOut = useCallback(async () => {
    await signOutFirebase();
    sessionStorage.removeItem(PLANT_SESSION_KEY);
    setPlantSessionState(null);
  }, []);

  const session: AppSession = useMemo(() => {
    if (firebaseUser) return { role: "owner", firebaseUser };
    if (plantSession) return { role: "plant", plant: plantSession };
    if (!authReady) return null;
    return null;
  }, [authReady, firebaseUser, plantSession]);

  const value = useMemo(
    () => ({
      session,
      firebaseUser,
      authReady,
      setPlantSession,
      signOut,
    }),
    [session, firebaseUser, authReady, setPlantSession, signOut]
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth debe usarse dentro de AuthProvider");
  }
  return ctx;
}
