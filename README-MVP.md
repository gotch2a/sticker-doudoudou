# 🎨 Sticker DOUDOU - MVP

> **MVP fonctionnel** pour créer des stickers personnalisés à partir de photos de doudous d'enfants (2-5 ans)

## ⚡ Démarrage Rapide

```bash
# 1. Setup automatique
./dev-setup.sh

# 2. Configurer les clés dans .env.local
# (Stripe, SMTP, etc.)

# 3. Lancer en développement
npm run dev

# 4. Ouvrir http://localhost:3000
```

## 🏗️ Architecture MVP

```
Landing → Formulaire → Stripe → Confirmation → Email Brief Artiste
```

### Fonctionnalités Livrées ✅

**🛒 E-commerce Complet**
- Formulaire mobile-first
- Upload photo sécurisé (10MB max)
- Paiement Stripe intégré
- Confirmation automatique

**📧 Emails Transactionnels**
- Confirmation client avec timeline
- Brief artiste avec photo et détails
- Templates HTML professionnels

**🔐 RGPD & Sécurité**
- Données minimales collectées
- Photos supprimées après 30j
- Accès sécurisé par tokens
- CGV et politique de confidentialité

**👨‍💼 Interface Admin**
- Liste des commandes
- Gestion des statuts
- Génération de briefs
- Export données

## 💰 Configuration Stripe

1. **Créer compte Stripe** → [stripe.com](https://stripe.com)
2. **Récupérer les clés** (Dashboard → Développeurs)
3. **Ajouter dans .env.local**:
```bash
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
```
4. **Configurer webhook** : `https://votredomaine.com/api/webhooks/stripe`

## 📧 Configuration Email

### Option Gmail (Simple)
```bash
SMTP_HOST=smtp.gmail.com
SMTP_USER=votre-email@gmail.com
SMTP_PASS=mot-de-passe-app-gmail
ARTIST_EMAIL=artiste@votredomaine.com
```

### Option SendGrid (Pro)
```bash
SMTP_HOST=smtp.sendgrid.net
SMTP_USER=apikey
SMTP_PASS=votre-clé-sendgrid
```

## 🧪 Test Complet

### Cartes de Test Stripe
- **Succès**: `4242 4242 4242 4242`
- **Échec**: `4000 0000 0000 0002`
- Date: n'importe quelle date future
- CVC: n'importe quel 3 chiffres

### Flux de Test
1. Aller sur `/commande`
2. Uploader une photo
3. Remplir le formulaire
4. Payer avec carte test
5. Vérifier emails reçus
6. Vérifier admin `/admin`

## 🚀 Déploiement

### Vercel (Recommandé)
```bash
npm i -g vercel
vercel
# Ajouter variables d'environnement dans dashboard
```

### Autres Plateformes
```bash
npm run build
# Déployer le dossier 'out/'
```

## 📊 KPI MVP

| Métrique | Cible | Suivi |
|----------|-------|-------|
| Taux conversion formulaire→paiement | >60% | Analytics |
| Taux échec paiement | <5% | Stripe Dashboard |
| Délai paiement→brief | <30s | Logs serveur |

## 🛠️ Structure des Fichiers

```
app/
├── page.tsx              # Landing page
├── commande/             # Formulaire de commande
├── confirmation/         # Page post-paiement
├── admin/                # Interface admin
├── cgv/ & confidentialite/ # Pages légales
└── api/
    ├── orders/           # Création commande + Stripe
    ├── upload/           # Upload photos
    ├── photos/           # Accès sécurisé
    └── webhooks/stripe/  # Confirmation paiement
```

## 🐛 Dépannage

### Upload ne fonctionne pas
- Vérifier taille < 10MB
- Format : JPEG, PNG, HEIC, WebP
- Permissions dossier `uploads/`

### Emails non reçus
- Vérifier config SMTP
- Regarder dossier spam
- Tester avec service externe

### Paiement échoue
- Mode test vs live Stripe
- Webhook configuré
- Variables d'environnement

## 🔄 Évolutions V2

- [ ] Base de données persistante
- [ ] Comptes utilisateurs
- [ ] Preview créatif
- [ ] Suivi de commande
- [ ] App mobile native

## 📞 Support

- **Bugs**: Ouvrir une issue GitHub
- **Questions**: hello@stickerdoudou.fr
- **Documentation**: Voir `DOCUMENTATION.md`

---

**🎯 Votre MVP est prêt à encaisser ! Bon lancement ! 🚀**
