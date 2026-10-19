import { useEffect, useSyncExternalStore } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Global "alternate mode": crypto-only deposits/withdrawals + simplified theme.
// Stored in admin_settings so it applies to every user. Bank details stay saved untouched.
// A single shared store keeps every component (theme applier, pages, settings switch) in sync.
const KEY = 'alt_mode_enabled';

let state = { enabled: false, loading: true };
const listeners = new Set<() => void>();
const emit = (next: Partial<typeof state>) => {
  state = { ...state, ...next };
  document.documentElement.classList.toggle('alt-theme', state.enabled);
  listeners.forEach((l) => l());
};

let started = false;
const fetchMode = async () => {
  const { data } = await supabase
    .from('admin_settings')
    .select('setting_value')
    .eq('setting_key', KEY)
    .maybeSingle();
  emit({ enabled: data?.setting_value === 'true', loading: false });
};
const start = () => {
  if (started) return;
  started = true;
  fetchMode();
  supabase
    .channel('alt-mode')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'admin_settings' }, fetchMode)
    .subscribe();
  // Fallback in case realtime is unavailable
  setInterval(fetchMode, 30000);
  window.addEventListener('focus', fetchMode);
};

const subscribe = (l: () => void) => {
  start();
  listeners.add(l);
  return () => listeners.delete(l);
};

export function useAltMode() {
  const snap = useSyncExternalStore(subscribe, () => state);

  const setMode = async (value: boolean) => {
    const prev = state.enabled;
    emit({ enabled: value });
    const { data } = await supabase.from('admin_settings').select('id').eq('setting_key', KEY).maybeSingle();
    const res = data
      ? await supabase.from('admin_settings').update({ setting_value: String(value) }).eq('setting_key', KEY)
      : await supabase.from('admin_settings').insert({ setting_key: KEY, setting_value: String(value) });
    if (res.error) { emit({ enabled: prev }); return { error: res.error }; }
    return { error: null };
  };

  return { enabled: snap.enabled, loading: snap.loading, setMode };
}

export function AltModeThemeApplier() {
  const { enabled } = useAltMode();
  useEffect(() => {
    document.documentElement.classList.toggle('alt-theme', enabled);
  }, [enabled]);
  return null;
}
