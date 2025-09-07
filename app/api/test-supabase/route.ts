import { NextResponse } from 'next/server'
import { OrderService } from '@/lib/supabase'

// GET - Test de connexion Supabase côté serveur
export async function GET() {
  try {
    console.log('🔍 Test de connexion Supabase côté serveur...')
    
    // Test de base
    const orders = await OrderService.getAllOrders()
    
    return NextResponse.json({
      success: true,
      message: 'Connexion Supabase OK',
      data: {
        ordersCount: orders.length,
        timestamp: new Date().toISOString(),
        environment: {
          supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Configurée' : 'Manquante',
          supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Configurée' : 'Manquante'
        }
      }
    })
  } catch (error) {
    console.error('❌ Erreur test Supabase serveur:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}
