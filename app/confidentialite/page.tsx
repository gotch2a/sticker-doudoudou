import Link from 'next/link'
import { ArrowLeft, Shield, Eye, Trash2, Download } from 'lucide-react'

export default function ConfidentialitePage() {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link 
            href="/" 
            className="p-2 rounded-full bg-white shadow-md hover:shadow-lg transition-shadow"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            Politique de Confidentialité
          </h1>
        </div>

        <div className="bg-white rounded-xl p-8 shadow-sm">
          <div className="prose max-w-none">
            <p className="text-gray-600 mb-8">
              <strong>Dernière mise à jour :</strong> {new Date().toLocaleDateString('fr-FR')}
            </p>

            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8">
              <h3 className="text-green-800 font-semibold mb-2 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Notre engagement RGPD
              </h3>
              <p className="text-green-700">
                Nous collectons le strict minimum et respectons vos droits. 
                Vos données ne sont jamais vendues ni partagées avec des tiers.
              </p>
            </div>

            <h2>1. Données Collectées</h2>
            <p>
              Dans le cadre de votre commande, nous collectons uniquement les données nécessaires :
            </p>
            <ul>
              <li><strong>Photo du doudou :</strong> pour la création des stickers</li>
              <li><strong>Informations de contact :</strong> email pour la confirmation</li>
              <li><strong>Informations de livraison :</strong> nom, adresse pour l'expédition</li>
              <li><strong>Informations produit :</strong> détails du doudou, notes pour l'artiste</li>
            </ul>

            <h2>2. Utilisation des Données</h2>
            <p>Vos données sont utilisées exclusivement pour :</p>
            <ul>
              <li>Traiter votre commande</li>
              <li>Créer les stickers personnalisés</li>
              <li>Vous envoyer les confirmations par email</li>
              <li>Assurer la livraison de votre commande</li>
            </ul>

            <h2>3. Partage des Données</h2>
            <div className="bg-sage-50 border border-sage-200 rounded-lg p-4 my-4">
              <p className="text-sage-800 font-medium">
                🔒 Vos données ne sont partagées qu'avec :
              </p>
              <ul className="text-sage-700 mt-2">
                <li>Notre artiste (brief de création uniquement)</li>
                <li>PayPal (paiement sécurisé)</li>
                <li>La Poste (livraison)</li>
              </ul>
            </div>

            <h2>4. Stockage et Sécurité</h2>
            <ul>
              <li><strong>Photos :</strong> stockées de manière sécurisée, supprimées après 30 jours</li>
              <li><strong>Données personnelles :</strong> chiffrées et protégées</li>
              <li><strong>Paiements :</strong> traités par PayPal (certifié PCI DSS)</li>
              <li><strong>Accès :</strong> limité aux personnes autorisées uniquement</li>
            </ul>

            <h2>5. Vos Droits (RGPD)</h2>
            <div className="grid md:grid-cols-2 gap-4 my-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Eye className="w-5 h-5 text-gray-600" />
                  <h4 className="font-semibold">Droit d'accès</h4>
                </div>
                <p className="text-sm text-gray-600">
                  Consulter les données que nous avons sur vous
                </p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Download className="w-5 h-5 text-gray-600" />
                  <h4 className="font-semibold">Droit à la portabilité</h4>
                </div>
                <p className="text-sm text-gray-600">
                  Récupérer vos données dans un format lisible
                </p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Trash2 className="w-5 h-5 text-gray-600" />
                  <h4 className="font-semibold">Droit à l'effacement</h4>
                </div>
                <p className="text-sm text-gray-600">
                  Demander la suppression de vos données
                </p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-5 h-5 text-gray-600" />
                  <h4 className="font-semibold">Droit de rectification</h4>
                </div>
                <p className="text-sm text-gray-600">
                  Corriger des informations incorrectes
                </p>
              </div>
            </div>

            <h2>6. Cookies</h2>
            <p>
              Notre site utilise uniquement des cookies essentiels au fonctionnement 
              (panier, session). Aucun cookie de tracking ou publicitaire.
            </p>

            <h2>7. Suppression Automatique</h2>
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 my-4">
              <p className="text-yellow-800">
                <strong>🗂️ Conservation limitée :</strong>
              </p>
              <ul className="text-yellow-700 mt-2">
                <li>Photos : supprimées après 30 jours</li>
                <li>Données de commande : conservées 3 ans (obligation légale)</li>
                <li>Données de paiement : non stockées (gérées par PayPal)</li>
              </ul>
            </div>

            <h2>8. Mineurs</h2>
            <p>
              Nos services s'adressent aux parents. Aucune donnée n'est collectée 
              directement auprès d'enfants de moins de 16 ans.
            </p>

            <h2>9. Modifications</h2>
            <p>
              Cette politique peut être mise à jour. Les modifications importantes 
              vous seront notifiées par email.
            </p>

            <h2>10. Contact DPO</h2>
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-6 mt-8">
              <h3 className="text-primary-800 font-semibold mb-2">
                Exercer vos droits ou poser une question
              </h3>
              <p className="text-primary-700 mb-3">
                Contactez notre délégué à la protection des données :
              </p>
              <div className="text-primary-700">
                <p><strong>Email :</strong> dpo@doudoudoud.fr</p>
                <p><strong>Courrier :</strong> DPO Doudoudou, [Adresse]</p>
                <p><strong>Délai de réponse :</strong> 30 jours maximum</p>
              </div>
            </div>

            <div className="bg-gray-100 rounded-lg p-4 mt-6">
              <p className="text-gray-600 text-sm">
                <strong>Autorité de contrôle :</strong> En cas de litige, vous pouvez 
                saisir la CNIL (Commission Nationale de l'Informatique et des Libertés) 
                via <a href="https://cnil.fr" className="text-primary-600 underline">cnil.fr</a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
