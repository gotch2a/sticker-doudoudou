# Sticker DOUDOU

Application mobile et desktop moderne construite avec Next.js, TypeScript et Tailwind CSS.

## 🚀 Fonctionnalités

- **Application Universelle** : Fonctionne sur mobile, tablette et desktop
- **PWA (Progressive Web App)** : Installation sur mobile et support hors ligne
- **Application Desktop** : Version Electron native pour Windows, macOS et Linux
- **Interface Moderne** : Design responsive avec animations fluides
- **Performance Optimisée** : Built avec Next.js 14 et les meilleures pratiques
- **TypeScript** : Code type-safe pour une meilleure maintenabilité
- **Tailwind CSS** : Styling utilitaire pour un développement rapide

## 🛠️ Technologies Utilisées

- **Framework** : Next.js 14 (App Router)
- **Language** : TypeScript
- **Styling** : Tailwind CSS
- **Animations** : Framer Motion
- **Icons** : Lucide React
- **Desktop** : Electron
- **PWA** : Service Worker natif
- **Build Tool** : Webpack (via Next.js)

## 📦 Installation

1. **Cloner le dépôt**
   ```bash
   git clone <repository-url>
   cd sticker-doudou
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   # ou
   yarn install
   # ou
   pnpm install
   ```

3. **Lancer en développement**
   ```bash
   npm run dev
   ```

4. **Ouvrir dans le navigateur**
   ```
   http://localhost:3000
   ```

## 🏗️ Scripts Disponibles

### Développement Web
```bash
npm run dev          # Démarrer le serveur de développement
npm run build        # Build de production
npm run start        # Démarrer en production
npm run lint         # Linter le code
```

### Application Desktop (Electron)
```bash
npm run electron-dev   # Développement Electron + Next.js
npm run electron-build # Build de l'app desktop
```

## 📱 PWA (Progressive Web App)

L'application est configurée comme une PWA complète :

- **Manifest** : Configuration dans `public/manifest.json`
- **Service Worker** : Mise en cache et fonctionnement hors ligne
- **Installation** : Installable sur mobile et desktop
- **Notifications** : Support des notifications push

### Installation PWA

1. Ouvrir l'application dans un navigateur moderne
2. Cliquer sur le bouton "Installer" dans la barre d'adresse
3. Ou utiliser le bouton d'installation dans l'interface

## 🖥️ Application Desktop

Version Electron pour une expérience desktop native :

### Développement Desktop
```bash
npm run electron-dev
```

### Build Desktop
```bash
npm run electron-build
```

Génère des exécutables pour :
- **Windows** : `.exe` avec installateur NSIS
- **macOS** : `.dmg` et `.app`
- **Linux** : `.AppImage`

## 📁 Structure du Projet

```
sticker-doudou/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # Layout principal
│   ├── page.tsx           # Page d'accueil
│   └── globals.css        # Styles globaux
├── src/
│   ├── components/        # Composants React
│   │   ├── ui/           # Composants UI réutilisables
│   │   ├── Header.tsx    # En-tête navigation
│   │   └── Footer.tsx    # Pied de page
│   ├── hooks/            # Hooks personnalisés
│   │   └── usePWA.ts     # Hook pour PWA
│   ├── lib/              # Utilitaires et configuration
│   │   └── utils.ts      # Fonctions utilitaires
│   ├── styles/           # Styles supplémentaires
│   ├── types/            # Types TypeScript
│   └── utils/            # Utilitaires
├── public/               # Assets statiques
│   ├── manifest.json     # Manifest PWA
│   ├── sw.js            # Service Worker
│   ├── electron.js      # Configuration Electron
│   └── icons/           # Icônes de l'application
└── config files         # Configuration (next.config.js, etc.)
```

## 🎨 Customisation

### Couleurs et Thème

Modifiez les couleurs dans `tailwind.config.js` :

```javascript
theme: {
  extend: {
    colors: {
      primary: {
        50: '#f0f9ff',
        // ... autres nuances
        900: '#0c4a6e',
      }
    }
  }
}
```

### Icônes et Manifest

1. Remplacez les icônes dans le dossier `public/`
2. Mettez à jour `public/manifest.json`
3. Modifiez les métadonnées dans `app/layout.tsx`

## 🚀 Déploiement

### Web (Vercel, Netlify, etc.)
```bash
npm run build
```

### Desktop
```bash
npm run electron-build
```

### PWA
Automatiquement déployée avec la version web.

## 📊 Performance

- **Lighthouse Score** : 95+ pour Performance, Accessibilité, SEO
- **Core Web Vitals** : Optimisés pour une expérience utilisateur excellente
- **Bundle Size** : Optimisé avec tree-shaking et code splitting
- **Images** : Optimisation automatique avec Next.js

## 🤝 Contribution

1. Fork le projet
2. Créer une branche feature (`git checkout -b feature/AmazingFeature`)
3. Commit les changements (`git commit -m 'Add some AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrir une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🆘 Support

- **Documentation** : Consultez ce README
- **Issues** : Ouvrir une issue sur GitHub
- **Contact** : [votre-email@example.com]

---

Développé avec ❤️ en France
