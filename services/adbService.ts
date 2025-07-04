// Service ADB avec gestion d'erreurs robuste pour les imports
// Compatible avec @yume-chan/adb v2.0.1

import { simSelectionService, SimSelectionResult } from './simSelectionService';

export interface AdbConnectionState {
  isConnected: boolean;
  device: any | null;
  adb: any | null;
  batteryLevel?: number;
  isCharging?: boolean;
  error?: string;
}

export interface PhoneCallResult {
  success: boolean;
  message: string;
  simHandled?: boolean;
  simResult?: SimSelectionResult;
}

class AdbService {
  private connectionState: AdbConnectionState = {
    isConnected: false,
    device: null,
    adb: null,
  };

  private listeners: Array<(state: AdbConnectionState) => void> = [];
  private isWebUsbAvailable: boolean = false;
  private adbModules: any = null;

  constructor() {
    this.checkWebUsbSupport();
  }

  private checkWebUsbSupport() {
    this.isWebUsbAvailable = typeof navigator !== 'undefined' && 
                            'usb' in navigator && 
                            typeof navigator.usb.requestDevice === 'function';
    
    if (!this.isWebUsbAvailable) {
      console.warn('WebUSB n\'est pas supporté dans ce navigateur');
      this.connectionState.error = 'WebUSB non supporté';
    }
  }

