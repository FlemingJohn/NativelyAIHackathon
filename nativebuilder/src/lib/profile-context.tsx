import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import { api, type StartupProfile } from "./api";

const STORAGE_KEY = "startup-profile-id";

type ProfileContextValue = {
  profile: StartupProfile | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

const ProfileContext = createContext<ProfileContextValue | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<StartupProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const id = localStorage.getItem(STORAGE_KEY);
      let p: StartupProfile;
      if (id) {
        p = await api.getProfile(id);
      } else {
        p = await api.createProfile("demo-user");
        localStorage.setItem(STORAGE_KEY, p.id);
      }
      setProfile(p);
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
    <ProfileContext.Provider value={{ profile, loading, error, refresh: load }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error("useProfile must be used within ProfileProvider");
  return ctx;
}
