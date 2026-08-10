import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import { api, type StartupProfile } from "./api";

const STORAGE_KEY = "startup-profile-id";

/**
 * How many results each module has saved.
 *
 * Completion has to be counted from rows, not inferred from profile fields.
 * Capital writes nothing to the profile at all — it reads the domain and the
 * latest TAM and produces leads — so there was no field to check and its tick
 * never appeared however many times you ran it.
 */
export type ProfileCounts = {
  ideas: number;
  market: number;
  matches: number;
  leads: number;
};

const EMPTY: ProfileCounts = { ideas: 0, market: 0, matches: 0, leads: 0 };

type ProfileContextValue = {
  profile: StartupProfile | null;
  counts: ProfileCounts;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<StartupProfile | null>(null);
  const [counts, setCounts] = useState<ProfileCounts>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const create = async () => {
    const created = await api.createProfile("demo-user");
    localStorage.setItem(STORAGE_KEY, created.id);
    setProfile(created);
    setCounts(EMPTY);
  };

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const id = localStorage.getItem(STORAGE_KEY);
      if (!id) {
        await create();
        return;
      }

      try {
        // One request for both — /full returns the profile and everything saved
        // against it, so counting rows costs nothing extra.
        const full = await api.getProfileFull(id);
        setProfile(full.profile);
        setCounts({
          ideas: full.idea_cards.length,
          market: full.market_report ? 1 : 0,
          matches: full.matches.length,
          leads: full.leads.length,
        });
      } catch (e) {
        // The stored id can outlive the row it points at — the database was
        // reset, the project was switched, or the row was deleted. Without
        // this the app is permanently stuck on "profile not found" with no way
        // out except clearing site data by hand.
        const missing =
          e instanceof Error && /404|profile not found/i.test(e.message);
        if (!missing) throw e;

        localStorage.removeItem(STORAGE_KEY);
        await create();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  return (
    <ProfileContext.Provider value={{ profile, counts, loading, error, refresh: load }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used within ProfileProvider");
  return ctx;
}
