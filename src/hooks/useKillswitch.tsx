import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// 1. CONFIGURATION: Your Command Center Credentials
// (These are the same ones from your dashboard index.html)
const KILLSWITCH_URL = 'https://rxxtcvyztgjzlcsvmyox.supabase.co';
const KILLSWITCH_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ4eHRjdnl6dGdqemxjc3ZteW94Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY3MjgyNzcsImV4cCI6MjA4MjMwNDI3N30.CPjgb825u-BznxCSO5jXMD_v2K5_4aL52qnh2ScAaPY';

const SITE_NAME = 'TAMIC Group';

// 2. Create a specific client just for this check
const killswitchClient = createClient(KILLSWITCH_URL, KILLSWITCH_KEY);

export function useKillswitch() {
  const [isKilled, setIsKilled] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkKillswitch = async () => {
      try {
        // Check the status from your Command Center DB
        const { data, error } = await killswitchClient
          .from('killswitch')
          .select('is_killed')
          .eq('site_name', SITE_NAME)
          .single();

        if (error) {
          console.error('Killswitch check error:', error);
          // Safety: If we can't connect, keep the site alive (Fail Open)
          // Change to true if you want it to die on error (Fail Closed)
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

    // 3. Realtime Listener (Optional: Instant Update)
    const channel = killswitchClient
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
      killswitchClient.removeChannel(channel);
    };
  }, []);

  return { isKilled, loading };
}
