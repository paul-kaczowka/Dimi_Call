import * as dotenv from 'dotenv'
import * as path from 'path'
import { app, shell, BrowserWindow, ipcMain, globalShortcut, dialog } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { spawn, exec } from 'child_process'
import { promisify } from 'util'
import * as fs from 'fs'
import electronUpdater from 'electron-updater'
import log from 'electron-log'
import { setupSmsHandler } from './sms-handler' // Import direct

// Tentative d'import du handler SMS. S'il est absent, on désactive simplement la fonctionnalité sans bloquer l'application.
/* let setupSmsHandler: (() => void) | undefined
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  ;({ setupSmsHandler } = require('./sms-handler.js'))
  console.log('📨 sms-handler chargé avec succès')
} catch (err) {
  console.warn('⚠️ sms-handler.js introuvable, les fonctionnalités SMS Electron sont désactivées.')
} */

// Extraction de autoUpdater depuis le module CommonJS
const { autoUpdater } = electronUpdater

// Configuration du logger pour electron-updater
log.transports.file.level = 'info'
autoUpdater.logger = log

// Load environment variables from .env file at the very start
dotenv.config({ path: path.resolve(app.getAppPath(), '..', '.env') })

const execAsync = promisify(exec)

// État de mise à jour
let updateInfo: any = null
let updateDownloaded = false
let mainWindow: BrowserWindow | null = null

// Configuration de l'auto-updater
if (!is.dev) {
  // Configuration explicite pour éviter les problèmes
  autoUpdater.checkForUpdatesAndNotify()
  
  // Vérifier les mises à jour toutes les 10 minutes
  setInterval(() => {
    autoUpdater.checkForUpdatesAndNotify()
  }, 10 * 60 * 1000)
}

// Initialisation ICU forcée avant toute autre chose
console.log('🔧 Démarrage de l\'application DimiCall...')
console.log('🌍 Initialisation ICU...')

// Forcer l'initialisation d'ICU avec des chemins multiples
const possibleIcuPaths = [
  join(__dirname, 'icudtl.dat'),
  join(process.resourcesPath, 'icudtl.dat'),
  join(process.resourcesPath, 'app.asar.unpacked', 'icudtl.dat'),
  join(process.cwd(), 'icudtl.dat'),
  join(process.execPath, '..', 'icudtl.dat')
]

for (const icuPath of possibleIcuPaths) {
  if (fs.existsSync(icuPath)) {
    console.log('✅ Fichier ICU trouvé:', icuPath)
    // Définir la variable d'environnement pour Electron
    process.env.ELECTRON_ICU_DATA_FILE = icuPath
    break
  } else {
    console.log('❌ ICU non trouvé:', icuPath)
  }
}

// Log ICU pour diagnostics
console.log('🌍 ICU_DATA_FILE:', process.env.ELECTRON_ICU_DATA_FILE)
console.log('🌍 Locale système:', Intl.DateTimeFormat().resolvedOptions().locale)

// Capturer toutes les erreurs non gérées
process.on('uncaughtException', (error) => {
  console.error('❌ Erreur non gérée dans le processus principal:', error)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Promise rejetée non gérée:', reason, 'at:', promise)
})

// Fonction pour obtenir le chemin de l'exécutable ADB
function getAdbPath(): string {
  const platform = process.platform
  // Déterminer le nom approprié du binaire adb selon l'OS
  const adbFile = platform === 'win32' ? 'adb.exe' : 'adb'

  if (is.dev) {
    // En mode développement, utiliser les dossiers platform-tools présents dans le repo
    if (platform === 'win32') {
      return join(app.getAppPath(), 'platform-tools-latest-windows (4)', 'platform-tools', adbFile)
    } else if (platform === 'darwin') {
      return join(app.getAppPath(), 'platform-tools-latest-darwin (2)', 'platform-tools', adbFile)
    }
    // Fallback générique pour Linux ou autres plateformes
    return join(app.getAppPath(), 'platform-tools', adbFile)
  }

  // En production (application packagée), les platform-tools sont copiés dans resourcesPath
  return join(process.resourcesPath, 'platform-tools', adbFile)
}

