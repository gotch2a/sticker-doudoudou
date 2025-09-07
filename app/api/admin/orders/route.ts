import { NextResponse } from 'next/server'
import { OrderService } from '@/lib/supabase'

// GET - Récupérer toutes les commandes côté serveur
export async function GET() {
  try {
    console.log('📊 API - Récupération des commandes...')
    
    const orders = await OrderService.getAllOrders()
    
    console.log(`✅ ${orders.length} commandes récupérées côté serveur`)
    
    return NextResponse.json({
      success: true,
      orders: orders,
      count: orders.length,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('❌ Erreur API orders:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Erreur inconnue',
      orders: [],
      count: 0
    }, { status: 500 })
  }
}
