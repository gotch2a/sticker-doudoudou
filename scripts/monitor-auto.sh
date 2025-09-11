#!/bin/bash
# 🔍 MONITORING AUTOMATIQUE 24/7 TAGADOU.FR
# Ce script surveille et corrige automatiquement les problèmes

set -e

# Configuration
SITE_URL="https://tagadou.fr"
LOG_FILE="/var/log/tagadou-monitor.log"
PID_FILE="/var/run/tagadou-monitor.pid"
CHECK_INTERVAL=60  # secondes
MAX_RESPONSE_TIME=3.0  # secondes
MAX_DISK_USAGE=85  # pourcentage
MAX_CPU_USAGE=80   # pourcentage
MAX_MEMORY_USAGE=85  # pourcentage

# Couleurs pour logs
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Création du fichier PID
echo $$ > $PID_FILE

# Functions utilitaires
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a $LOG_FILE
}

warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] ⚠️${NC} $1" | tee -a $LOG_FILE
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ❌${NC} $1" | tee -a $LOG_FILE
}

critical() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] 🚨 CRITIQUE:${NC} $1" | tee -a $LOG_FILE
    send_alert "$1"
}

# Function notification critique
send_alert() {
    local message="$1"
    
    # Email alert
    if [ -n "$ALERT_EMAIL" ] && [ -n "$RESEND_API_KEY" ]; then
        curl -X POST "https://api.resend.com/emails" \
            -H "Authorization: Bearer $RESEND_API_KEY" \
            -H "Content-Type: application/json" \
            -d "{
                \"from\": \"alerts@tagadou.fr\",
                \"to\": [\"$ALERT_EMAIL\"],
                \"subject\": \"🚨 ALERTE TAGADOU.FR - Action requise\",
                \"html\": \"<h2 style='color: red;'>🚨 ALERTE CRITIQUE</h2><p><strong>Message:</strong> $message</p><p><strong>Timestamp:</strong> $(date)</p><p><strong>Serveur:</strong> $(hostname)</p>\"
            }" > /dev/null 2>&1
    fi
    
    # SMS alert (via service tiers)
    if [ -n "$SMS_WEBHOOK" ]; then
        curl -X POST "$SMS_WEBHOOK" \
            -d "message=🚨 TAGADOU.FR: $message" > /dev/null 2>&1
    fi
}

# Function check site uptime
check_uptime() {
    local start_time=$(date +%s.%N)
    
    if curl -f -s --max-time 10 "$SITE_URL" > /dev/null 2>&1; then
        local end_time=$(date +%s.%N)
        local response_time=$(echo "$end_time - $start_time" | bc)
        
        echo $response_time
        return 0
    else
        return 1
    fi
}

# Function check API health
check_api_health() {
    local endpoints=(
        "/api/health"
        "/api/products"
        "/api/orders"
    )
    
    for endpoint in "${endpoints[@]}"; do
        if ! curl -f -s --max-time 5 "$SITE_URL$endpoint" > /dev/null 2>&1; then
            warning "API endpoint $endpoint non disponible"
            return 1
        fi
    done
    
    return 0
}

# Function check système resources
check_system_resources() {
    # CPU Usage
    local cpu_usage=$(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | cut -d'%' -f1 | cut -d',' -f1)
    
    # Memory Usage
    local memory_info=$(free | grep Mem)
    local memory_total=$(echo $memory_info | awk '{print $2}')
    local memory_used=$(echo $memory_info | awk '{print $3}')
    local memory_usage=$(echo "scale=2; $memory_used * 100 / $memory_total" | bc)
    
    # Disk Usage
    local disk_usage=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
    
    echo "$cpu_usage,$memory_usage,$disk_usage"
}

