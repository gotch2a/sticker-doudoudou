'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function DebugSupabasePage() {
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const runTests = async () => {
    setLoading(true)
    const testResults = []

    // Test 1: Variables d'environnement côté client
    testResults.push({
      test: 'Variables d\'environnement',
      status: process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'success' : 'error',
      details: {
        url: process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Configurée' : '❌ Manquante',
        key: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Configurée' : '❌ Manquante'
      }
    })

    // Test 2: Connexion de base
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('id')
        .limit(1)
      
      testResults.push({
        test: 'Connexion de base',
        status: error ? 'error' : 'success',
        details: error ? error.message : `✅ ${data?.length || 0} résultat(s)`
      })
    } catch (err) {
      testResults.push({
        test: 'Connexion de base',
        status: 'error',
        details: err instanceof Error ? err.message : 'Erreur inconnue'
      })
    }

    // Test 3: Comptage des commandes
    try {
      const { count, error } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true })
      
      testResults.push({
        test: 'Comptage des commandes',
        status: error ? 'error' : 'success',
        details: error ? error.message : `✅ ${count} commandes trouvées`
      })
    } catch (err) {
      testResults.push({
        test: 'Comptage des commandes',
        status: 'error',
        details: err instanceof Error ? err.message : 'Erreur inconnue'
      })
    }

    // Test 4: Autres tables
    const tables = ['articles', 'admin_notes', 'discount_codes']
    for (const tableName of tables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('id')
          .limit(1)
        
        testResults.push({
          test: `Table ${tableName}`,
          status: error ? 'error' : 'success',
          details: error ? error.message : '✅ Accessible'
        })
      } catch (err) {
        testResults.push({
          test: `Table ${tableName}`,
          status: 'error',
          details: err instanceof Error ? err.message : 'Erreur inconnue'
        })
      }
    }

    setResults(testResults)
    setLoading(false)
  }

  useEffect(() => {
    runTests()
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-900">🔍 Debug Supabase</h1>
            <button
              onClick={runTests}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? '⏳ Test en cours...' : '🔄 Relancer les tests'}
            </button>
          </div>

          <div className="space-y-4">
            {results.map((result, index) => (
              <div key={index} className={`p-4 rounded-lg border ${
                result.status === 'success' 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <div className="flex items-center gap-3 mb-2">
                  <span className={`w-4 h-4 rounded-full ${
                    result.status === 'success' ? 'bg-green-500' : 'bg-red-500'
                  }`}></span>
                  <h3 className="font-semibold text-gray-900">{result.test}</h3>
                </div>
                
                <div className="ml-7">
                  {typeof result.details === 'object' ? (
                    <div className="space-y-1">
                      {Object.entries(result.details).map(([key, value]) => (
                        <div key={key} className="text-sm">
                          <strong>{key}:</strong> {String(value)}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">{result.details}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {results.length > 0 && (
            <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">📋 Résumé</h3>
              <div className="text-sm text-blue-800">
                <p>✅ Tests réussis: {results.filter(r => r.status === 'success').length}</p>
                <p>❌ Tests échoués: {results.filter(r => r.status === 'error').length}</p>
                <p>📊 Total: {results.length}</p>
              </div>
            </div>
          )}

          <div className="mt-6 text-center">
            <a 
              href="/admin" 
              className="inline-block bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
            >
              🎯 Retour à la page Admin
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
