/**
 * Page "Comment ça marche" - Processus de création des stickers doudou
 */

export default function CommentCaMarche() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Comment ça marche ?
        </h1>
        <p className="text-xl text-gray-600">
          Transformez les doudous préférés de votre enfant en magnifiques stickers personnalisés !
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 mb-12">
        <div className="text-center">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl font-bold text-orange-600">1</span>
          </div>
          <h3 className="text-xl font-semibold mb-2">Uploadez une photo</h3>
          <p className="text-gray-600">
            Prenez une photo du doudou de votre enfant sous tous les angles
          </p>
        </div>

        <div className="text-center">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl font-bold text-orange-600">2</span>
          </div>
          <h3 className="text-xl font-semibold mb-2">Notre artiste crée</h3>
          <p className="text-gray-600">
            Nos artistes transforment votre photo en illustrations magnifiques
          </p>
        </div>

        <div className="text-center">
          <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl font-bold text-orange-600">3</span>
          </div>
          <h3 className="text-xl font-semibold mb-2">Recevez vos stickers</h3>
          <p className="text-gray-600">
            Recevez votre planche de stickers personnalisés sous 7 jours
          </p>
        </div>
      </div>

      <div className="text-center">
        <a
          href="/commande"
          className="inline-block bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-full font-semibold transition-colors"
        >
          Commencer maintenant
        </a>
      </div>
    </main>
  )
}
