#!/bin/bash
# 🔧 Script d'installation MCP Hostinger automatique
# Usage: ./setup-mcp-local.sh VOTRE_TOKEN_API

set -e

TOKEN="$1"

if [ -z "$TOKEN" ]; then
    echo "❌ Usage: ./setup-mcp-local.sh VOTRE_TOKEN_API"
    exit 1
fi

echo "🚀 Installation MCP Hostinger..."

# 1. Installation NVM si pas présent
if ! command -v nvm &> /dev/null; then
    echo "📦 Installation NVM..."
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    source ~/.bashrc 2>/dev/null || source ~/.zshrc 2>/dev/null || true
fi

# 2. Installation Node.js 20
echo "📦 Installation Node.js 20..."
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm install 20
nvm use 20

# 3. Installation MCP Server Hostinger
echo "📦 Installation Hostinger MCP Server..."
npm install -g hostinger-api-mcp

# 4. Configuration pour Cursor
echo "⚙️ Configuration Cursor MCP..."
mkdir -p ~/.cursor

cat > ~/.cursor/mcp-config.json << EOF
{
  "mcpServers": {
    "hostinger-api": {
      "command": "hostinger-api-mcp",
      "env": {
        "DEBUG": "false",
        "APITOKEN": "$TOKEN"
      }
    }
  }
}
EOF

# 5. Test de connexion
echo "🧪 Test de connexion API..."
curl -H "Authorization: Bearer $TOKEN" \
     "https://api.hostinger.com/v1/domains" \
     -w "\n%{http_code}\n" \
     -s | tail -1 | grep -q "200" && echo "✅ Token API valide !" || echo "❌ Erreur token API"

echo "✅ MCP Hostinger configuré !"
echo "🔄 Redémarrez Cursor pour activer MCP"
echo
echo "📋 Prochaine étape :"
echo "   1. Redémarrer Cursor"
echo "   2. Vérifier MCP dans Cursor → Outils → MCP"
echo "   3. Me dire 'MCP activé' pour continuer"




