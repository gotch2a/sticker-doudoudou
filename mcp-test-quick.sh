#!/bin/bash
# 🚀 Test rapide MCP Hostinger après configuration
# Usage: ./mcp-test-quick.sh

echo "🧪 Test rapide de la configuration MCP Hostinger..."

# 1. Vérifier que le fichier mcp.json existe
if [ ! -f ~/.cursor/mcp.json ]; then
    echo "❌ Fichier ~/.cursor/mcp.json introuvable"
    echo "💡 Lancez d'abord: ./setup-mcp-local-fixed.sh VOTRE_TOKEN"
    exit 1
fi

# 2. Vérifier que la configuration Hostinger existe
if ! grep -q "hostinger-api" ~/.cursor/mcp.json; then
    echo "❌ Configuration hostinger-api introuvable dans mcp.json"
    exit 1
fi

# 3. Extraire le token configuré
TOKEN=$(grep -A 3 -B 1 "HOSTINGER_API_TOKEN" ~/.cursor/mcp.json | grep -o '"[^"]*"$' | tr -d '"')

if [ -z "$TOKEN" ] || [ "$TOKEN" = "" ]; then
    echo "❌ Token Hostinger vide dans la configuration"
    echo "💡 Éditez ~/.cursor/mcp.json ou relancez setup-mcp-local-fixed.sh"
    exit 1
fi

echo "🔑 Token trouvé: ${TOKEN:0:8}..."

# 4. Test API rapide
echo "📡 Test de connexion API..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: Bearer $TOKEN" \
    "https://api.hostinger.com/v1/vps/virtual-machines")

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ API Hostinger : FONCTIONNELLE !"
    echo "🎉 MCP Hostinger prêt pour l'automatisation"
    echo ""
    echo "📋 Prochaines étapes :"
    echo "   1. Redémarrez Cursor complètement"
    echo "   2. Testez: demandez 'liste mes VPS Hostinger'"
    echo "   3. Lancez le déploiement automatique !"
elif [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "403" ]; then
    echo "❌ Token invalide ou expiré (Code: $HTTP_CODE)"
    echo "💡 Générez un nouveau token sur hpanel.hostinger.com"
    echo "   → VPS → API Management → Create new token"
else
    echo "⚠️ Réponse inattendue (Code: $HTTP_CODE)"
    echo "💡 Vérifiez votre connexion internet et réessayez"
fi

