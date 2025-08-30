// Service de gestion des paramètres de livraison côté serveur
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

export interface ShippingSettings {
  tarif1: {
    name: string
    description: string
    price: number
    condition: string
  }
  tarif2: {
    name: string
    description: string
    price: number
    condition: string
  }
}

// Paramètres par défaut pour la livraison
const defaultShippingSettings: ShippingSettings = {
  tarif1: {
    name: 'Livraison Standard',
    description: 'Pour stickers uniquement (planche de base seule ou avec planche bonus)',
    price: 3.5,
    condition: 'stickers_only'
  },
  tarif2: {
    name: 'Livraison Premium',
    description: 'Avec photo ou livre (objets physiques supplémentaires)',
    price: 5.8,
    condition: 'with_physical_products'
  }
}

class ServerShippingSettingsService {
  private settingsPath = join(process.cwd(), 'data', 'shipping-settings.json')

  constructor() {
    this.ensureSettingsFile()
  }

  private ensureSettingsFile() {
    const dataDir = join(process.cwd(), 'data')
    
    if (!existsSync(dataDir)) {
      try {
        require('fs').mkdirSync(dataDir, { recursive: true })
      } catch (error) {
        console.warn('Impossible de créer le dossier data:', error)
        return
      }
    }

    if (!existsSync(this.settingsPath)) {
      this.saveSettings(defaultShippingSettings)
      console.log('✅ Fichier de paramètres livraison créé:', this.settingsPath)
    }
  }

  getSettings(): ShippingSettings {
    try {
      if (!existsSync(this.settingsPath)) {
        console.warn('Fichier settings livraison non trouvé, utilisation des valeurs par défaut')
        return defaultShippingSettings
      }

      const data = readFileSync(this.settingsPath, 'utf8')
      const settings = JSON.parse(data)
      return settings || defaultShippingSettings
    } catch (error) {
      console.error('Erreur chargement paramètres livraison:', error)
      return defaultShippingSettings
    }
  }

  saveSettings(settings: ShippingSettings): void {
    try {
      writeFileSync(this.settingsPath, JSON.stringify(settings, null, 2))
      console.log('✅ Paramètres livraison sauvegardés côté serveur')
    } catch (error) {
      console.error('Erreur sauvegarde paramètres livraison:', error)
    }
  }

  updateTarif(tarif: 'tarif1' | 'tarif2', updates: Partial<ShippingSettings['tarif1']>): ShippingSettings {
    const settings = this.getSettings()
    const updatedSettings = {
      ...settings,
      [tarif]: { ...settings[tarif], ...updates }
    }
    this.saveSettings(updatedSettings)
    return updatedSettings
  }

  calculateShipping(upsells: string[]): { cost: number, tarif: 'tarif1' | 'tarif2', reason: string } {
    const settings = this.getSettings()
    const hasPhysicalProducts = upsells.some(id => id === 'photo-premium' || id === 'livre-histoire')
    
    if (hasPhysicalProducts) {
      return {
        cost: settings.tarif2.price,
        tarif: 'tarif2',
        reason: settings.tarif2.description
      }
    } else {
      return {
        cost: settings.tarif1.price,
        tarif: 'tarif1',
        reason: settings.tarif1.description
      }
    }
  }
}

export const serverShippingSettingsService = new ServerShippingSettingsService()
