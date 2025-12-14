import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export type KYCStatus = 'not_started' | 'pending' | 'approved' | 'rejected';
export type AccountType = 'individual' | 'corporate';

export interface KYCRequest {
  id: string;
  user_id: string;
  account_type: AccountType;
  status: KYCStatus;
  full_name: string | null;
  date_of_birth: string | null;
  phone: string | null;
  chn: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  employment_status: string | null;
  annual_income: string | null;
  company_name: string | null;
  incorporation_date: string | null;
  registration_number: string | null;
  signatory_name: string | null;
  business_address: string | null;
  business_nature: string | null;
  annual_turnover: string | null;
  id_document_url: string | null;
  selfie_url: string | null;
  cac_certificate_url: string | null;
  board_resolution_url: string | null;
  tax_clearance_url: string | null;
  rejection_reason: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export function useKYC() {
  const { user } = useAuth();
  const [kycRequest, setKycRequest] = useState<KYCRequest | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchKYC = useCallback(async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('kyc_requests')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (!error) {
      setKycRequest(data as KYCRequest | null);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchKYC();
    } else {
      setKycRequest(null);
      setLoading(false);
    }
  }, [user, fetchKYC]);

  const submitKYC = async (data: Partial<KYCRequest>) => {
    if (!user) return { error: new Error('Not authenticated') };
    
    const { error } = await supabase
      .from('kyc_requests')
      .insert([{
        user_id: user.id,
        account_type: data.account_type as 'individual' | 'corporate',
        full_name: data.full_name,
        date_of_birth: data.date_of_birth,
        phone: data.phone,
        chn: data.chn,
        address: data.address,
        city: data.city,
        state: data.state,
        country: data.country,
        employment_status: data.employment_status,
        annual_income: data.annual_income,
        company_name: data.company_name,
        incorporation_date: data.incorporation_date,
        registration_number: data.registration_number,
        signatory_name: data.signatory_name,
        business_address: data.business_address,
        business_nature: data.business_nature,
        annual_turnover: data.annual_turnover,
        id_document_url: data.id_document_url,
        selfie_url: data.selfie_url,
        cac_certificate_url: data.cac_certificate_url,
        board_resolution_url: data.board_resolution_url,
        tax_clearance_url: data.tax_clearance_url,
      }]);
    
    if (!error) {
      await fetchKYC();
    }
    
    return { error };
  };

  const uploadDocument = async (file: File, type: string): Promise<{ url: string | null; error: Error | null }> => {
    if (!user) return { url: null, error: new Error('Not authenticated') };
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${type}-${Date.now()}.${fileExt}`;
    
    const { error } = await supabase.storage
      .from('kyc-documents')
      .upload(fileName, file);
    
    if (error) return { url: null, error };
    
    const { data } = supabase.storage
      .from('kyc-documents')
      .getPublicUrl(fileName);
    
    return { url: data.publicUrl, error: null };
  };

  return { kycRequest, loading, fetchKYC, submitKYC, uploadDocument };
}