-- Make the kyc-documents bucket public so admin can view KYC documents
UPDATE storage.buckets SET public = true WHERE id = 'kyc-documents';