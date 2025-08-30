# 🎛️ Guide Admin - Gestion des Prix

## 🎯 Dashboard Admin Fonctionnel

Votre dashboard admin est maintenant **entièrement fonctionnel** ! Tous les changements de prix sont **persistants** et se synchronisent automatiquement.

### **📍 Accès Dashboard**
```
http://localhost:3000/admin
```
→ Onglet **"🏷️ Articles"**

---

## 💰 Modification des Prix

### **Via Dashboard (Recommandé)**
1. Allez sur `http://localhost:3000/admin`
2. Cliquez sur l'onglet **"🏷️ Articles"**
3. Modifiez les prix directement dans les champs
4. Les changements sont **automatiquement sauvegardés**
5. ✅ **Persistance garantie** - les prix restent jusqu'au prochain changement

### **Articles modifiables :**
- 🏷️ **Planche de base** (actuellement 15.90€) 
- 🏷️ **Planche bonus** (actuellement 4.90€)
- 🖼️ **Photo Premium** (actuellement 29.90€ - en pause)
- 📖 **Livre Histoire** (actuellement 24.90€ - en pause)

### **Actions possibles :**
- ✅ **Modifier prix** de vente et original
- ✅ **Activer/Désactiver** les produits
- ✅ **Calcul automatique** des économies
- ✅ **Synchronisation** client ↔ serveur

---

## 🔧 Modification en Dur (Si Besoin)

### **Fichier principal :**
```
/data/product-settings.json
```

### **Structure :**
```json
{
  "id": "planche-base",
  "salePrice": 15.90,    ← Prix affiché
  "originalPrice": 12.90, ← Prix barré
  "active": true         ← Produit actif
}
```

### **Pour modifier manuellement :**
1. Éditez `data/product-settings.json`
2. Changez les valeurs `salePrice`
3. Redémarrez le serveur : `npm run dev`

---

## 📧 Configuration Emails

### **Statut actuel :** 
- ✅ **Envoi automatique** activé
- 📧 **Mode DÉMO** (visible dans les logs)

### **Pour activer les vrais emails :**
1. Suivez le guide : `GUIDE-GMAIL.md`
2. Configurez `.env.local` avec vos identifiants
3. Les emails partiront automatiquement

### **Emails envoyés :**
- 👤 **Client** : Confirmation de commande
- 🎨 **Artiste** : Brief avec photo sécurisée

---

## 🧪 Test des Modifications

### **Test du prix de base :**
1. Modifiez le prix dans l'admin
2. Allez sur `/commande`
3. ✅ Le nouveau prix s'affiche automatiquement

### **Test des upsells :**
1. Activez la photo ou le livre
2. Passez par `/commande` → `/pre-commande`
3. ✅ Les produits actifs apparaissent

### **Test persistance :**
1. Modifiez un prix
2. Fermez le navigateur 
3. Redémarrez le serveur
4. ✅ Les prix restent inchangés

---

## 🔍 Debugging

### **Vérifier les prix actuels :**
```bash
curl http://localhost:3000/api/admin/products
```

### **Logs à surveiller :**
```
💰 Prix planche de base: 15.9€
✅ Paramètres synchronisés avec le serveur
📧 Email client envoyé avec succès
```

### **Fichiers importants :**
- `/data/product-settings.json` - Stockage persistant
- `/app/admin/page.tsx` - Interface admin
- `/src/lib/serverProductSettings.ts` - Logic serveur

---

## ✅ Statut Système

- 🟢 **Dashboard fonctionnel** 
- 🟢 **Prix persistants**
- 🟢 **Synchronisation client/serveur**
- 🟢 **Emails automatiques**
- 🟢 **API complète**

**Votre système est prêt pour la production ! 🚀**
