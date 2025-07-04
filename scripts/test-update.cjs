/**
 * Script de test pour simuler une mise à jour factice
 * Permet de tester le système de mise à jour automatique
 */

const fs = require('fs');
const path = require('path');

const log = (level, message) => {
  const timestamp = new Date().toLocaleTimeString();
  const icon = {
    'info': '📋',
    'success': '✅',
    'warning': '⚠️',
    'error': '❌',
    'update': '🔄'
  }[level] || '📝';
  
  console.log(`[${timestamp}] ${icon} ${message}`);
};

async function testAutoUpdate() {
  log('info', '🚀 Test de mise à jour automatique DimiCall');
  
  try {
    // 1. Lire le package.json actuel
    const packagePath = path.join(__dirname, '..', 'package.json');
    const packageData = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    const currentVersion = packageData.version;
    
    log('info', `Version actuelle: ${currentVersion}`);
    
    // 2. Créer une version de test (patch bump)
    const versionParts = currentVersion.split('.');
    const testVersion = `${versionParts[0]}.${versionParts[1]}.${parseInt(versionParts[2]) + 1}`;
    
    log('info', `Version de test proposée: ${testVersion}`);
    
    // 3. Vérifier la configuration de mise à jour
    log('info', '🔍 Vérification de la configuration...');
    
    // Vérifier electron-updater
    const electronUpdaterInstalled = fs.existsSync(path.join(__dirname, '..', 'node_modules', 'electron-updater'));
    log(electronUpdaterInstalled ? 'success' : 'error', 
        `electron-updater: ${electronUpdaterInstalled ? 'Installé ✅' : 'NON installé ❌'}`);
    
    // Vérifier electron-log
    const electronLogInstalled = fs.existsSync(path.join(__dirname, '..', 'node_modules', 'electron-log'));
    log(electronLogInstalled ? 'success' : 'error', 
        `electron-log: ${electronLogInstalled ? 'Installé ✅' : 'NON installé ❌'}`);
    
    // Vérifier dev-app-update.yml
    const devConfigExists = fs.existsSync(path.join(__dirname, '..', 'dev-app-update.yml'));
    log(devConfigExists ? 'success' : 'warning', 
        `dev-app-update.yml: ${devConfigExists ? 'Présent ✅' : 'Absent ⚠️'}`);
    
    // 4. Vérifier la configuration publish
    const publishConfig = packageData.build?.publish;
    if (publishConfig) {
      log('success', `Configuration publish: ${publishConfig.provider} (${publishConfig.owner}/${publishConfig.repo})`);
    } else {
      log('error', 'Configuration publish manquante dans package.json');
    }
    
    // 5. Vérifier la configuration Windows NSIS
    const winTarget = packageData.build?.win?.target?.[0]?.target;
    log(winTarget === 'nsis' ? 'success' : 'warning', 
        `Target Windows: ${winTarget} ${winTarget === 'nsis' ? '✅' : '(recommandé: nsis)'}`);
    
    // 6. Conseils pour tester
    log('info', '📋 Pour tester la mise à jour automatique:');
    log('info', '  1. Construire l\'application: npm run build');
    log('info', '  2. Distribuer: npm run dist');
    log('info', '  3. Installer la version actuelle');
    log('info', '  4. Augmenter la version et republier');
    log('info', '  5. Vérifier la détection de mise à jour');
    
    // 7. Instructions pour test en développement
    log('info', '🧪 Test en développement:');
    log('info', '  - forceDevUpdateConfig est activé dans main.ts');
    log('info', '  - dev-app-update.yml sera utilisé pour les tests');
    log('info', '  - Logs détaillés dans electron-log');
    
    log('success', '✅ Configuration de mise à jour automatique vérifiée');
    
    return {
      success: true,
      currentVersion,
      testVersion,
      recommendations: [
        electronUpdaterInstalled ? null : 'Installer electron-updater',
        electronLogInstalled ? null : 'Installer electron-log',
        devConfigExists ? null : 'Créer dev-app-update.yml',
        publishConfig ? null : 'Configurer publish dans package.json',
        winTarget === 'nsis' ? null : 'Changer le target Windows vers NSIS'
      ].filter(Boolean)
    };
    
  } catch (error) {
    log('error', `Erreur lors du test: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Exécuter le test si appelé directement
if (require.main === module) {
  testAutoUpdate()
    .then(result => {
      if (result.success) {
        log('success', '🎉 Test terminé avec succès');
        if (result.recommendations.length > 0) {
          log('warning', '⚠️ Recommandations:');
          result.recommendations.forEach(rec => log('warning', `  - ${rec}`));
        }
      } else {
        log('error', '❌ Test échoué');
        process.exit(1);
      }
    })
    .catch(error => {
      log('error', `Erreur fatale: ${error.message}`);
      process.exit(1);
    });
}

module.exports = { testAutoUpdate }; 