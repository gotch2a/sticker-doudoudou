#!/bin/bash
# 🚀 SCRIPT DÉPLOIEMENT AUTOMATIQUE TAGADOU.FR
# Usage: ./deploy-auto.sh [branch] [environment]

set -e

# Configuration automatique
BRANCH=${1:-main}
DEPLOY_ENV=${2:-production}
PROJECT_DIR="/opt/tagadou"
BACKUP_DIR="/opt/tagadou-backups"
LOG_FILE="/var/log/tagadou-deploy.log"

# Couleurs pour logs
RED='\033[0;31m'
GREEN='\033[0;32m'  
YELLOW='\033[1;33m'
NC='\033[0m'

# Function logging
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a $LOG_FILE
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" | tee -a $LOG_FILE
}

warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1" | tee -a $LOG_FILE
}

# Function backup automatique
create_backup() {
    log "📦 Création backup automatique..."
    BACKUP_NAME="tagadou-backup-$(date +%Y%m%d-%H%M%S)"
    
    # Backup code
    cp -r $PROJECT_DIR $BACKUP_DIR/$BACKUP_NAME
    
    # Backup database (si locale)
    if [ -f "$PROJECT_DIR/database.db" ]; then
        cp $PROJECT_DIR/database.db $BACKUP_DIR/$BACKUP_NAME/
    fi
    
    # Backup uploads
    if [ -d "$PROJECT_DIR/uploads" ]; then
        cp -r $PROJECT_DIR/uploads $BACKUP_DIR/$BACKUP_NAME/
    fi
    
    log "✅ Backup créé: $BACKUP_NAME"
}

