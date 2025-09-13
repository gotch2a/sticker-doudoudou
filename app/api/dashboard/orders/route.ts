/**
 * API pour récupérer les commandes d'un utilisateur pour le dashboard
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Client Supabase Admin avec clé de service
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

/**
 * Récupérer les commandes d'un utilisateur par email
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const email = url.searchParams.get('email')
    
    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email requis' },
        { status: 400 }
      )
    }
    
    console.log('📋 Récupération commandes pour:', email)
    
    // Récupérer les commandes depuis Supabase
    const { data: orders, error: ordersError } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('client_email', email)
      .order('created_at', { ascending: false })
    
    if (ordersError) {
      console.error('❌ Erreur récupération commandes:', ordersError)
      return NextResponse.json(
        { success: false, error: 'Erreur récupération commandes' },
        { status: 500 }
      )
    }
    
    // Récupérer les doudous associés
    const { data: doudous, error: doudousError } = await supabaseAdmin
      .from('user_doudous')
      .select('*')
      .eq('user_email', email)
      .order('created_at', { ascending: false })
    
    if (doudousError) {
      console.warn('⚠️ Erreur récupération doudous:', doudousError)
    }
    
    // Calculer les statistiques
    const stats = {
      totalOrders: orders.length,
      totalSpent: orders.reduce((sum, order) => sum + (order.total_amount || 0), 0),
      totalSavings: orders.reduce((sum, order) => sum + (order.savings_amount || 0), 0)
    }
    
    console.log('✅ Données dashboard récupérées:', {
      orders: orders.length,
      doudous: doudous?.length || 0,
      stats
    })
    
    return NextResponse.json({
      success: true,
      orders: orders || [],
      doudous: doudous || [],
      stats
    })
    
  } catch (error) {
    console.error('❌ Erreur API dashboard orders:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}






