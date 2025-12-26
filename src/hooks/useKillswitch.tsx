import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const SITE_NAME = 'TAMIC Group';

export function useKillswitch() {
  const [isKilled, setIsKilled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkKillswitch = async () => {
      try {
        const { data, error } = await supabase
          .from('killswitch')
          .select('is_killed')
          .eq('site_name', SITE_NAME)
          .single();

        if (error) {
          console.error('Killswitch check error:', error);
          setIsKilled(false);
        } else {
          setIsKilled(data?.is_killed || false);
        }
      } catch (err) {
        console.error('Killswitch error:', err);
        setIsKilled(false);
      } finally {
        setLoading(false);
      }
    };

    checkKillswitch();

    // Subscribe to realtime changes
    const channel = supabase
      .channel('killswitch-changes')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'killswitch',
          filter: `site_name=eq.${SITE_NAME}`,
        },
        (payload) => {
          setIsKilled(payload.new.is_killed || false);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { isKilled, loading };
}