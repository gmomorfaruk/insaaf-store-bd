-- Run this SQL in Supabase Dashboard → SQL Editor → New Query
-- This adds the new tables for contact submissions and site settings

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
  payment_number TEXT DEFAULT '',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

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
CREATE INDEX IF NOT EXISTS idx_contact_status ON contact_submissions(status);

-- Insert default settings row
INSERT INTO site_settings (id, whatsapp_link, telegram_link, facebook_link, support_email)
VALUES ('main', '', '', '', '')
ON CONFLICT (id) DO NOTHING;

-- Add new columns to reviews table (if they don't exist)
-- Run this if you already have a reviews table
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS institution TEXT;
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS occupation TEXT CHECK (occupation IS NULL OR occupation IN ('student', 'professional'));

-- Add payment_number column to site_settings (for existing tables)
ALTER TABLE site_settings ADD COLUMN IF NOT EXISTS payment_number TEXT DEFAULT '';
