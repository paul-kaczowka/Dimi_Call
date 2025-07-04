// Service ADB utilisant les APIs Electron natives
// Remplace l'implémentation WebUSB par une communication directe avec le daemon ADB local

export interface AdbConnectionState {
  isConnected: boolean;
  device: any | null;
  adb: any | null;
  batteryLevel?: number;
  isCharging?: boolean;
  error?: string;
  lastLog?: string;
  autoDetectionEnabled?: boolean;
  currentCallState?: 'idle' | 'ringing' | 'offhook' | 'disconnected';
  lastCallNumber?: string;
  callDuration?: number; // Durée d'appel en ms
}

export interface PhoneCallResult {
  success: boolean;
  message: string;
}

// Nouveaux types pour les événements d'appel
export interface CallEndEvent {
  phoneNumber?: string;
  durationMs: number;
  timestamp: Date;
}

export type CallEndCallback = (event: CallEndEvent) => void;

class AdbService {
  private connectionState: AdbConnectionState = {
    isConnected: false,
    device: null,
    adb: null,
    autoDetectionEnabled: false,
    currentCallState: 'idle'
  };

  private listeners: Array<(state: AdbConnectionState) => void> = [];
  private callEndListeners: Array<CallEndCallback> = [];
  private autoDetectionInterval: NodeJS.Timeout | null = null;
  private callMonitorInterval: NodeJS.Timeout | null = null;
  private logBuffer: string[] = [];
  private isElectron: boolean = false;
  
  // Nouvelles propriétés pour le suivi des appels
  private callStartTime: Date | null = null;
  private wasInCall: boolean = false;

  constructor() {
    this.checkElectronEnvironment();
    this.setAutoDetection(true);
  }

  private checkElectronEnvironment() {
    this.isElectron = typeof window !== 'undefined' && !!window.electronAPI;
    this.log(this.isElectron ? '🚀 Environnement Electron détecté - ADB natif disponible' : '⚠️ Environnement web - ADB natif non disponible');
  }

  private log(message: string, level: 'info' | 'warn' | 'error' = 'info') {
    const timestamp = new Date().toLocaleTimeString('fr-FR');
    const logMessage = `[${timestamp}] ADB: ${message}`;
    
    console.log(logMessage);
    
    // Ajouter au buffer de logs (max 50 entrées)
    this.logBuffer.push(logMessage);
    if (this.logBuffer.length > 50) {
      this.logBuffer.shift();
    }
    
    // Mettre à jour le dernier log dans l'état
    this.connectionState.lastLog = message;
    this.notifyListeners();
  }

  private startAutoDetection() {
    if (!this.isElectron) {
      this.log('❌ Auto-détection désactivée - Environnement non-Electron');
      return;
    }

    this.log('🔍 Démarrage de la détection automatique ADB...');
    this.connectionState.autoDetectionEnabled = true;
    
    // Vérification initiale
    this.checkForConnectedDevices();
    
    // Vérification périodique toutes les 5 secondes
    this.autoDetectionInterval = setInterval(() => {
      if (this.connectionState.autoDetectionEnabled) {
        this.checkForConnectedDevices();
      }
    }, 5000);
  }

  private async checkForConnectedDevices() {
    if (!this.isElectron || !window.electronAPI) {
      this.log('❌ APIs Electron non disponibles');
      return;
    }

    try {
      this.log('🔍 Recherche d\'appareils Android connectés...');
      
      const result = await window.electronAPI.adb.getDevices();
      
      if (!result.success) {
        this.log(`❌ Erreur lors de la recherche d'appareils: ${result.error}`, 'error');
        this.connectionState.error = `Erreur de détection: ${result.error}`;
        this.connectionState.isConnected = false;
        this.connectionState.device = null;
        this.notifyListeners();
        return;
      }

      const devices = result.devices || [];
      this.log(`📱 ${devices.length} appareil(s) ADB trouvé(s)`);
      
      // Log détaillé des appareils trouvés
      devices.forEach((device, index) => {
        this.log(`📱 Appareil ${index + 1}: ${device.serial} (${device.status})`);
      });

      // Chercher un appareil connecté (status = "device")
      const connectedDevice = devices.find(d => d.status === 'device');
      
      if (connectedDevice) {
        if (!this.connectionState.isConnected || this.connectionState.device?.serial !== connectedDevice.serial) {
          this.log(`✅ Appareil Android connecté détecté: ${connectedDevice.serial}`);
          await this.connectToDevice(connectedDevice);
        }
      } else {
        if (this.connectionState.isConnected) {
          this.log('📱 Appareil déconnecté');
          this.handleDeviceDisconnection();
        } else {
          this.log('⚠️ Aucun appareil Android autorisé trouvé');
          this.connectionState.error = 'Aucun appareil Android connecté et autorisé';
          this.notifyListeners();
        }
      }
      
    } catch (error) {
      this.log(`❌ Erreur lors de la recherche d'appareils: ${error instanceof Error ? error.message : String(error)}`, 'error');
      this.connectionState.error = `Erreur de détection: ${error instanceof Error ? error.message : String(error)}`;
      this.notifyListeners();
    }
  }