# Function auto-correction
auto_fix_issue() {
    local issue_type="$1"
    local severity="$2"
    
    case $issue_type in
        "site_down")
            critical "Site inaccessible - Redémarrage automatique des services"
            docker-compose restart
            sleep 60
            
            # Second check
            if ! check_uptime > /dev/null; then
                critical "Site toujours down après redémarrage - Rollback automatique"
                cd /opt/tagadou
                ./deploy-auto.sh main production
            fi
            ;;
            
        "slow_response")
            warning "Performance dégradée - Optimisation automatique"
            
            # Redémarrage services
            docker-compose restart app
            
            # Nettoyage cache
            docker exec tagadou-app npm run cache:clear 2>/dev/null || true
            
            # Nettoyage système
            docker system prune -f > /dev/null 2>&1
            ;;
            
        "high_cpu")
            warning "CPU élevé - Optimisation automatique"
            
            # Identification processus gourmands
            ps aux --sort=-pcpu | head -10 >> $LOG_FILE
            
            # Redémarrage si critique
            if [ "$severity" = "critical" ]; then
                docker-compose restart
            fi
            ;;
            
        "high_memory")
            warning "Mémoire élevée - Nettoyage automatique"
            
            # Nettoyage cache système
            sync && echo 3 > /proc/sys/vm/drop_caches
            
            # Redémarrage si critique
            if [ "$severity" = "critical" ]; then
                docker-compose restart
            fi
            ;;
            
        "high_disk")
            warning "Espace disque élevé - Nettoyage automatique"
            
            # Nettoyage logs anciens
            find /var/log -name "*.log" -mtime +7 -exec rm {} \;
            
            # Nettoyage Docker
            docker system prune -af > /dev/null 2>&1
            
            # Nettoyage backups anciens (garde 5 derniers)
            cd /opt/tagadou-backups
            ls -t | tail -n +6 | xargs -r rm -rf
            ;;
            
        "api_error")
            warning "Erreur API - Redémarrage service"
            docker-compose restart app
            ;;
    esac
}

# Function génération métriques
generate_metrics() {
    local timestamp=$(date +%s)
    local uptime_status="0"
    local response_time="0"
    
    # Check uptime et response time
    if response_time=$(check_uptime); then
        uptime_status="1"
        log "✅ Site accessible (${response_time}s)"
    else
        uptime_status="0"
        error "Site inaccessible"
        auto_fix_issue "site_down" "critical"
    fi
    
    # Check API
    local api_status="0"
    if check_api_health; then
        api_status="1"
    else
        api_status="0"
        warning "API partiellement indisponible"
        auto_fix_issue "api_error" "medium"
    fi
    
    # System resources
    local resources=$(check_system_resources)
    IFS=',' read -r cpu_usage memory_usage disk_usage <<< "$resources"
    
    # Vérification seuils et auto-correction
    if (( $(echo "$response_time > $MAX_RESPONSE_TIME" | bc -l) )) && [ "$uptime_status" = "1" ]; then
        warning "Temps de réponse élevé: ${response_time}s"
        auto_fix_issue "slow_response" "medium"
    fi
    
    if (( $(echo "$cpu_usage > $MAX_CPU_USAGE" | bc -l) )); then
        warning "CPU usage élevé: ${cpu_usage}%"
        if (( $(echo "$cpu_usage > 90" | bc -l) )); then
            auto_fix_issue "high_cpu" "critical"
        else
            auto_fix_issue "high_cpu" "medium"
        fi
    fi
    
    if (( $(echo "$memory_usage > $MAX_MEMORY_USAGE" | bc -l) )); then
        warning "Memory usage élevé: ${memory_usage}%"
        if (( $(echo "$memory_usage > 95" | bc -l) )); then
            auto_fix_issue "high_memory" "critical"
        else
            auto_fix_issue "high_memory" "medium"
        fi
    fi
    
    if [ "$disk_usage" -gt "$MAX_DISK_USAGE" ]; then
        warning "Disk usage élevé: ${disk_usage}%"
        if [ "$disk_usage" -gt 95 ]; then
            auto_fix_issue "high_disk" "critical"
        else
            auto_fix_issue "high_disk" "medium"
        fi
    fi
    
    # Sauvegarde métriques pour dashboard
    echo "$timestamp,$uptime_status,$response_time,$api_status,$cpu_usage,$memory_usage,$disk_usage" >> /tmp/tagadou-metrics.csv
    
    # Garde seulement dernières 1440 entrées (24h à 1 minute d'intervalle)
    tail -n 1440 /tmp/tagadou-metrics.csv > /tmp/tagadou-metrics-temp.csv
    mv /tmp/tagadou-metrics-temp.csv /tmp/tagadou-metrics.csv
}

