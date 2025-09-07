'use client'

import { useState, useEffect } from 'react'

// VERSION ULTRA-SIMPLE POUR DIAGNOSTIC
export default function AdminSimplePage() {
  const [step, setStep] = useState(1)
  const [results, setResults] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const addResult = (message: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
    console.log(message)
  }

  const runDiagnostic = async () => {
    setLoading(true)
    setResults([])
    
    try {
      // ÉTAPE 1: Variables d'environnement
      setStep(1)
      addResult("🔍 ÉTAPE 1: Vérification variables d'environnement")
      
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      addResult(`URL Supabase: ${supabaseUrl ? '✅ Présente' : '❌ Manquante'}`)
      addResult(`Clé Supabase: ${supabaseKey ? '✅ Présente' : '❌ Manquante'}`)
      
      if (!supabaseUrl || !supabaseKey) {
        addResult("❌ ÉCHEC ÉTAPE 1: Variables manquantes")
        return
      }
      
      addResult("✅ ÉTAPE 1 RÉUSSIE")
      
      // ÉTAPE 2: Test fetch basique (sans Supabase)
      setStep(2)
      addResult("🔍 ÉTAPE 2: Test fetch basique vers Google")
      
      try {
        const googleTest = await fetch('https://www.google.com', { mode: 'no-cors' })
        addResult("✅ Fetch Google OK - Réseau fonctionne")
      } catch (error) {
        addResult(`❌ Fetch Google échoué: ${error}`)
        addResult("❌ PROBLÈME RÉSEAU GÉNÉRAL")
        return
      }
      
      addResult("✅ ÉTAPE 2 RÉUSSIE")
      
      // ÉTAPE 3: Test fetch vers Supabase (sans authentification)
      setStep(3)
      addResult("🔍 ÉTAPE 3: Test fetch Supabase sans auth")
      
      try {
        const supabaseTest = await fetch(`${supabaseUrl}/rest/v1/`, { 
          method: 'HEAD',
          mode: 'cors'
        })
        addResult(`✅ Supabase accessible: ${supabaseTest.status}`)
      } catch (error) {
        addResult(`❌ Supabase inaccessible: ${error}`)
        addResult("❌ PROBLÈME SPÉCIFIQUE SUPABASE")
        return
      }
      
      addResult("✅ ÉTAPE 3 RÉUSSIE")
      
      // ÉTAPE 4: Test avec authentification
      setStep(4)
      addResult("🔍 ÉTAPE 4: Test avec authentification Supabase")
      
      try {
        const authTest = await fetch(`${supabaseUrl}/rest/v1/`, {
          method: 'HEAD',
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          }
        })
        addResult(`✅ Auth Supabase OK: ${authTest.status}`)
      } catch (error) {
        addResult(`❌ Auth Supabase échoué: ${error}`)
        addResult("❌ PROBLÈME AUTHENTIFICATION")
        return
      }
      
      addResult("✅ ÉTAPE 4 RÉUSSIE")
      
      // ÉTAPE 5: Test requête réelle vers table
      setStep(5)
      addResult("🔍 ÉTAPE 5: Test requête vers table orders")
      
      try {
        const tableTest = await fetch(`${supabaseUrl}/rest/v1/orders?select=id&limit=1`, {
          headers: {
            'apikey': supabaseKey,
            'Authorization': `Bearer ${supabaseKey}`
          }
        })
        
        if (tableTest.ok) {
          const data = await tableTest.json()
          addResult(`✅ Table orders accessible: ${JSON.stringify(data)}`)
        } else {
          addResult(`❌ Table orders erreur: ${tableTest.status} ${tableTest.statusText}`)
          return
        }
      } catch (error) {
        addResult(`❌ Requête table échouée: ${error}`)
        addResult("❌ PROBLÈME ACCÈS TABLE")
        return
      }
      
      addResult("✅ ÉTAPE 5 RÉUSSIE")
      
      // ÉTAPE 6: Test du client Supabase
      setStep(6)
      addResult("🔍 ÉTAPE 6: Test client Supabase complet")
      
      try {
        // Import dynamique pour éviter les erreurs SSR
        const { createClient } = await import('@supabase/supabase-js')
        const supabase = createClient(supabaseUrl, supabaseKey)
        
        const { data, error } = await supabase
          .from('orders')
          .select('id')
          .limit(1)
        
        if (error) {
          addResult(`❌ Client Supabase erreur: ${error.message}`)
          return
        }
        
        addResult(`✅ Client Supabase OK: ${data?.length || 0} résultats`)
      } catch (error) {
        addResult(`❌ Client Supabase échoué: ${error}`)
        addResult("❌ PROBLÈME CLIENT SUPABASE")
        return
      }
      
      addResult("✅ ÉTAPE 6 RÉUSSIE")
      addResult("🎉 TOUS LES TESTS RÉUSSIS - CONNEXION OPÉRATIONNELLE")
      
    } catch (globalError) {
      addResult(`❌ ERREUR GLOBALE: ${globalError}`)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    runDiagnostic()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">🔍 Diagnostic Complet Admin</h1>
            <button
              onClick={runDiagnostic}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? '⏳ En cours...' : '🔄 Relancer'}
            </button>
          </div>

          <div className="mb-6">
            <div className="flex items-center gap-4">
              <div className="text-lg font-semibold">Étape actuelle: {step}/6</div>
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(step / 6) * 100}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="space-y-2 bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
            {results.map((result, index) => (
              <div key={index} className={`text-sm font-mono ${
                result.includes('✅') ? 'text-green-700' :
                result.includes('❌') ? 'text-red-700' :
                result.includes('🔍') ? 'text-blue-700 font-bold' :
                'text-gray-700'
              }`}>
                {result}
              </div>
            ))}
            {loading && (
              <div className="text-sm font-mono text-blue-600 animate-pulse">
                ⏳ Test en cours...
              </div>
            )}
          </div>

          <div className="mt-6 flex gap-4">
            <a 
              href="/admin" 
              className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
            >
              🎯 Page Admin Originale
            </a>
            <a 
              href="/debug-supabase" 
              className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
            >
              🔧 Debug Supabase
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
