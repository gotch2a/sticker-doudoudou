#!/bin/bash
# 🔒 Script d'installation SSL automatique pour TagaDou sur VPS Hostinger
# Usage: Copiez tout ce script et collez-le dans votre terminal SSH

set -e

echo "🔒 INSTALLATION SSL AUTOMATIQUE POUR TAGADOU.FR"
echo "================================================"

# Variables
DOMAIN="tagadou.fr"
WWW_DOMAIN="www.tagadou.fr"
NEXTJS_PORT="3000"

# Vérification que nous sommes root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Ce script doit être exécuté en tant que root"
    exit 1
fi

echo "📦 1. Mise à jour du système..."
apt update -y

echo "🌐 2. Installation Nginx..."
apt install nginx -y

echo "🔒 3. Installation Certbot..."
apt install certbot python3-certbot-nginx -y

echo "⚙️  4. Configuration Nginx comme reverse proxy..."

# Sauvegarde de la config par défaut
if [ -f /etc/nginx/sites-enabled/default ]; then
    mv /etc/nginx/sites-enabled/default /etc/nginx/sites-enabled/default.bak
fi

# Création de la configuration TagaDou
cat > /etc/nginx/sites-available/tagadou.fr << EOF
server {
    listen 80;
    server_name $DOMAIN $WWW_DOMAIN;

    # Configuration reverse proxy vers Next.js
    location / {
        proxy_pass http://localhost:$NEXTJS_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Configuration pour les assets statiques
    location /_next/static/ {
        proxy_pass http://localhost:$NEXTJS_PORT;
        proxy_cache_valid 200 1y;
        add_header Cache-Control "public, max-age=31536000";
    }
    
    # Configuration pour les images
    location ~* \.(jpg|jpeg|png|gif|ico|svg|webp)$ {
        proxy_pass http://localhost:$NEXTJS_PORT;
        proxy_cache_valid 200 1M;
        add_header Cache-Control "public, max-age=2592000";
    }
}
EOF

# Activation de la configuration
ln -sf /etc/nginx/sites-available/tagadou.fr /etc/nginx/sites-enabled/

echo "🧪 5. Test de la configuration Nginx..."
nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Configuration Nginx valide !"
else
    echo "❌ Erreur dans la configuration Nginx"
    exit 1
fi

echo "🔄 6. Redémarrage Nginx..."
systemctl reload nginx
systemctl enable nginx

echo "🔒 7. Installation du certificat SSL Let's Encrypt..."
echo "   Domaines : $DOMAIN et $WWW_DOMAIN"

# Installation SSL automatique
certbot --nginx -d $DOMAIN -d $WWW_DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN

if [ $? -eq 0 ]; then
    echo "✅ SSL installé avec succès !"
else
    echo "❌ Erreur lors de l'installation SSL"
    echo "💡 Vérifiez que le domaine pointe bien vers ce serveur"
    exit 1
fi

echo "⚙️  8. Configuration du renouvellement automatique..."
# Test du renouvellement
certbot renew --dry-run

echo "🧪 9. Tests finaux..."
echo "   Test HTTP  : http://$DOMAIN"
echo "   Test HTTPS : https://$DOMAIN"

# Test de redirections
sleep 2
curl -I http://$DOMAIN 2>/dev/null | head -1
curl -I https://$DOMAIN 2>/dev/null | head -1

echo ""
echo "🎉 INSTALLATION SSL TERMINÉE AVEC SUCCÈS !"
echo "============================================"
echo "✅ Nginx configuré en reverse proxy"
echo "✅ SSL Let's Encrypt activé"
echo "✅ Renouvellement automatique configuré"
echo ""
echo "🌐 Votre site est maintenant accessible en HTTPS :"
echo "   👉 https://$DOMAIN"
echo "   👉 https://$WWW_DOMAIN"
echo ""
echo "🔧 Fichiers de configuration :"
echo "   • Nginx : /etc/nginx/sites-available/tagadou.fr"
echo "   • SSL   : /etc/letsencrypt/live/tagadou.fr/"
echo ""
echo "📊 Commandes utiles :"
echo "   • Statut Nginx : systemctl status nginx"
echo "   • Logs Nginx   : tail -f /var/log/nginx/error.log"
echo "   • Test SSL     : certbot renew --dry-run"
