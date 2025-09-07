#!/bin/bash

# Script de configuration de l'environnement pour Sticker DOUDOU
# Ce script crée le fichier .env.local nécessaire au fonctionnement de l'application

echo "🚀 Configuration de l'environnement Sticker DOUDOU"
echo "=================================================="

# Vérifier si .env.local existe déjà
if [ -f ".env.local" ]; then
    echo "⚠️  Le fichier .env.local existe déjà."
    read -p "Voulez-vous le remplacer ? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Configuration annulée."
        exit 1
    fi
fi

# Copier env.example vers .env.local
if [ -f "env.example" ]; then
    cp env.example .env.local
    echo "✅ Fichier .env.local créé depuis env.example"
else
    echo "❌ Fichier env.example non trouvé!"
    exit 1
fi

# Vérifier que Next.js peut accéder aux variables
echo ""
echo "🔍 Vérification de la configuration..."
echo "- NEXT_PUBLIC_SUPABASE_URL: $(grep NEXT_PUBLIC_SUPABASE_URL .env.local | cut -d'=' -f2)"
echo "- NEXT_PUBLIC_SUPABASE_ANON_KEY: $(grep NEXT_PUBLIC_SUPABASE_ANON_KEY .env.local | cut -d'=' -f2 | cut -c1-20)..."

echo ""
echo "✅ Configuration terminée!"
echo ""
echo "📋 Prochaines étapes:"
echo "1. Redémarrez le serveur avec: npm run dev"
echo "2. Visitez http://localhost:3000/admin"
echo "3. La page admin devrait maintenant se charger correctement"
echo ""
echo "💡 Si vous avez des erreurs de connexion Supabase, vérifiez:"
echo "   - Que votre projet Supabase est actif"
echo "   - Que les clés dans .env.local sont correctes"
echo "   - Que les tables nécessaires existent dans Supabase"
