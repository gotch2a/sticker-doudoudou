#!/bin/bash
# 🔧 SETUP VPS AUTOMATIQUE TAGADOU.FR
# Configuration complète serveur production en une commande

set -e

# Configuration
PROJECT_NAME="tagadou"
DOMAIN="tagadou.fr"
USER="tagadou"
PROJECT_DIR="/opt/tagadou"
BACKUP_DIR="/opt/tagadou-backups"
LOG_FILE="/var/log/tagadou-setup.log"

# Couleurs pour output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a $LOG_FILE
}

warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] ⚠️${NC} $1" | tee -a $LOG_FILE
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ❌${NC} $1" | tee -a $LOG_FILE
}

header() {
    echo
    echo -e "${BLUE}============================================${NC}"
    echo -e "${BLUE} $1${NC}"
    echo -e "${BLUE}============================================${NC}"
    echo
}

# Vérification root
if [ "$EUID" -ne 0 ]; then
    error "Ce script doit être exécuté en tant que root"
    exit 1
fi

header "🚀 SETUP AUTOMATIQUE VPS TAGADOU.FR"

# 1. Mise à jour système
log "📦 Mise à jour du système..."
apt update && apt upgrade -y

# 2. Installation des paquets essentiels
log "📦 Installation paquets essentiels..."
apt install -y \
    curl \
    wget \
    git \
    unzip \
    software-properties-common \
    apt-transport-https \
    ca-certificates \
    gnupg \
    lsb-release \
    fail2ban \
    ufw \
    htop \
    nano \
    vim \
    bc \
    jq \
    nginx \
    certbot \
    python3-certbot-nginx

# 3. Installation Docker
header "🐳 INSTALLATION DOCKER"
log "Installation Docker..."

# Désinstallation versions anciennes
apt remove -y docker docker-engine docker.io containerd runc 2>/dev/null || true

# Installation Docker officiel
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Installation Docker Compose standalone
curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

# Démarrage et activation Docker
systemctl start docker
systemctl enable docker

log "✅ Docker installé : $(docker --version)"

# 4. Installation Node.js et npm
header "📦 INSTALLATION NODE.JS"
log "Installation Node.js 20..."

curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

log "✅ Node.js installé : $(node --version)"
log "✅ npm installé : $(npm --version)"

# 5. Configuration utilisateur projet
header "👤 CONFIGURATION UTILISATEUR"
log "Création utilisateur $USER..."

if ! id "$USER" &>/dev/null; then
    useradd -m -s /bin/bash $USER
    usermod -aG docker $USER
    usermod -aG sudo $USER
    log "✅ Utilisateur $USER créé"
else
    log "ℹ️ Utilisateur $USER existe déjà"
fi

# 6. Configuration SSH sécurisée
header "🔒 SÉCURISATION SSH"
log "Configuration SSH sécurisée..."

# Backup config SSH
cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup

# Configuration SSH sécurisée
cat > /etc/ssh/sshd_config << 'EOF'
Port 22
Protocol 2
HostKey /etc/ssh/ssh_host_rsa_key
HostKey /etc/ssh/ssh_host_dsa_key
HostKey /etc/ssh/ssh_host_ecdsa_key
HostKey /etc/ssh/ssh_host_ed25519_key

UsePrivilegeSeparation yes
KeyRegenerationInterval 3600
ServerKeyBits 1024

SyslogFacility AUTH
LogLevel INFO

LoginGraceTime 120
PermitRootLogin yes
StrictModes yes

RSAAuthentication yes
PubkeyAuthentication yes

IgnoreRhosts yes
RhostsRSAAuthentication no
HostbasedAuthentication no

PermitEmptyPasswords no
ChallengeResponseAuthentication no
PasswordAuthentication yes

X11Forwarding yes
X11DisplayOffset 10
PrintMotd no
PrintLastLog yes
TCPKeepAlive yes

AcceptEnv LANG LC_*
Subsystem sftp /usr/lib/openssh/sftp-server

UsePAM yes
EOF

systemctl reload sshd
log "✅ SSH sécurisé"

# 7. Configuration Firewall
header "🛡️ CONFIGURATION FIREWALL"
log "Configuration UFW..."

ufw --force reset
ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 3001/tcp  # Monitoring
ufw --force enable

