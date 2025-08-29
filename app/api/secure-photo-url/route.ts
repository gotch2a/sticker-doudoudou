import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const { photoUrl } = await request.json()
    
    if (!photoUrl) {
      return NextResponse.json({ error: 'URL de photo requise' }, { status: 400 })
    }
    
    // Extraire le nom du fichier de l'URL
    const filename = photoUrl.split('/').pop()
    if (!filename) {
      return NextResponse.json({ secureUrl: photoUrl })
    }
    
    // Générer le token sécurisé (même logique que l'API photos)
    const token = crypto
      .createHmac('sha256', process.env.UPLOAD_SECRET || 'default-secret')
      .update(filename)
      .digest('hex')
    
    // Construire l'URL sécurisée
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const secureUrl = `${baseUrl}/api/photos/${filename}?token=${token}`
    
    return NextResponse.json({ secureUrl })
    
  } catch (error) {
    console.error('❌ Erreur génération URL sécurisée:', error)
    return NextResponse.json({ error: 'Erreur serveur' }, { status: 500 })
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'API Secure Photo URL',
    description: 'Génère des URLs sécurisées pour accéder aux photos'
  })
}