# Function rollback automatique
rollback() {
    error "🔄 Déclenchement rollback automatique..."
    
    # Trouver le dernier backup
    LAST_BACKUP=$(ls -t $BACKUP_DIR/ | head -n1)
    
    if [ -n "$LAST_BACKUP" ]; then
        log "📁 Restauration depuis: $LAST_BACKUP"
        
        # Arrêt services
        docker-compose down
        
        # Restauration code
        rm -rf $PROJECT_DIR/*
        cp -r $BACKUP_DIR/$LAST_BACKUP/* $PROJECT_DIR/
        
        # Redémarrage
        docker-compose up -d
        
        log "✅ Rollback terminé"
    else
        error "❌ Aucun backup trouvé pour rollback"
        exit 1
    fi
}

# Function health check
health_check() {
    log "🏥 Health check en cours..."
    
    for i in {1..10}; do
        if curl -f -s https://tagadou.fr/api/health > /dev/null 2>&1; then
            log "✅ Health check réussi"
            return 0
        fi
        
        warning "⏳ Tentative $i/10 - En attente..."
        sleep 30
    done
    
    error "❌ Health check échoué après 10 tentatives"
    return 1
}

# Function notification
send_notification() {
    local status=$1
    local message=$2
    
    # Email notification
    if [ -n "$NOTIFICATION_EMAIL" ] && [ -n "$RESEND_API_KEY" ]; then
        curl -X POST "https://api.resend.com/emails" \
            -H "Authorization: Bearer $RESEND_API_KEY" \
            -H "Content-Type: application/json" \
            -d "{
                \"from\": \"deploy@tagadou.fr\",
                \"to\": [\"$NOTIFICATION_EMAIL\"],
                \"subject\": \"$status Déploiement TAGADOU.FR\",
                \"html\": \"<h2>$status</h2><p>$message</p><p>Version: $(git rev-parse --short HEAD)</p><p>Timestamp: $(date)</p>\"
            }" > /dev/null 2>&1
    fi
    
    # Webhook notification (Slack, Discord, etc.)
    if [ -n "$WEBHOOK_URL" ]; then
        curl -X POST "$WEBHOOK_URL" \
            -H "Content-Type: application/json" \
            -d "{\"text\": \"$status TAGADOU.FR: $message\"}" > /dev/null 2>&1
    fi
}

# DÉBUT DU DÉPLOIEMENT
log "🚀 DÉBUT DÉPLOIEMENT AUTOMATIQUE TAGADOU.FR"
log "📋 Branch: $BRANCH | Environment: $DEPLOY_ENV"

# 1. Vérification pré-requis
log "🔍 Vérification pré-requis..."
if ! command -v docker &> /dev/null; then
    error "Docker non installé"
    exit 1
fi

if ! command -v git &> /dev/null; then
    error "Git non installé"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    error "Node.js/npm non installé"
    exit 1
fi

# 2. Backup automatique
create_backup

# 3. Pull dernière version
log "📥 Récupération dernière version..."
cd $PROJECT_DIR

git fetch origin
git reset --hard origin/$BRANCH

# 4. Vérification des changements
CURRENT_COMMIT=$(git rev-parse HEAD)
log "📝 Version déployée: $CURRENT_COMMIT"

# 5. Installation dépendances
log "📦 Installation dépendances..."
npm ci --production=false

# 6. Build optimisé
log "🔨 Build de production..."
npm run build

# 7. Tests automatiques
if [ "$DEPLOY_ENV" = "production" ]; then
    log "🧪 Exécution tests..."
    
    # Tests unitaires
    if ! npm run test > /tmp/test-output.log 2>&1; then
        error "Tests unitaires échoués"
        cat /tmp/test-output.log
        rollback
        send_notification "❌" "Déploiement échoué - Tests unitaires"
        exit 1
    fi
    
    # Tests de build
    if ! npm run build > /tmp/build-output.log 2>&1; then
        error "Build échoué"
        cat /tmp/build-output.log
        rollback
        send_notification "❌" "Déploiement échoué - Build"
        exit 1
    fi
fi

# 8. Déploiement Docker
log "🐳 Déploiement Docker..."

# Arrêt services actuels
docker-compose down

# Build nouvelle image
docker-compose build --no-cache

# Démarrage services
docker-compose up -d

# 9. Health check automatique
log "⏳ Attente initialisation services..."
sleep 60

if ! health_check; then
    error "Health check échoué - Rollback automatique"
    rollback
    send_notification "❌" "Déploiement échoué - Health check"
    exit 1
fi

# 10. Tests post-déploiement
log "🔍 Tests post-déploiement..."

# Test page d'accueil
if ! curl -f -s https://tagadou.fr > /dev/null; then
    error "Page d'accueil inaccessible"
    rollback
    send_notification "❌" "Déploiement échoué - Page inaccessible"
    exit 1
fi

# Test API
if ! curl -f -s https://tagadou.fr/api/health > /dev/null; then
    error "API inaccessible"
    rollback
    send_notification "❌" "Déploiement échoué - API inaccessible"
    exit 1
fi

# 11. Nettoyage automatique
log "🧹 Nettoyage..."

# Suppression anciens backups (garde 10 derniers)
cd $BACKUP_DIR
ls -t | tail -n +11 | xargs -r rm -rf

# Nettoyage Docker
docker system prune -f > /dev/null 2>&1

# 12. Monitoring post-déploiement
log "📊 Activation monitoring..."

# Redémarrage monitoring si existe
if systemctl is-active --quiet tagadou-monitor; then
    systemctl restart tagadou-monitor
fi

# 13. Notification succès
log "✅ DÉPLOIEMENT RÉUSSI !"
send_notification "✅" "Déploiement réussi - Version $CURRENT_COMMIT"

# 14. Affichage informations finales
echo
echo "=================================================="
echo "🎉 TAGADOU.FR DÉPLOYÉ AVEC SUCCÈS !"
echo "=================================================="
echo "🌐 URL: https://tagadou.fr"
echo "📝 Version: $CURRENT_COMMIT"
echo "⏰ Durée: $SECONDS secondes"
echo "📊 Monitoring: http://tagadou.fr:3001 (si activé)"
echo "=================================================="

exit 0
