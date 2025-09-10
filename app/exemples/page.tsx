/**
 * Page "Exemples" - Galerie des réalisations
 */

export default function Exemples() {
  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Nos créations
        </h1>
        <p className="text-xl text-gray-600">
          Découvrez les magnifiques stickers créés à partir des doudous de nos petits clients !
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Exemples de créations */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="h-48 bg-gradient-to-br from-pink-100 to-purple-100 flex items-center justify-center">
            <span className="text-gray-400">Exemple Doudou 1</span>
          </div>
          <div className="p-4">
            <h3 className="font-semibold text-gray-900">Nounours Théo</h3>
            <p className="text-sm text-gray-600">Transformé en stickers colorés</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="h-48 bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center">
            <span className="text-gray-400">Exemple Doudou 2</span>
          </div>
          <div className="p-4">
            <h3 className="font-semibold text-gray-900">Lapin Lila</h3>
            <p className="text-sm text-gray-600">Une création pleine de douceur</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="h-48 bg-gradient-to-br from-green-100 to-teal-100 flex items-center justify-center">
            <span className="text-gray-400">Exemple Doudou 3</span>
          </div>
          <div className="p-4">
            <h3 className="font-semibold text-gray-900">Éléphant Émile</h3>
            <p className="text-sm text-gray-600">Des couleurs vives et joyeuses</p>
          </div>
        </div>
      </div>

      <div className="text-center mt-12">
        <a
          href="/commande"
          className="inline-block bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-full font-semibold transition-colors"
        >
          Créer mes stickers
        </a>
      </div>
    </main>
  )
}