log "✅ Firewall configuré"

# 8. Configuration Fail2Ban
log "Configuration Fail2Ban..."
systemctl enable fail2ban
systemctl start fail2ban
log "✅ Fail2Ban activé"

# 9. Création structure projet
header "📁 STRUCTURE PROJET"
log "Création répertoires..."

mkdir -p $PROJECT_DIR
mkdir -p $BACKUP_DIR
mkdir -p /var/log/tagadou
mkdir -p /opt/tagadou-scripts

chown -R $USER:$USER $PROJECT_DIR
chown -R $USER:$USER $BACKUP_DIR
chown -R $USER:$USER /var/log/tagadou

log "✅ Structure créée"

# 10. Configuration Git global
log "Configuration Git..."
su - $USER -c "git config --global user.name 'TAGADOU Server'"
su - $USER -c "git config --global user.email 'server@tagadou.fr'"

# 11. Clonage projet (si repository fourni)
if [ -n "$GIT_REPO" ]; then
    log "Clonage du projet..."
    su - $USER -c "cd $PROJECT_DIR && git clone $GIT_REPO ."
    log "✅ Projet cloné"
fi

# 12. Installation PM2 pour gestion processus
header "⚙️ INSTALLATION PM2"
log "Installation PM2..."
npm install -g pm2
pm2 startup systemd -u $USER --hp /home/$USER

log "✅ PM2 installé"

# 13. Configuration Nginx
header "🌐 CONFIGURATION NGINX"
log "Configuration Nginx..."

# Configuration Nginx optimisée
cat > /etc/nginx/sites-available/$DOMAIN << EOF
# Configuration Nginx optimisée TAGADOU.FR
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    # Redirection HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;
    
    # SSL Configuration (Certbot configurera automatiquement)
    # ssl_certificate managed by Certbot
    # ssl_certificate_key managed by Certbot
    
    # Sécurité
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options SAMEORIGIN always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "origin-when-cross-origin" always;
    
    # Gzip
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # Proxy vers application
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # Assets statiques
    location /_next/static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        proxy_pass http://localhost:3000;
    }
    
    location /images/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        proxy_pass http://localhost:3000;
    }
    
    # Monitoring (optionnel)
    location /monitoring {
        proxy_pass http://localhost:3001;
        auth_basic "Monitoring";
        auth_basic_user_file /etc/nginx/.htpasswd;
    }
}
EOF

# Activation du site
ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test configuration
nginx -t && systemctl reload nginx
log "✅ Nginx configuré"

# 14. Certificat SSL automatique
header "🔒 CERTIFICAT SSL"
log "Génération certificat SSL..."

# Attendre que DNS soit propagé
warning "⏳ Vérification DNS... (peut prendre quelques minutes)"

# Test DNS
for i in {1..30}; do
    if nslookup $DOMAIN | grep -q "Address:"; then
        log "✅ DNS résolu"
        break
    fi
    
    if [ $i -eq 30 ]; then
        warning "DNS non résolu - SSL à configurer manuellement plus tard"
        break
    fi
    
    sleep 10
done

# Génération SSL si DNS OK
if nslookup $DOMAIN | grep -q "Address:"; then
    certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN
    log "✅ Certificat SSL configuré"
else
    warning "SSL à configurer manuellement une fois DNS propagé :"
    warning "certbot --nginx -d $DOMAIN -d www.$DOMAIN"
fi

# 15. Configuration cron jobs
header "⏰ TÂCHES AUTOMATISÉES"
log "Configuration cron jobs..."

