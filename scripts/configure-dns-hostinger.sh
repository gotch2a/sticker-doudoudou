#!/bin/bash
# 🌐 CONFIGURATION DNS AUTOMATIQUE - TAGADOU.FR
# Script pour configurer automatiquement le DNS sur Hostinger
# Usage: ./configure-dns-hostinger.sh DOMAIN_NAME VPS_IP

set -e

DOMAIN=${1:-tagadou.fr}
VPS_IP=${2:-$(curl -s ifconfig.me)}

# Couleurs
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

log() { echo -e "${GREEN}[DNS]${NC} $1"; }
warning() { echo -e "${YELLOW}[DNS]${NC} $1"; }
error() { echo -e "${RED}[DNS]${NC} $1"; }
info() { echo -e "${BLUE}[DNS]${NC} $1"; }

clear
echo "=================================================="
echo "🌐 CONFIGURATION DNS TAGADOU.FR"
echo "=================================================="
echo
log "Domaine: $DOMAIN"
log "IP VPS: $VPS_IP"
echo

# Vérification IP
if [[ ! $VPS_IP =~ ^[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}$ ]]; then
    error "IP invalide: $VPS_IP"
    exit 1
fi

log "📋 CONFIGURATION DNS RECOMMANDÉE"
echo
echo "┌─────────────────────────────────────────────┐"
echo "│ ENREGISTREMENTS DNS À CRÉER                 │"
echo "├─────────────────────────────────────────────┤"
echo "│ Type    │ Nom    │ Valeur         │ TTL    │"
echo "├─────────────────────────────────────────────┤"
echo "│ A       │ @      │ $VPS_IP       │ 3600   │"
echo "│ A       │ www    │ $VPS_IP       │ 3600   │"
echo "│ CNAME   │ api    │ $DOMAIN       │ 3600   │"
echo "│ MX      │ @      │ mail.$DOMAIN  │ 3600   │"
echo "│ TXT     │ @      │ (voir below)  │ 3600   │"
echo "└─────────────────────────────────────────────┘"
echo

# Configuration automatique si MCP Hostinger disponible
if command -v mcp &> /dev/null; then
    log "🤖 Tentative configuration automatique via MCP..."
    
    # Configuration JSON pour les enregistrements DNS
    cat > /tmp/dns-config.json << EOF
{
    "zone": [
        {
            "name": "@",
            "type": "A",
            "records": [{"content": "$VPS_IP"}],
            "ttl": 3600
        },
        {
            "name": "www",
            "type": "A", 
            "records": [{"content": "$VPS_IP"}],
            "ttl": 3600
        },
        {
            "name": "api",
            "type": "CNAME",
            "records": [{"content": "$DOMAIN"}],
            "ttl": 3600
        }
    ]
}
EOF

    info "Configuration DNS générée dans /tmp/dns-config.json"
else
    warning "MCP Hostinger non disponible - configuration manuelle requise"
fi

echo
log "📋 GUIDE CONFIGURATION MANUELLE"
echo

if [[ $DOMAIN == "tagadou.fr" ]]; then
    echo "🇫🇷 DOMAINE .FR - Registrar probable: OVH, Gandi, Hostinger"
    echo
    echo "📍 SI CHEZ HOSTINGER:"
    echo "   1. hPanel → Domaines → Gérer"
    echo "   2. DNS/Nameservers → DNS Zone Editor"
    echo "   3. Ajoutez les enregistrements ci-dessus"
    echo
    echo "📍 SI CHEZ UN AUTRE REGISTRAR (OVH, Gandi, etc.):"
    echo "   Option 1 - Modifier les DNS:"
    echo "   1. Interface registrar → Gestion DNS"
    echo "   2. Ajoutez les enregistrements A et CNAME"
    echo
    echo "   Option 2 - Transférer chez Hostinger:"
    echo "   1. Demander code de transfert au registrar actuel"
    echo "   2. hPanel → Domaines → Transfert"
    echo "   3. Suivre la procédure (5-7 jours)"
fi

echo
log "🔧 COMMANDES DE VÉRIFICATION"
echo

# Génération script de vérification
cat > /tmp/verify-dns.sh << 'EOF'
#!/bin/bash
DOMAIN=$1
VPS_IP=$2

echo "🔍 VÉRIFICATION DNS POUR $DOMAIN"
echo "================================="

echo
echo "📋 Test résolution DNS:"
echo "nslookup $DOMAIN"
nslookup $DOMAIN 2>/dev/null | grep -A2 "Non-authoritative answer:" || echo "❌ DNS non résolu"

