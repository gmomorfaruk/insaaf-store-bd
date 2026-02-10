-- Run this in Supabase Dashboard → SQL Editor → New Query
-- This updates the packages status constraint to include 'upcoming'

-- Drop the old constraint
ALTER TABLE packages DROP CONSTRAINT IF EXISTS packages_status_check;

-- Add the new constraint with 'upcoming' included
ALTER TABLE packages ADD CONSTRAINT packages_status_check 
  CHECK (status IN ('active', 'hidden', 'inactive', 'upcoming'));

-- Update RLS policy to allow public read of both active and upcoming packages
DROP POLICY IF EXISTS "Public can read active packages" ON packages;
DROP POLICY IF EXISTS "Public can read active and upcoming packages" ON packages;
CREATE POLICY "Public can read active and upcoming packages" ON packages
  FOR SELECT USING (status = 'active' OR status = 'upcoming');
