import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import path from 'path'
import crypto from 'crypto'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)



const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/heic', 'image/webp']

export async function POST(request: NextRequest) {
  try {
    console.log('📸 Tentative d\'upload de photo...')
    
    const formData = await request.formData()
    const file = formData.get('photo') as File

    if (!file) {
      console.log('❌ Aucun fichier fourni')
      return NextResponse.json(
        { error: 'Aucun fichier fourni' },
        { status: 400 }
      )
    }

    console.log('📝 Fichier reçu:', file.name, file.size, file.type)

    // Validation de la taille
    if (file.size > MAX_FILE_SIZE) {
      console.log('❌ Fichier trop volumineux:', file.size)
      return NextResponse.json(
        { error: 'Fichier trop volumineux (max 10MB)' },
        { status: 400 }
      )
    }

    // Validation du type (plus permissive)
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type.toLowerCase())) {
      console.log('❌ Type non autorisé:', file.type)
      return NextResponse.json(
        { error: 'Type de fichier non autorisé. Utilisez JPEG, PNG ou WebP' },
        { status: 400 }
      )
    }

    // Générer un nom de fichier unique
    const fileName = `upload_${Date.now()}_${crypto.randomUUID().slice(0, 8)}.jpg`
    
    // Créer le dossier uploads/photos s'il n'existe pas
    const uploadDir = path.join(process.cwd(), 'uploads', 'photos')
    try {
      await mkdir(uploadDir, { recursive: true })
    } catch (error) {
      // Le dossier existe déjà, c'est normal
    }
    
    // Sauvegarder le fichier
    const filePath = path.join(uploadDir, fileName)
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    await writeFile(filePath, buffer)
    console.log('✅ Fichier sauvegardé:', filePath)
    
    // Générer l'URL sécurisée
    const token = crypto
      .createHmac('sha256', process.env.UPLOAD_SECRET || 'default-secret')
      .update(fileName)
      .digest('hex')
    
    const secureUrl = `/api/photos/${fileName}?token=${token}`
    
    console.log('✅ Upload réel avec succès:', fileName)
    
    // Enregistrer les métadonnées dans la table photos
    try {
      const { data: photoData, error: photoError } = await supabase
        .from('photos')
        .insert({
          filename: fileName,
          original_name: file.name,
          file_size: file.size,
          mime_type: file.type,
          is_active: true
        })
        .select()
        .single()

      if (photoError) {
        console.error('❌ Erreur enregistrement métadonnées:', photoError)
      } else {
        console.log('✅ Métadonnées enregistrées:', photoData.id)
      }
    } catch (error) {
      console.error('❌ Erreur enregistrement métadonnées:', error)
    }
    
    return NextResponse.json({
      success: true,
      fileName,
      secureUrl,
      fileSize: file.size,
      fileType: file.type,
      message: 'Fichier uploadé avec succès'
    })

  } catch (error) {
    console.error('❌ Erreur upload:', error)
    return NextResponse.json(
      { error: 'Erreur lors de l\'upload du fichier' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json(
    { 
      message: 'Endpoint pour upload de photos',
      maxSize: '10MB',
      allowedTypes: ALLOWED_TYPES
    }
  )
}