# Cron pour renouvellement SSL
(crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | crontab -

# Cron pour backup quotidien
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/tagadou-scripts/backup-daily.sh") | crontab -

# Cron pour nettoyage logs
(crontab -l 2>/dev/null; echo "0 1 * * 0 /usr/bin/find /var/log -name \"*.log\" -mtime +30 -delete") | crontab -

log "✅ Cron jobs configurés"

# 16. Optimisations système
header "⚡ OPTIMISATIONS SYSTÈME"
log "Optimisations performance..."

# Swappiness
echo 'vm.swappiness=10' >> /etc/sysctl.conf

# File descriptors
echo '* soft nofile 65535' >> /etc/security/limits.conf
echo '* hard nofile 65535' >> /etc/security/limits.conf

# Network optimizations
cat >> /etc/sysctl.conf << 'EOF'
# Network optimizations
net.core.rmem_default = 262144
net.core.rmem_max = 16777216
net.core.wmem_default = 262144
net.core.wmem_max = 16777216
net.ipv4.tcp_rmem = 4096 65536 16777216
net.ipv4.tcp_wmem = 4096 65536 16777216
net.core.netdev_max_backlog = 5000
EOF

sysctl -p
log "✅ Optimisations appliquées"

# 17. Installation monitoring tools
log "Installation outils monitoring..."
apt install -y htop iotop nethogs

# 18. Création script de monitoring
cat > /opt/tagadou-scripts/server-status.sh << 'EOF'
#!/bin/bash
echo "====== STATUT SERVEUR TAGADOU ======"
echo "Date: $(date)"
echo
echo "== SYSTÈME =="
uptime
echo
echo "== MÉMOIRE =="
free -h
echo
echo "== DISQUE =="
df -h
echo  
echo "== PROCESSUS TAGADOU =="
ps aux | grep -E "(node|nginx|docker)" | grep -v grep
echo
echo "== DOCKER =="
docker ps
echo
echo "== NGINX STATUS =="
systemctl status nginx --no-pager -l
echo
echo "== CERTIFICAT SSL =="
certbot certificates
EOF

chmod +x /opt/tagadou-scripts/server-status.sh

# 19. Script de backup
cat > /opt/tagadou-scripts/backup-daily.sh << 'EOF'
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="tagadou_backup_$DATE"

# Backup code
tar -czf /opt/tagadou-backups/code_$BACKUP_NAME.tar.gz -C /opt/tagadou .

# Backup nginx config
cp -r /etc/nginx/sites-available /opt/tagadou-backups/nginx_$DATE

# Nettoyage (garde 7 derniers backups)
cd /opt/tagadou-backups
ls -t | tail -n +8 | xargs rm -f

echo "Backup terminé: $BACKUP_NAME"
EOF

chmod +x /opt/tagadou-scripts/backup-daily.sh

log "✅ Scripts monitoring créés"

# 20. Instructions finales
header "✅ SETUP TERMINÉ !"

echo
echo -e "${GREEN}🎉 VPS TAGADOU.FR CONFIGURÉ AVEC SUCCÈS !${NC}"
echo
echo "======================================================"
echo -e "${BLUE}📋 INFORMATIONS IMPORTANTES${NC}"
echo "======================================================"
echo -e "🌐 Domaine: ${YELLOW}$DOMAIN${NC}"
echo -e "📁 Projet: ${YELLOW}$PROJECT_DIR${NC}"
echo -e "👤 Utilisateur: ${YELLOW}$USER${NC}"
echo -e "💾 Backups: ${YELLOW}$BACKUP_DIR${NC}"
echo -e "📊 Logs: ${YELLOW}/var/log/tagadou/${NC}"
echo
echo "======================================================"
echo -e "${BLUE}🔧 PROCHAINES ÉTAPES${NC}"
echo "======================================================"
echo -e "${GREEN}1.${NC} Cloner le projet dans $PROJECT_DIR"
echo -e "${GREEN}2.${NC} Configurer les variables d'environnement"
echo -e "${GREEN}3.${NC} Lancer: docker-compose up -d"
echo -e "${GREEN}4.${NC} Vérifier: https://$DOMAIN"
echo
echo "======================================================"
echo -e "${BLUE}📊 COMMANDES UTILES${NC}"
echo "======================================================"
echo -e "${GREEN}Status:${NC} /opt/tagadou-scripts/server-status.sh"
echo -e "${GREEN}Logs:${NC} tail -f /var/log/tagadou/app.log"
echo -e "${GREEN}Docker:${NC} docker-compose logs -f"
echo -e "${GREEN}Nginx:${NC} systemctl status nginx"
echo -e "${GREEN}SSL:${NC} certbot certificates"
echo
echo "======================================================"

log "✅ Setup VPS terminé avec succès !"

# Redémarrage pour appliquer toutes les configurations
warning "🔄 Redémarrage recommandé dans 1 minute..."
warning "Commande: reboot"

exit 0
EOF
