# 🎨 Sticker DOUDOU - MVP Documentation

## 📋 Vue d'ensemble

**Sticker DOUDOU** est un MVP de e-commerce pour créer des stickers personnalisés basés sur les doudous d'enfants de 2-5 ans.

### Fonctionnalités MVP
- ✅ Formulaire de commande mobile-first
- ✅ Upload sécurisé de photos
- ✅ Paiement Stripe intégré
- ✅ Génération automatique de briefs pour artiste
- ✅ Interface admin simple
- ✅ Emails transactionnels
- ✅ Conformité RGPD

## 🚀 Installation et Configuration

### 1. Prérequis
```bash
Node.js 18+
npm/yarn/pnpm
Compte Stripe
Service SMTP (Gmail, SendGrid, etc.)
```

### 2. Installation
```bash
# Cloner et installer
git clone <repo>
cd sticker-doudou
npm install

# Configuration environnement
cp env.example .env.local
```

### 3. Variables d'environnement (.env.local)

```bash
# Base
NEXT_PUBLIC_BASE_URL=https://votre-domaine.com
NODE_ENV=production

# Stripe (OBLIGATOIRE)
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Email (OBLIGATOIRE)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=hello@stickerdoudou.fr
SMTP_PASS=votre-mot-de-passe-app
ARTIST_EMAIL=artiste@stickerdoudou.fr

# Upload
UPLOAD_SECRET=une-clé-secrète-aléatoire-longue
MAX_FILE_SIZE=10485760
```

### 4. Configuration Stripe

#### a) Créer les produits Stripe
```bash
# Dans le dashboard Stripe, créer un produit
Nom: "Stickers personnalisés"
Prix: 12.90€
Type: Récurrent ou Unique
```

#### b) Configurer les webhooks
```
URL: https://votre-domaine.com/api/webhooks/stripe
Événements: checkout.session.completed
```

#### c) Mode test vs production
```bash
# Test
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Production
STRIPE_SECRET_KEY=sk_live_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
```

### 5. Configuration Email

#### Option A: Gmail
```bash
# Activer l'authentification 2 facteurs
# Créer un mot de passe d'application
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=votre-email@gmail.com
SMTP_PASS=mot-de-passe-app-gmail
```

#### Option B: SendGrid
```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=votre-clé-api-sendgrid
```

## 📂 Structure des Fichiers

```
sticker-doudou/
├── app/                     # Next.js App Router
│   ├── page.tsx            # Landing page
│   ├── commande/           # Formulaire de commande
│   ├── recapitulatif/      # Page de récap (supprimée dans MVP)
│   ├── confirmation/       # Page de confirmation post-paiement
│   ├── admin/              # Interface admin
│   ├── cgv/                # Conditions générales
│   ├── confidentialite/    # Politique RGPD
│   └── api/                # APIs
│       ├── orders/         # Gestion commandes + Stripe
│       ├── upload/         # Upload photos
│       ├── photos/         # Accès sécurisé photos
│       └── webhooks/       # Webhooks Stripe
├── src/
│   ├── hooks/              # Hooks React
│   │   ├── useStripe.ts    # Hook paiement
│   │   └── usePWA.ts       # Hook PWA
│   └── components/         # Composants réutilisables
├── uploads/                # Stockage local photos (temp)
└── public/                 # Assets statiques
```

## 🔄 Flux Utilisateur Complet

### 1. Commande (page /commande)
```
Utilisateur → Upload photo + formulaire → Validation → Stripe Checkout
```

### 2. Paiement
```
Stripe Checkout → Paiement → Webhook → Confirmation commande
```

### 3. Traitement
```
API → Email client + Brief artiste → Admin voit commande
```

## 🛠️ APIs et Endpoints

### POST /api/upload
Upload sécurisé de photos
```typescript
Body: FormData avec 'photo'
Response: { secureUrl, fileName, fileSize, fileType }
Limite: 10MB, JPEG/PNG/HEIC/WebP
```

### POST /api/orders
Création de commande et session Stripe
```typescript
Body: OrderData (voir types)
Response: { sessionUrl, orderNumber }
```

### GET /api/photos/[filename]?token=...
Accès sécurisé aux photos uploadées
```typescript
Query: token (HMAC du filename)
Response: Image file ou 403/404
```

### POST /api/webhooks/stripe
Confirmation de paiement via webhook
```typescript
Body: Stripe webhook event
Action: Envoi emails + mise à jour statut
```

## 📧 Système d'Emails

### Email Client (Confirmation)
- ✅ Récapitulatif commande
- ✅ Timeline des étapes
- ✅ Informations livraison
- ✅ Contact support

