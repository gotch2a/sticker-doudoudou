import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'
import crypto from 'crypto'

export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const { filename } = params
    const url = new URL(request.url)
    const token = url.searchParams.get('token')

    if (!token) {
      return NextResponse.json(
        { error: 'Token d\'accès requis' },
        { status: 401 }
      )
    }

    // Vérification du token
    const expectedToken = crypto
      .createHmac('sha256', process.env.UPLOAD_SECRET || 'default-secret')
      .update(filename)
      .digest('hex')

    if (token !== expectedToken) {
      return NextResponse.json(
        { error: 'Token d\'accès invalide' },
        { status: 403 }
      )
    }

    // Lecture du fichier
    const filePath = path.join(process.cwd(), 'uploads', 'photos', filename)
    
    // Vérifier l'existence du fichier avant de le lire
    const fs = require('fs')
    if (!fs.existsSync(filePath)) {
      console.warn(`📷 Photo non trouvée: ${filename}`)
      return NextResponse.json(
        { error: 'Photo non trouvée' },
        { status: 404 }
      )
    }
    
    const fileBuffer = await readFile(filePath)

    // Détermination du type MIME basé sur l'extension
    const extension = path.extname(filename).toLowerCase()
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.heic': 'image/heic',
      '.webp': 'image/webp'
    }
    
    const contentType = mimeTypes[extension] || 'application/octet-stream'

    // Retour du fichier avec les bons headers
    return new NextResponse(new Uint8Array(fileBuffer), {
      headers: {
        'Content-Type': contentType,
        'Content-Length': fileBuffer.length.toString(),
        'Cache-Control': 'private, max-age=3600', // Cache 1 heure
        'Content-Disposition': `inline; filename="${filename}"`
      }
    })

  } catch (error) {
    console.error('Erreur accès photo:', error)
    
    if ((error as any).code === 'ENOENT') {
      return NextResponse.json(
        { error: 'Fichier non trouvé' },
        { status: 404 }
      )
    }

    return NextResponse.json(
      { error: 'Erreur lors de l\'accès au fichier' },
      { status: 500 }
    )
  }
}