function createWindow(): BrowserWindow {
  console.log('🚀 Création de la fenêtre principale...')
  
  // Configuration spécifique selon la plateforme
  const isMacOS = process.platform === 'darwin'
  const HEADER_HEIGHT = 32 // Hauteur de la barre de titre personnalisée
  
  // Créer la fenêtre de navigateur principale
  const mainWindow = new BrowserWindow({
    width: 1800,
    height: 1200,
    minWidth: 1400,
    minHeight: 900,
    show: false,
    autoHideMenuBar: !is.dev, // Masquer le menu en production, l'afficher en développement
    titleBarStyle: isMacOS ? 'hiddenInset' : 'hidden', // Configuration adaptée pour macOS
    titleBarOverlay: isMacOS ? { height: HEADER_HEIGHT } : false,
    frame: isMacOS ? true : false, // Garder le frame sur macOS pour les boutons natifs
    trafficLightPosition: isMacOS ? { x: 16, y: 16 } : undefined, // Position des boutons macOS
    backgroundColor: '#ffffff', // Couleur de fond blanche pour éviter l'écran noir
    icon: join(__dirname, '../../public/logo-d.png'), // Correction du chemin de l'icône
    webPreferences: {
      preload: join(__dirname, '../preload/preload.mjs'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false,
      devTools: is.dev // DevTools seulement en mode développement
    }
  })

  console.log('✅ Fenêtre créée, configuration des événements...')

  // Logs détaillés pour le chargement
  mainWindow.webContents.on('dom-ready', () => {
    console.log('📄 DOM prêt')
  })

  mainWindow.webContents.on('did-start-loading', () => {
    console.log('⏳ Début du chargement de la page...')
  })

  mainWindow.webContents.on('did-stop-loading', () => {
    console.log('✅ Fin du chargement de la page')
  })

  mainWindow.webContents.on('did-finish-load', () => {
    console.log('🎯 Page entièrement chargée')
  })

  // Attendre que la page soit complètement chargée avant d'afficher la fenêtre
  mainWindow.once('ready-to-show', () => {
    console.log('🎪 ready-to-show événement déclenché')
    mainWindow.show()
    
    // Ouvrir les DevTools automatiquement pour déboguer
    if (is.dev) {
      console.log('🔧 Ouverture des DevTools en mode développement')
      mainWindow.webContents.openDevTools()
    }
    
    // Optionnel : fade in pour une transition plus douce
    if (mainWindow.isVisible()) {
      mainWindow.focus()
      console.log('🔍 Fenêtre affichée et focus donné')
    }
  })

  // Gérer les erreurs de chargement
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('❌ Échec du chargement de la page:', {
      errorCode,
      errorDescription,
      url: validatedURL
    })
  })

  // Logger les erreurs de la console du renderer
  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log(`🖥️ Console [${level}]:`, message, `(${sourceId}:${line})`)
  })

  // Logger les erreurs non gérées du renderer
  mainWindow.webContents.on('render-process-gone', (event, details) => {
    console.error('💥 Le processus renderer a disparu!', details)
  })

  // S'assurer que la fenêtre s'affiche même en cas de problème
  setTimeout(() => {
    if (mainWindow && !mainWindow.isVisible()) {
      console.log('⚠️ Forçage de l\'affichage de la fenêtre après délai')
      mainWindow.show()
      // Ouvrir les DevTools en cas de problème seulement en développement
      if (is.dev) {
        mainWindow.webContents.openDevTools()
      }
    }
  }, 5000) // 5 secondes de délai maximum

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR pour renderer basé sur electron-vite cli.
  // Charger l'URL distante pour le développement ou le fichier html local pour la production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    console.log('🌐 Mode développement - chargement de l\'URL:', process.env['ELECTRON_RENDERER_URL'])
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    // En mode production, les fichiers renderer sont extraits de l'asar dans app.asar.unpacked
    const htmlPath = is.dev 
      ? join(__dirname, '../renderer/index.html')
      : join(__dirname, '../renderer/index.html')
    
    console.log('📁 Mode production - chargement du fichier:', htmlPath)
    console.log('📂 __dirname:', __dirname)
    console.log('📂 process.resourcesPath:', process.resourcesPath)
    
    // Essayer différents chemins possibles
    const possiblePaths = [
      htmlPath,
      join(__dirname, '../renderer/src/index.html'), // Le chemin correct avec Vite
      join(process.resourcesPath, 'app.asar.unpacked', 'dist', 'renderer', 'src', 'index.html'),
      join(process.resourcesPath, 'app.asar.unpacked', 'dist', 'renderer', 'index.html'),
      join(process.resourcesPath, 'app', 'dist', 'renderer', 'src', 'index.html'),
      join(process.resourcesPath, 'app', 'dist', 'renderer', 'index.html'),
      join(__dirname, '../../renderer/index.html')
    ]
    
    let validPath: string | null = null
    for (const path of possiblePaths) {
      console.log('🔍 Test du chemin:', path)
      if (require('fs').existsSync(path)) {
        validPath = path
        console.log('✅ Chemin valide trouvé!')
        break
      } else {
        console.log('❌ Chemin invalide')
      }
    }
    
    if (validPath) {
      mainWindow.loadFile(validPath)
    } else {
      console.error('💥 Aucun chemin valide trouvé pour index.html')
      // Fallback: essayer de charger une page d'erreur simple
      mainWindow.loadURL('data:text/html,<h1>Erreur: Impossible de charger l\'application</h1><p>Fichier HTML non trouvé</p>')
    }
  }
  
  console.log('✨ Configuration de la fenêtre terminée')
  return mainWindow
}

