-- Script de vérification et création des tables Supabase
-- À exécuter dans l'éditeur SQL de Supabase

-- =============================================================================
-- 1. VÉRIFICATION DES TABLES EXISTANTES
-- =============================================================================

-- Lister toutes les tables dans le schéma public
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- =============================================================================
-- 2. CRÉATION DE LA TABLE ORDERS (si elle n'existe pas)
-- =============================================================================

CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number TEXT UNIQUE NOT NULL,
  pet_name TEXT NOT NULL,
  animal_type TEXT NOT NULL,
  photo_url TEXT,
  child_name TEXT NOT NULL,
  child_age TEXT,
  client_email TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  number_of_sheets INTEGER DEFAULT 1,
  total_amount DECIMAL(10,2) DEFAULT 0,
  notes TEXT,
  discount_code TEXT,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  status TEXT DEFAULT 'nouveau' CHECK (status IN ('nouveau', 'en_cours', 'termine', 'expedie', 'livre')),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  payment_reference TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- 3. CRÉATION DE LA TABLE ADMIN_NOTES (si elle n'existe pas)
-- =============================================================================

CREATE TABLE IF NOT EXISTS admin_notes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  note TEXT NOT NULL,
  created_by TEXT DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- 4. CRÉATION DE LA TABLE ARTICLES (si elle n'existe pas)
-- =============================================================================

CREATE TABLE IF NOT EXISTS articles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  original_price DECIMAL(10,2) DEFAULT 0,
  sale_price DECIMAL(10,2) DEFAULT 0,
  savings DECIMAL(10,2) DEFAULT 0,
  icon TEXT DEFAULT '📦',
  badge TEXT,
  popular BOOLEAN DEFAULT false,
  features TEXT[] DEFAULT '{}',
  active BOOLEAN DEFAULT true,
  category TEXT DEFAULT 'base' CHECK (category IN ('base', 'upsell', 'pack')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- 5. CRÉATION DE LA TABLE ORDER_ARTICLES (si elle n'existe pas)
-- =============================================================================

CREATE TABLE IF NOT EXISTS order_articles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  article_id UUID REFERENCES articles(id),
  quantity INTEGER DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- 6. CRÉATION DE LA TABLE DISCOUNT_CODES (si elle n'existe pas)
-- =============================================================================

CREATE TABLE IF NOT EXISTS discount_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10,2) NOT NULL,
  minimum_amount DECIMAL(10,2) DEFAULT 0,
  usage_limit INTEGER,
  used_count INTEGER DEFAULT 0,
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- 7. INSERTION DE DONNÉES DE TEST POUR ARTICLES (si la table est vide)
-- =============================================================================

INSERT INTO articles (name, description, original_price, sale_price, savings, icon, badge, popular, features, category)
SELECT 
  '1 Planche de Stickers',
  'Une planche de stickers personnalisés avec votre doudou',
  15.00,
  12.90,
  2.10,
  '🧸',
  'POPULAIRE',
  true,
  ARRAY['Stickers résistants', 'Impression haute qualité', 'Personnalisation unique'],
  'base'
WHERE NOT EXISTS (SELECT 1 FROM articles);

INSERT INTO articles (name, description, original_price, sale_price, savings, icon, badge, popular, features, category)
SELECT 
  '2 Planches de Stickers',
  'Deux planches de stickers personnalisés avec votre doudou',
  30.00,
  24.90,
  5.10,
  '🧸',
  'ÉCONOMIQUE',
  false,
  ARRAY['Stickers résistants', 'Impression haute qualité', 'Personnalisation unique', 'Économie de 17%'],
  'upsell'
WHERE NOT EXISTS (SELECT 1 FROM articles WHERE name = '2 Planches de Stickers');

-- =============================================================================
-- 8. ACTIVATION DES POLITIQUES RLS (Row Level Security)
-- =============================================================================

-- Activer RLS sur toutes les tables
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;

-- Créer des politiques permissives pour les tests (à sécuriser en production)
CREATE POLICY IF NOT EXISTS "Allow all for authenticated users" ON orders FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Allow all for authenticated users" ON admin_notes FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Allow all for authenticated users" ON articles FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Allow all for authenticated users" ON order_articles FOR ALL USING (true);
CREATE POLICY IF NOT EXISTS "Allow all for authenticated users" ON discount_codes FOR ALL USING (true);

-- =============================================================================
-- 9. VÉRIFICATION FINALE
-- =============================================================================

-- Compter les enregistrements dans chaque table
SELECT 'orders' as table_name, COUNT(*) as count FROM orders
UNION ALL
SELECT 'admin_notes' as table_name, COUNT(*) as count FROM admin_notes
UNION ALL
SELECT 'articles' as table_name, COUNT(*) as count FROM articles
UNION ALL
SELECT 'order_articles' as table_name, COUNT(*) as count FROM order_articles
UNION ALL
SELECT 'discount_codes' as table_name, COUNT(*) as count FROM discount_codes
ORDER BY table_name;

-- Vérifier les politiques RLS
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  CASE 
    WHEN rowsecurity THEN '✅ Activée'
    ELSE '❌ Désactivée'
  END as rls_status
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename IN ('orders', 'admin_notes', 'articles', 'order_articles', 'discount_codes')
ORDER BY tablename;
