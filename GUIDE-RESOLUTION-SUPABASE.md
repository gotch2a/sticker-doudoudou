# 🔧 Guide de Résolution - Erreur de Connexion Supabase

## 🎯 Situation Actuelle

Votre page admin affiche :
- ✅ URL Supabase : Configurée
- ✅ Clé Supabase : Configurée  
- ❌ Connexion : Échec

**Erreur** : "Erreur de connexion Supabase: Erreur inconnue"

## 🔍 Causes Possibles

1. **Tables manquantes** dans la base de données Supabase
2. **Politiques RLS** (Row Level Security) trop restrictives
3. **Projet Supabase en pause** ou inactif
4. **Clés d'API incorrectes** ou expirées

## 🚀 Solutions par Ordre de Priorité

### ✅ Solution 1 : Vérifier et Créer les Tables (RECOMMANDÉ)

1. **Connectez-vous à votre projet Supabase** :
   - Allez sur [supabase.com](https://supabase.com)
   - Connectez-vous à votre compte
   - Sélectionnez votre projet

2. **Ouvrez l'éditeur SQL** :
   - Dans le menu de gauche, cliquez sur "SQL Editor"
   - Créez une nouvelle requête

3. **Exécutez le script de configuration** :
   - Copiez tout le contenu du fichier `check-supabase-setup.sql`
   - Collez-le dans l'éditeur SQL
   - Cliquez sur "Run" pour exécuter

4. **Vérifiez les résultats** :
   - Le script devrait créer toutes les tables nécessaires
   - Afficher un résumé des tables créées
   - Configurer les politiques RLS de base

### ✅ Solution 2 : Vérifier le Statut du Projet

1. **Vérifiez que votre projet Supabase est actif** :
   - Dans le dashboard Supabase, vérifiez le statut du projet
   - S'il est en pause, cliquez sur "Resume project"

2. **Vérifiez les limites** :
   - Assurez-vous que vous n'avez pas dépassé les limites du plan gratuit
   - Vérifiez qu'il n'y a pas d'alertes dans le dashboard

### ✅ Solution 3 : Tester la Connexion Manuellement

1. **Test simple dans l'éditeur SQL** :
```sql
SELECT 'Hello Supabase!' as message;
```

2. **Test des tables** :
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';
```

### ✅ Solution 4 : Vérifier les Clés d'API

1. **Récupérez les nouvelles clés** :
   - Dans Supabase, allez dans "Settings" > "API"
   - Copiez l'URL du projet et la clé "anon public"

2. **Mettez à jour `.env.local`** :
```bash
NEXT_PUBLIC_SUPABASE_URL=https://votre-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-cle-anon-key
```

3. **Redémarrez le serveur** :
```bash
npm run dev
```

## 🔄 Test Après Chaque Solution

Après chaque tentative de solution :

1. **Rechargez la page admin** : http://localhost:3000/admin
2. **Cliquez sur "Réessayer"** dans l'interface d'erreur
3. **Vérifiez les logs** dans la console du navigateur (F12 > Console)

## 📋 Logs à Surveiller

Dans la console du navigateur, vous devriez voir :

### ✅ Succès :
```
🔍 Vérification de la configuration...
📋 Configuration détectée: { supabaseUrl: '✅ Configurée', supabaseKey: '✅ Configurée' }
🔗 Test de connexion Supabase...
✅ Test de santé Supabase réussi
✅ Connexion Supabase réussie
```

### ❌ Échec avec détails :
```
🔗 Test de connexion Supabase...
❌ Test de santé Supabase échoué: [détails de l'erreur]
❌ Erreur connexion Supabase: [message d'erreur précis]
```

## 🆘 Si Rien ne Fonctionne

### Créer un Nouveau Projet Supabase

1. **Créez un nouveau projet** sur supabase.com
2. **Notez les nouvelles clés** d'API
3. **Exécutez le script `check-supabase-setup.sql`**
4. **Mettez à jour `.env.local`** avec les nouvelles clés
5. **Redémarrez le serveur**

### Support Technique

Si le problème persiste, collectez ces informations :

1. **Logs complets** de la console navigateur
2. **Capture d'écran** de l'erreur Supabase
3. **URL de votre projet** Supabase (sans les clés !)
4. **Version** de votre plan Supabase (gratuit/pro)

## 🎯 Résultat Attendu

Une fois le problème résolu, la page admin devrait afficher :

- ✅ URL Supabase : Configurée
- ✅ Clé Supabase : Configurée  
- ✅ Connexion : Connectée

Et vous verrez l'interface admin complète avec tous les onglets fonctionnels.

---

## 📚 Informations Techniques

### Tables Créées par le Script

- `orders` : Commandes des clients
- `admin_notes` : Notes administrateur
- `articles` : Produits disponibles
- `order_articles` : Articles dans chaque commande
- `discount_codes` : Codes de remise

### Politiques RLS

Le script configure des politiques permissives pour les tests. En production, vous devrez les sécuriser selon vos besoins.

### Données de Test

Le script insère automatiquement quelques articles de base pour tester l'interface admin.
