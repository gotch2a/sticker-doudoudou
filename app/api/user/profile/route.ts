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
 * API pour mettre à jour le profil utilisateur
 */
export async function PUT(request: NextRequest) {
  try {
    const { userId, first_name, last_name, email } = await request.json()
    
    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'ID utilisateur requis' },
        { status: 400 }
      )
    }
    
    console.log('👤 Mise à jour profil pour:', userId)
    
    // Mettre à jour le profil dans Supabase
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .update({
        first_name,
        last_name,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single()
    
    if (profileError) {
      console.error('❌ Erreur mise à jour profil:', profileError)
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la mise à jour du profil' },
        { status: 500 }
      )
    }
    
    // Mettre à jour l'email dans Supabase Auth si nécessaire
    if (email) {
      try {
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.updateUserById(
          userId,
          { email }
        )
        
        if (authError) {
          console.warn('⚠️ Erreur mise à jour email auth:', authError)
          // On continue même si l'email n'a pas pu être mis à jour
        } else {
          console.log('✅ Email mis à jour dans Auth:', email)
        }
      } catch (emailError) {
        console.warn('⚠️ Erreur mise à jour email:', emailError)
        // On continue même si l'email n'a pas pu être mis à jour
      }
    }
    
    console.log('✅ Profil mis à jour avec succès')
    
    return NextResponse.json({
      success: true,
      profile: {
        id: profile.id,
        first_name: profile.first_name,
        last_name: profile.last_name,
        email: email || profile.email,
        total_orders: profile.total_orders,
        total_spent: profile.total_spent,
        total_savings: profile.total_savings,
        created_at: profile.created_at,
        updated_at: profile.updated_at
      },
      message: 'Profil mis à jour avec succès'
    })
    
  } catch (error) {
    console.error('❌ Erreur API profil:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}

/**
 * API pour récupérer le profil utilisateur
 */
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const userId = url.searchParams.get('userId')
    const email = url.searchParams.get('email')
    
    if (!userId && !email) {
      return NextResponse.json(
        { success: false, error: 'ID utilisateur ou email requis' },
        { status: 400 }
      )
    }
    
    console.log('👤 Récupération profil pour:', userId || email)
    
    let profile
    let authEmail
    
    if (email) {
      // Rechercher par email
      try {
        const { data: usersData } = await supabaseAdmin.auth.admin.listUsers()
        const user = usersData?.users?.find(u => u.email === email)
        
        if (!user) {
          return NextResponse.json(
            { success: false, error: 'Utilisateur non trouvé' },
            { status: 404 }
          )
        }
        
        // Récupérer le profil
        const { data: profileData, error: profileError } = await supabaseAdmin
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        
        if (profileError) {
          return NextResponse.json(
            { success: false, error: 'Profil non trouvé' },
            { status: 404 }
          )
        }
        
        profile = profileData
        authEmail = user.email
        
      } catch (authError) {
        console.error('❌ Erreur recherche par email:', authError)
        return NextResponse.json(
          { success: false, error: 'Utilisateur non trouvé' },
          { status: 404 }
        )
      }
    } else {
    
      // Récupérer le profil depuis Supabase
      const { data: profileData, error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single()
      
      if (profileError) {
        console.error('❌ Erreur récupération profil:', profileError)
        return NextResponse.json(
          { success: false, error: 'Profil non trouvé' },
          { status: 404 }
        )
      }
      
      profile = profileData
      
      // Récupérer l'email depuis Auth
      try {
        const { data: authData } = await supabaseAdmin.auth.admin.getUserById(userId)
        authEmail = authData.user?.email || profile.email
      } catch (authError) {
        console.warn('⚠️ Erreur récupération email auth:', authError)
        authEmail = profile.email
      }
    }
    
    console.log('✅ Profil récupéré avec succès')
    
    return NextResponse.json({
      success: true,
      user: {
        id: profile.id,
        first_name: profile.first_name,
        last_name: profile.last_name,
        email: authEmail,
        // 🎯 CORRECTION: Inclure l'adresse dans la réponse
        address: profile.default_address?.address || '',
        city: profile.default_address?.city || '',
        postalCode: profile.default_address?.postal_code || '',
        total_orders: profile.total_orders,
        total_spent: profile.total_spent,
        total_savings: profile.total_savings,
        created_at: profile.created_at,
        updated_at: profile.updated_at
      }
    })
    
  } catch (error) {
    console.error('❌ Erreur API profil GET:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
