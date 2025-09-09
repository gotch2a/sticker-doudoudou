import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Doudoudou',
  description: 'Transformez les doudous en souvenirs magiques avec Doudoudou',
  manifest: '/manifest.json',
  icons: {
    icon: '/images/Tagadou_favicon.png',
    apple: '/icon-192x192.png',
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#8b7355',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <head>
        <meta name="theme-color" content="#8b7355" />
      </head>
      <body className={`${inter.className} antialiased`}>
        <div className="min-h-screen bg-gradient-to-br from-primary-50 to-sage-50">
          {children}
        </div>
      </body>
    </html>
  )
}
