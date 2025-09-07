# 🏷️ Instructions - Codes de Remise

## ⚠️ ÉTAPE OBLIGATOIRE - Créer la table dans Supabase

Pour que les codes de remise fonctionnent, vous devez d'abord créer la table `discount_codes` dans votre base de données Supabase.

### 📋 Étapes à suivre :

1. **Connectez-vous à Supabase** : https://app.supabase.com/
2. **Sélectionnez votre projet** Sticker DOUDOU
3. **Allez dans "SQL Editor"** (dans le menu de gauche)
4. **Créez une nouvelle requête** et collez le code suivant :

```sql
-- Création de la table pour les codes de remise
CREATE TABLE IF NOT EXISTS discount_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10,2) NOT NULL,
  minimum_amount DECIMAL(10,2) DEFAULT 0,
  usage_limit INTEGER DEFAULT NULL,
  used_count INTEGER DEFAULT 0,
  valid_from TIMESTAMP DEFAULT NOW(),
  valid_until TIMESTAMP DEFAULT NULL,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index pour les recherches fréquentes
CREATE INDEX IF NOT EXISTS idx_discount_codes_code ON discount_codes(code);
CREATE INDEX IF NOT EXISTS idx_discount_codes_active ON discount_codes(active);
CREATE INDEX IF NOT EXISTS idx_discount_codes_valid ON discount_codes(valid_from, valid_until);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour mettre à jour updated_at
DROP TRIGGER IF EXISTS update_discount_codes_updated_at ON discount_codes;
CREATE TRIGGER update_discount_codes_updated_at
    BEFORE UPDATE ON discount_codes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insertion de codes de test
INSERT INTO discount_codes (code, description, discount_type, discount_value, minimum_amount, usage_limit) VALUES
('BIENVENUE10', 'Remise de bienvenue 10%', 'percentage', 10.00, 20.00, 100),
('NOEL5', 'Remise de Noël 5€', 'fixed', 5.00, 15.00, 50),
('VIP20', 'Remise VIP 20%', 'percentage', 20.00, 50.00, NULL)
ON CONFLICT (code) DO NOTHING;
```

5. **Cliquez sur "Run"** pour exécuter la requête

### ✅ Vérification

Une fois la table créée, vous pouvez vérifier qu'elle existe en allant dans :
- **"Table Editor"** → vous devriez voir la table `discount_codes`
- **3 codes de test** devraient être présents : `BIENVENUE10`, `NOEL5`, `VIP20`

### 🎯 Test du système

1. **Dashboard Admin** : http://localhost:3001/admin → Onglet "🏷️ Codes de remise"
2. **Codes de test disponibles** :
   - `BIENVENUE10` : 10% de remise (minimum 20€, 100 utilisations max)
   - `NOEL5` : 5€ de remise fixe (minimum 15€, 50 utilisations max)  
   - `VIP20` : 20% de remise (minimum 50€, illimité)

3. **Test côté utilisateur** :
   - Page de pré-commande → "Avez-vous un code de remise ?"
   - Entrez un des codes de test → remise appliquée automatiquement !

---

## 🔧 Dépannage

Si vous obtenez encore une erreur après avoir créé la table :
1. Vérifiez que la table `discount_codes` existe bien dans Supabase
2. Vérifiez les permissions RLS (Row Level Security) - elles peuvent être désactivées pour les tests
3. Consultez les logs dans le terminal pour voir l'erreur Supabase complète

---

## 📊 Fonctionnalités du système

### Dashboard Admin :
- ✅ Créer/modifier/désactiver des codes
- ✅ Types : pourcentage (%) ou montant fixe (€)
- ✅ Conditions : montant minimum, limite d'utilisation, dates de validité
- ✅ Statistiques d'utilisation en temps réel

### Interface utilisateur :
- ✅ Section repliable discrète
- ✅ Validation automatique avec debounce
- ✅ Messages d'erreur/succès
- ✅ Calcul automatique du total avec remise
- ✅ Récapitulatif détaillé des économies


