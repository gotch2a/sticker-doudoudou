# 🔒 SCRIPT SSL TAGADOU - VERSION COPIER-COLLER
# Copiez TOUT le contenu ci-dessous et collez-le dans votre terminal SSH

# Mise à jour + Installation
apt update -y && apt install nginx certbot python3-certbot-nginx -y

# Sauvegarde config par défaut
[ -f /etc/nginx/sites-enabled/default ] && mv /etc/nginx/sites-enabled/default /etc/nginx/sites-enabled/default.bak

# Configuration Nginx pour TagaDou
cat > /etc/nginx/sites-available/tagadou.fr << 'EOF'
server {
    listen 80;
    server_name tagadou.fr www.tagadou.fr;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# Activation et test
ln -sf /etc/nginx/sites-available/tagadou.fr /etc/nginx/sites-enabled/ && nginx -t && systemctl reload nginx

# Installation SSL automatique
certbot --nginx -d tagadou.fr -d www.tagadou.fr --non-interactive --agree-tos --email admin@tagadou.fr

# Test final
echo "🎉 Installation terminée ! Testez : https://tagadou.fr"
