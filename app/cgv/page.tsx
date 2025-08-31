import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function CGVPage() {
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
            Conditions Générales de Vente
          </h1>
        </div>

        <div className="bg-white rounded-xl p-8 shadow-sm">
          <div className="prose max-w-none">
            <p className="text-gray-600 mb-8">
              <strong>Dernière mise à jour :</strong> {new Date().toLocaleDateString('fr-FR')}
            </p>

            <h2>1. Objet</h2>
            <p>
              Les présentes Conditions Générales de Vente (CGV) régissent la vente de stickers personnalisés 
              proposés par Doudoudou. Toute commande implique l'acceptation sans réserve des présentes CGV.
            </p>

            <h2>2. Produits et Services</h2>
            <p>
              Doudoudou propose la création et la vente de planches de stickers personnalisés basés sur 
              les photos de doudous fournis par les clients. Chaque sticker est créé à la main par notre artiste.
            </p>

            <h2>3. Commandes</h2>
            <p>
              Les commandes sont passées via notre site internet. Le client fournit une photo du doudou et 
              les informations nécessaires. La commande est confirmée après paiement intégral.
            </p>

            <h2>4. Prix et Paiement</h2>
            <ul>
              <li>Prix : 12,90€ par planche de stickers</li>
              <li>Frais de port : inclus dans le prix</li>
              <li>Paiement sécurisé par PayPal</li>
              <li>Aucun prélèvement avant confirmation de commande</li>
            </ul>

            <h2>5. Délais de Livraison</h2>
            <p>
              Les stickers sont livrés sous 5 à 7 jours ouvrés après confirmation du paiement. 
              Ce délai inclut la création artistique, l'impression et l'expédition.
            </p>

            <h2>6. Livraison</h2>
            <p>
              La livraison s'effectue à l'adresse indiquée lors de la commande, en France métropolitaine uniquement. 
              Les colis sont expédiés via Colissimo avec suivi.
            </p>

            <h2>7. Droit de Rétractation</h2>
            <p>
              Conformément à l'article L221-28 du Code de la consommation, le droit de rétractation ne peut être 
              exercé pour les biens confectionnés selon les spécifications du consommateur ou nettement personnalisés.
            </p>

            <h2>8. Propriété Intellectuelle</h2>
            <p>
              Le client garantit qu'il détient tous les droits sur les photos transmises et que celles-ci ne 
              contiennent pas d'éléments sous droits d'auteur (personnages de dessins animés, marques, etc.).
            </p>

            <h2>9. Données Personnelles</h2>
            <p>
              Les données collectées sont utilisées uniquement pour le traitement de la commande. 
              Voir notre <Link href="/confidentialite" className="text-primary-600 underline">politique de confidentialité</Link>.
            </p>

            <h2>10. Responsabilité</h2>
            <p>
              Notre responsabilité est limitée au montant de la commande. Nous ne saurions être tenus responsables 
              de dommages indirects ou de préjudices moraux.
            </p>

            <h2>11. Réclamations</h2>
            <p>
              Toute réclamation doit être adressée dans les 7 jours suivant la réception à : 
              <strong> hello@stickerdoudou.fr</strong>
            </p>

            <h2>12. Droit Applicable</h2>
            <p>
              Les présentes CGV sont soumises au droit français. Tout litige sera de la compétence 
              des tribunaux français.
            </p>

            <div className="mt-12 p-6 bg-primary-50 rounded-lg">
              <h3 className="text-primary-800 font-semibold mb-2">Contact</h3>
              <p className="text-primary-700">
                Pour toute question concernant ces conditions :<br/>
                <strong>Email :</strong> hello@stickerdoudou.fr<br/>
                <strong>Téléphone :</strong> [Votre numéro]
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
