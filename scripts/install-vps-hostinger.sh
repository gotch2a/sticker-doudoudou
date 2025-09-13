#!/bin/bash
# 🚀 INSTALLATION VPS HOSTINGER AUTOMATIQUE - TAGADOU.FR
# Script d'installation complète pour VPS Ubuntu 22.04 Hostinger
# Usage: curl -sSL https://raw.githubusercontent.com/VOTRE-REPO/main/scripts/install-vps-hostinger.sh | bash

set -e

# Configuration
PROJECT_NAME="tagadou"
PROJECT_DIR="/opt/tagadou"
DOMAIN="tagadou.fr"
USER_NAME="tagadou"

# Couleurs pour affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
}

warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

info() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] INFO:${NC} $1"
}

# Vérification root
if [ "$EUID" -ne 0 ]; then 
    error "Ce script doit être exécuté en tant que root (utilisez sudo)"
    exit 1
fi

log "🚀 DÉBUT INSTALLATION VPS HOSTINGER POUR TAGADOU.FR"
log "=================================================="

# 1. Mise à jour système
log "📦 Mise à jour système Ubuntu..."
apt update -y
apt upgrade -y
apt install -y curl wget git unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release

# 2. Configuration firewall UFW
log "🔥 Configuration firewall UFW..."
ufw --force reset
ufw default deny incoming
ufw default allow outgoing

# Ports essentiels
ufw allow ssh
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 8080/tcp  # Monitoring

# Activation firewall
ufw --force enable
ufw status

# 3. Installation Docker et Docker Compose
log "🐳 Installation Docker..."
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null

apt update -y
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

# Démarrage et activation Docker
systemctl start docker
systemctl enable docker

# 4. Installation Node.js LTS
log "📦 Installation Node.js 20 LTS..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Vérification versions
log "✅ Versions installées:"
echo "Docker: $(docker --version)"
echo "Docker Compose: $(docker compose version)"
echo "Node.js: $(node --version)"
echo "NPM: $(npm --version)"

# 5. Création utilisateur non-privilégié
log "👤 Création utilisateur $USER_NAME..."
if ! id "$USER_NAME" &>/dev/null; then
    useradd -m -s /bin/bash "$USER_NAME"
    usermod -aG docker "$USER_NAME"
    echo "$USER_NAME ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers
fi

# 6. Création structure de répertoires
log "📁 Création structure répertoires..."
mkdir -p "$PROJECT_DIR"
mkdir -p "/opt/tagadou-backups"
mkdir -p "/var/log/tagadou"
mkdir -p "/opt/ssl-certs"

# Permissions
chown -R "$USER_NAME:$USER_NAME" "$PROJECT_DIR"
chown -R "$USER_NAME:$USER_NAME" "/opt/tagadou-backups"
chown -R "$USER_NAME:$USER_NAME" "/var/log/tagadou"

# 7. Configuration optimisée système
log "⚙️ Optimisation système..."

# Limites système
cat >> /etc/security/limits.conf << EOF
$USER_NAME soft nofile 65536
$USER_NAME hard nofile 65536
$USER_NAME soft nproc 32768
$USER_NAME hard nproc 32768
EOF

# Paramètres kernel
cat >> /etc/sysctl.conf << EOF
# Optimisations TagaDou
net.core.somaxconn = 65535
net.core.netdev_max_backlog = 5000
net.ipv4.tcp_max_syn_backlog = 65535
net.ipv4.tcp_keepalive_time = 300
net.ipv4.tcp_keepalive_intvl = 30
net.ipv4.tcp_keepalive_probes = 3
vm.swappiness = 10
vm.dirty_ratio = 15
vm.dirty_background_ratio = 5
EOF

sysctl -p

# 8. Configuration logs rotation
log "📝 Configuration rotation logs..."
cat > /etc/logrotate.d/tagadou << EOF
/var/log/tagadou/*.log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 0644 $USER_NAME $USER_NAME
    postrotate
        systemctl reload rsyslog > /dev/null 2>&1 || true
    endscript
}
EOF

# 9. Installation outils monitoring
log "📊 Installation outils monitoring..."
apt install -y htop iotop nload ncdu tree jq

# 10. Configuration SSH sécurisée
log "🔐 Sécurisation SSH..."
cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup

cat > /etc/ssh/sshd_config << EOF
# Configuration SSH sécurisée TagaDou
Port 22
Protocol 2
PermitRootLogin no
MaxAuthTries 3
PubkeyAuthentication yes
PasswordAuthentication yes
PermitEmptyPasswords no
ChallengeResponseAuthentication no
UsePAM yes
X11Forwarding no
PrintMotd no
AcceptEnv LANG LC_*
Subsystem sftp /usr/lib/openssh/sftp-server
ClientAliveInterval 300
ClientAliveCountMax 2
MaxSessions 10
EOF

systemctl reload ssh

# 11. Installation Fail2Ban
log "🛡️ Installation Fail2Ban..."
apt install -y fail2ban

cat > /etc/fail2ban/jail.local << EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/error.log
EOF

systemctl enable fail2ban
systemctl start fail2ban

# 12. Préparation variables environnement
log "🔧 Préparation environnement..."
sudo -u "$USER_NAME" cat > "$PROJECT_DIR/.env.example" << 'EOF'
# Configuration Production TAGADOU.FR

# Base
NODE_ENV=production
NEXT_PUBLIC_BASE_URL=https://tagadou.fr

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://VOTRE-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=VOTRE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=VOTRE_SERVICE_ROLE_KEY

# PayPal Production
NEXT_PUBLIC_PAYPAL_CLIENT_ID=VOTRE_PAYPAL_CLIENT_ID
PAYPAL_CLIENT_SECRET=VOTRE_PAYPAL_CLIENT_SECRET
NEXT_PUBLIC_PAYPAL_ENVIRONMENT=production

# Email (Resend)
RESEND_API_KEY=re_VOTRE_API_KEY

# Redis
REDIS_PASSWORD=VOTRE_MOT_DE_PASSE_REDIS_FORT

# Monitoring
ADMIN_EMAIL=admin@tagadou.fr

# Sécurité
JWT_SECRET=VOTRE_JWT_SECRET_TRES_LONG
NEXTAUTH_SECRET=VOTRE_NEXTAUTH_SECRET_TRES_LONG
NEXTAUTH_URL=https://tagadou.fr
EOF

# 13. Création service systemd pour monitoring
log "📊 Création service monitoring..."
cat > /etc/systemd/system/tagadou-monitor.service << EOF
[Unit]
Description=TagaDou Monitoring Service
After=docker.service
Requires=docker.service

[Service]
Type=forking
User=$USER_NAME
WorkingDirectory=$PROJECT_DIR
ExecStart=$PROJECT_DIR/scripts/monitor-auto.sh
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# 14. Configuration crontab automatique
log "⏰ Configuration tâches automatiques..."
sudo -u "$USER_NAME" crontab -l 2>/dev/null | { cat; echo "0 2 * * * $PROJECT_DIR/scripts/backup-auto.sh"; } | sudo -u "$USER_NAME" crontab -
sudo -u "$USER_NAME" crontab -l 2>/dev/null | { cat; echo "*/15 * * * * $PROJECT_DIR/scripts/health-check.sh"; } | sudo -u "$USER_NAME" crontab -

