#!/bin/bash

echo "🎨 Configuration Sticker DOUDOU MVP"
echo "=================================="

# Vérifier si .env.local existe
if [ ! -f .env.local ]; then
    echo "📝 Création du fichier .env.local..."
    cp env.example .env.local
    echo "✅ Fichier .env.local créé"
    echo ""
    echo "⚠️  IMPORTANT: Éditez .env.local avec vos vraies clés :"
    echo "   - STRIPE_SECRET_KEY"
    echo "   - SMTP_USER et SMTP_PASS"
    echo "   - ARTIST_EMAIL"
    echo ""
else
    echo "✅ .env.local existe déjà"
fi

# Créer les dossiers nécessaires
echo "📁 Création des dossiers..."
mkdir -p uploads/photos
mkdir -p uploads/temp
echo "✅ Dossiers créés"

# Installation des dépendances si nécessaire
if [ ! -d node_modules ]; then
    echo "📦 Installation des dépendances..."
    npm install
    echo "✅ Dépendances installées"
else
    echo "✅ Dépendances déjà installées"
fi

echo ""
echo "🚀 Setup terminé !"
echo ""
echo "Prochaines étapes :"
echo "1. Éditez .env.local avec vos clés"
echo "2. npm run dev"
echo "3. Ouvrez http://localhost:3000"
echo ""
echo "Pour tester les paiements :"
echo "- Carte test : 4242 4242 4242 4242"
echo "- Date : n'importe quelle date future"
echo "- CVC : n'importe quel 3 chiffres"
