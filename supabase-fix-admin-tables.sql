-- ========================================
-- SCRIPT CORRIGÉ POUR TABLES ADMIN
-- ========================================

-- Supprimer les tables existantes si elles existent (pour éviter les conflits)
DROP TABLE IF EXISTS articles CASCADE;
DROP TABLE IF EXISTS shipping_settings CASCADE;
DROP TABLE IF EXISTS discount_codes CASCADE;

-- ========================================
-- CRÉATION DES TABLES
-- ========================================

-- Table pour les articles/produits
CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  original_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  sale_price DECIMAL(10,2) NOT NULL DEFAULT 0,
  savings DECIMAL(10,2) NOT NULL DEFAULT 0,
  category VARCHAR(50) NOT NULL DEFAULT 'base' CHECK (category IN ('base', 'upsell', 'pack')),
  features JSONB DEFAULT '[]'::jsonb,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour les paramètres de livraison
CREATE TABLE shipping_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  france_price DECIMAL(10,2) NOT NULL DEFAULT 4.90,
  europe_price DECIMAL(10,2) NOT NULL DEFAULT 8.90,
  world_price DECIMAL(10,2) NOT NULL DEFAULT 12.90,
  letter_price DECIMAL(10,2) NOT NULL DEFAULT 2.50,
  free_shipping_threshold DECIMAL(10,2) NOT NULL DEFAULT 50.00,
  estimated_delivery_france VARCHAR(100) DEFAULT '2-3 jours ouvrés',
  estimated_delivery_europe VARCHAR(100) DEFAULT '5-7 jours ouvrés',
  estimated_delivery_world VARCHAR(100) DEFAULT '10-15 jours ouvrés',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour les codes de remise
CREATE TABLE discount_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) NOT NULL UNIQUE,
  description TEXT NOT NULL,
  discount_type VARCHAR(20) NOT NULL DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10,2) NOT NULL DEFAULT 0,
  minimum_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  usage_limit INTEGER NULL,
  used_count INTEGER NOT NULL DEFAULT 0,
  valid_from DATE NOT NULL,
  valid_until DATE NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ========================================
-- DONNÉES D'EXEMPLE
-- ========================================

-- Insérer quelques articles d'exemple avec des IDs explicites
INSERT INTO articles (name, description, original_price, sale_price, savings, category, features, active) VALUES
('Doudou Personnalisé Base', 'Doudou personnalisé avec le prénom de votre enfant et sa photo favorite', 34.90, 27.90, 7.00, 'base', '["Personnalisation unique", "Tissu doux et hypoallergénique", "Lavable en machine", "Taille 25x25cm"]'::jsonb, true),
('Pack Doudou + Livre', 'Pack complet avec doudou personnalisé et livre d''histoire personnalisé', 49.90, 39.90, 10.00, 'pack', '["Doudou personnalisé inclus", "Livre d''histoire avec le prénom", "Emballage cadeau offert", "Idéal pour les cadeaux"]'::jsonb, true),
('Doudou XL Format', 'Version extra-large du doudou personnalisé pour plus de câlins', 44.90, 37.90, 7.00, 'upsell', '["Format XL 35x35cm", "Personnalisation recto-verso", "Tissu premium", "Rembourrage extra-doux"]'::jsonb, true),
('Pochette de Transport', 'Pochette assortie pour transporter le doudou partout', 12.90, 9.90, 3.00, 'upsell', '["Assortie au doudou", "Fermeture zip sécurisée", "Anse de transport", "Personnalisation prénom"]'::jsonb, true);

-- Insérer les paramètres de livraison par défaut
INSERT INTO shipping_settings (
  france_price, 
  europe_price, 
  world_price, 
  letter_price,
  free_shipping_threshold,
  estimated_delivery_france,
  estimated_delivery_europe,
  estimated_delivery_world,
  active
) VALUES (
  4.90, 
  8.90, 
  12.90, 
  2.50,
  50.00,
  '2-3 jours ouvrés',
  '5-7 jours ouvrés',
  '10-15 jours ouvrés',
  true
);

