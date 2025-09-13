# 🚀 GUIDE COMPLET : DÉPLOIEMENT TAGADOU SUR VPS HOSTINGER

## 🎯 OBJECTIF : TAGADOU.FR EN LIGNE EN 1 HEURE MAXIMUM

Ce guide vous accompagne étape par étape pour déployer TagaDou sur votre VPS Hostinger.

---

## 📋 PRÉ-REQUIS

### ✅ Ce que vous devez avoir :

1. **VPS Hostinger commandé** (VPS 2 recommandé : 2 CPU, 4GB RAM)
2. **Domaine tagadou.fr** (si pas encore fait, voir section DNS)
3. **Accès SSH** au VPS
4. **Variables d'environnement** prêtes (Supabase, PayPal, Resend)

### 🔧 Informations nécessaires :

- **IP du VPS** (fournie par Hostinger après installation)
- **Mot de passe root** (reçu par email)
- **Vos clés API** (Supabase, PayPal, Resend)

---

## 🚀 ÉTAPE 1 : COMMANDE VPS HOSTINGER

### 📝 Configuration recommandée :

```
┌─────────────────────────────────────┐
│ CONFIGURATION VPS OPTIMALE          │
├─────────────────────────────────────┤
│ Plan: VPS 2 (9€/mois)               │
│ CPU: 2 cœurs                        │
│ RAM: 4GB                            │
│ Stockage: 80GB SSD                  │
│ OS: Ubuntu 22.04 LTS               │
│ Localisation: Amsterdam/Londres     │
│ Backup: Activé                     │
└─────────────────────────────────────┘
```

### 🛒 Processus de commande :

