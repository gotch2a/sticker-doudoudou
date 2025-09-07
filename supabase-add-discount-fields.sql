-- Ajouter les colonnes pour les codes de remise dans la table orders
-- Exécuter ce script dans l'éditeur SQL de Supabase

-- Ajouter la colonne discount_code
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS discount_code VARCHAR(50) DEFAULT NULL;

-- Ajouter la colonne discount_amount
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(10,2) DEFAULT 0;

-- Créer un index sur discount_code pour les recherches
CREATE INDEX IF NOT EXISTS idx_orders_discount_code ON orders(discount_code);

-- Commentaires pour documentation
COMMENT ON COLUMN orders.discount_code IS 'Code de remise appliqué à la commande';
COMMENT ON COLUMN orders.discount_amount IS 'Montant de la remise en euros';

-- Vérifier que les colonnes ont été ajoutées
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'orders' 
AND column_name IN ('discount_code', 'discount_amount')
ORDER BY column_name;


