import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "@tanstack/react-router";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

const StudentSession = createContext<{ user: User | null; loading: boolean; recovery: boolean }>({ user: null, loading: true, recovery: false });
export const useStudentSession = () => useContext(StudentSession);

export function StudentSessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [recovery, setRecovery] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();
  useEffect(() => {
    if (new URLSearchParams(window.location.hash.slice(1)).get("type") === "recovery") setRecovery(true);
    let active = true;
    let revision = 0;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!["SIGNED_IN", "SIGNED_OUT", "USER_UPDATED", "PASSWORD_RECOVERY"].includes(event)) return;
      revision++;
      if (event === "PASSWORD_RECOVERY") setRecovery(true);
      if (event === "SIGNED_OUT") setRecovery(false);
      setUser(session?.user ?? null);
      setLoading(false);
      if (event === "SIGNED_OUT") queryClient.clear();
      void router.invalidate();
      if (event !== "SIGNED_OUT") void queryClient.invalidateQueries();
    });
    const initialRevision = revision;
    void supabase.auth.getUser().then(({ data }) => {
      if (!active || initialRevision !== revision) return;
      setUser(data.user);
      setLoading(false);
    }).catch(() => { if (active) setLoading(false); });
    return () => { active = false; subscription.unsubscribe(); };
  }, [router, queryClient]);
  return <StudentSession.Provider value={{ user, loading, recovery }}>{children}</StudentSession.Provider>;
}