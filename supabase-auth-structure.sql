-- ============================================================================
-- STRUCTURE BASE DE DONNÉES - AUTHENTIFICATION AUTOMATIQUE
-- ============================================================================
-- À exécuter dans l'éditeur SQL de Supabase
-- Phase 1 : Création des tables pour l'authentification automatique

-- ============================================================================
-- 1. TABLE PROFILS UTILISATEURS (Création automatique post-commande)
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  
  -- Adresse principale (JSON pour flexibilité)
  default_address JSONB DEFAULT '{}'::jsonb,
  
  -- Traçabilité création compte
  account_created_from_order TEXT, -- Référence première commande
  account_created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Statistiques client
  total_orders INTEGER DEFAULT 0,
  total_spent DECIMAL(10,2) DEFAULT 0,
  total_savings DECIMAL(10,2) DEFAULT 0,
  
  -- Préférences
  newsletter_subscribed BOOLEAN DEFAULT true,
  marketing_emails BOOLEAN DEFAULT true,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 2. MODIFICATION TABLE ORDERS (Lier aux utilisateurs)
-- ============================================================================

-- Ajouter colonne user_id si elle n'existe pas
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'user_id'
  ) THEN
    ALTER TABLE orders ADD COLUMN user_id UUID REFERENCES auth.users(id);
  END IF;
END $$;

-- Ajouter colonne pour hash de photo (détection doublons)
DO $$ 
BEGIN 
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'photo_hash'
  ) THEN
    ALTER TABLE orders ADD COLUMN photo_hash TEXT;
  END IF;
END $$;

-- ============================================================================
-- 3. TABLE DOUDOUS UTILISATEURS (Détection répétitions)
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_doudous (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  
  -- Informations doudou
  pet_name TEXT NOT NULL,
  animal_type TEXT NOT NULL,
  photo_hash TEXT, -- Hash pour détecter même photo
  
  -- Statistiques
  first_order_id UUID REFERENCES orders(id),
  first_order_date TIMESTAMPTZ,
  total_orders INTEGER DEFAULT 1,
  last_order_date TIMESTAMPTZ,
  
  -- Pricing
  standard_price DECIMAL(10,2),
  discounted_price DECIMAL(10,2),
  total_savings DECIMAL(10,2) DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Contrainte unicité par utilisateur
  UNIQUE(user_id, pet_name, animal_type)
);

-- ============================================================================
-- 4. TABLE RÉDUCTIONS APPLIQUÉES (Historique)
-- ============================================================================

CREATE TABLE IF NOT EXISTS applied_discounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES orders(id) NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  
  -- Type de réduction
  discount_type TEXT NOT NULL CHECK (discount_type IN ('repeat_doudou', 'upsell', 'loyalty', 'manual')),
  discount_reason TEXT NOT NULL, -- Description lisible
  
  -- Montants
  original_price DECIMAL(10,2) NOT NULL,
  discounted_price DECIMAL(10,2) NOT NULL,
  savings_amount DECIMAL(10,2) NOT NULL,
  discount_percentage INTEGER, -- Ex: 30 pour 30%
  
  -- Métadonnées
  doudou_id UUID REFERENCES user_doudous(id), -- Si réduction doudou répété
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 5. TABLE ABONNEMENTS (Préparation future)
-- ============================================================================

CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  
  -- Détails abonnement
  plan_type TEXT DEFAULT 'monthly' CHECK (plan_type IN ('monthly', 'quarterly', 'yearly')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled', 'expired')),
  
  -- Logique 9 mois = cadeau
  consecutive_months INTEGER DEFAULT 0,
  next_free_item_at DATE,
  free_items_earned INTEGER DEFAULT 0,
  
  -- Pricing
  monthly_price DECIMAL(10,2) DEFAULT 19.90,
  
  -- Dates importantes
  started_at TIMESTAMPTZ DEFAULT NOW(),
  next_billing_date DATE,
  cancelled_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 6. INDEX POUR PERFORMANCE
-- ============================================================================

-- Index user_profiles
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON user_profiles(email);
CREATE INDEX IF NOT EXISTS idx_user_profiles_created_order ON user_profiles(account_created_from_order);

-- Index orders avec user_id
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_photo_hash ON orders(photo_hash);
CREATE INDEX IF NOT EXISTS idx_orders_user_created ON orders(user_id, created_at DESC);

-- Index user_doudous
CREATE INDEX IF NOT EXISTS idx_user_doudous_user_id ON user_doudous(user_id);
CREATE INDEX IF NOT EXISTS idx_user_doudous_pet_name ON user_doudous(user_id, pet_name);
CREATE INDEX IF NOT EXISTS idx_user_doudous_photo_hash ON user_doudous(photo_hash);

-- Index applied_discounts
CREATE INDEX IF NOT EXISTS idx_applied_discounts_order ON applied_discounts(order_id);
CREATE INDEX IF NOT EXISTS idx_applied_discounts_user ON applied_discounts(user_id);
CREATE INDEX IF NOT EXISTS idx_applied_discounts_type ON applied_discounts(discount_type);

-- Index subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);

-- ============================================================================
-- 7. POLITIQUES RLS (Row Level Security)
-- ============================================================================

-- Activer RLS sur les nouvelles tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_doudous ENABLE ROW LEVEL SECURITY;
ALTER TABLE applied_discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- Politiques user_profiles
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Service role can manage all profiles" ON user_profiles
  FOR ALL USING (auth.role() = 'service_role');

-- Politiques user_doudous
CREATE POLICY "Users can view own doudous" ON user_doudous
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all doudous" ON user_doudous
  FOR ALL USING (auth.role() = 'service_role');

-- Politiques applied_discounts
CREATE POLICY "Users can view own discounts" ON applied_discounts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all discounts" ON applied_discounts
  FOR ALL USING (auth.role() = 'service_role');

-- Politiques subscriptions
CREATE POLICY "Users can view own subscription" ON subscriptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own subscription" ON subscriptions
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all subscriptions" ON subscriptions
  FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- 8. FONCTIONS UTILITAIRES
-- ============================================================================

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour updated_at
CREATE TRIGGER update_user_profiles_updated_at 
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_doudous_updated_at 
  BEFORE UPDATE ON user_doudous
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at 
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Fonction pour calculer le hash d'une photo (simplifiée)
CREATE OR REPLACE FUNCTION generate_photo_hash(photo_url TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Hash simple basé sur l'URL (peut être amélioré)
  RETURN encode(digest(photo_url, 'sha256'), 'hex');
END;
$$ language 'plpgsql';

-- ============================================================================
-- 9. VÉRIFICATIONS FINALES
-- ============================================================================

-- Compter les nouvelles tables créées
SELECT 
  'user_profiles' as table_name,
  COUNT(*) as row_count 
FROM user_profiles
UNION ALL
SELECT 
  'user_doudous' as table_name,
  COUNT(*) as row_count 
FROM user_doudous
UNION ALL
SELECT 
  'applied_discounts' as table_name,
  COUNT(*) as row_count 
FROM applied_discounts
UNION ALL
SELECT 
  'subscriptions' as table_name,
  COUNT(*) as row_count 
FROM subscriptions;

-- Message de succès
SELECT '✅ Structure base de données créée avec succès!' as status;
SELECT '🎯 Prêt pour la Phase 2 : Création automatique de comptes' as next_step;
