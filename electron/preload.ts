import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron'

// Interface personnalisée pour l'API exposée au renderer
interface ElectronAPI {
  // APIs de fenêtre
  closeApp: () => Promise<void>
  minimizeApp: () => Promise<void>
  maximizeApp: () => Promise<void>
  isMaximized: () => Promise<boolean>
  
  // APIs système
  platform: string
  
  // APIs de notification
  showNotification: (title: string, body: string) => void
  
  // APIs IPC pour les événements entrants
  ipcRenderer: {
    on: (channel: string, listener: (...args: any[]) => void) => void
    removeListener: (channel: string, listener: (...args: any[]) => void) => void
    removeAllListeners: (channel: string) => void
  }
  
  // APIs ADB
  adb: {
    getDevices: () => Promise<{ success: boolean; devices?: any[]; error?: string }>
    executeShell: (command: string) => Promise<{ success: boolean; output?: string; error?: string }>
    makeCall: (phoneNumber: string) => Promise<{ success: boolean; message?: string; error?: string }>
    endCall: () => Promise<{ success: boolean; message?: string; error?: string }>
    sendSms: (phoneNumber: string, message: string) => Promise<{ success: boolean; message?: string; error?: string }>
    getBattery: () => Promise<{ success: boolean; level?: number; isCharging?: boolean; error?: string }>
    restartServer: () => Promise<{ success: boolean; message?: string; error?: string }>
    killServer: () => Promise<{ success: boolean; message?: string; error?: string }>
    startServer: () => Promise<{ success: boolean; message?: string; error?: string }>
    cleanAuthKeys: () => Promise<{ success: boolean; message?: string; error?: string; deletedFiles?: string[] }>
  }
  
  // API pour obtenir la version de l'app
  getAppVersion: () => Promise<string>
  // API pour forcer la vérification manuelle des mises à jour
  checkForUpdates: () => Promise<{ status: string; message: string }>
}

// API personnalisée à exposer dans la sandbox du navigateur
const electronAPI: ElectronAPI = {
  // APIs de fenêtre
  closeApp: () => ipcRenderer.invoke('app:close'),
  minimizeApp: () => ipcRenderer.invoke('app:minimize'),
  maximizeApp: () => ipcRenderer.invoke('app:maximize'),
  isMaximized: () => ipcRenderer.invoke('app:is-maximized'),
  
  // APIs système
  platform: process.platform,
  
  // APIs de notification
  showNotification: (title: string, body: string) => {
    if (Notification.permission === 'granted') {
      new Notification(title, { body })
    }
  },
  
  // APIs IPC pour les événements entrants (exposer seulement les canaux sécurisés)
  ipcRenderer: {
    on: (channel: string, listener: (...args: any[]) => void) => {
      // Seulement autoriser les canaux sécurisés prédéfinis
      const validChannels = ['global-fn-key'];
      if (validChannels.includes(channel)) {
        ipcRenderer.on(channel, listener);
      }
    },
    removeListener: (channel: string, listener: (...args: any[]) => void) => {
      const validChannels = ['global-fn-key'];
      if (validChannels.includes(channel)) {
        ipcRenderer.removeListener(channel, listener);
      }
    },
    removeAllListeners: (channel: string) => {
      const validChannels = ['global-fn-key'];
      if (validChannels.includes(channel)) {
        ipcRenderer.removeAllListeners(channel);
      }
    }
  },
  
  // APIs ADB
  adb: {
    getDevices: () => ipcRenderer.invoke('adb:devices'),
    executeShell: (command: string) => ipcRenderer.invoke('adb:shell', command),
    makeCall: (phoneNumber: string) => ipcRenderer.invoke('adb:call', phoneNumber),
    endCall: () => ipcRenderer.invoke('adb:end-call'),
    sendSms: (phoneNumber: string, message: string) => ipcRenderer.invoke('adb:send-sms', phoneNumber, message),
    getBattery: () => ipcRenderer.invoke('adb:battery'),
    restartServer: () => ipcRenderer.invoke('adb:restart-server'),
    killServer: () => ipcRenderer.invoke('adb:kill-server'),
    startServer: () => ipcRenderer.invoke('adb:start-server'),
    cleanAuthKeys: () => ipcRenderer.invoke('adb:clean-auth-keys')
  },
  
  // API pour obtenir la version de l'app
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  // Vérification manuelle
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates')
}

// Utiliser `contextBridge` APIs pour exposer Electron APIs au
// renderer seulement si le context isolation est activé, sinon
// juste ajouter au DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electronAPI', electronAPI)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electronAPI = electronAPI
}

// Types pour TypeScript
declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
} 