  private async connectToDevice(device: any): Promise<boolean> {
    try {
      this.log(`🔄 Connexion à l'appareil ${device.serial}...`);
      
      this.connectionState.isConnected = true;
      this.connectionState.device = device;
      this.connectionState.error = undefined;
      
      this.log(`✅ Connecté avec succès à ${device.serial}`);
      
      // Récupérer les informations de batterie
      await this.updateBatteryStatus();
      
      this.notifyListeners();
      return true;
      
    } catch (error) {
      this.log(`❌ Erreur lors de la connexion: ${error instanceof Error ? error.message : String(error)}`, 'error');
      this.connectionState.error = `Erreur de connexion: ${error instanceof Error ? error.message : String(error)}`;
      this.connectionState.isConnected = false;
      this.connectionState.device = null;
      this.notifyListeners();
      return false;
    }
  }

  private handleDeviceDisconnection() {
    this.log('📱 Appareil déconnecté');
    this.connectionState.isConnected = false;
    this.connectionState.device = null;
    this.connectionState.batteryLevel = undefined;
    this.connectionState.isCharging = undefined;
    this.connectionState.error = 'Appareil déconnecté';
    this.notifyListeners();
  }

  onConnectionStateChange(listener: (state: AdbConnectionState) => void) {
    this.listeners.push(listener);
    // Retourner une fonction de désabonnement
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  onCallEnd(callback: CallEndCallback) {
    this.callEndListeners.push(callback);
    // Retourner une fonction de désabonnement
    return () => {
      const index = this.callEndListeners.indexOf(callback);
      if (index > -1) {
        this.callEndListeners.splice(index, 1);
      }
    };
  }

  private notifyCallEnd(event: CallEndEvent) {
    this.callEndListeners.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        this.log(`❌ Erreur dans callback de fin d'appel: ${error instanceof Error ? error.message : String(error)}`, 'error');
      }
    });
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.connectionState));
  }

  async connectDevice(): Promise<boolean> {
    if (!this.isElectron || !window.electronAPI) {
      this.log('❌ APIs Electron non disponibles pour la connexion manuelle');
      return false;
    }

    try {
      this.log('🚀 Démarrage de la connexion ADB manuelle...');
      
      // Vérifier les appareils disponibles
      const result = await window.electronAPI.adb.getDevices();
      
      if (!result.success) {
        this.log(`❌ Erreur lors de la recherche d'appareils: ${result.error}`, 'error');
        this.connectionState.error = result.error;
        this.notifyListeners();
        return false;
      }

      const devices = result.devices || [];
      const connectedDevice = devices.find(d => d.status === 'device');
      
      if (connectedDevice) {
        return await this.connectToDevice(connectedDevice);
      } else {
        this.log('❌ Aucun appareil Android connecté trouvé');
        this.connectionState.error = 'Aucun appareil Android connecté et autorisé';
        this.notifyListeners();
        return false;
      }
      
    } catch (error) {
      this.log(`❌ Erreur lors de la connexion manuelle: ${error instanceof Error ? error.message : String(error)}`, 'error');
      this.connectionState.error = `Erreur de connexion: ${error instanceof Error ? error.message : String(error)}`;
      this.notifyListeners();
      return false;
    }
  }

  async disconnectDevice(): Promise<void> {
    this.log('🔌 Déconnexion ADB...');
    
    this.connectionState.isConnected = false;
    this.connectionState.device = null;
    this.connectionState.adb = null;
    this.connectionState.batteryLevel = undefined;
    this.connectionState.isCharging = undefined;
    this.connectionState.error = undefined;
    
    this.notifyListeners();
    this.log('✅ ADB déconnecté');
  }

  async makePhoneCall(phoneNumber: string): Promise<PhoneCallResult> {
    if (!this.connectionState.isConnected || !this.isElectron || !window.electronAPI) {
      return {
        success: false,
        message: 'Aucun appareil ADB connecté'
      };
    }

    try {
      this.log(`📞 Initiation d'appel vers ${phoneNumber}...`);
      
      const result = await window.electronAPI.adb.makeCall(phoneNumber);
      
      if (result.success) {
        this.log(`✅ Appel initié avec succès vers ${phoneNumber}`);
        this.connectionState.lastCallNumber = phoneNumber;
        this.connectionState.currentCallState = 'ringing';
        this.callStartTime = new Date(); // Enregistrer l'heure de début d'appel
        this.wasInCall = false; // Reset du flag
        this.notifyListeners();
        
        // Démarrer la surveillance de l'appel
        this.startCallMonitoring();
        
        return {
          success: true,
          message: result.message || `Appel initié vers ${phoneNumber}`
        };
      } else {
        this.log(`❌ Échec de l'appel: ${result.error}`, 'error');
        return {
          success: false,
          message: result.error || 'Erreur lors de l\'initiation de l\'appel'
        };
      }
      
    } catch (error) {
      this.log(`❌ Erreur lors de l'appel: ${error instanceof Error ? error.message : String(error)}`, 'error');
      return {
        success: false,
        message: `Erreur: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * RACCROCHAGE ULTRA-ROBUSTE basé sur les meilleures pratiques ADB
   * Références: 
   * - https://developer.android.com/studio/command-line/adb
   * - https://techblogs.42gears.com/using-adb-command-to-make-a-call-reject-a-call-and-sending-receiving-a-message/
   */
  async endCall(): Promise<PhoneCallResult> {
    if (!this.connectionState.isConnected || !this.isElectron || !window.electronAPI) {
      return {
        success: false,
        message: 'Aucun appareil ADB connecté'
      };
    }

    try {
      this.log(`📞 ⚡ RACCROCHAGE D'APPEL ULTRA-ROBUSTE DÉMARRÉ...`);
      
      // Utiliser la nouvelle API Electron ultra-robuste
      const result = await window.electronAPI.adb.endCall();
      
      if (result.success) {
        this.log(`✅ ⚡ RACCROCHAGE ADB RÉUSSI: ${result.message}`);
        
        // Forcer la fin de monitoring et mise à jour d'état
        this.log(`🔄 Mise à jour forcée de l'état d'appel...`);
        this.connectionState.currentCallState = 'idle';
        this.stopCallMonitoring();
        
        // Calculer la durée si un appel était en cours
        if (this.callStartTime) {
          const callDuration = new Date().getTime() - this.callStartTime.getTime();
          
          // Créer l'événement de fin d'appel forcé
          const callEndEvent: CallEndEvent = {
            phoneNumber: this.connectionState.lastCallNumber,
            durationMs: callDuration,
            timestamp: new Date()
          };
          
          // Notifier la fin d'appel
          this.notifyCallEnd(callEndEvent);
          
          this.log(`📞 Appel terminé - Durée: ${Math.round(callDuration / 1000)}s`);
        }
        
        this.notifyListeners();
        
        return {
          success: true,
          message: result.message || 'Appel raccroché avec succès'
        };
      } else {
        this.log(`❌ Raccrochage ADB échoué: ${result.error}`, 'error');
        return {
          success: false,
          message: result.error || 'Erreur inconnue lors du raccrochage'
        };
      }
      
    } catch (error) {
      this.log(`❌ Erreur critique lors du raccrochage: ${error instanceof Error ? error.message : String(error)}`, 'error');
      return {
        success: false,
        message: `Erreur critique de raccrochage: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  private startCallMonitoring() {
    if (this.callMonitorInterval) {
      clearInterval(this.callMonitorInterval);
    }

    this.callMonitorInterval = setInterval(async () => {
      await this.checkCallState();
    }, 1000); // Vérifier l'état d'appel toutes les secondes

    this.log('📞 Surveillance d\'appel démarrée');
  }

  private stopCallMonitoring() {
    if (this.callMonitorInterval) {
      clearInterval(this.callMonitorInterval);
      this.callMonitorInterval = null;
      this.log('📞 Surveillance d\'appel arrêtée');
    }
  }

  async checkCallState(): Promise<void> {
    if (!this.connectionState.isConnected || !this.isElectron || !window.electronAPI) {
      return;
    }

    try {
      // Commande ADB pour vérifier l'état des appels
      const result = await window.electronAPI.adb.executeShell('dumpsys telephony.registry | grep "mCallState"');
      
      if (result.success && result.output) {
        const callStateMatch = result.output.match(/mCallState=(\d+)/);
        if (callStateMatch) {
          const callStateValue = parseInt(callStateMatch[1]);
          const previousState = this.connectionState.currentCallState;
          
          // États Android: 0=IDLE, 1=RINGING, 2=OFFHOOK
          let newState: 'idle' | 'ringing' | 'offhook' | 'disconnected' = 'idle';
          switch (callStateValue) {
            case 0:
              newState = 'idle';
              break;
            case 1:
              newState = 'ringing';
              break;
            case 2:
              newState = 'offhook';
              break;
          }

          if (previousState !== newState) {
            this.connectionState.currentCallState = newState;
            this.log(`📞 État d'appel changé: ${previousState} → ${newState}`);
            
            // Suivre si nous étions en communication
            if (newState === 'offhook') {
              this.wasInCall = true;
            }
            
            this.notifyListeners();

            // Si l'appel passe de 'offhook' ou 'ringing' à 'idle', l'appel est terminé
            if ((previousState === 'offhook' || previousState === 'ringing') && newState === 'idle') {
              this.log('📞 Appel terminé détecté');
              
              // Calculer la durée de l'appel
              const callDuration = this.callStartTime ? 
                new Date().getTime() - this.callStartTime.getTime() : 0;
              
              // Créer l'événement de fin d'appel
              const callEndEvent: CallEndEvent = {
                phoneNumber: this.connectionState.lastCallNumber,
                durationMs: callDuration,
                timestamp: new Date()
              };
              
              // Mettre à jour l'état
              this.connectionState.currentCallState = 'idle';
              this.connectionState.callDuration = callDuration;
              this.connectionState.lastCallNumber = undefined;
              
              // Arrêter la surveillance
              this.stopCallMonitoring();
              
              // Reset des variables de suivi
              this.callStartTime = null;
              this.wasInCall = false;
              
              // Notifier les listeners
              this.notifyListeners();
              this.notifyCallEnd(callEndEvent);
              
              this.log(`📞 Appel terminé - Durée: ${Math.round(callDuration / 1000)}s`);
            }
          }
        }
      }
    } catch (error) {
      this.log(`❌ Erreur lors de la vérification d'état d'appel: ${error instanceof Error ? error.message : String(error)}`, 'error');
    }
  }

  getCurrentCallState(): 'idle' | 'ringing' | 'offhook' | 'disconnected' {
    return this.connectionState.currentCallState || 'idle';
  }

  getLastCallNumber(): string | undefined {
    return this.connectionState.lastCallNumber;
  }

  async sendSms(phoneNumber: string, message: string): Promise<PhoneCallResult> {
    if (!this.connectionState.isConnected || !this.isElectron || !window.electronAPI) {
      return {
        success: false,
        message: 'Aucun appareil ADB connecté'
      };
    }

    try {
      this.log(`💬 Envoi SMS vers ${phoneNumber}...`);
      
      const result = await window.electronAPI.adb.sendSms(phoneNumber, message);
      
      if (result.success) {
        this.log(`✅ SMS préparé avec succès pour ${phoneNumber}`);
        return {
          success: true,
          message: result.message || `SMS préparé pour ${phoneNumber}`
        };
      } else {
        this.log(`❌ Échec du SMS: ${result.error}`, 'error');
        return {
          success: false,
          message: result.error || 'Erreur lors de la préparation du SMS'
        };
      }
      
    } catch (error) {
      this.log(`❌ Erreur lors de l'envoi SMS: ${error instanceof Error ? error.message : String(error)}`, 'error');
      return {
        success: false,
        message: `Erreur: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  async updateBatteryStatus(): Promise<void> {
    if (!this.connectionState.isConnected || !this.isElectron || !window.electronAPI) {
      return;
    }

    try {
      this.log('🔋 Mise à jour du statut de la batterie...');
      
      const result = await window.electronAPI.adb.getBattery();
      
      if (result.success) {
        this.connectionState.batteryLevel = result.level;
        this.connectionState.isCharging = result.isCharging;
        this.log(`🔋 Batterie: ${result.level}% ${result.isCharging ? '🔌' : '🔋'}`);
        this.notifyListeners();
      } else {
        this.log(`❌ Erreur batterie: ${result.error}`, 'warn');
      }
      
    } catch (error) {
      this.log(`❌ Erreur lors de la mise à jour de la batterie: ${error instanceof Error ? error.message : String(error)}`, 'error');
    }
  }

  async restartAdbServer(): Promise<boolean> {
    if (!this.isElectron || !window.electronAPI) {
      this.log('❌ APIs Electron non disponibles pour redémarrer ADB');
      return false;
    }

    try {
      this.log('🔄 Redémarrage du serveur ADB...');
      
      const result = await window.electronAPI.adb.restartServer();
      
      if (result.success) {
        this.log('✅ Serveur ADB redémarré avec succès');
        // Relancer la détection après redémarrage
        setTimeout(() => this.checkForConnectedDevices(), 2000);
        return true;
      } else {
        this.log(`❌ Erreur lors du redémarrage ADB: ${result.error}`, 'error');
        return false;
      }
      
    } catch (error) {
      this.log(`❌ Erreur lors du redémarrage ADB: ${error instanceof Error ? error.message : String(error)}`, 'error');
      return false;
    }
  }

  getConnectionState(): AdbConnectionState {
    return { ...this.connectionState };
  }

  isWebUsbSupported(): boolean {
    // Dans cette implémentation, on utilise ADB natif via Electron
    return this.isElectron;
  }

  async testConnection(): Promise<boolean> {
    if (!this.isElectron || !window.electronAPI) {
      return false;
    }

    try {
      const result = await window.electronAPI.adb.getDevices();
      return result.success && (result.devices?.length || 0) > 0;
    } catch {
      return false;
    }
  }

  getLogs(): string[] {
    return [...this.logBuffer];
  }

  setAutoDetection(enabled: boolean) {
    this.connectionState.autoDetectionEnabled = enabled;
    
    if (enabled && !this.autoDetectionInterval) {
      this.startAutoDetection();
    } else if (!enabled && this.autoDetectionInterval) {
      clearInterval(this.autoDetectionInterval);
      this.autoDetectionInterval = null;
      this.log('⏹️ Détection automatique désactivée');
    }
    
    this.notifyListeners();
  }

  cleanup() {
    if (this.autoDetectionInterval) {
      clearInterval(this.autoDetectionInterval);
      this.autoDetectionInterval = null;
    }
    if (this.callMonitorInterval) {
      clearInterval(this.callMonitorInterval);
      this.callMonitorInterval = null;
    }
    this.log('🧹 Service ADB nettoyé');
  }

  /**
   * Diagnostic et résolution automatique des problèmes d'autorisation ADB
   */
  async diagnoseAndFixUnauthorized(): Promise<boolean> {
    if (!this.isElectron || !window.electronAPI) {
      this.log('❌ APIs Electron non disponibles pour le diagnostic');
      return false;
    }

    try {
      this.log('🔧 Diagnostic des problèmes d\'autorisation ADB...');
      
      // Étape 1: Vérifier l'état actuel des appareils
      const deviceResult = await window.electronAPI.adb.getDevices();
      if (!deviceResult.success) {
        this.log(`❌ Impossible de lister les appareils: ${deviceResult.error}`, 'error');
        return false;
      }

      const devices = deviceResult.devices || [];
      const unauthorizedDevices = devices.filter(d => d.status === 'unauthorized');
      
      if (unauthorizedDevices.length === 0) {
        this.log('✅ Aucun appareil non autorisé trouvé');
        return true;
      }

      this.log(`⚠️ ${unauthorizedDevices.length} appareil(s) non autorisé(s) détecté(s)`);
      unauthorizedDevices.forEach(device => {
        this.log(`  📱 ${device.serial} - Status: ${device.status}`);
      });

      // Étape 2: Arrêter le serveur ADB
      this.log('🔄 Arrêt du serveur ADB...');
      const killResult = await window.electronAPI.adb.killServer();
      if (!killResult.success) {
        this.log(`⚠️ Erreur lors de l'arrêt ADB: ${killResult.error}`, 'warn');
      } else {
        this.log('✅ Serveur ADB arrêté');
      }

      // Étape 3: Nettoyer les clés ADB
      this.log('🧹 Nettoyage des clés d\'autorisation ADB...');
      const cleanResult = await window.electronAPI.adb.cleanAuthKeys();
      if (!cleanResult.success) {
        this.log(`⚠️ Erreur lors du nettoyage: ${cleanResult.error}`, 'warn');
      } else {
        this.log('✅ Clés d\'autorisation nettoyées');
      }

      // Étape 4: Redémarrer le serveur ADB
      this.log('🚀 Redémarrage du serveur ADB...');
      const startResult = await window.electronAPI.adb.startServer();
      if (!startResult.success) {
        this.log(`❌ Erreur lors du redémarrage: ${startResult.error}`, 'error');
        return false;
      }
      this.log('✅ Serveur ADB redémarré');

      // Étape 5: Attendre un peu pour la détection
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Étape 6: Vérifier les nouveaux appareils
      this.log('🔍 Vérification des appareils après nettoyage...');
      const newDeviceResult = await window.electronAPI.adb.getDevices();
      if (!newDeviceResult.success) {
        this.log(`❌ Impossible de vérifier les appareils: ${newDeviceResult.error}`, 'error');
        return false;
      }

      const newDevices = newDeviceResult.devices || [];
      const stillUnauthorized = newDevices.filter(d => d.status === 'unauthorized');
      
      if (stillUnauthorized.length === 0) {
        this.log('🎉 Problème d\'autorisation résolu ! Tous les appareils sont maintenant autorisés.');
        
        // Relancer la détection automatique
        this.checkForConnectedDevices();
        return true;
      } else {
        this.log('⚠️ Certains appareils nécessitent encore une autorisation manuelle sur l\'appareil Android');
        this.log('📱 Instructions:');
        this.log('   1. Vérifiez que le "Débogage USB" est activé sur votre appareil Android');
        this.log('   2. Recherchez une popup d\'autorisation sur votre téléphone');
        this.log('   3. Cochez "Toujours autoriser cet ordinateur" et appuyez sur "OK"');
        this.log('   4. Si aucune popup n\'apparaît, déconnectez et reconnectez le câble USB');
        
        return false;
      }
      
    } catch (error) {
      this.log(`❌ Erreur lors du diagnostic: ${error instanceof Error ? error.message : String(error)}`, 'error');
      return false;
    }
  }

  /**
   * Nettoie les clés d'autorisation ADB et redémarre le serveur
   */
  async cleanAdbKeys(): Promise<boolean> {
    if (!this.isElectron || !window.electronAPI) {
      this.log('❌ APIs Electron non disponibles pour le nettoyage');
      return false;
    }

    try {
      this.log('🧹 Nettoyage des clés d\'autorisation ADB...');
      
      const result = await window.electronAPI.adb.cleanAuthKeys();
      
      if (result.success) {
        this.log('✅ Clés d\'autorisation nettoyées avec succès');
        
        // Redémarrer le serveur ADB après nettoyage
        await this.restartAdbServer();
        
        return true;
      } else {
        this.log(`❌ Erreur lors du nettoyage: ${result.error}`, 'error');
        return false;
      }
      
    } catch (error) {
      this.log(`❌ Erreur lors du nettoyage: ${error instanceof Error ? error.message : String(error)}`, 'error');
      return false;
    }
  }

  /**
   * Force la reconnexion des appareils non autorisés
   */
  async forceReconnectUnauthorized(): Promise<boolean> {
    if (!this.isElectron || !window.electronAPI) {
      this.log('❌ APIs Electron non disponibles');
      return false;
    }

    try {
      this.log('🔄 Force la reconnexion des appareils non autorisés...');
      
      // Tuer et redémarrer le serveur ADB
      await window.electronAPI.adb.killServer();
      await new Promise(resolve => setTimeout(resolve, 1000));
      await window.electronAPI.adb.startServer();
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Vérifier les appareils
      this.checkForConnectedDevices();
      
      this.log('✅ Reconnexion forcée terminée');
      return true;
      
    } catch (error) {
      this.log(`❌ Erreur lors de la reconnexion: ${error instanceof Error ? error.message : String(error)}`, 'error');
      return false;
    }
  }
}

export const adbService = new AdbService(); 