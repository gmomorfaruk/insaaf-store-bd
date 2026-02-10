-- Run this in Supabase Dashboard → SQL Editor → New Query
-- This adds the package_accounts table and account_id column to orders

-- Package accounts table (stores account credentials for packages)
CREATE TABLE IF NOT EXISTS package_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id TEXT NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  password TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'assigned', 'revoked')),
  assigned_order_id UUID,
  assigned_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add account_id column to orders table (if it doesn't exist)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES package_accounts(id) ON DELETE SET NULL;

-- Add profile_id and profile_number columns to orders table (for profile system)
ALTER TABLE orders ADD COLUMN IF NOT EXISTS profile_id UUID;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS profile_number INTEGER;

-- Add foreign key for assigned_order_id after orders table has been modified
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'package_accounts_assigned_order_id_fkey' 
    AND table_name = 'package_accounts'
  ) THEN
    ALTER TABLE package_accounts 
    ADD CONSTRAINT package_accounts_assigned_order_id_fkey 
    FOREIGN KEY (assigned_order_id) REFERENCES orders(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Enable RLS on package_accounts
ALTER TABLE package_accounts ENABLE ROW LEVEL SECURITY;

-- Policies for package_accounts (admin only via service role)
CREATE POLICY IF NOT EXISTS "Service role can manage package accounts" ON package_accounts
  FOR ALL USING (true) WITH CHECK (true);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_package_accounts_package_id ON package_accounts(package_id);
CREATE INDEX IF NOT EXISTS idx_package_accounts_status ON package_accounts(status);
CREATE INDEX IF NOT EXISTS idx_package_accounts_assigned_order_id ON package_accounts(assigned_order_id);
CREATE INDEX IF NOT EXISTS idx_orders_account_id ON orders(account_id);
CREATE INDEX IF NOT EXISTS idx_orders_profile_id ON orders(profile_id);

-- Profiles table (for user self-service portal)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_number SERIAL UNIQUE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  mobile TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policies for profiles
CREATE POLICY IF NOT EXISTS "Anyone can create profiles" ON profiles
  FOR INSERT WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Service role can manage profiles" ON profiles
  FOR ALL USING (true) WITH CHECK (true);

-- Index for profiles
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_mobile ON profiles(mobile);

-- Access tokens table (for profile authentication)
CREATE TABLE IF NOT EXISTS access_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on access_tokens
ALTER TABLE access_tokens ENABLE ROW LEVEL SECURITY;

-- Policies for access_tokens
CREATE POLICY IF NOT EXISTS "Service role can manage access tokens" ON access_tokens
  FOR ALL USING (true) WITH CHECK (true);

-- Index for access_tokens
CREATE INDEX IF NOT EXISTS idx_access_tokens_token ON access_tokens(token);
CREATE INDEX IF NOT EXISTS idx_access_tokens_order_id ON access_tokens(order_id);
