-- Run this in Supabase Dashboard → SQL Editor → New Query
-- SIMPLIFIED SCHEMA for Admin Panel

-- Packages table
CREATE TABLE IF NOT EXISTS packages (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'BDT',
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'hidden', 'inactive', 'upcoming')),
  features JSONB DEFAULT '[]'::jsonb,
  groups JSONB DEFAULT '{}'::jsonb,
  is_highlighted BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Contact form submissions
CREATE TABLE IF NOT EXISTS contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  mobile TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'read', 'resolved')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Site settings (links, contact info)
CREATE TABLE IF NOT EXISTS site_settings (
  id TEXT PRIMARY KEY DEFAULT 'main',
  whatsapp_link TEXT DEFAULT '',
  telegram_link TEXT DEFAULT '',
  facebook_link TEXT DEFAULT '',
  support_email TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  user_name TEXT,
  user_id TEXT,
  email TEXT NOT NULL,
  mobile TEXT NOT NULL,
  package_id TEXT NOT NULL REFERENCES packages(id),
  source TEXT NOT NULL CHECK (source IN ('WhatsApp', 'Facebook', 'Telegram', 'Website')),
  transaction_id TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  currency TEXT DEFAULT 'BDT',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  account_id UUID,  -- References package_accounts (FK added after table creation)
  profile_id UUID,
  profile_number INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Package accounts table (stores account credentials for packages)
CREATE TABLE IF NOT EXISTS package_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id TEXT NOT NULL REFERENCES packages(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  password TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'assigned', 'revoked')),
  assigned_order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  assigned_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key from orders.account_id to package_accounts
ALTER TABLE orders ADD CONSTRAINT orders_account_id_fkey 
  FOREIGN KEY (account_id) REFERENCES package_accounts(id) ON DELETE SET NULL;

-- Chat entries table (for AI chatbot knowledge)
CREATE TABLE IF NOT EXISTS chat_entries (
  id TEXT PRIMARY KEY,
  topic TEXT NOT NULL,
  prompt TEXT NOT NULL,
  response TEXT NOT NULL,
  enabled BOOLEAN DEFAULT true,
  tags JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reviews table
CREATE TABLE IF NOT EXISTS reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  source TEXT,
  institution TEXT,
  occupation TEXT CHECK (occupation IS NULL OR occupation IN ('student', 'professional')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS (Row Level Security)
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE package_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

-- Policies for packages (public read, authenticated write)
CREATE POLICY "Public can read active and upcoming packages" ON packages
  FOR SELECT USING (status = 'active' OR status = 'upcoming');

CREATE POLICY "Service role can do anything on packages" ON packages
  FOR ALL USING (true) WITH CHECK (true);

-- Policies for orders (users can insert, service role can manage)
CREATE POLICY "Anyone can create orders" ON orders
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can manage orders" ON orders
  FOR ALL USING (true) WITH CHECK (true);

-- Policies for package_accounts (admin only via service role)
CREATE POLICY "Service role can manage package accounts" ON package_accounts
  FOR ALL USING (true) WITH CHECK (true);

-- Policies for chat_entries
CREATE POLICY "Public can read enabled chat entries" ON chat_entries
  FOR SELECT USING (enabled = true);

CREATE POLICY "Service role can manage chat entries" ON chat_entries
  FOR ALL USING (true) WITH CHECK (true);

-- Policies for reviews
CREATE POLICY "Public can read approved reviews" ON reviews
  FOR SELECT USING (status = 'approved');

CREATE POLICY "Anyone can create reviews" ON reviews
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can manage reviews" ON reviews
  FOR ALL USING (true) WITH CHECK (true);

-- Policies for contact_submissions
CREATE POLICY "Anyone can create contact submissions" ON contact_submissions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Service role can manage contact submissions" ON contact_submissions
  FOR ALL USING (true) WITH CHECK (true);

-- Policies for site_settings
CREATE POLICY "Public can read site settings" ON site_settings
  FOR SELECT USING (true);

CREATE POLICY "Service role can manage site settings" ON site_settings
  FOR ALL USING (true) WITH CHECK (true);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_packages_status ON packages(status);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_account_id ON orders(account_id);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);
CREATE INDEX IF NOT EXISTS idx_contact_status ON contact_submissions(status);
CREATE INDEX IF NOT EXISTS idx_package_accounts_package_id ON package_accounts(package_id);
CREATE INDEX IF NOT EXISTS idx_package_accounts_status ON package_accounts(status);
CREATE INDEX IF NOT EXISTS idx_package_accounts_assigned_order_id ON package_accounts(assigned_order_id);

-- Insert default settings row
INSERT INTO site_settings (id, whatsapp_link, telegram_link, facebook_link, support_email)
VALUES ('main', '', '', '', '')
ON CONFLICT (id) DO NOTHING;
