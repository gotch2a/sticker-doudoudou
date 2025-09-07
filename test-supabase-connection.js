// Script de test de connexion Supabase
// Exécuter avec: node test-supabase-connection.js

const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

async function testSupabaseConnection() {
  console.log('🔍 Test de connexion Supabase...')
  console.log('=====================================')
  
  // Vérifier les variables d'environnement
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  console.log('📋 Configuration:')
  console.log(`- URL: ${supabaseUrl ? '✅ Configurée' : '❌ Manquante'}`)
  console.log(`- Clé: ${supabaseKey ? '✅ Configurée' : '❌ Manquante'}`)
  
  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ Variables d\'environnement manquantes')
    return
  }
  
  // Créer le client Supabase
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  try {
    // Test 1: Connexion de base
    console.log('\n📊 Test 1: Connexion de base...')
    const { data, error } = await supabase
      .from('orders')
      .select('id')
      .limit(1)
    
    if (error) {
      console.log(`❌ Test 1 échoué: ${error.message} (Code: ${error.code})`)
      console.log('📋 Détails de l\'erreur:', error)
      return
    }
    
    console.log('✅ Test 1 réussi - Connexion établie')
    
    // Test 2: Comptage des enregistrements
    console.log('\n📊 Test 2: Comptage des enregistrements...')
    const { count, error: countError } = await supabase
      .from('orders')
      .select('*', { count: 'exact', head: true })
    
    if (countError) {
      console.log(`❌ Test 2 échoué: ${countError.message}`)
      return
    }
    
    console.log(`✅ Test 2 réussi - ${count} commandes trouvées`)
    
    // Test 3: Vérification des autres tables
    console.log('\n📊 Test 3: Vérification des autres tables...')
    const tables = ['articles', 'admin_notes', 'discount_codes']
    
    for (const tableName of tables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('id')
          .limit(1)
        
        if (error) {
          console.log(`⚠️ Table ${tableName}: ${error.message}`)
        } else {
          console.log(`✅ Table ${tableName}: Accessible`)
        }
      } catch (err) {
        console.log(`❌ Table ${tableName}: Erreur - ${err.message}`)
      }
    }
    
    console.log('\n✅ Test de connexion terminé avec succès!')
    console.log('🎯 Votre page admin devrait maintenant fonctionner')
    
  } catch (error) {
    console.log('❌ Erreur générale:', error.message)
    console.log('📋 Stack trace:', error.stack)
  }
}

// Exécuter le test
testSupabaseConnection().catch(console.error)
