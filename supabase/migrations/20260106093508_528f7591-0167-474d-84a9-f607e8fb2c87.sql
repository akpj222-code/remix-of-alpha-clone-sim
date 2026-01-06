-- Drop the restrictive admin-only read policy
DROP POLICY IF EXISTS "Admins can read settings" ON public.admin_settings;

-- Create a new policy allowing ALL authenticated users to read settings
CREATE POLICY "Anyone can read settings"
ON public.admin_settings
FOR SELECT
USING (true);

-- Keep admin-only policies for insert/update (already exist)