echo
echo "📋 Test dig:"
echo "dig $DOMAIN +short"
dig $DOMAIN +short 2>/dev/null || echo "❌ dig échoué"

echo
echo "📋 Test www:"
echo "nslookup www.$DOMAIN"
nslookup www.$DOMAIN 2>/dev/null | grep -A2 "Non-authoritative answer:" || echo "❌ www non résolu"

echo
echo "📋 Test propagation mondiale:"
echo "Vérifiez manuellement: https://www.whatsmydns.net/#A/$DOMAIN"

echo
echo "📋 Test HTTP:"
if curl -I --connect-timeout 5 "http://$DOMAIN" 2>/dev/null | head -1; then
    echo "✅ HTTP accessible"
else
    echo "❌ HTTP non accessible (normal pendant la propagation)"
fi

echo
echo "📋 Test HTTPS:"
if curl -I --connect-timeout 5 "https://$DOMAIN" 2>/dev/null | head -1; then
    echo "✅ HTTPS accessible"
else
    echo "❌ HTTPS non accessible (normal, SSL se configure après DNS)"
fi

echo
echo "🕐 TEMPS D'ATTENTE TYPIQUES:"
echo "   • DNS interne: 0-10 minutes"
echo "   • Propagation mondiale: 0-24 heures (souvent 1-2h)"
echo "   • SSL Let's Encrypt: 2-5 minutes après propagation DNS"
EOF

chmod +x /tmp/verify-dns.sh

echo "Script de vérification créé: /tmp/verify-dns.sh"
echo "Usage: /tmp/verify-dns.sh $DOMAIN $VPS_IP"

echo
log "⏰ DÉLAIS DE PROPAGATION"
echo
echo "┌─────────────────────────────────────┐"
echo "│ TYPE                │ DÉLAI         │"
echo "├─────────────────────────────────────┤"
echo "│ DNS local           │ 0-10 minutes  │"
echo "│ Propagation globale │ 1-24 heures   │"
echo "│ SSL Let's Encrypt   │ 2-5 minutes   │"
echo "│ Cache navigateur    │ 5-30 minutes  │"
echo "└─────────────────────────────────────┘"

echo
warning "⚠️  POINTS IMPORTANTS:"
echo "   • Attendez la propagation DNS avant de tester HTTPS"
echo "   • Videz le cache navigateur si problème d'affichage"
echo "   • SSL se configure automatiquement après propagation DNS"
echo "   • En cas de problème, vérifiez d'abord les DNS"

echo
log "🔍 VÉRIFICATION EN TEMPS RÉEL"
echo
echo "1. Test DNS immédiat:"
echo "   nslookup $DOMAIN"
echo
echo "2. Propagation mondiale:"
echo "   https://www.whatsmydns.net/#A/$DOMAIN"
echo
echo "3. Test depuis le VPS:"
echo "   curl -I http://$DOMAIN"

echo
info "💡 CONSEIL: Sauvegardez cette configuration DNS"
cat > "$HOME/dns-config-$DOMAIN.txt" << EOF
# Configuration DNS pour $DOMAIN
# Date: $(date)
# VPS IP: $VPS_IP

Enregistrements DNS:
- A @ $VPS_IP (TTL: 3600)
- A www $VPS_IP (TTL: 3600)  
- CNAME api $DOMAIN (TTL: 3600)

Vérifications:
- nslookup $DOMAIN
- https://www.whatsmydns.net/#A/$DOMAIN
- curl -I http://$DOMAIN

Fait le: $(date)
EOF

log "Configuration sauvegardée: $HOME/dns-config-$DOMAIN.txt"

echo
echo "=================================================="
echo "✅ CONFIGURATION DNS PRÉPARÉE !"
echo "=================================================="
echo
echo "📋 PROCHAINES ÉTAPES:"
echo "   1. 🌐 Configurer DNS chez votre registrar"
echo "   2. ⏰ Attendre propagation (1-2h en général)"
echo "   3. 🔍 Vérifier: /tmp/verify-dns.sh $DOMAIN $VPS_IP"
echo "   4. 🚀 Lancer déploiement TagaDou"
echo
echo "🔗 LIENS UTILES:"
echo "   • Test propagation: https://www.whatsmydns.net"
echo "   • Test SSL: https://www.ssllabs.com/ssltest"
echo "   • Ping test: https://tools.pingdom.com"

exit 0

