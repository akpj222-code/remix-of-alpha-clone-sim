import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Global "alternate mode": crypto-only deposits + simplified theme.
// Stored in admin_settings so it applies to every user. Bank details stay saved untouched.
const KEY = 'alt_mode_enabled';

export function useAltMode() {
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchMode = useCallback(async () => {
    const { data } = await supabase
      .from('admin_settings')
      .select('setting_value')
      .eq('setting_key', KEY)
      .maybeSingle();
    setEnabled(data?.setting_value === 'true');
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchMode();
    const channel = supabase
      .channel(`alt-mode-${Math.random().toString(36).slice(2)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'admin_settings' }, fetchMode)
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [fetchMode]);

  const setMode = async (value: boolean) => {
    setEnabled(value);
    const { data } = await supabase.from('admin_settings').select('id').eq('setting_key', KEY).maybeSingle();
    const res = data
      ? await supabase.from('admin_settings').update({ setting_value: String(value) }).eq('setting_key', KEY)
      : await supabase.from('admin_settings').insert({ setting_key: KEY, setting_value: String(value) });
    if (res.error) { setEnabled(!value); return { error: res.error }; }
    return { error: null };
  };

  return { enabled, loading, setMode };
}

export function AltModeThemeApplier() {
  const { enabled } = useAltMode();
  useEffect(() => {
    document.documentElement.classList.toggle('alt-theme', enabled);
  }, [enabled]);
  return null;
}