1. **Connexion hPanel** : [hpanel.hostinger.com](https://hpanel.hostinger.com)
2. **VPS → Nouvelle commande**
3. **Sélectionnez VPS 2**
4. **OS : Ubuntu 22.04 LTS**
5. **Localisation : Europe (Amsterdam)**
6. **Options : Backup automatique ✅**
7. **Finaliser la commande**

⏱️ **Temps d'installation VPS** : 5-15 minutes

---

## 🔐 ÉTAPE 2 : PREMIÈRE CONNEXION SSH

### 📧 Récupération accès :

Après installation, vous recevrez un email avec :
- **IP du serveur** : `123.456.789.012`
- **Utilisateur** : `root`
- **Mot de passe** : `MotDePasseTemporaire`

### 🖥️ Connexion SSH :

```bash
# Connexion initiale
ssh root@VOTRE_IP_VPS

# Changement mot de passe (recommandé)
passwd
```

### 🔑 Configuration clé SSH (optionnel mais recommandé) :

```bash
# Sur votre machine locale
ssh-keygen -t rsa -b 4096 -C "tagadou@votre-email.com"
ssh-copy-id root@VOTRE_IP_VPS
```

---

## ⚡ ÉTAPE 3 : INSTALLATION AUTOMATIQUE

### 🚀 Lancement script d'installation :

```bash
# Téléchargement et exécution du script d'installation
curl -sSL https://raw.githubusercontent.com/VOTRE-REPO/tagadou/main/scripts/install-vps-hostinger.sh | bash
```

### 📊 Ce que fait le script automatiquement :

- ✅ **Mise à jour système** Ubuntu 22.04
- ✅ **Installation Docker** + Docker Compose
- ✅ **Installation Node.js 20 LTS**
- ✅ **Configuration firewall** UFW sécurisé
- ✅ **Création utilisateur** `tagadou` non-privilégié
- ✅ **Optimisation système** (limites, kernel)
- ✅ **Sécurisation SSH** + Fail2Ban
- ✅ **Configuration monitoring** automatique
- ✅ **Structure répertoires** optimale
- ✅ **Services systemd** pour auto-restart

⏱️ **Durée d'installation** : 3-5 minutes

---

## 👤 ÉTAPE 4 : BASCULEMENT UTILISATEUR SÉCURISÉ

### 🔄 Changement vers utilisateur non-root :

```bash
# Changement d'utilisateur
sudo su - tagadou

# Vérification
whoami  # Doit afficher 'tagadou'
pwd     # Doit afficher '/opt/tagadou'
```

---

## 📥 ÉTAPE 5 : CLONAGE REPOSITORY

### 🔗 Clonage du projet :

```bash
# Dans /opt/tagadou
git clone https://github.com/VOTRE-USERNAME/tagadou.git .

# Vérification
ls -la  # Doit afficher les fichiers du projet
```

### 🔑 Si repository privé :

```bash
# Configuration Git (remplacez par vos infos)
git config --global user.name "Votre Nom"
git config --global user.email "votre@email.com"

# Clonage avec authentification
git clone https://USERNAME:TOKEN@github.com/USERNAME/tagadou.git .
```

---

## ⚙️ ÉTAPE 6 : CONFIGURATION ENVIRONNEMENT

### 📝 Configuration fichier .env :

```bash
# Copie du template
cp .env.example .env

# Édition du fichier .env
nano .env
```

### 🔧 Variables à configurer :

```bash
# .env - CONFIGURATION PRODUCTION
NODE_ENV=production
NEXT_PUBLIC_BASE_URL=https://tagadou.fr

# Supabase (remplacez par vos vraies valeurs)
NEXT_PUBLIC_SUPABASE_URL=https://VOTRE-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# PayPal Production (vraies clés)
NEXT_PUBLIC_PAYPAL_CLIENT_ID=VOTRE_CLIENT_ID_PRODUCTION
PAYPAL_CLIENT_SECRET=VOTRE_CLIENT_SECRET_PRODUCTION
NEXT_PUBLIC_PAYPAL_ENVIRONMENT=production

# Email Resend
RESEND_API_KEY=re_VOTRE_CLE_API_RESEND

# Sécurité (générez des clés fortes)
REDIS_PASSWORD=MotDePasseRedisUltraFort2024!
JWT_SECRET=CleJWTTresLongueEtSecrete123456789
NEXTAUTH_SECRET=CleNextAuthTresLongueEtSecrete123456789
NEXTAUTH_URL=https://tagadou.fr

# Admin
ADMIN_EMAIL=admin@tagadou.fr
```

### 🔑 Génération clés sécurisées :

```bash
# Génération clés fortes
openssl rand -base64 32  # Pour JWT_SECRET
openssl rand -base64 32  # Pour NEXTAUTH_SECRET
openssl rand -base64 16  # Pour REDIS_PASSWORD
```

---

## 🌐 ÉTAPE 7 : CONFIGURATION DNS

### 📋 Configuration chez votre registrar de domaine :

**Si le domaine n'est PAS chez Hostinger :**

1. **Chez votre registrar actuel** (OVH, Gandi, etc.)
2. **Ajoutez ces enregistrements DNS :**

```
Type    Nom    Valeur              TTL
A       @      VOTRE_IP_VPS        3600
A       www    VOTRE_IP_VPS        3600
CNAME   api    tagadou.fr          3600
```

**Si vous voulez transférer le domaine chez Hostinger :**

1. **hPanel → Domaines → Transfert**
2. **Code de transfert** (demandé au registrar actuel)
3. **Suivi du transfert** (5-7 jours)

### 🔍 Vérification DNS :

```bash
# Vérification propagation DNS
nslookup tagadou.fr
dig tagadou.fr

# Test depuis différents endroits
# https://www.whatsmydns.net/#A/tagadou.fr
```

⏱️ **Propagation DNS** : 0-24h (souvent 0-2h)

---

## 🚀 ÉTAPE 8 : DÉPLOIEMENT FINAL

### ⚡ Lancement déploiement automatique :

```bash
# Exécution du script de post-installation
./post-install.sh
```

### 📊 Ce qui se passe automatiquement :

1. **Installation dépendances** : `npm ci`
2. **Build optimisé** : `npm run build`
3. **Démarrage Docker** : Services en mode production
4. **Configuration SSL** : Certificat Let's Encrypt automatique
5. **Activation monitoring** : Surveillance 24/7

### 🔍 Vérification déploiement :

```bash
# Statut des services Docker
docker compose ps

# Logs en temps réel
docker compose logs -f

# Test de la réponse
curl -I https://tagadou.fr
```

---

## ✅ ÉTAPE 9 : VÉRIFICATIONS FINALES

### 🌐 Tests fonctionnels :

1. **Page d'accueil** : [https://tagadou.fr](https://tagadou.fr)
2. **API Health** : [https://tagadou.fr/api/health](https://tagadou.fr/api/health)
3. **SSL automatique** : Cadenas vert dans le navigateur
4. **Redirection www** : [https://www.tagadou.fr](https://www.tagadou.fr) → tagadou.fr

### 📊 Monitoring accessible :

- **Métriques système** : [http://tagadou.fr:8080](http://tagadou.fr:8080)
- **Logs centralisés** : `docker compose logs -f`
- **Statut services** : `systemctl status tagadou-monitor`

### 🔍 Commandes utiles :

```bash
# Statut général
docker compose ps
systemctl status tagadou-monitor

# Logs spécifiques
docker logs tagadou-app
docker logs tagadou-nginx

# Métriques en temps réel
htop
iotop
nload

# Espace disque
df -h
ncdu /opt/tagadou
```

---

## 🛠️ MAINTENANCE ET MISES À JOUR

### 🔄 Déploiement nouvelle version :

```bash
# Simple git pull + déploiement
git pull origin main
./scripts/deploy-auto.sh
```

### 📦 Sauvegarde manuelle :

```bash
# Backup complet
./scripts/backup-auto.sh

# Liste des backups
ls -la /opt/tagadou-backups/
```

### 🔧 Redémarrage services :

```bash
# Redémarrage propre
docker compose down
docker compose up -d

# Redémarrage forcé
sudo systemctl restart docker
```

---

## 🚨 DÉPANNAGE COURANT

### ❌ Problème : Site inaccessible

```bash
# Vérifications
docker compose ps          # Services up ?
curl -I http://localhost:3000  # App locale OK ?
sudo ufw status             # Firewall OK ?
nslookup tagadou.fr        # DNS OK ?
```

### ❌ Problème : SSL non activé

```bash
# Forcer renouvellement SSL
docker compose restart letsencrypt
docker compose logs letsencrypt
```

### ❌ Problème : Performance lente

```bash
# Métriques système
htop
iotop
docker stats

# Nettoyage Docker
docker system prune -f
```

---

## 📊 RÉSULTAT FINAL ATTENDU

### 🎉 Infrastructure TagaDou opérationnelle :

- ✅ **Site principal** : https://tagadou.fr (< 1 seconde)
- ✅ **SSL automatique** : Certificat Let's Encrypt valide
- ✅ **Redirection www** : www.tagadou.fr → tagadou.fr
- ✅ **API fonctionnelle** : /api/health retourne 200
- ✅ **Upload photos** : Fonctionnel avec sécurisation
- ✅ **Paiement PayPal** : Mode production activé
- ✅ **Monitoring 24/7** : Auto-restart si problème
- ✅ **Backup automatique** : Quotidien à 2h du matin
- ✅ **Logs centralisés** : Rotation automatique
- ✅ **Sécurité** : Firewall + Fail2Ban + SSL

### 📈 Performance attendue :

- **Temps de chargement** : < 1 seconde
- **Uptime** : 99.9%+ avec auto-restart
- **Scaling** : Gère 1000+ visiteurs simultanés
- **Sécurité** : Headers optimisés + protection DDoS

---

## 🎯 CHECKLIST FINALE

```
🚀 DÉPLOIEMENT TAGADOU.FR - CHECKLIST

📋 Avant déploiement :
[ ] VPS Hostinger commandé et reçu (IP + accès)
[ ] Domaine pointé vers IP du VPS
[ ] Variables .env configurées (Supabase, PayPal, Resend)
[ ] Clés SSH configurées (optionnel)

⚡ Installation :
[ ] Script install-vps-hostinger.sh exécuté avec succès
[ ] Utilisateur 'tagadou' créé et fonctionnel
[ ] Repository cloné dans /opt/tagadou
[ ] Fichier .env configuré avec vraies valeurs
[ ] Script post-install.sh exécuté

✅ Vérifications finales :
[ ] https://tagadou.fr accessible (< 2 sec)
[ ] SSL actif (cadenas vert)
[ ] /api/health retourne 200 OK
[ ] Upload de photo fonctionnel
[ ] PayPal en mode production
[ ] Monitoring sur :8080 accessible
[ ] Backup automatique configuré
[ ] Services Docker tous UP

🎉 TAGADOU.FR EN LIGNE !
```

---

## 🆘 SUPPORT

### 📧 En cas de problème :

1. **Vérifiez les logs** : `docker compose logs -f`
2. **Consultez le monitoring** : `http://VOTRE-IP:8080`
3. **Testez les services** : `docker compose ps`

### 📋 Informations à fournir pour support :

```bash
# Collecte d'informations de debug
echo "=== SYSTÈME ===" > debug.txt
uname -a >> debug.txt
df -h >> debug.txt

echo "=== DOCKER ===" >> debug.txt
docker --version >> debug.txt
docker compose ps >> debug.txt

echo "=== SERVICES ===" >> debug.txt
systemctl status tagadou-monitor >> debug.txt

echo "=== LOGS RÉCENTS ===" >> debug.txt
tail -50 /var/log/tagadou/deploy.log >> debug.txt

# Envoi du fichier debug.txt pour support
```

**🚀 FÉLICITATIONS ! TAGADOU.FR EST EN LIGNE !**


