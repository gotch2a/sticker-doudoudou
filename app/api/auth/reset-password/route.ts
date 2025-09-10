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
 * API de réinitialisation de mot de passe
 */
export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()
    
    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email requis' },
        { status: 400 }
      )
    }
    
    console.log('🔐 Réinitialisation mot de passe pour:', email)
    
    // Vérifier si l'utilisateur existe
    const { data: usersData } = await supabaseAdmin.auth.admin.listUsers()
    const user = usersData?.users?.find(u => u.email === email)
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Utilisateur non trouvé' },
        { status: 404 }
      )
    }
    
    // Générer un nouveau mot de passe temporaire simple
    const newPassword = `temp${Math.random().toString(36).slice(-6)}`
    
    // Mettre à jour le mot de passe
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    )
    
    if (updateError) {
      console.error('❌ Erreur mise à jour mot de passe:', updateError)
      return NextResponse.json(
        { success: false, error: 'Erreur lors de la réinitialisation' },
        { status: 500 }
      )
    }
    
    console.log('✅ Mot de passe réinitialisé pour:', email)
    console.log('🔑 Nouveau mot de passe temporaire:', newPassword)
    
    return NextResponse.json({
      success: true,
      message: 'Mot de passe réinitialisé avec succès',
      // EN DÉVELOPPEMENT UNIQUEMENT - Ne jamais renvoyer le mot de passe en production !
      temporaryPassword: newPassword,
      warning: 'Changez ce mot de passe lors de votre première connexion'
    })
    
  } catch (error) {
    console.error('❌ Erreur API reset-password:', error)
    return NextResponse.json(
      { success: false, error: 'Erreur interne du serveur' },
      { status: 500 }
    )
  }
}