# Function check sécurité
check_security() {
    # Check certificat SSL
    local ssl_expiry=$(echo | openssl s_client -servername tagadou.fr -connect tagadou.fr:443 2>/dev/null | openssl x509 -noout -dates | grep notAfter | cut -d= -f2)
    local ssl_expiry_timestamp=$(date -d "$ssl_expiry" +%s)
    local current_timestamp=$(date +%s)
    local days_until_expiry=$(( (ssl_expiry_timestamp - current_timestamp) / 86400 ))
    
    if [ $days_until_expiry -lt 30 ]; then
        warning "Certificat SSL expire dans $days_until_expiry jours"
        
        if [ $days_until_expiry -lt 7 ]; then
            critical "Certificat SSL expire dans $days_until_expiry jours - Renouvellement urgent requis"
        fi
    fi
    
    # Check tentatives d'intrusion
    local failed_logins=$(grep "Failed password" /var/log/auth.log | grep "$(date +%b\ %d)" | wc -l)
    if [ $failed_logins -gt 50 ]; then
        warning "$failed_logins tentatives de connexion échouées aujourd'hui"
        
        if [ $failed_logins -gt 100 ]; then
            critical "Possible attaque brute force détectée - $failed_logins tentatives"
        fi
    fi
}

# Function rapport quotidien
daily_report() {
    local current_hour=$(date +%H)
    
    if [ "$current_hour" = "08" ]; then  # 8h du matin
        log "📊 Génération rapport quotidien..."
        
        # Calcul uptime 24h
        local uptime_24h=$(tail -n 1440 /tmp/tagadou-metrics.csv | awk -F',' '$2==1' | wc -l)
        local uptime_percentage=$(echo "scale=2; $uptime_24h * 100 / 1440" | bc)
        
        # Temps de réponse moyen 24h
        local avg_response_time=$(tail -n 1440 /tmp/tagadou-metrics.csv | awk -F',' '$2==1 {sum+=$3; count++} END {if(count>0) print sum/count; else print 0}')
        
        # Rapport par email
        if [ -n "$REPORT_EMAIL" ] && [ -n "$RESEND_API_KEY" ]; then
            curl -X POST "https://api.resend.com/emails" \
                -H "Authorization: Bearer $RESEND_API_KEY" \
                -H "Content-Type: application/json" \
                -d "{
                    \"from\": \"reports@tagadou.fr\",
                    \"to\": [\"$REPORT_EMAIL\"],
                    \"subject\": \"📊 Rapport quotidien TAGADOU.FR - $(date +%d/%m/%Y)\",
                    \"html\": \"<h2>📊 Rapport quotidien TAGADOU.FR</h2><h3>📈 Métriques 24h</h3><ul><li><strong>Uptime:</strong> ${uptime_percentage}%</li><li><strong>Temps réponse moyen:</strong> ${avg_response_time}s</li><li><strong>Incidents:</strong> $(grep -c '❌\|🚨' $LOG_FILE || echo 0)</li></ul><p><small>Généré automatiquement le $(date)</small></p>\"
                }" > /dev/null 2>&1
        fi
    fi
}

# Trap pour nettoyage à l'arrêt
cleanup() {
    log "🛑 Arrêt monitoring automatique"
    rm -f $PID_FILE
    exit 0
}

trap cleanup SIGTERM SIGINT

# BOUCLE PRINCIPALE DE MONITORING
log "🚀 Démarrage monitoring automatique TAGADOU.FR"
log "⚙️ Intervalle: ${CHECK_INTERVAL}s | Max response time: ${MAX_RESPONSE_TIME}s"

while true; do
    # Génération métriques et auto-correction
    generate_metrics
    
    # Check sécurité (toutes les 10 minutes)
    if [ $(($(date +%s) % 600)) -eq 0 ]; then
        check_security
    fi
    
    # Rapport quotidien
    daily_report
    
    # Attente avant prochain check
    sleep $CHECK_INTERVAL
done