# 15. Optimisation Docker
log "🐳 Optimisation Docker..."
cat > /etc/docker/daemon.json << EOF
{
    "log-driver": "json-file",
    "log-opts": {
        "max-size": "10m",
        "max-file": "3"
    },
    "storage-driver": "overlay2",
    "dns": ["8.8.8.8", "1.1.1.1"],
    "default-ulimits": {
        "nofile": {
            "Hard": 65536,
            "Name": "nofile",
            "Soft": 65536
        }
    }
}
EOF

systemctl restart docker

# 16. Création script de post-installation
log "📋 Création script post-installation..."
cat > "$PROJECT_DIR/post-install.sh" << 'EOF'
#!/bin/bash
# Script à exécuter après clonage du repository

echo "🚀 Configuration finale TagaDou..."

# 1. Installation dépendances
npm ci

# 2. Configuration environnement
if [ ! -f .env ]; then
    echo "⚠️  Copiez .env.example vers .env et configurez vos variables !"
    cp .env.example .env
fi

# 3. Build initial
npm run build

# 4. Démarrage services
docker compose -f docker-compose.production.yml up -d

echo "✅ Installation terminée !"
echo "📋 Prochaines étapes :"
echo "   1. Configurez votre .env avec vos vraies valeurs"
echo "   2. Pointez votre domaine vers cette IP"
echo "   3. Redémarrez : docker compose -f docker-compose.production.yml restart"
EOF

chmod +x "$PROJECT_DIR/post-install.sh"
chown "$USER_NAME:$USER_NAME" "$PROJECT_DIR/post-install.sh"

# 17. Affichage informations finales
clear
echo "=================================================="
echo "🎉 INSTALLATION VPS HOSTINGER TERMINÉE AVEC SUCCÈS !"
echo "=================================================="
echo
echo "📋 INFORMATIONS SYSTÈME :"
echo "   • OS: Ubuntu $(lsb_release -rs)"
echo "   • IP Publique: $(curl -s ifconfig.me 2>/dev/null || echo 'Détection échouée')"
echo "   • Docker: $(docker --version | cut -d' ' -f3)"
echo "   • Node.js: $(node --version)"
echo
echo "📁 RÉPERTOIRES :"
echo "   • Application: $PROJECT_DIR"
echo "   • Backups: /opt/tagadou-backups"
echo "   • Logs: /var/log/tagadou"
echo
echo "👤 UTILISATEUR :"
echo "   • Nom: $USER_NAME"
echo "   • Groupe Docker: ✅"
echo "   • Sudo: ✅"
echo
echo "🔐 SÉCURITÉ :"
echo "   • Firewall UFW: ✅ Activé"
echo "   • Fail2Ban: ✅ Activé"
echo "   • SSH sécurisé: ✅"
echo
echo "📋 PROCHAINES ÉTAPES :"
echo "   1. 🔄 Changez d'utilisateur: sudo su - $USER_NAME"
echo "   2. 📥 Clonez votre repo: git clone https://github.com/VOTRE-REPO/tagadou.git ."
echo "   3. ⚙️  Configurez .env avec vos vraies valeurs"
echo "   4. 🚀 Lancez: ./post-install.sh"
echo "   5. 🌐 Configurez DNS: $DOMAIN → $(curl -s ifconfig.me 2>/dev/null)"
echo
echo "🔧 COMMANDES UTILES :"
echo "   • Statut services: docker compose ps"
echo "   • Logs temps réel: docker compose logs -f"
echo "   • Monitoring: systemctl status tagadou-monitor"
echo "   • Backups: ls -la /opt/tagadou-backups/"
echo
echo "=================================================="

# Messages finaux
log "✅ Installation VPS terminée avec succès !"
warning "🔄 Redémarrage recommandé dans 5 minutes..."
info "📧 Consultez les logs dans /var/log/tagadou/"

exit 0


