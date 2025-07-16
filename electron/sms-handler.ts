import { ipcMain, app } from 'electron'
import { exec } from 'child_process'
import { promisify } from 'util'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'

const execPromise = promisify(exec)

/**
 * Détermine le chemin absolu vers le binaire ADB livré avec l'application.
 */
function getAdbPath(): string {
  const platform = process.platform
  const adbFile = platform === 'win32' ? 'adb.exe' : 'adb'

  if (is.dev) {
    const basePath = app.getAppPath()
    if (platform === 'win32') {
      return join(basePath, 'platform-tools-latest-windows (4)', 'platform-tools', adbFile)
    } else if (platform === 'darwin') {
      return join(basePath, 'platform-tools-latest-darwin (2)', 'platform-tools', adbFile)
    }
    return join(basePath, 'platform-tools', adbFile)
  }

  return join(process.resourcesPath, 'platform-tools', adbFile)
}

/**
 * Enregistre les handlers IPC nécessaires.
 */
export function setupSmsHandler(): void {
  console.log('📨 Enregistrement du handler IPC "adb:send-sms"')

  ipcMain.handle('adb:send-sms', async (event, phoneNumber: string, message: string) => {
    console.log('--- [SMS Handler] Début ---');
    if (!phoneNumber || !message) {
      console.error('[SMS Handler] ❌ Erreur: Numéro ou message manquant.');
      throw new Error('Numéro de téléphone ou message manquant')
    }

    console.log(`[SMS Handler] 📞 Numéro reçu: ${phoneNumber}`);
    console.log(`[SMS Handler] 📝 Message reçu (longueur: ${message.length}):\n---\n${message}\n---`);

    const cleanNumber = String(phoneNumber).replace(/[^\d+]/g, '')

    const encodedMessage = encodeURIComponent(message)
    console.log(`[SMS Handler] 📦 Message encodé (longueur: ${encodedMessage.length})`);

    const adbPath = getAdbPath()
    const command = `"${adbPath}" shell am start -a android.intent.action.SENDTO -d "sms:${cleanNumber}?body=${encodedMessage}"`

    console.log('[SMS Handler] 📤 Commande ADB finale:\n', command)

    try {
      const { stdout, stderr } = await execPromise(command)
      if (stderr && stderr.trim().length > 0) {
        console.warn('[sms-handler] ⚠️ STDERR ADB:', stderr)
      }
      console.log('[sms-handler] ✅ STDOUT ADB:', stdout)
      console.log('--- [SMS Handler] Fin ---');
      return { success: true, stdout, stderr }
    } catch (error) {
      console.error('[SMS Handler] ❌ Erreur lors de l\'exécution ADB:', error)
      console.log('--- [SMS Handler] Fin (avec erreur) ---');
      const err = error as Error
      throw new Error(err.message || String(err))
    }
  })
} 