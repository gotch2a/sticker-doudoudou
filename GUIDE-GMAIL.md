# 📧 Guide Configuration Gmail SMTP - Sticker DOUDOU

## 🎯 Objectif
Configurer l'envoi automatique d'emails via Gmail pour :
- **Artiste** : Brief détaillé avec lien sécurisé photo
- **Client** : Confirmation de commande

## 🔧 Étapes de Configuration

### **1. Préparer votre compte Gmail**

#### **A. Activer la validation en 2 étapes**
1. Allez sur [myaccount.google.com](https://myaccount.google.com)
2. **Sécurité** → **Validation en 2 étapes**
3. **Activer** la validation en 2 étapes

#### **B. Créer un mot de passe d'application**
1. Dans **Sécurité** → **Validation en 2 étapes**
2. Tout en bas : **Mots de passe d'application**
3. **Sélectionner l'application** : "Autre (nom personnalisé)"
4. Tapez : `Sticker DOUDOU App`
5. **Générer** → Copiez le mot de passe de 16 caractères

### **2. Configurer les variables d'environnement**

Créez ou modifiez votre fichier `.env.local` :

\`\`\`bash
# Configuration Email Gmail SMTP
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre-email@gmail.com
SMTP_PASS=votre-mot-de-passe-app-16-caracteres

# Email destinataire artiste
ARTIST_EMAIL=artiste@example.com

# Base URL application
NEXT_PUBLIC_BASE_URL=http://localhost:3000
\`\`\`

### **3. Tester la configuration**

1. **Redémarrez le serveur** :
   \`\`\`bash
   npm run dev
   \`\`\`

2. **Remplissez une commande** sur `/commande`

3. **Vérifiez les logs** dans le terminal :
   \`\`\`
   🔧 API Orders initialisée avec email réel
   📧 Envoi de l'email à l'artiste...
   ✅ Email envoyé avec succès à l'artiste
   ✅ Email de confirmation envoyé au client
   \`\`\`

## 📧 Emails Envoyés

### **Email Artiste**
- **Sujet** : `🎨 Nouveau Brief - [Doudou] pour [Enfant] ([ID])`
- **Contenu** : Brief complet HTML avec lien photo sécurisé
- **Délai** : 7 jours indicatif

### **Email Client**  
- **Sujet** : `✅ Confirmation - Stickers [Doudou] ([ID])`
- **Contenu** : Confirmation avec numéro de commande

## 🛠️ Résolution de Problèmes

### **Erreur "Authentication failed"**
- ✅ Vérifiez le mot de passe d'application (16 caractères)
- ✅ Validation en 2 étapes activée
- ✅ Email correct dans `SMTP_USER`

### **Erreur "Connection refused"**
- ✅ Vérifiez `SMTP_HOST=smtp.gmail.com`
- ✅ Vérifiez `SMTP_PORT=587`

### **Mode développement**
Si pas de configuration → Mode simulation dans les logs

## 🚀 Mode Production

Pour déployer avec emails :
1. Ajoutez les variables d'environnement sur Vercel/Netlify
2. `NODE_ENV=production` active automatiquement les emails
3. Testez avec des emails de test avant la mise en ligne

## 🔒 Sécurité

- ✅ Mot de passe d'application (pas votre mot de passe Gmail)
- ✅ Variables d'environnement (jamais dans le code)
- ✅ `.env.local` dans `.gitignore`
- ✅ Emails HTML pour éviter le spam
