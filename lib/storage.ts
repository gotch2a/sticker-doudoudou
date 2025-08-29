import { promises as fs } from 'fs'
import path from 'path'

const DATA_DIR = path.join(process.cwd(), 'data')

// Interface pour les commandes
export interface Order {
  orderNumber: string
  petName: string
  animalType: string
  childName: string
  email: string
  address: string
  city: string
  postalCode: string
  numberOfSheets: number
  notes: string
  total: number
  status: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered'
  photoUrl?: string
  paymentReference?: string
  createdAt: string
  updatedAt?: string
}

// Initialiser le dossier data si nécessaire
async function ensureDataDir() {
  try {
    await fs.access(DATA_DIR)
  } catch {
    await fs.mkdir(DATA_DIR, { recursive: true })
  }
}

// Lire les commandes
export async function getOrders(): Promise<Record<string, Order>> {
  await ensureDataDir()
  try {
    const ordersFile = path.join(DATA_DIR, 'orders.json')
    const data = await fs.readFile(ordersFile, 'utf-8')
    return JSON.parse(data)
  } catch {
    return {}
  }
}

// Sauvegarder une commande
export async function saveOrder(order: Order): Promise<void> {
  await ensureDataDir()
  const orders = await getOrders()
  orders[order.orderNumber] = {
    ...order,
    updatedAt: new Date().toISOString()
  }
  
  const ordersFile = path.join(DATA_DIR, 'orders.json')
  await fs.writeFile(ordersFile, JSON.stringify(orders, null, 2))
  
  console.log('💾 Commande sauvegardée:', order.orderNumber)
}

// Mettre à jour le statut d'une commande
export async function updateOrderStatus(
  orderNumber: string, 
  status: Order['status']
): Promise<void> {
  const orders = await getOrders()
  if (orders[orderNumber]) {
    orders[orderNumber].status = status
    orders[orderNumber].updatedAt = new Date().toISOString()
    
    const ordersFile = path.join(DATA_DIR, 'orders.json')
    await fs.writeFile(ordersFile, JSON.stringify(orders, null, 2))
    
    console.log('📝 Statut mis à jour:', orderNumber, '→', status)
  }
}

// Statistiques simples
export async function getStats() {
  const orders = await getOrders()
  const ordersList = Object.values(orders)
  
  return {
    total: ordersList.length,
    paid: ordersList.filter(o => o.status === 'paid').length,
    processing: ordersList.filter(o => o.status === 'processing').length,
    shipped: ordersList.filter(o => o.status === 'shipped').length,
    revenue: ordersList
      .filter(o => o.status !== 'pending')
      .reduce((sum, o) => sum + o.total, 0),
    lastOrder: ordersList.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0]
  }
}