// Cette méthode sera appelée quand Electron aura fini
// de s'initialiser et est prête à créer des fenêtres de navigateur.
// Certaines APIs peuvent seulement être utilisées après que cet événement se produit.
app.whenReady().then(() => {
  console.log('🚀 Electron est prêt, initialisation de l\'application...')
  
  // Définir l'id de l'app pour les notifications Windows 10+
  electronApp.setAppUserModelId('com.dimultra.dimicall')
  console.log('🏷️ App ID défini: com.dimultra.dimicall')

  // Déplacer la configuration du handler ici pour garantir que l'app est prête
  if (setupSmsHandler) {
    try {
      setupSmsHandler()
      console.log('✅ Handler SMS configuré avec succès après "app.ready".')
    } catch (error) {
      console.error('❌ Erreur lors de la configuration du handler SMS:', error)
    }
  }

  mainWindow = createWindow()

  // IPC handlers basiques pour l'interface utilisateur
  ipcMain.handle('get-app-version', () => {
    return app.getVersion()
  })

  // Vérification manuelle des mises à jour avec retour d'état
  ipcMain.handle('check-for-updates', async () => {
    try {
      if (is.dev) {
        log.warn('Mise à jour ignorée car l\'application est en mode développement.')
        return {
          status: 'dev_mode',
          message: 'La vérification des mises à jour est désactivée en mode développement.'
        }
      }
      log.info('Vérification manuelle des mises à jour initiée par l\'utilisateur...')
      autoUpdater.checkForUpdatesAndNotify()
      return { status: 'checking', message: 'Vérification des mises à jour lancée.' }
    } catch (error) {
      log.error("Erreur lors de l'initiation de la vérification manuelle des mises à jour:", error)
      return {
        status: 'error',
        message: error instanceof Error ? error.message : 'Une erreur inconnue est survenue.'
      }
    }
  })

  // Obtenir l'état actuel de mise à jour
  ipcMain.handle('get-update-status', () => {
    return {
      updateAvailable: !!updateInfo,
      updateDownloaded,
      updateInfo
    }
  })

  // Installer et redémarrer avec la mise à jour
  ipcMain.handle('install-update', () => {
    if (updateDownloaded) {
      console.log('🔄 Installation de la mise à jour et redémarrage...')
      autoUpdater.quitAndInstall()
      return { success: true }
    } else {
      console.log('⚠️ Aucune mise à jour téléchargée disponible')
      return { success: false, message: 'Aucune mise à jour disponible' }
    }
  })

  // Événements de l'auto-updater
  autoUpdater.on('checking-for-update', () => {
    console.log('🔍 Vérification des mises à jour...')
    if (mainWindow) {
      mainWindow.webContents.send('update-checking')
    }
  })

  autoUpdater.on('update-available', (info) => {
    console.log('📦 Mise à jour disponible:', info.version)
    updateInfo = info
    if (mainWindow) {
      mainWindow.webContents.send('update-available', info)
    }
  })

  autoUpdater.on('update-not-available', (info) => {
    console.log('✅ Application à jour:', info.version)
    if (mainWindow) {
      mainWindow.webContents.send('update-not-available', info)
    }
  })

  autoUpdater.on('error', (err) => {
    console.error('❌ Erreur lors de la mise à jour:', err)
    if (mainWindow) {
      mainWindow.webContents.send('update-error', err.message)
    }
  })

  autoUpdater.on('download-progress', (progressObj) => {
    const percent = Math.round(progressObj.percent)
    console.log(`⬇️ Téléchargement en cours: ${percent}%`)
    if (mainWindow) {
      mainWindow.webContents.send('update-download-progress', progressObj)
    }
  })

  autoUpdater.on('update-downloaded', (info) => {
    console.log('🎉 Mise à jour téléchargée:', info.version)
    console.log('🔄 Mise à jour prête à être installée - en attente du clic utilisateur')
    
    updateDownloaded = true
    updateInfo = info
    
    if (mainWindow) {
      mainWindow.webContents.send('update-downloaded', info)
    }
  })

  console.log('🚀 electron-updater configuré pour les mises à jour automatiques')

  // Le raccourci de développement par défaut de 'CommandOrControl + R' est
  // enregistré lors du développement pour aider
  // au débogage avec DevTools.
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
    
    // Ajouter des raccourcis personnalisés pour déboguer
    window.webContents.on('before-input-event', (event, input) => {
      // Ctrl+Shift+I ou F12 pour ouvrir les DevTools
      if ((input.control && input.shift && input.key.toLowerCase() === 'i') || input.key === 'F12') {
        console.log('🔧 Ouverture forcée des DevTools via raccourci')
        window.webContents.openDevTools()
      }
    })
  })

  // Gestionnaires IPC
  ipcMain.handle('app:close', () => {
    app.quit()
  })

  ipcMain.handle('app:minimize', () => {
    const window = BrowserWindow.getFocusedWindow()
    if (window) {
      window.minimize()
    }
  })

  ipcMain.handle('app:maximize', () => {
    const window = BrowserWindow.getFocusedWindow()
    if (window) {
      if (window.isMaximized()) {
        window.unmaximize()
      } else {
        window.maximize()
      }
    }
  })

  ipcMain.handle('app:is-maximized', () => {
    const window = BrowserWindow.getFocusedWindow()
    return window ? window.isMaximized() : false
  })

  // Gestionnaires IPC pour ADB
  ipcMain.handle('adb:devices', async () => {
    try {
      const adbCommand = `"${getAdbPath()}" devices`
      const { stdout, stderr } = await execAsync(adbCommand)
      if (stderr && !stderr.includes('daemon not running')) {
        throw new Error(stderr)
      }
      
      // Parser la sortie d'adb devices
      const lines = stdout.split('\n').filter(line => line.trim() && !line.includes('List of devices'))
      const devices = lines.map(line => {
        const parts = line.trim().split('\t')
        if (parts.length >= 2) {
          return {
            serial: parts[0],
            status: parts[1],
            name: parts[0] // On utilisera le serial comme nom pour l'instant
          }
        }
        return null
      }).filter(Boolean)
      
      return { success: true, devices }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  })

  ipcMain.handle('adb:shell', async (event, command) => {
    try {
      const adbCommand = `"${getAdbPath()}" shell "${command}"`
      const { stdout, stderr } = await execAsync(adbCommand)
      if (stderr) {
        throw new Error(stderr)
      }
      return { success: true, output: stdout.trim() }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  })

  ipcMain.handle('adb:call', async (event, phoneNumber) => {
    try {
      const adbCommand = `"${getAdbPath()}" shell am start -a android.intent.action.CALL -d tel:${phoneNumber}`
      const { stdout, stderr } = await execAsync(adbCommand)
      if (stderr) {
        throw new Error(stderr)
      }
      return { success: true, message: `Appel initié vers ${phoneNumber}` }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  })

  ipcMain.handle('adb:sms', async (event, phoneNumber, message) => {
    try {
      // DIAGNOSTIC DÉTAILLÉ DES APOSTROPHES
      console.log('[ELECTRON ADB] === DIAGNOSTIC APOSTROPHES ===');
      console.log('[ELECTRON ADB] Message reçu:', message);
      console.log('[ELECTRON ADB] Contient apostrophes?', message.includes("'"));
      console.log('[ELECTRON ADB] Nombre d\'apostrophes:', (message.match(/'/g) || []).length);
      
      // SOLUTION QUI FONCTIONNE : URI encodée avec %27 pour les apostrophes
      const encodedMessage = encodeURIComponent(message)
      console.log('[ELECTRON ADB] Message encodé URL:', encodedMessage);
      console.log('[ELECTRON ADB] Apostrophes deviennent %27?', encodedMessage.includes('%27'));
      
      // Normaliser le numéro si nécessaire
      let normalizedNumber = phoneNumber
      if (phoneNumber.startsWith('0') && phoneNumber.length === 10) {
        normalizedNumber = "+33" + phoneNumber.substring(1)
      }
      
      const primaryCommand = `"${getAdbPath()}" shell am start -a android.intent.action.SENDTO -d "sms:${normalizedNumber}?body=${encodedMessage}"`
      console.log('[ELECTRON ADB] === COMMANDE QUI FONCTIONNE ===');
      console.log('[ELECTRON ADB] Commande:', primaryCommand);
      
      const { stdout, stderr } = await execAsync(primaryCommand)
      console.log('[ELECTRON ADB] Résultat - stdout:', stdout);
      console.log('[ELECTRON ADB] Résultat - stderr:', stderr);
      
      if (!stderr || stderr.includes('Starting:') || stderr.includes('Warning')) {
        console.log('[ELECTRON ADB] ✅ SMS envoyé avec succès - apostrophes préservées!');
        return { success: true, message: `SMS préparé pour ${phoneNumber} avec apostrophes préservées` }
      } else {
        throw new Error(stderr)
      }
    } catch (error) {
      console.log('[ELECTRON ADB] ❌ Erreur:', error);
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  })

  ipcMain.handle('adb:battery', async () => {
    try {
      const adbCommand = `"${getAdbPath()}" shell dumpsys battery`
      const { stdout, stderr } = await execAsync(adbCommand)
      if (stderr) {
        throw new Error(stderr)
      }
      
      // Parser les informations de batterie
      const lines = stdout.split('\n')
      let level = 0
      let isCharging = false
      
      for (const line of lines) {
        if (line.includes('level:')) {
          level = parseInt(line.split(':')[1].trim())
        }
        if (line.includes('AC powered:') && line.includes('true')) {
          isCharging = true
        }
        if (line.includes('USB powered:') && line.includes('true')) {
          isCharging = true
        }
      }
      
      return { success: true, level, isCharging }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  })

  ipcMain.handle('adb:restart-server', async () => {
    try {
      await execAsync(`"${getAdbPath()}" kill-server`)
      await new Promise(resolve => setTimeout(resolve, 1000)) // Attendre 1 seconde
      await execAsync(`"${getAdbPath()}" start-server`)
      return { success: true, message: 'Serveur ADB redémarré' }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  })

  // Handler pour arrêter le serveur ADB
  ipcMain.handle('adb:kill-server', async () => {
    try {
      console.log('🔄 Arrêt du serveur ADB...')
      await execAsync(`"${getAdbPath()}" kill-server`)
      return { success: true, message: 'Serveur ADB arrêté' }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  })

  // Handler pour démarrer le serveur ADB
  ipcMain.handle('adb:start-server', async () => {
    try {
      console.log('🚀 Démarrage du serveur ADB...')
      await execAsync(`"${getAdbPath()}" start-server`)
      return { success: true, message: 'Serveur ADB démarré' }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  })

  // Handler pour nettoyer les clés d'autorisation ADB
  ipcMain.handle('adb:clean-auth-keys', async () => {
    try {
      console.log('🧹 Nettoyage des clés d\'autorisation ADB...')
      
      // Chemin vers le dossier .android de l'utilisateur
      const os = require('os')
      const path = require('path')
      const fs = require('fs')
      
      const androidFolder = path.join(os.homedir(), '.android')
      const adbKeyPath = path.join(androidFolder, 'adbkey')
      const adbKeyPubPath = path.join(androidFolder, 'adbkey.pub')
      
      console.log('🔍 Vérification des clés ADB...')
      console.log('  - Dossier .android:', androidFolder)
      console.log('  - Clé privée:', adbKeyPath)
      console.log('  - Clé publique:', adbKeyPubPath)
      
      let deletedFiles = []
      
      // Supprimer adbkey si il existe
      if (fs.existsSync(adbKeyPath)) {
        fs.unlinkSync(adbKeyPath)
        deletedFiles.push('adbkey')
        console.log('✅ Clé privée ADB supprimée')
      } else {
        console.log('ℹ️ Clé privée ADB n\'existe pas')
      }
      
      // Supprimer adbkey.pub si il existe
      if (fs.existsSync(adbKeyPubPath)) {
        fs.unlinkSync(adbKeyPubPath)
        deletedFiles.push('adbkey.pub')
        console.log('✅ Clé publique ADB supprimée')
      } else {
        console.log('ℹ️ Clé publique ADB n\'existe pas')
      }
      
      if (deletedFiles.length > 0) {
        return { 
          success: true, 
          message: `Clés supprimées: ${deletedFiles.join(', ')}`,
          deletedFiles 
        }
      } else {
        return { 
          success: true, 
          message: 'Aucune clé à supprimer (déjà propre)',
          deletedFiles: [] 
        }
      }
      
    } catch (error) {
      console.error('❌ Erreur lors du nettoyage des clés:', error)
      return { 
        success: false, 
        error: error instanceof Error ? error.message : String(error) 
      }
    }
  })

  // Handler SMS déplacé vers sms-handler.js pour éviter les problèmes d'encodage Unicode
  // if (setupSmsHandler) { // This line is now moved inside app.whenReady()
  //   setupSmsHandler()
  // }

  /**
   * FONCTION RÉOUVERTURE APPLICATION TÉLÉPHONE
   * Rouvre l'app Téléphone Android après raccrochage pour éviter les appels en arrière-plan
   */
  const reopenPhoneApp = async (): Promise<void> => {
    try {
      console.log(`📱 [REOPEN_PHONE] Réouverture de l'application Téléphone...`)
      
      // Pause de 200ms pour laisser le temps au raccrochage de s'effectuer
      await new Promise(resolve => setTimeout(resolve, 200))
      
      // Méthode 1: Ouvrir via l'intent dialer (le plus rapide)
      try {
        await execAsync(`"${getAdbPath()}" shell am start -a android.intent.action.CALL_BUTTON`)
        console.log(`✅ [REOPEN_PHONE] App Téléphone rouverte via CALL_BUTTON`)
        return
      } catch (error1) {
        console.log(`⚠️ [REOPEN_PHONE] CALL_BUTTON échoué: ${error1}`)
      }
      
      // Méthode 2: Ouvrir via le package dialer standard
      try {
        await execAsync(`"${getAdbPath()}" shell am start -n com.android.dialer/.DialtactsActivity`)
        console.log(`✅ [REOPEN_PHONE] App Téléphone rouverte via package dialer`)
        return
      } catch (error2) {
        console.log(`⚠️ [REOPEN_PHONE] Package dialer échoué: ${error2}`)
      }
      
      // Méthode 3: Intent téléphone générique
      try {
        await execAsync(`"${getAdbPath()}" shell am start -a android.intent.action.DIAL`)
        console.log(`✅ [REOPEN_PHONE] App Téléphone rouverte via DIAL intent`)
        return
      } catch (error3) {
        console.log(`⚠️ [REOPEN_PHONE] DIAL intent échoué: ${error3}`)
      }
      
      console.log(`❌ [REOPEN_PHONE] Impossible de rouvrir l'app Téléphone`)
      
    } catch (error) {
      console.error(`❌ [REOPEN_PHONE] Erreur critique:`, error)
    }
  }

  /**
   * HANDLER RACCROCHAGE ADB ULTRA-ROBUSTE
   * Implémente les 4 meilleures méthodes de raccrochage basées sur:
   * - https://developer.android.com/studio/command-line/adb
   * - https://techblogs.42gears.com/using-adb-command-to-make-a-call-reject-a-call-and-sending-receiving-a-message/
   */
  ipcMain.handle('adb:end-call', async () => {
    try {
      console.log(`📞 [ADB_ENDCALL] Début raccrochage ultra-robuste...`)
      
      // Méthode 1: KEYCODE_ENDCALL (recommandée officiellement)
      console.log(`🔧 [ADB_ENDCALL] Tentative 1: KEYCODE_ENDCALL`)
      try {
        const { stdout: stdout1, stderr: stderr1 } = await execAsync(`"${getAdbPath()}" shell input keyevent KEYCODE_ENDCALL`)
        if (!stderr1 || stderr1.includes('Warning')) {
          console.log(`✅ [ADB_ENDCALL] KEYCODE_ENDCALL réussi`)
          await reopenPhoneApp()
          return { success: true, message: 'Appel raccroché via KEYCODE_ENDCALL' }
        }
      } catch (error1) {
        console.log(`❌ [ADB_ENDCALL] KEYCODE_ENDCALL échoué: ${error1}`)
      }
      
      return { success: false, error: 'Méthodes de raccrochage ont échoué' }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) }
    }
  })
})