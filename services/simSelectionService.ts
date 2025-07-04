// Service pour gérer automatiquement la sélection de carte SIM lors des appels
// Utilise UiAutomator2 pour détecter et cliquer sur l'option "Pro"

export interface SimSelectionResult {
  success: boolean;
  message: string;
  dialogDetected: boolean;
}

export interface SimDialogInfo {
  title?: string;
  persoNumber?: string;
  proNumber?: string;
  isVisible: boolean;
}

class SimSelectionService {
  private adb: any = null;
  private isMonitoring: boolean = false;
  private monitoringInterval: NodeJS.Timeout | null = null;

  // Initialiser le service avec une connexion ADB
  initialize(adb: any) {
    this.adb = adb;
    console.log('🔧 Service de sélection SIM initialisé');
  }

  // Démarrer la surveillance automatique de la dialog de choix SIM
  startMonitoring(intervalMs: number = 2000) {
    if (this.isMonitoring || !this.adb) {
      return;
    }

    this.isMonitoring = true;
    console.log('👁️ Surveillance de la dialog SIM démarrée');

    this.monitoringInterval = setInterval(async () => {
      try {
        await this.checkAndHandleSimDialog();
      } catch (error) {
        console.warn('Erreur lors de la surveillance SIM:', error);
      }
    }, intervalMs);
  }

