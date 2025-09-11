# 🚀 CHECKLIST DÉPLOIEMENT TAGADOU.FR

## ✅ Pré-déploiement

### 1. Variables d'environnement de production
- [ ] NEXT_PUBLIC_SUPABASE_URL
- [ ] NEXT_PUBLIC_SUPABASE_ANON_KEY
- [ ] SUPABASE_SERVICE_ROLE_KEY
- [ ] RESEND_API_KEY
- [ ] PAYPAL_CLIENT_ID 
- [ ] PAYPAL_CLIENT_SECRET

### 2. Configuration Next.js
- [ ] Vérifier next.config.js pour la production
- [ ] Optimisations d'images activées
- [ ] Variables de build configurées

### 3. Supabase Production
- [ ] RLS (Row Level Security) activé sur toutes les tables
- [ ] Policies de sécurité vérifiées
- [ ] Backup automatique configuré
- [ ] URL de production mise à jour

### 4. Tests finaux
- [ ] Build de production fonctionne (`npm run build`)
- [ ] Toutes les fonctionnalités testées
- [ ] Performance vérifiée (Lighthouse)
- [ ] SEO optimisé

## 🌐 Déploiement

### Option A : Vercel (Recommandée)
1. Push le code sur GitHub
2. Connecter Vercel au repository
3. Configurer les variables d'environnement
4. Déploiement automatique

### Option B : VPS Hostinger
1. Serveur Node.js configuré
2. PM2 pour le processus
3. Nginx comme reverse proxy
4. SSL avec Let's Encrypt

## 🔗 Configuration Domaine

### Vercel + Hostinger
1. Dans Vercel : Ajouter domaine customtagadou.fr
2. Dans Hostinger DNS :
   - A record : @ → IP Vercel
   - CNAME : www → tagadou.vercel.app

### VPS Direct
1. A record : @ → IP du serveur
2. CNAME : www → tagadou.fr

## 🔄 Post-déploiement
- [ ] SSL actif (HTTPS)
- [ ] Performances vérifiées
- [ ] Monitoring configuré
- [ ] Sauvegardes automatiques