### Email Artiste (Brief)
- ✅ Détails commande urgents
- ✅ Lien sécurisé vers photo
- ✅ Spécifications techniques
- ✅ Deadline de livraison

## 🔐 Sécurité et RGPD

### Données Collectées (Minimales)
- Photo doudou (supprimée après 30 jours)
- Nom enfant + surnom doudou
- Adresse livraison
- Email contact
- Notes créatives (optionnel)

### Mesures de Sécurité
- ✅ Photos avec accès par token HMAC
- ✅ Validation stricte uploads
- ✅ Pas de stockage données bancaires
- ✅ Chiffrement communications (HTTPS)
- ✅ Headers de sécurité

### Conformité RGPD
- ✅ Collecte données minimales
- ✅ Consentement explicite
- ✅ Droit à l'effacement
- ✅ Suppression automatique photos
- ✅ Politique confidentialité complète

## 👨‍💼 Interface Admin

### Accès: /admin
```typescript
// Fonctionnalités:
- Liste toutes les commandes
- Filtrage par statut
- Génération briefs artiste
- Mise à jour statuts
- Export données
```

### Statuts Commandes
- `pending` - À traiter
- `in_progress` - En cours de création
- `completed` - Terminé
- `shipped` - Expédié

## 🚀 Déploiement

### Option A: Vercel (Recommandé)
```bash
# Installation Vercel CLI
npm i -g vercel

# Déploiement
vercel

# Variables d'environnement via dashboard
# ou via CLI: vercel env add
```

### Option B: Netlify
```bash
# Build
npm run build

# Déployer dossier 'out/'
# Configurer variables d'environnement
```

### Option C: VPS/Serveur
```bash
# Build production
npm run build
npm start

# Avec PM2
npm i -g pm2
pm2 start npm --name "sticker-doudou" -- start
```

## 📊 KPI et Monitoring

### KPI MVP (comme demandé)
1. **Taux de complétion formulaire→paiement**
   - Tracking: Google Analytics events
   - Cible: >60%

2. **Taux d'échec paiement**
   - Source: Dashboard Stripe
   - Cible: <5%

3. **Délai paiement→brief envoyé**
   - Monitoring: Logs serveur + emails
   - Cible: <30 secondes

### Monitoring Recommandé
```bash
# Logs d'erreurs
console.error → Service externe (Sentry)

# Performance
Core Web Vitals → Google PageSpeed

# Uptime
Ping endpoint → Service monitoring
```

## 🐛 Gestion d'Erreurs

### Erreurs Fréquentes

#### Upload échoue
```
Cause: Fichier trop lourd/mauvais format
Solution: Validation côté client + messages clairs
```

#### Paiement refusé
```
Cause: Carte invalide/fonds insuffisants
Solution: Stripe gère automatiquement + retry
```

#### Email non reçu
```
Cause: SMTP mal configuré/spam
Solution: Vérifier config + whitelist domaine
```

#### Photo inaccessible
```
Cause: Token expiré/invalide
Solution: Regénérer lien ou re-upload
```

## 📞 Support et Maintenance

### Contacts Techniques
```
Développement: [votre-email]
Stripe: support.stripe.com
Hébergement: support selon provider
```

### Maintenance Régulière
- [ ] Nettoyer dossier uploads/ (automatique après 30j)
- [ ] Vérifier statuts commandes anciennes
- [ ] Backup base de données si utilisée
- [ ] Monitorer logs d'erreurs

### Évolutions V2 (Post-MVP)
- Base de données persistante (PostgreSQL)
- Système de comptes utilisateurs
- Interface de suivi commande client
- Preview créatif avant impression
- Module logistique automatisé
- App mobile native

---

## 🎯 Checklist Mise en Production

### Configuration
- [ ] Variables d'environnement production
- [ ] Stripe en mode live
- [ ] DNS pointant vers le bon serveur
- [ ] HTTPS activé
- [ ] SMTP opérationnel

### Tests
- [ ] Commande complète test
- [ ] Paiement test (cartes Stripe test)
- [ ] Réception emails
- [ ] Interface admin accessible
- [ ] Upload photo fonctionne

### Légal
- [ ] CGV adaptées à votre entreprise
- [ ] Mentions légales complètes
- [ ] RGPD conforme à votre situation
- [ ] Numéro SIRET dans footer

### Go Live! 🚀
- [ ] Monitoring activé
- [ ] Support client prêt
- [ ] Artiste briefé sur le processus
- [ ] Communication prête (réseaux sociaux, etc.)

---

**🎉 Votre MVP Sticker DOUDOU est prêt à encaisser ses premières commandes !**
