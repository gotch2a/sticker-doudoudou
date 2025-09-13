#!/bin/bash
# 🧪 Script de test rapide du token Hostinger
# Usage: ./test-hostinger-token.sh [TOKEN]

# Utiliser le token fourni en paramètre ou celui dans le fichier mcp.json
if [ -n "$1" ]; then
    TOKEN="$1"
else
    # Extraire le token du fichier mcp.json existant
    TOKEN=$(grep -o '"HOSTINGER_API_TOKEN": "[^"]*"' ~/.cursor/mcp.json | cut -d'"' -f4 | head -1)
fi

if [ -z "$TOKEN" ]; then
    echo "❌ Aucun token trouvé"
    echo "Usage: ./test-hostinger-token.sh VOTRE_TOKEN"
    exit 1
fi

echo "🧪 Test du token Hostinger : ${TOKEN:0:8}..."

# Test 1: Liste des VPS
echo "📋 Test 1: Liste des VPS..."
VPS_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "https://api.hostinger.com/v1/vps/virtual-machines")
VPS_CODE=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $TOKEN" "https://api.hostinger.com/v1/vps/virtual-machines")

# Test 2: Liste des domaines
echo "🌐 Test 2: Liste des domaines..."
DOMAINS_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "https://api.hostinger.com/v1/domains")
DOMAINS_CODE=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $TOKEN" "https://api.hostinger.com/v1/domains")

# Test 3: Centres de données
echo "🏢 Test 3: Centres de données..."
DC_RESPONSE=$(curl -s -H "Authorization: Bearer $TOKEN" "https://api.hostinger.com/v1/vps/data-centers")
DC_CODE=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $TOKEN" "https://api.hostinger.com/v1/vps/data-centers")

# Affichage des résultats
echo ""
echo "=============================================="
echo "📊 RÉSULTATS DU TEST"
echo "=============================================="

if [ "$VPS_CODE" = "200" ]; then
    echo "✅ VPS API : Fonctionnel (Code: $VPS_CODE)"
else
    echo "❌ VPS API : Erreur (Code: $VPS_CODE)"
    echo "   Réponse: $VPS_RESPONSE"
fi

if [ "$DOMAINS_CODE" = "200" ]; then
    echo "✅ Domaines API : Fonctionnel (Code: $DOMAINS_CODE)"
else
    echo "❌ Domaines API : Erreur (Code: $DOMAINS_CODE)"
    echo "   Réponse: $DOMAINS_RESPONSE"
fi

if [ "$DC_CODE" = "200" ]; then
    echo "✅ Centres données : Fonctionnel (Code: $DC_CODE)"
else
    echo "❌ Centres données : Erreur (Code: $DC_CODE)"
    echo "   Réponse: $DC_RESPONSE"
fi

echo "=============================================="

# Résultat global
if [ "$VPS_CODE" = "200" ] && [ "$DOMAINS_CODE" = "200" ] && [ "$DC_CODE" = "200" ]; then
    echo "🎉 TOKEN HOSTINGER ENTIÈREMENT FONCTIONNEL !"
    echo "🚀 Prêt pour le déploiement automatique"
elif [ "$VPS_CODE" = "200" ] || [ "$DOMAINS_CODE" = "200" ]; then
    echo "⚠️ Token partiellement fonctionnel"
    echo "💡 Vérifiez les permissions sur hpanel.hostinger.com"
else
    echo "❌ TOKEN NON FONCTIONNEL"
    echo "💡 Générez un nouveau token sur hpanel.hostinger.com → VPS → API Management"
fi

