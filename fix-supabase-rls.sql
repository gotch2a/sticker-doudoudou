-- Script pour diagnostiquer et corriger les problèmes RLS dans Supabase
-- À exécuter dans l'éditeur SQL de Supabase

-- =============================================================================
-- 1. DIAGNOSTIC DES TABLES ET POLITIQUES EXISTANTES
-- =============================================================================

-- Vérifier l'existence des tables
SELECT 
    table_name,
    table_type,
    CASE 
        WHEN table_name IN ('orders', 'admin_notes', 'articles', 'order_articles', 'discount_codes') 
        THEN '✅ Table requise'
        ELSE '⚠️ Table supplémentaire'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Vérifier le statut RLS de chaque table
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity THEN '🔒 RLS Activé'
        ELSE '🔓 RLS Désactivé'
    END as rls_status
FROM pg_tables 
WHERE schemaname = 'public'
    AND tablename IN ('orders', 'admin_notes', 'articles', 'order_articles', 'discount_codes')
ORDER BY tablename;

-- Lister toutes les politiques existantes
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- =============================================================================
-- 2. SUPPRESSION DES POLITIQUES EXISTANTES (NETTOYAGE)
-- =============================================================================

-- Supprimer toutes les politiques existantes pour recommencer
DROP POLICY IF EXISTS "Allow all for authenticated users" ON orders;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON admin_notes;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON articles;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON order_articles;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON discount_codes;

-- Supprimer d'autres politiques qui pourraient exister
DROP POLICY IF EXISTS "Admins can manage discount codes" ON discount_codes;
DROP POLICY IF EXISTS "Service role can manage discount codes" ON discount_codes;
DROP POLICY IF EXISTS "Authenticated users can read discount codes" ON discount_codes;
DROP POLICY IF EXISTS "Admin can modify discount codes" ON discount_codes;

-- =============================================================================
-- 3. DÉSACTIVATION TEMPORAIRE DE RLS POUR LES TESTS
-- =============================================================================

-- ATTENTION: Ceci désactive la sécurité RLS temporairement pour les tests
-- En production, vous devrez réactiver RLS avec des politiques appropriées

ALTER TABLE orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE articles DISABLE ROW LEVEL SECURITY;
ALTER TABLE order_articles DISABLE ROW LEVEL SECURITY;
ALTER TABLE discount_codes DISABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 4. TEST DE FONCTIONNALITÉ SANS RLS
-- =============================================================================

-- Tester l'accès à chaque table
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

-- =============================================================================
-- 5. CRÉATION DE POLITIQUES RLS PERMISSIVES (OPTIONNEL)
-- =============================================================================

-- Si vous voulez réactiver RLS avec des politiques permissives :
-- Décommentez les lignes ci-dessous APRÈS avoir testé sans RLS

/*
-- Réactiver RLS
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;

-- Créer des politiques très permissives pour l'admin
CREATE POLICY "Admin full access" ON orders FOR ALL USING (true);
CREATE POLICY "Admin full access" ON admin_notes FOR ALL USING (true);
CREATE POLICY "Admin full access" ON articles FOR ALL USING (true);
CREATE POLICY "Admin full access" ON order_articles FOR ALL USING (true);
CREATE POLICY "Admin full access" ON discount_codes FOR ALL USING (true);

-- Permettre l'accès anonyme pour les API publiques
CREATE POLICY "Public read access" ON orders FOR SELECT USING (true);
CREATE POLICY "Public read access" ON articles FOR SELECT USING (true);
CREATE POLICY "Public read access" ON discount_codes FOR SELECT USING (true);
*/

-- =============================================================================
-- 6. VÉRIFICATION FINALE
-- =============================================================================

-- Vérifier que RLS est désactivé
SELECT 
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity THEN '🔒 RLS Activé - Peut bloquer l''accès'
        ELSE '✅ RLS Désactivé - Accès libre'
    END as status
FROM pg_tables 
WHERE schemaname = 'public'
    AND tablename IN ('orders', 'admin_notes', 'articles', 'order_articles', 'discount_codes')
ORDER BY tablename;

-- Compter les politiques restantes (devrait être 0)
SELECT 
    COUNT(*) as policies_count,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ Aucune politique - Accès libre'
        ELSE '⚠️ Des politiques existent encore'
    END as status
FROM pg_policies 
WHERE schemaname = 'public';

-- =============================================================================
-- 7. INSTRUCTIONS POST-EXÉCUTION
-- =============================================================================

SELECT '🎯 INSTRUCTIONS' as titre, 
       'Après avoir exécuté ce script:
        1. Retournez sur votre page admin
        2. Cliquez sur "Réessayer"
        3. La connexion devrait maintenant fonctionner
        4. Une fois que tout fonctionne, vous pourrez réactiver RLS si nécessaire' as instructions;