-- Insérer quelques codes de remise d'exemple
INSERT INTO discount_codes (code, description, discount_type, discount_value, minimum_amount, usage_limit, valid_from, valid_until, active) VALUES
('BIENVENUE10', 'Code de bienvenue pour les nouveaux clients', 'percentage', 10.00, 20.00, 100, CURRENT_DATE, CURRENT_DATE + INTERVAL '3 months', true),
('NOEL2024', 'Promotion spéciale Noël', 'percentage', 15.00, 30.00, 50, CURRENT_DATE, CURRENT_DATE + INTERVAL '1 month', true),
('LIVRAISON5', 'Réduction sur les frais de livraison', 'fixed', 5.00, 0.00, NULL, CURRENT_DATE, NULL, true),
('FIDELITE20', 'Code fidélité pour les clients réguliers', 'percentage', 20.00, 50.00, 25, CURRENT_DATE, CURRENT_DATE + INTERVAL '6 months', false);

-- ========================================
-- POLITIQUES DE SÉCURITÉ (RLS)
-- ========================================

-- Activer RLS sur les nouvelles tables
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;

-- Politique pour les articles - lecture libre, modification admin uniquement
CREATE POLICY "Articles lisibles par tous" ON articles FOR SELECT USING (true);
CREATE POLICY "Articles modifiables par admin" ON articles FOR ALL USING (auth.role() = 'service_role');

-- Politique pour les paramètres de livraison - lecture libre, modification admin uniquement
CREATE POLICY "Paramètres livraison lisibles par tous" ON shipping_settings FOR SELECT USING (true);
CREATE POLICY "Paramètres livraison modifiables par admin" ON shipping_settings FOR ALL USING (auth.role() = 'service_role');

-- Politique pour les codes de remise - lecture libre, modification admin uniquement
CREATE POLICY "Codes remise lisibles par tous" ON discount_codes FOR SELECT USING (true);
CREATE POLICY "Codes remise modifiables par admin" ON discount_codes FOR ALL USING (auth.role() = 'service_role');

-- ========================================
-- INDEX POUR PERFORMANCE
-- ========================================

-- Index sur les articles
CREATE INDEX IF NOT EXISTS idx_articles_category ON articles(category);
CREATE INDEX IF NOT EXISTS idx_articles_active ON articles(active);
CREATE INDEX IF NOT EXISTS idx_articles_created_at ON articles(created_at DESC);

-- Index sur les paramètres de livraison
CREATE INDEX IF NOT EXISTS idx_shipping_settings_active ON shipping_settings(active);

-- Index sur les codes de remise
CREATE INDEX IF NOT EXISTS idx_discount_codes_code ON discount_codes(code);
CREATE INDEX IF NOT EXISTS idx_discount_codes_active ON discount_codes(active);
CREATE INDEX IF NOT EXISTS idx_discount_codes_valid_dates ON discount_codes(valid_from, valid_until);
CREATE INDEX IF NOT EXISTS idx_discount_codes_created_at ON discount_codes(created_at DESC);

-- ========================================
-- FONCTIONS DE MISE À JOUR AUTOMATIQUE
-- ========================================

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour la mise à jour automatique
CREATE TRIGGER update_articles_updated_at BEFORE UPDATE ON articles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_shipping_settings_updated_at BEFORE UPDATE ON shipping_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_discount_codes_updated_at BEFORE UPDATE ON discount_codes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ========================================
-- VÉRIFICATIONS FINALES
-- ========================================

-- Vérifier que les tables ont été créées et les données insérées
SELECT 'Articles créés: ' || COUNT(*) as result FROM articles;
SELECT 'Paramètres livraison créés: ' || COUNT(*) as result FROM shipping_settings;
SELECT 'Codes de remise créés: ' || COUNT(*) as result FROM discount_codes;

-- Afficher un message de succès
SELECT '✅ Tables admin créées avec succès!' as status;
