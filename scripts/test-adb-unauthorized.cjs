#!/usr/bin/env node

/**
 * Script de test pour vérifier le diagnostic des problèmes d'autorisation ADB
 * Usage: node scripts/test-adb-unauthorized.js
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🔧 Script de Test - Diagnostic Autorisation ADB');
console.log('================================================\n');

// Fonction pour exécuter des commandes ADB
function runAdbCommand(args) {
  return new Promise((resolve, reject) => {
    const adbPath = path.join(__dirname, '..', 'platform-tools-latest-windows (4)', 'platform-tools', 'adb.exe');
    
    console.log(`📱 Exécution: adb ${args.join(' ')}`);
    
    const adb = spawn(adbPath, args, { stdio: 'pipe' });
    
    let stdout = '';
    let stderr = '';
    
    adb.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    adb.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    adb.on('close', (code) => {
      resolve({ code, stdout, stderr });
    });
    
    adb.on('error', (error) => {
      reject(error);
    });
  });
}

// Fonction pour vérifier les clés ADB
function checkAdbKeys() {
  const os = require('os');
  const androidFolder = path.join(os.homedir(), '.android');
  const adbKeyPath = path.join(androidFolder, 'adbkey');
  const adbKeyPubPath = path.join(androidFolder, 'adbkey.pub');
  
  console.log('🔍 Vérification des clés ADB...');
  console.log(`   Dossier .android: ${androidFolder}`);
  console.log(`   Clé privée: ${fs.existsSync(adbKeyPath) ? '✅ Existe' : '❌ Absent'}`);
  console.log(`   Clé publique: ${fs.existsSync(adbKeyPubPath) ? '✅ Existe' : '❌ Absent'}`);
  
  return {
    hasPrivateKey: fs.existsSync(adbKeyPath),
    hasPublicKey: fs.existsSync(adbKeyPubPath),
    androidFolder,
    adbKeyPath,
    adbKeyPubPath
  };
}

// Fonction de test principale
async function runTests() {
  try {
    console.log('1️⃣ Test de connexion ADB de base...');
    
    // Test 1: Vérifier que ADB fonctionne
    const versionResult = await runAdbCommand(['version']);
    if (versionResult.code === 0) {
      console.log('✅ ADB est opérationnel');
      console.log(`   Version: ${versionResult.stdout.split('\n')[0]}`);
    } else {
      console.log('❌ ADB non opérationnel');
      console.log(`   Erreur: ${versionResult.stderr}`);
      return;
    }
    
    console.log('\n2️⃣ Test de détection d\'appareils...');
    
    // Test 2: Lister les appareils
    const devicesResult = await runAdbCommand(['devices', '-l']);
    console.log('📱 Résultat adb devices:');
    console.log(devicesResult.stdout);
    
    // Analyser les appareils
    const devices = [];
    const lines = devicesResult.stdout.split('\n');
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line && !line.startsWith('*')) {
        const parts = line.split(/\s+/);
        if (parts.length >= 2) {
          devices.push({
            serial: parts[0],
            status: parts[1],
            fullLine: line
          });
        }
      }
    }
    
    console.log(`\n📊 Appareils trouvés: ${devices.length}`);
    devices.forEach((device, index) => {
      console.log(`   ${index + 1}. ${device.serial} - Status: ${device.status}`);
      
      if (device.status === 'unauthorized') {
        console.log('      ⚠️  APPAREIL NON AUTORISÉ DÉTECTÉ !');
      } else if (device.status === 'device') {
        console.log('      ✅ Appareil autorisé');
      } else {
        console.log(`      ❓ Status inconnu: ${device.status}`);
      }
    });
    
    console.log('\n3️⃣ Vérification des clés d\'autorisation...');
    
    // Test 3: Vérifier les clés ADB
    const keyInfo = checkAdbKeys();
    
    console.log('\n4️⃣ Test de simulation de nettoyage...');
    
    // Test 4: Simuler le processus de nettoyage (sans vraiment supprimer)
    if (keyInfo.hasPrivateKey || keyInfo.hasPublicKey) {
      console.log('🧹 Simulation du nettoyage des clés...');
      console.log('   Les fichiers suivants seraient supprimés :');
      if (keyInfo.hasPrivateKey) {
        console.log(`   - ${keyInfo.adbKeyPath}`);
      }
      if (keyInfo.hasPublicKey) {
        console.log(`   - ${keyInfo.adbKeyPubPath}`);
      }
      console.log('   (Simulation seulement - aucun fichier supprimé)');
    } else {
      console.log('✨ Aucune clé à nettoyer (déjà propre)');
    }
    
    console.log('\n5️⃣ Test de redémarrage du serveur ADB...');
    
    // Test 5: Redémarrage du serveur ADB
    console.log('🔄 Arrêt du serveur ADB...');
    const killResult = await runAdbCommand(['kill-server']);
    
    if (killResult.code === 0) {
      console.log('✅ Serveur ADB arrêté');
    } else {
      console.log('⚠️ Erreur lors de l\'arrêt du serveur ADB');
    }
    
    console.log('🚀 Redémarrage du serveur ADB...');
    const startResult = await runAdbCommand(['start-server']);
    
    if (startResult.code === 0) {
      console.log('✅ Serveur ADB redémarré');
    } else {
      console.log('❌ Erreur lors du redémarrage du serveur ADB');
    }
    
    // Attendre un peu puis re-vérifier les appareils
    console.log('\n⏳ Attente de 2 secondes...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log('\n6️⃣ Vérification post-redémarrage...');
    const finalDevicesResult = await runAdbCommand(['devices', '-l']);
    console.log('📱 Appareils après redémarrage:');
    console.log(finalDevicesResult.stdout);
    
    // Résumé
    console.log('\n📋 RÉSUMÉ DU TEST');
    console.log('=================');
    console.log(`✅ ADB opérationnel: ${versionResult.code === 0 ? 'Oui' : 'Non'}`);
    console.log(`📱 Appareils détectés: ${devices.length}`);
    console.log(`⚠️  Appareils non autorisés: ${devices.filter(d => d.status === 'unauthorized').length}`);
    console.log(`✅ Appareils autorisés: ${devices.filter(d => d.status === 'device').length}`);
    console.log(`🔑 Clés ADB présentes: ${keyInfo.hasPrivateKey && keyInfo.hasPublicKey ? 'Oui' : 'Non'}`);
    
    const unauthorizedDevices = devices.filter(d => d.status === 'unauthorized');
    if (unauthorizedDevices.length > 0) {
      console.log('\n🔧 RECOMMANDATIONS');
      console.log('==================');
      console.log('Des appareils non autorisés ont été détectés.');
      console.log('Utilisez DimiCall pour les diagnostiquer automatiquement :');
      console.log('1. Lancez DimiCall');
      console.log('2. Essayez de vous connecter');
      console.log('3. Le dialog de diagnostic devrait s\'ouvrir automatiquement');
      console.log('4. Cliquez sur "Diagnostiquer et Corriger Automatiquement"');
    } else if (devices.length === 0) {
      console.log('\n📝 SUGGESTIONS');
      console.log('==============');
      console.log('Aucun appareil détecté. Vérifiez :');
      console.log('1. Que l\'appareil Android est connecté via USB');
      console.log('2. Que le débogage USB est activé');
      console.log('3. Que le câble USB permet le transfert de données');
    } else {
      console.log('\n🎉 Tous les appareils sont autorisés !');
    }
    
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.message);
  }
}

// Lancer les tests
console.log('Démarrage des tests...\n');
runTests().then(() => {
  console.log('\n🏁 Tests terminés.');
}).catch((error) => {
  console.error('💥 Erreur fatale:', error);
  process.exit(1);
}); 