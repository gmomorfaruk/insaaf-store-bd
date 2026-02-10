-- Run this in Supabase Dashboard → SQL Editor → New Query
-- This script fixes any foreign key issues for account assignment and package deletion

-- ============================================
-- FIX: Allow package deletion by updating FK constraint
-- ============================================
-- Drop the existing constraint that blocks package deletion
ALTER TABLE package_accounts DROP CONSTRAINT IF EXISTS package_accounts_package_id_fkey;

-- Re-create with ON DELETE CASCADE so deleting a package also deletes its accounts
ALTER TABLE package_accounts ADD CONSTRAINT package_accounts_package_id_fkey 
  FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE CASCADE;

-- Also fix orders table - allow package deletion even if orders reference it
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_package_id_fkey;
ALTER TABLE orders ADD CONSTRAINT orders_package_id_fkey 
  FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE CASCADE;

-- ============================================
-- Original account assignment fixes
-- ============================================
-- First, drop the existing constraint if it exists (to recreate it)
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_account_id_fkey;

-- Add the account_id column if it doesn't exist
ALTER TABLE orders ADD COLUMN IF NOT EXISTS account_id UUID;

-- Add the foreign key constraint
ALTER TABLE orders ADD CONSTRAINT orders_account_id_fkey 
  FOREIGN KEY (account_id) REFERENCES package_accounts(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_orders_account_id ON orders(account_id);

-- Verify the package_accounts table has the correct structure
-- These are idempotent operations
ALTER TABLE package_accounts ADD COLUMN IF NOT EXISTS assigned_order_id UUID;
ALTER TABLE package_accounts ADD COLUMN IF NOT EXISTS assigned_at TIMESTAMPTZ;

-- Drop and recreate the FK for assigned_order_id to ensure it's correct
ALTER TABLE package_accounts DROP CONSTRAINT IF EXISTS package_accounts_assigned_order_id_fkey;
ALTER TABLE package_accounts ADD CONSTRAINT package_accounts_assigned_order_id_fkey 
  FOREIGN KEY (assigned_order_id) REFERENCES orders(id) ON DELETE SET NULL;

-- Create index for assigned_order_id lookups
CREATE INDEX IF NOT EXISTS idx_package_accounts_assigned_order_id ON package_accounts(assigned_order_id);

-- Grant necessary permissions (service role should have these by default)
-- These grant statements ensure the service role can update these tables

-- Show current state for debugging
SELECT 'Current orders with account_id' as info;
SELECT id, status, account_id FROM orders WHERE status = 'approved' ORDER BY created_at DESC LIMIT 5;

SELECT 'Current package_accounts' as info;
SELECT id, package_id, status, assigned_order_id FROM package_accounts ORDER BY created_at DESC LIMIT 10;
