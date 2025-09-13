#!/bin/bash
# 🔧 Script d'installation MCP Hostinger automatique - VERSION CORRIGÉE
# Usage: ./setup-mcp-local-fixed.sh VOTRE_TOKEN_API

set -e

TOKEN="$1"

if [ -z "$TOKEN" ]; then
    echo "❌ Usage: ./setup-mcp-local-fixed.sh VOTRE_TOKEN_API_HOSTINGER"
    echo "💡 Obtenez votre token sur : https://hpanel.hostinger.com → VPS → API Management"
    exit 1
fi

echo "🚀 Configuration MCP Hostinger (Version corrigée)..."

# 1. Sauvegarde de la configuration existante
echo "💾 Sauvegarde configuration existante..."
if [ -f ~/.cursor/mcp.json ]; then
    cp ~/.cursor/mcp.json ~/.cursor/mcp.json.backup.$(date +%Y%m%d_%H%M%S)
    echo "✅ Sauvegarde créée : ~/.cursor/mcp.json.backup.*"
fi

# 2. Installation du package MCP Hostinger si nécessaire
echo "📦 Vérification installation hostinger-api-mcp..."
if ! command -v hostinger-api-mcp &> /dev/null; then
    echo "📦 Installation hostinger-api-mcp..."
    npm install -g hostinger-api-mcp
else
    echo "✅ hostinger-api-mcp déjà installé"
fi

# 3. Mise à jour de la configuration MCP existante
echo "⚙️ Mise à jour configuration MCP..."

# Utiliser un script Python pour modifier le JSON proprement
cat > /tmp/update_mcp.py << 'EOL'
import json
import sys
import os

token = sys.argv[1]
config_file = os.path.expanduser("~/.cursor/mcp.json")

# Lire la configuration existante
if os.path.exists(config_file):
    with open(config_file, 'r') as f:
        config = json.load(f)
else:
    config = {"mcpServers": {}}

# Mettre à jour la configuration Hostinger (supprimer les doublons d'abord)
if "hostinger" in config["mcpServers"]:
    del config["mcpServers"]["hostinger"]
if "hostinger-api" in config["mcpServers"]:
    del config["mcpServers"]["hostinger-api"]

# Ajouter la nouvelle configuration Hostinger optimisée
config["mcpServers"]["hostinger-api"] = {
    "command": "hostinger-api-mcp",
    "env": {
        "HOSTINGER_API_TOKEN": token,
        "DEBUG": "false"
    },
    "args": []
}

# Sauvegarder la configuration mise à jour
os.makedirs(os.path.dirname(config_file), exist_ok=True)
with open(config_file, 'w') as f:
    json.dump(config, f, indent=2)

print("✅ Configuration MCP mise à jour avec succès")
EOL

python3 /tmp/update_mcp.py "$TOKEN"
rm /tmp/update_mcp.py

# 4. Test de validation du token
echo "🧪 Test de validation du token API..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" \
    -H "Authorization: Bearer $TOKEN" \
    "https://api.hostinger.com/v1/vps/virtual-machines")

if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ Token API valide - Connexion établie !"
elif [ "$HTTP_CODE" = "401" ]; then
    echo "❌ Token API invalide ou expiré"
    echo "💡 Vérifiez votre token sur https://hpanel.hostinger.com"
    exit 1
else
    echo "⚠️ Réponse inattendue (Code: $HTTP_CODE)"
    echo "💡 Le token pourrait fonctionner, testez dans Cursor"
fi

# 5. Affichage de la configuration finale
echo ""
echo "=============================================="
echo "🎉 CONFIGURATION MCP HOSTINGER TERMINÉE !"
echo "=============================================="
echo ""
echo "📁 Fichier configuré : ~/.cursor/mcp.json"
echo "🔑 Token configuré : ${TOKEN:0:8}..."
echo "💾 Sauvegarde : ~/.cursor/mcp.json.backup.*"
echo ""
echo "📋 PROCHAINES ÉTAPES :"
echo "   1. 🔄 Redémarrez Cursor complètement"
echo "   2. 🔧 Vérifiez : Cursor → View → Command Palette → 'MCP'"
echo "   3. 🧪 Testez avec : 'vérifier MCP Hostinger'"
echo ""
echo "🔍 DEBUG - Si problème :"
echo "   • Vérifiez ~/.cursor/mcp.json"
echo "   • Consultez les logs Cursor : Help → Show Logs"
echo "   • Token visible sur hpanel.hostinger.com → VPS → API"
echo ""
echo "🚀 PRÊT POUR LE DÉPLOIEMENT AUTOMATIQUE !"
echo "=============================================="

