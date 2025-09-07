-- Script de sécurisation RLS (Row Level Security) pour Supabase
-- Exécuter ce script dans l'éditeur SQL de Supabase

-- =============================================================================
-- 1. ACTIVER RLS SUR LA TABLE DISCOUNT_CODES (CRITIQUE)
-- =============================================================================

-- Activer Row Level Security sur la table discount_codes
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;

-- Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Admins can manage discount codes" ON discount_codes;
DROP POLICY IF EXISTS "Service role can manage discount codes" ON discount_codes;

-- Politique pour permettre l'accès via service role (pour l'API)
CREATE POLICY "Service role can manage discount codes" ON discount_codes
    FOR ALL USING (auth.role() = 'service_role');

-- Politique pour les utilisateurs authentifiés (interface admin)
CREATE POLICY "Authenticated users can read discount codes" ON discount_codes
    FOR SELECT USING (auth.role() = 'authenticated');

-- Politique pour les insertions/modifications (admin uniquement)
CREATE POLICY "Admin can modify discount codes" ON discount_codes
    FOR ALL USING (
        auth.role() = 'authenticated' 
        AND auth.jwt() ->> 'role' = 'admin'
    );

-- =============================================================================
-- 2. VÉRIFIER ET SÉCURISER LES AUTRES TABLES
-- =============================================================================

-- Vérifier le statut RLS de toutes les tables
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    CASE 
        WHEN rowsecurity THEN '✅ Sécurisée'
        ELSE '❌ NON SÉCURISÉE'
    END as status
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY tablename;

-- =============================================================================
-- 3. SÉCURISER LA TABLE ADMIN_NOTES SI NÉCESSAIRE
-- =============================================================================

-- Activer RLS sur admin_notes si pas déjà fait
ALTER TABLE admin_notes ENABLE ROW LEVEL SECURITY;

-- Politique pour admin_notes
DROP POLICY IF EXISTS "Service role can manage admin notes" ON admin_notes;
CREATE POLICY "Service role can manage admin notes" ON admin_notes
    FOR ALL USING (auth.role() = 'service_role');

-- =============================================================================
-- 4. SÉCURISER LA TABLE PHOTOS SI NÉCESSAIRE
-- =============================================================================

-- Activer RLS sur photos si pas déjà fait
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

-- Politique pour photos
DROP POLICY IF EXISTS "Service role can manage photos" ON photos;
CREATE POLICY "Service role can manage photos" ON photos
    FOR ALL USING (auth.role() = 'service_role');

-- =============================================================================
-- 5. VÉRIFIER LES POLITIQUES EXISTANTES
-- =============================================================================

-- Lister toutes les politiques RLS actives
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- =============================================================================
-- 6. RAPPORT DE SÉCURITÉ FINAL
-- =============================================================================

-- Rapport final des tables et leur sécurité
SELECT 
    t.tablename,
    t.rowsecurity as rls_enabled,
    COUNT(p.policyname) as policy_count,
    CASE 
        WHEN t.rowsecurity AND COUNT(p.policyname) > 0 THEN '🟢 SÉCURISÉE'
        WHEN t.rowsecurity AND COUNT(p.policyname) = 0 THEN '🟡 RLS ACTIVÉ MAIS AUCUNE POLITIQUE'
        ELSE '🔴 NON SÉCURISÉE'
    END as security_status
FROM pg_tables t
LEFT JOIN pg_policies p ON t.tablename = p.tablename AND t.schemaname = p.schemaname
WHERE t.schemaname = 'public'
GROUP BY t.tablename, t.rowsecurity
ORDER BY t.tablename;

-- =============================================================================
-- COMMENTAIRES ET DOCUMENTATION
-- =============================================================================

COMMENT ON TABLE discount_codes IS 'Table des codes de remise - SÉCURISÉE avec RLS';
COMMENT ON TABLE admin_notes IS 'Notes administratives - SÉCURISÉE avec RLS';
COMMENT ON TABLE photos IS 'Métadonnées des photos - SÉCURISÉE avec RLS';

-- Fin du script de sécurisation