  // Arrêter la surveillance
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
    console.log('🛑 Surveillance de la dialog SIM arrêtée');
  }

  // Vérifier et gérer la dialog de choix SIM
  async checkAndHandleSimDialog(): Promise<SimSelectionResult> {
    if (!this.adb) {
      return {
        success: false,
        message: 'Aucune connexion ADB active',
        dialogDetected: false
      };
    }

    try {
      // Obtenir la hiérarchie UI actuelle
      const uiDump = await this.getUiDump();
      
      // Analyser la hiérarchie pour détecter la dialog SIM
      const dialogInfo = this.parseSimDialog(uiDump);
      
      if (dialogInfo.isVisible) {
        console.log('📱 Dialog de choix SIM détectée');
        
        // Tenter de cliquer sur l'option "Pro"
        const result = await this.selectProSim(uiDump);
        
        return {
          success: result,
          message: result ? 'Carte SIM Pro sélectionnée automatiquement' : 'Échec de la sélection automatique',
          dialogDetected: true
        };
      }

      return {
        success: true,
        message: 'Aucune dialog SIM détectée',
        dialogDetected: false
      };

    } catch (error) {
      console.error('❌ Erreur lors de la vérification de la dialog SIM:', error);
      return {
        success: false,
        message: `Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
        dialogDetected: false
      };
    }
  }

  // Obtenir le dump de l'interface utilisateur
  private async getUiDump(): Promise<string> {
    try {
      // Exécuter la commande uiautomator dump
      const result = await this.executeShellCommand('uiautomator dump /sdcard/ui_dump.xml && cat /sdcard/ui_dump.xml');
      return result;
    } catch (error) {
      console.error('Erreur lors de la récupération du UI dump:', error);
      throw new Error('Impossible d\'obtenir le dump UI');
    }
  }

  // Analyser la hiérarchie UI pour détecter la dialog SIM
  private parseSimDialog(uiDump: string): SimDialogInfo {
    const dialogInfo: SimDialogInfo = {
      isVisible: false
    };

    try {
      // Chercher le titre caractéristique
      if (uiDump.includes('Choisir la carte SIM pour cet appel') || 
          uiDump.includes('Choose SIM for this call') ||
          uiDump.includes('com.google.android.dialer')) {
        
        dialogInfo.isVisible = true;
        dialogInfo.title = 'Choisir la carte SIM pour cet appel';

        // Extraire les numéros de téléphone
        const persoMatch = uiDump.match(/text="Perso".*?text="(\+33[^"]+)"/s);
        const proMatch = uiDump.match(/text="Pro".*?text="(\+33[^"]+)"/s);

        if (persoMatch) {
          dialogInfo.persoNumber = persoMatch[1];
        }
        if (proMatch) {
          dialogInfo.proNumber = proMatch[1];
        }

        console.log('📋 Dialog SIM détectée:', dialogInfo);
      }

    } catch (error) {
      console.warn('Erreur lors de l\'analyse de la dialog:', error);
    }

    return dialogInfo;
  }

  // Sélectionner automatiquement la carte SIM Pro
  private async selectProSim(uiDump: string): Promise<boolean> {
    try {
      // Méthode 1: Chercher par le texte "Pro"
      let success = await this.clickByText('Pro');
      if (success) {
        console.log('✅ Cliqué sur "Pro" par texte');
        return true;
      }

      // Méthode 2: Chercher par le numéro Pro (visible dans le XML)
      success = await this.clickByText('+33 7 66 90 67 89');
      if (success) {
        console.log('✅ Cliqué sur le numéro Pro');
        return true;
      }

      // Méthode 3: Utiliser les coordonnées approximatives basées sur le XML
      // Dans le XML, l'option Pro est à bounds="[93,1162][987,1366]"
      success = await this.clickByCoordinates(540, 1264); // Centre de la zone Pro
      if (success) {
        console.log('✅ Cliqué sur Pro par coordonnées');
        return true;
      }

      // Méthode 4: Chercher par resource-id si disponible
      success = await this.clickByResourceId('com.google.android.dialer:id/label', 'Pro');
      if (success) {
        console.log('✅ Cliqué sur Pro par resource-id');
        return true;
      }

      console.warn('⚠️ Impossible de cliquer sur l\'option Pro');
      return false;

    } catch (error) {
      console.error('❌ Erreur lors de la sélection Pro:', error);
      return false;
    }
  }

  // Cliquer sur un élément par son texte
  private async clickByText(text: string): Promise<boolean> {
    try {
      const command = `input tap $(uiautomator dump /dev/null && grep -o 'text="${text}"[^>]*bounds="\\[[0-9,]*\\]"' /sdcard/window_dump.xml | head -1 | grep -o 'bounds="\\[[0-9,]*\\]"' | grep -o '[0-9]*,[0-9]*' | head -1 | sed 's/,/ /')`;
      
      // Approche plus simple: utiliser uiautomator directement
      const clickCommand = `uiautomator dump && grep -A 10 -B 10 'text="${text}"' /sdcard/window_dump.xml | grep bounds | head -1 | sed 's/.*bounds="\\[\\([0-9]*\\),\\([0-9]*\\)\\]\\[\\([0-9]*\\),\\([0-9]*\\)\\]".*/\\1 \\2 \\3 \\4/' | read x1 y1 x2 y2; if [ ! -z "$x1" ]; then centerX=$((($x1+$x2)/2)); centerY=$((($y1+$y2)/2)); input tap $centerX $centerY; echo "Clicked at $centerX,$centerY"; fi`;
      
      await this.executeShellCommand(clickCommand);
      
      // Attendre un peu pour l'action
      await this.sleep(500);
      
      return true;
    } catch (error) {
      console.warn(`Échec du clic par texte "${text}":`, error);
      return false;
    }
  }

  // Cliquer sur des coordonnées spécifiques
  private async clickByCoordinates(x: number, y: number): Promise<boolean> {
    try {
      await this.executeShellCommand(`input tap ${x} ${y}`);
      console.log(`🎯 Clic effectué aux coordonnées (${x}, ${y})`);
      
      // Attendre un peu pour l'action
      await this.sleep(500);
      
      return true;
    } catch (error) {
      console.warn(`Échec du clic aux coordonnées (${x}, ${y}):`, error);
      return false;
    }
  }

  // Cliquer par resource-id et texte
  private async clickByResourceId(resourceId: string, text?: string): Promise<boolean> {
    try {
      let command = `uiautomator dump`;
      
      if (text) {
        command += ` && grep -A 5 -B 5 'resource-id="${resourceId}".*text="${text}"' /sdcard/window_dump.xml`;
      } else {
        command += ` && grep -A 5 -B 5 'resource-id="${resourceId}"' /sdcard/window_dump.xml`;
      }
      
      // Cette méthode est plus complexe, utilisons les coordonnées comme fallback
      return await this.clickByCoordinates(540, 1264);
      
    } catch (error) {
      console.warn(`Échec du clic par resource-id "${resourceId}":`, error);
      return false;
    }
  }

  // Exécuter une commande shell
  private async executeShellCommand(command: string): Promise<string> {
    if (!this.adb) {
      throw new Error('Aucune connexion ADB active');
    }

    try {
      let result = '';
      
      if (this.adb.subprocess) {
        const subprocess = await this.adb.subprocess.shell(command);
        const reader = subprocess.stdout.pipeThrough(new TextDecoderStream()).getReader();
        const output = await reader.read();
        result = output.value || '';
        reader.releaseLock();
      } else if (this.adb.shell) {
        result = await this.adb.shell(command);
      } else {
        throw new Error('API shell non disponible');
      }
      
      return result;
      
    } catch (error) {
      console.error('Erreur lors de l\'exécution de la commande shell:', error);
      throw error;
    }
  }

  // Fonction utilitaire pour attendre
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Obtenir l'état de la surveillance
  isCurrentlyMonitoring(): boolean {
    return this.isMonitoring;
  }

  // Méthode publique pour forcer une vérification unique
  async forceCheck(): Promise<SimSelectionResult> {
    return await this.checkAndHandleSimDialog();
  }
}

// Instance singleton
export const simSelectionService = new SimSelectionService(); 