import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import type { SchoolSettings } from "@/lib/types";

export function useSettings() {
  const [settings, setSettings] = useState<SchoolSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await supabase
      .rpc("get_school_info")
      .maybeSingle();
    if (data) {
      setSettings({
        id: 1,
        school_name: data.school_name,
        logo_url: data.logo_url,
        classroom_pin: "",
        created_at: "",
      });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { settings, loading, reload: load };
}

export function useAdminSettings() {
  const [settings, setSettings] = useState<SchoolSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from("school_settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle();
    if (data) setSettings(data as SchoolSettings);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return { settings, loading, reload: load };
}
