/**
 * Header principal avec navigation et bouton d'authentification
 */

import Link from 'next/link'
import AuthButton from './AuthButton'

export default function Header() {
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center gap-8">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">SD</span>
              </div>
              <h1 className="text-xl font-bold text-primary-600">Sticker DOUDOU</h1>
            </Link>
            
            <nav className="hidden md:flex items-center gap-6">
              <Link href="/commande" className="text-gray-600 hover:text-primary-600 transition-colors">
                Commander
              </Link>
              <Link href="/admin" className="text-gray-600 hover:text-primary-600 transition-colors">
                Admin
              </Link>
            </nav>
          </div>
          
          <div className="flex items-center gap-4">
            <AuthButton />
          </div>
        </div>
      </div>
    </header>
  )
}