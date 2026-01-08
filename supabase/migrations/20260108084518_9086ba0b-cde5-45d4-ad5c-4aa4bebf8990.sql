-- Add image_url column to support_messages for chat images
ALTER TABLE public.support_messages ADD COLUMN IF NOT EXISTS image_url text;

-- Create storage bucket for support chat images
INSERT INTO storage.buckets (id, name, public)
VALUES ('support-images', 'support-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for BTC QR codes
INSERT INTO storage.buckets (id, name, public)
VALUES ('btc-qr-codes', 'btc-qr-codes', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for support-images bucket
CREATE POLICY "Authenticated users can upload support images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'support-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Anyone can view support images"
ON storage.objects FOR SELECT
USING (bucket_id = 'support-images');

CREATE POLICY "Users can delete own support images"
ON storage.objects FOR DELETE
USING (bucket_id = 'support-images' AND auth.uid() IS NOT NULL);

-- Storage policies for btc-qr-codes bucket
CREATE POLICY "Admins can upload BTC QR codes"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'btc-qr-codes' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view BTC QR codes"
ON storage.objects FOR SELECT
USING (bucket_id = 'btc-qr-codes');

CREATE POLICY "Admins can delete BTC QR codes"
ON storage.objects FOR DELETE
USING (bucket_id = 'btc-qr-codes' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update BTC QR codes"
ON storage.objects FOR UPDATE
USING (bucket_id = 'btc-qr-codes' AND has_role(auth.uid(), 'admin'::app_role));