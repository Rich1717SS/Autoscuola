import { useState, useEffect, useCallback } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase, ADMIN_EMAIL } from "@/lib/supabase";
import type { Student } from "@/lib/types";

export interface AuthState {
  session: Session | null;
  isAdmin: boolean;
  student: Student | null;
  loading: boolean;
}

export function useAuth(): AuthState & {
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (data: SignUpData) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  reloadStudent: () => Promise<void>;
} {
  const [session, setSession] = useState<Session | null>(null);
  const [student, setStudent] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStudent = useCallback(async (uid: string) => {
    const { data } = await supabase
      .from("students")
      .select("*")
      .eq("user_id", uid)
      .maybeSingle();
    setStudent(data as Student | null);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) {
        loadStudent(data.session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      if (sess?.user) {
        setLoading(true);
        (async () => {
          await loadStudent(sess.user.id);
          setLoading(false);
        })();
      } else {
        setStudent(null);
        setLoading(false);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, [loadStudent]);

  const isAdmin = session?.user?.email === ADMIN_EMAIL;

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  }, []);

  const signUp = useCallback(async (data: SignUpData) => {
    const { data: authData, error } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
      options: { data: { name: data.name } },
    });
    if (error) return { error: error.message };
    if (!authData.user) return { error: "Errore nella registrazione" };

    const { error: insertError } = await supabase.from("students").insert({
      user_id: authData.user.id,
      name: data.name,
      email: data.email,
      phone: data.phone || null,
      fiscal_code: data.fiscal_code || null,
      license_category: data.license_category,
    });
    if (insertError) return { error: "Registrazione auth OK ma errore nel creare la scheda allievo" };
    return { error: null };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setStudent(null);
    setSession(null);
  }, []);

  const reloadStudent = useCallback(async () => {
    if (session?.user) await loadStudent(session.user.id);
  }, [session, loadStudent]);

  return { session, isAdmin, student, loading, signIn, signUp, signOut, reloadStudent };
}

export interface SignUpData {
  name: string;
  email: string;
  password: string;
  phone: string;
  fiscal_code: string;
  license_category: string;
}
