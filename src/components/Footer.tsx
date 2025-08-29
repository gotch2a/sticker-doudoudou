import { Heart, Smartphone, Monitor, Mail, Github, Twitter } from 'lucide-react'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gray-900 text-white">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          {/* Logo et description */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="flex items-center gap-1">
                <Smartphone className="w-6 h-6 text-primary-400" />
                <Monitor className="w-6 h-6 text-indigo-400" />
              </div>
              <span className="text-xl font-bold">Sticker DOUDOU</span>
            </div>
            <p className="text-gray-300 mb-6 max-w-md">
              Une application moderne conçue pour offrir la meilleure expérience 
              utilisateur sur mobile et desktop.
            </p>
            <div className="flex gap-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Github className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Twitter className="w-5 h-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Mail className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Liens rapides */}
          <div>
            <h3 className="font-semibold mb-4">Liens rapides</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Accueil</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Fonctionnalités</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">À propos</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Contact</a></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="font-semibold mb-4">Support</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Documentation</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">FAQ</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Aide</a></li>
              <li><a href="#" className="text-gray-300 hover:text-white transition-colors">Nous contacter</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            © {currentYear} Sticker DOUDOU. Tous droits réservés.
          </p>
          <div className="flex items-center gap-1 text-gray-400 text-sm mt-4 md:mt-0">
            Fait avec <Heart className="w-4 h-4 text-red-400 mx-1" /> en France
          </div>
        </div>
      </div>
    </footer>
  )
}
