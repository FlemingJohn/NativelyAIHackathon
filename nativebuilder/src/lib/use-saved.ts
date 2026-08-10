import { useEffect, useState } from "react";

import { api, type ProfileFull } from "./api";
import { useProfile } from "./profile-context";

/**
 * Loads whatever this profile has already saved, once, on mount.
 *
 * Before this the four module pages were write-only: they saved results to
 * Supabase and never read them back, so navigating away and returning looked
 * like the work had been thrown away. The rows were there the whole time.
 */
export function useSaved<T>(pick: (full: ProfileFull) => T) {
  const { profile } = useProfile();
  const [saved, setSaved] = useState<T | null>(null);
  const [restoring, setRestoring] = useState(true);

  useEffect(() => {
    if (!profile) return;
    let cancelled = false;

    setRestoring(true);
    api
      .getProfileFull(profile.id)
      .then((full) => {
        if (!cancelled) setSaved(pick(full));
      })
      // A failed restore is not worth an error banner: the form still works,
      // it just starts empty.
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setRestoring(false);
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.id]);

  return { saved, restoring, setSaved };
}
