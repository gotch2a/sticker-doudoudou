// Types génériques pour l'application

export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  createdAt: Date
  updatedAt: Date
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system'
  language: 'fr' | 'en'
  notifications: boolean
  autoSave: boolean
}

export interface APIResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface NavigationItem {
  name: string
  href: string
  icon?: React.ComponentType<any>
  current?: boolean
}

export interface FeatureCard {
  title: string
  description: string
  icon: React.ComponentType<any>
  href?: string
}

// Types pour PWA
export interface PWAInstallPrompt {
  prompt: () => Promise<void>
  userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
}

// Types pour les hooks
export interface UsePWAReturn {
  isInstallable: boolean
  isInstalled: boolean
  installApp: () => Promise<boolean>
}

// Types pour les composants UI
export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  asChild?: boolean
}

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helper?: string
}

// Types pour les animations
export interface MotionVariants {
  initial: object
  animate: object
  exit?: object
  transition?: object
}

// Types pour les événements
export interface CustomEvent<T = any> {
  type: string
  payload: T
  timestamp: number
}
