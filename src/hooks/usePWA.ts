'use client'

import { useEffect, useState } from 'react'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

export function usePWA() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstallable, setIsInstallable] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)

  useEffect(() => {
    // Vérifier si l'app est déjà installée
    const checkIfInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      const isInAppBrowser = (window.navigator as any).standalone === true
      setIsInstalled(isStandalone || isInAppBrowser)
    }

    // Écouter l'événement beforeinstallprompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setIsInstallable(true)
    }

    // Écouter l'événement d'installation
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setIsInstallable(false)
      setDeferredPrompt(null)
    }

    if (typeof window !== 'undefined') {
      checkIfInstalled()
      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.addEventListener('appinstalled', handleAppInstalled)

      // Enregistrer le service worker
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('Service Worker enregistré:', registration)
          })
          .catch((error) => {
            console.log('Erreur Service Worker:', error)
          })
      }
    }

    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
        window.removeEventListener('appinstalled', handleAppInstalled)
      }
    }
  }, [])

  const installApp = async () => {
    if (!deferredPrompt) return false

    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        setIsInstalled(true)
        setIsInstallable(false)
        setDeferredPrompt(null)
        return true
      }
      
      return false
    } catch (error) {
      console.error('Erreur lors de l\'installation:', error)
      return false
    }
  }

  return {
    isInstallable,
    isInstalled,
    installApp
  }
}
