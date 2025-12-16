import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  balance: number;
  wallet_id: string | null;
  bank_name: string | null;
  bank_account_number: string | null;
  bank_account_name: string | null;
  bank_routing_number: string | null;
  created_at: string;
  updated_at: string;
}

export function useProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchProfile();
    } else {
      setProfile(null);
      setLoading(false);
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    
    if (!error && data) {
      setProfile(data as Profile);
    }
    setLoading(false);
  };

  const updateBalance = async (newBalance: number) => {
    if (!user) return;
    
    const { error } = await supabase
      .from('profiles')
      .update({ balance: newBalance })
      .eq('id', user.id);
    
    if (!error) {
      setProfile(prev => prev ? { ...prev, balance: newBalance } : null);
    }
    
    return { error };
  };

  return { profile, loading, fetchProfile, updateBalance };
}