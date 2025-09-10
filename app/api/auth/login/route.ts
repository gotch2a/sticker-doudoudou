import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Client Supabase avec privilèges admin
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
 * API de connexion utilisateur
 */
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email et mot de passe requis' },
        { status: 400 }
      )
    }
    
    console.log('🔐 Tentative connexion pour:', email)
    
    // Connexion avec Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.signInWithPassword({
      email,
      password
    })
    
    if (authError || !authData.user) {
      console.log('❌ Connexion échouée:', authError?.message)
      return NextResponse.json(
        { success: false, error: 'Email ou mot de passe incorrect' },
        { status: 401 }
      )
    }
    
    console.log('✅ Connexion réussie pour:', authData.user.email)
    
    // Récupérer le profil utilisateur
    const { data: profile } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single()
    
    // Récupérer les commandes de l'utilisateur  
    const { data: orders } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('user_id', authData.user.id)
      .order('created_at', { ascending: false })
    
    return NextResponse.json({
      success: true,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        first_name: profile?.first_name,
        last_name: profile?.last_name,
        total_orders: profile?.total_orders || 0,
        total_spent: profile?.total_spent || 0,
        total_savings: profile?.total_savings || 0,
        created_at: profile?.created_at,
        orders: orders || []
      },
      message: 'Connexion réussie'
    })
    
  } catch (error) {
    console.error('❌ Erreur API login:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
