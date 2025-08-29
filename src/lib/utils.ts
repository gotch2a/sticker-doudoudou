import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Fonction pour détecter le type d'appareil
export function getDeviceType() {
  if (typeof window === 'undefined') return 'desktop'
  
  const userAgent = navigator.userAgent
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)
  const isTablet = /iPad|Android(?=.*Mobile)/i.test(userAgent)
  
  if (isMobile && !isTablet) return 'mobile'
  if (isTablet) return 'tablet'
  return 'desktop'
}

// Fonction pour détecter si l'app est installée en PWA
export function isPWA() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(display-mode: standalone)').matches
}

// Fonction pour formater les dates
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)
}

// Fonction pour débouncer les appels de fonction
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// Fonction pour throttler les appels de fonction
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}
