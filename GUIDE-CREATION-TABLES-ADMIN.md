# 🚀 GUIDE CRÉATION TABLES ADMIN

## 📋 ÉTAPES À SUIVRE

### 1. **Ouvrir Supabase Dashboard**
- Allez sur [supabase.com](https://supabase.com)
- Connectez-vous à votre compte
- Sélectionnez votre projet **Sticker DOUDOU**

### 2. **Accéder à l'Éditeur SQL**
- Dans le menu de gauche, cliquez sur **"SQL Editor"**
- Cliquez sur **"New Query"** pour créer une nouvelle requête

### 3. **Exécuter le Script**
- Copiez tout le contenu du fichier `supabase-create-admin-tables.sql`
- Collez-le dans l'éditeur SQL
- Cliquez sur **"Run"** (ou appuyez sur Ctrl+Entrée)

### 4. **Vérifier la Création**
Vous devriez voir ces messages de succès :
```
Articles créés: 4
Paramètres livraison créés: 1
✅ Tables admin créées avec succès!
```

## 🏗️ TABLES CRÉÉES

### **📦 Table `articles`**
- **4 articles d'exemple** insérés automatiquement
- **Catégories** : base, upsell, pack
- **Fonctionnalités** : prix, descriptions, caractéristiques

### **🚚 Table `shipping_settings`**
- **Paramètres par défaut** configurés
- **Tarifs** : France (4.90€), Europe (8.90€), Monde (12.90€)
- **Livraison gratuite** à partir de 50€

## ✅ APRÈS EXÉCUTION

Une fois le script exécuté, **rechargez votre interface admin** :
- Les boutons **"Nouvel Article"** et **"Modifier"** fonctionneront
- L'onglet **"Livraison"** affichera les paramètres
- L'onglet **"Articles"** montrera les 4 articles d'exemple

## 🔧 FONCTIONNALITÉS DISPONIBLES

### **Gestion des Articles**
- ✅ **Création** d'articles avec formulaire complet
- ✅ **Modification** des articles existants
- ✅ **Suppression** avec confirmation
- ✅ **Catégories** (Base, Upsell, Pack)
- ✅ **Prix et économies** calculés automatiquement
- ✅ **Caractéristiques** en liste

### **Paramètres de Livraison**
- ✅ **Affichage** des tarifs par zone
- ✅ **Délais de livraison** configurables
- ✅ **Seuil de livraison gratuite**
- ✅ **Interface colorée** par zone

## 🎯 PROCHAINE ÉTAPE

Après avoir exécuté le script SQL, **testez immédiatement** :

1. **Allez sur `/admin`**
2. **Cliquez sur l'onglet "Articles"**
3. **Testez le bouton "➕ Nouvel Article"**
4. **Testez le bouton "✏️ Modifier"** sur un article existant
5. **Vérifiez l'onglet "🚚 Livraison"**

---

## 🆘 EN CAS DE PROBLÈME

Si vous rencontrez des erreurs :

1. **Vérifiez les permissions** de votre utilisateur Supabase
2. **Relancez le script** (il est conçu pour être idempotent)
3. **Consultez les logs** dans la console du navigateur

**Le script est sécurisé** et ne supprime aucune donnée existante ! 🛡️
