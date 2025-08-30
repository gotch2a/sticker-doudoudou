const { app, BrowserWindow, Menu, shell } = require('electron')
const path = require('path')
const isDev = process.env.NODE_ENV === 'development'

let mainWindow

function createWindow() {
  // Créer la fenêtre principale
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true
    },
    icon: path.join(__dirname, 'icon-512x512.png'),
    show: false,
    titleBarStyle: process.platform === 'darwin' ? 'hiddenInset' : 'default'
  })

  // Charger l'application
  const startUrl = isDev 
    ? 'http://localhost:3000' 
    : `file://${path.join(__dirname, '../out/index.html')}`
  
  mainWindow.loadURL(startUrl)

  // Ouvrir DevTools en développement
  if (isDev) {
    mainWindow.webContents.openDevTools()
  }

  // Afficher la fenêtre une fois prête
  mainWindow.once('ready-to-show', () => {
    mainWindow.show()
    
    if (isDev) {
      mainWindow.webContents.openDevTools()
    }
  })

  // Gérer la fermeture de la fenêtre
  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // Ouvrir les liens externes dans le navigateur
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url)
    return { action: 'deny' }
  })
}

// Cette méthode sera appelée quand Electron aura fini de s'initialiser
app.whenReady().then(() => {
  createWindow()

  // Menu de l'application
  const template = [
    {
      label: 'Fichier',
      submenu: [
        {
          label: 'Nouveau',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            // Action pour nouveau fichier
          }
        },
        {
          label: 'Ouvrir',
          accelerator: 'CmdOrCtrl+O',
          click: () => {
            // Action pour ouvrir
          }
        },
        { type: 'separator' },
        {
          label: 'Quitter',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit()
          }
        }
      ]
    },
    {
      label: 'Édition',
      submenu: [
        { label: 'Annuler', accelerator: 'CmdOrCtrl+Z', role: 'undo' },
        { label: 'Rétablir', accelerator: 'Shift+CmdOrCtrl+Z', role: 'redo' },
        { type: 'separator' },
        { label: 'Couper', accelerator: 'CmdOrCtrl+X', role: 'cut' },
        { label: 'Copier', accelerator: 'CmdOrCtrl+C', role: 'copy' },
        { label: 'Coller', accelerator: 'CmdOrCtrl+V', role: 'paste' }
      ]
    },
    {
      label: 'Affichage',
      submenu: [
        { label: 'Recharger', accelerator: 'CmdOrCtrl+R', role: 'reload' },
        { label: 'Forcer le rechargement', accelerator: 'CmdOrCtrl+Shift+R', role: 'forceReload' },
        { label: 'Outils de développement', accelerator: 'F12', role: 'toggleDevTools' },
        { type: 'separator' },
        { label: 'Zoom réel', accelerator: 'CmdOrCtrl+0', role: 'resetZoom' },
        { label: 'Zoom avant', accelerator: 'CmdOrCtrl+Plus', role: 'zoomIn' },
        { label: 'Zoom arrière', accelerator: 'CmdOrCtrl+-', role: 'zoomOut' },
        { type: 'separator' },
        { label: 'Plein écran', accelerator: 'F11', role: 'togglefullscreen' }
      ]
    },
    {
      label: 'Fenêtre',
      submenu: [
        { label: 'Réduire', accelerator: 'CmdOrCtrl+M', role: 'minimize' },
        { label: 'Fermer', accelerator: 'CmdOrCtrl+W', role: 'close' }
      ]
    },
    {
      label: 'Aide',
      submenu: [
        {
          label: 'À propos de Doudoudou',
          click: () => {
            // Afficher la fenêtre À propos
            require('electron').dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'À propos',
              message: 'Doudoudou',
              detail: 'Application mobile et desktop moderne avec Next.js\nVersion 1.0.0'
            })
          }
        }
      ]
    }
  ]

  const menu = Menu.buildFromTemplate(template)
  Menu.setApplicationMenu(menu)

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

// Quitter quand toutes les fenêtres sont fermées
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Sécurité : empêcher la navigation vers des domaines externes
app.on('web-contents-created', (event, contents) => {
  contents.on('will-navigate', (event, navigationUrl) => {
    const parsedUrl = new URL(navigationUrl)
    
    if (parsedUrl.origin !== 'http://localhost:3000' && !navigationUrl.startsWith('file://')) {
      event.preventDefault()
    }
  })
})