  // Charger dynamiquement les modules ADB
  private async loadAdbModules() {
    if (this.adbModules) {
      return this.adbModules;
    }

    try {
      console.log('🔄 Chargement des modules ADB...');
      
      // Import dynamique pour gérer les erreurs de compatibilité
      const [adbModule, webUsbModule] = await Promise.all([
        import('@yume-chan/adb').catch(err => {
          console.warn('Erreur import @yume-chan/adb:', err);
          return null;
        }),
        import('@yume-chan/adb-daemon-webusb').catch(err => {
          console.warn('Erreur import @yume-chan/adb-daemon-webusb:', err);
          return null;
        })
      ]);

      if (!adbModule || !webUsbModule) {
        throw new Error('Impossible de charger les modules ADB');
      }

      this.adbModules = {
        Adb: adbModule.Adb,
        AdbDaemonTransport: adbModule.AdbDaemonTransport,
        AdbDaemonWebUsbDeviceManager: webUsbModule.AdbDaemonWebUsbDeviceManager,
        AdbDaemonWebUsbDevice: webUsbModule.AdbDaemonWebUsbDevice,
      };

      console.log('✅ Modules ADB chargés avec succès');
      return this.adbModules;

    } catch (error) {
      console.error('❌ Erreur lors du chargement des modules ADB:', error);
      throw new Error(`Modules ADB non disponibles: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  }

  // Écouter les changements d'état de connexion
  onConnectionStateChange(listener: (state: AdbConnectionState) => void) {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener({ ...this.connectionState }));
  }

  // Connecter à un appareil Android via WebUSB
  async connectDevice(): Promise<boolean> {
    if (!this.isWebUsbAvailable) {
      this.connectionState.error = 'WebUSB non supporté dans ce navigateur';
      this.notifyListeners();
      return false;
    }

    try {
      console.log('🔌 Tentative de connexion ADB via WebUSB...');
      
      // Charger les modules ADB
      const modules = await this.loadAdbModules();
      
      // Créer le gestionnaire de périphériques
      const manager = new modules.AdbDaemonWebUsbDeviceManager();
      
      // Demander la sélection d'un périphérique
      const device = await manager.requestDevice();
      
      if (!device) {
        throw new Error('Aucun appareil sélectionné');
      }

      console.log('📱 Appareil détecté:', device.name || 'Android Device');

      // Établir la connexion
      const connection = await device.connect();
      
      // Créer le transport ADB
      const transport = new modules.AdbDaemonTransport(connection);
      
      // Créer l'instance ADB
      const adb = new modules.Adb(transport);

      // Mettre à jour l'état de connexion
      this.connectionState = {
        isConnected: true,
        device: {
          name: device.name || 'Android Device',
          serial: device.serial || 'unknown'
        },
        adb: adb,
        batteryLevel: undefined,
        isCharging: undefined,
        error: undefined
      };

      this.notifyListeners();
      
      // Initialiser le service de sélection SIM
      simSelectionService.initialize(adb);
      
      // Essayer d'obtenir le statut initial de la batterie
      this.updateBatteryStatus().catch(console.warn);
      
      console.log('✅ Connexion ADB établie avec succès');
      return true;

    } catch (error) {
      console.error('❌ Erreur lors de la connexion ADB:', error);
      
      let errorMessage = 'Erreur de connexion ADB';
      if (error instanceof Error) {
        if (error.message.includes('No device selected') || error.message.includes('Aucun appareil')) {
          errorMessage = 'Aucun appareil sélectionné';
        } else if (error.message.includes('Access denied')) {
          errorMessage = 'Accès refusé - Vérifiez les permissions USB';
        } else if (error.message.includes('Device not found')) {
          errorMessage = 'Appareil non trouvé - Vérifiez la connexion USB';
        } else if (error.message.includes('Modules ADB non disponibles')) {
          errorMessage = 'Modules ADB non compatibles avec ce navigateur';
        } else {
          errorMessage = error.message;
        }
      }

      this.connectionState = {
        isConnected: false,
        device: null,
        adb: null,
        error: errorMessage
      };
      
      this.notifyListeners();
      return false;
    }
  }

  // Déconnecter l'appareil
  async disconnectDevice(): Promise<void> {
    try {
      // Arrêter la surveillance SIM
      simSelectionService.stopMonitoring();
      
      if (this.connectionState.adb) {
        // Essayer de fermer la connexion proprement
        await this.connectionState.adb.close?.();
        console.log('🔌 Connexion ADB fermée');
      }
    } catch (error) {
      console.warn('Erreur lors de la fermeture de la connexion:', error);
    } finally {
      this.connectionState = {
        isConnected: false,
        device: null,
        adb: null,
      };
      this.notifyListeners();
    }
  }

  // Passer un appel téléphonique avec gestion automatique de la sélection SIM
  async makePhoneCall(phoneNumber: string): Promise<PhoneCallResult> {
    if (!this.connectionState.isConnected || !this.connectionState.adb) {
      return {
        success: false,
        message: 'Aucun appareil Android connecté'
      };
    }

    try {
      console.log(`📞 Tentative d'appel vers ${phoneNumber}`);
      
      // Démarrer la surveillance SIM avant l'appel
      simSelectionService.startMonitoring(1000); // Vérifier toutes les secondes
      
      // Nettoyer le numéro de téléphone
      const cleanNumber = phoneNumber.replace(/[^\d+]/g, '');
      
      // Exécuter la commande ADB pour initier l'appel
      const command = `am start -a android.intent.action.CALL -d tel:${cleanNumber}`;
      const result = await this.executeShellCommand(command);
      
      if (result.includes('Starting') || result.includes('Activity')) {
        console.log('✅ Appel initié avec succès');
        
        // Attendre quelques secondes pour permettre à la dialog SIM d'apparaître
        console.log('⏳ Vérification de la dialog de choix SIM...');
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Vérifier s'il y a une dialog de choix SIM et la gérer
        const simResult = await simSelectionService.forceCheck();
        
        // Arrêter la surveillance après l'appel
        setTimeout(() => {
          simSelectionService.stopMonitoring();
        }, 5000); // Arrêter après 5 secondes
        
        const baseMessage = `Appel vers ${phoneNumber} initié`;
        let finalMessage = baseMessage;
        
        if (simResult.dialogDetected) {
          if (simResult.success) {
            finalMessage += ' - SIM Pro sélectionnée automatiquement';
          } else {
            finalMessage += ' - Dialog SIM détectée mais sélection automatique échouée';
          }
        }
        
        return {
          success: true,
          message: finalMessage,
          simHandled: simResult.dialogDetected,
          simResult
        };
      } else {
        throw new Error('Échec de l\'initiation de l\'appel');
      }

    } catch (error) {
      console.error('❌ Erreur lors de l\'appel:', error);
      // Arrêter la surveillance en cas d'erreur
      simSelectionService.stopMonitoring();
      
      return {
        success: false,
        message: `Erreur lors de l'appel: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      };
    }
  }

  // Envoyer un SMS
  async sendSms(phoneNumber: string, message: string): Promise<PhoneCallResult> {
    if (!this.connectionState.isConnected || !this.connectionState.adb) {
      return {
        success: false,
        message: 'Aucun appareil Android connecté'
      };
    }

    try {
      console.log(`💬 Tentative d'envoi SMS vers ${phoneNumber}`);
      
      // Nettoyer le numéro de téléphone
      const cleanNumber = phoneNumber.replace(/[^\d+]/g, '');
      
      // Exécuter la commande ADB pour ouvrir l'app SMS
      const command = `am start -a android.intent.action.SENDTO -d sms:${cleanNumber} --es sms_body "${message.replace(/"/g, '\\"')}"`;
      const result = await this.executeShellCommand(command);
      
      if (result.includes('Starting') || result.includes('Activity')) {
        console.log('✅ Application SMS ouverte avec succès');
        return {
          success: true,
          message: `SMS préparé pour ${phoneNumber}`
        };
      } else {
        throw new Error('Échec de l\'ouverture de l\'application SMS');
      }

    } catch (error) {
      console.error('❌ Erreur lors de l\'envoi SMS:', error);
      return {
        success: false,
        message: `Erreur lors de l'envoi SMS: ${error instanceof Error ? error.message : 'Erreur inconnue'}`
      };
    }
  }

  // Mettre à jour l'état de la batterie
  async updateBatteryStatus(): Promise<void> {
    if (!this.connectionState.isConnected || !this.connectionState.adb) {
      return;
    }

    try {
      // Obtenir les informations de la batterie
      const batteryInfo = await this.executeShellCommand('dumpsys battery');
      
      // Parser le niveau de batterie
      const levelMatch = batteryInfo.match(/level: (\d+)/);
      const chargingMatch = batteryInfo.match(/AC powered: (true|false)/);
      
      if (levelMatch) {
        this.connectionState.batteryLevel = parseInt(levelMatch[1]);
      }
      
      if (chargingMatch) {
        this.connectionState.isCharging = chargingMatch[1] === 'true';
      }
      
      this.notifyListeners();
      
    } catch (error) {
      console.warn('Erreur lors de la récupération du statut de la batterie:', error);
    }
  }

  // Exécuter une commande shell sur l'appareil
  private async executeShellCommand(command: string): Promise<string> {
    if (!this.connectionState.adb) {
      throw new Error('Aucune connexion ADB active');
    }

    try {
      // Exécuter la commande shell via ADB
      // L'API peut varier selon la version, on essaie plusieurs approches
      let result = '';
      
      if (this.connectionState.adb.subprocess) {
        // Approche v2.x
        const subprocess = await this.connectionState.adb.subprocess.shell(command);
        const reader = subprocess.stdout.pipeThrough(new TextDecoderStream()).getReader();
        const output = await reader.read();
        result = output.value || '';
        reader.releaseLock();
      } else if (this.connectionState.adb.shell) {
        // Approche alternative
        result = await this.connectionState.adb.shell(command);
      } else {
        throw new Error('API shell non disponible');
      }
      
      return result;
      
    } catch (error) {
      console.error('Erreur lors de l\'exécution de la commande shell:', error);
      throw error;
    }
  }

  // Obtenir l'état actuel de la connexion
  getConnectionState(): AdbConnectionState {
    return { ...this.connectionState };
  }

  // Vérifier si WebUSB est supporté
  isWebUsbSupported(): boolean {
    return this.isWebUsbAvailable;
  }

  // Méthode pour tester la connexion
  async testConnection(): Promise<boolean> {
    if (!this.connectionState.isConnected) {
      return false;
    }

    try {
      const result = await this.executeShellCommand('echo "test"');
      return result.includes('test');
    } catch {
      return false;
    }
  }
}

// Instance singleton
export const adbService = new AdbService(); 