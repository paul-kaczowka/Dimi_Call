#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🛠️  Génération d\'icônes robuste pour DimiCall');

const sourceImage = 'DDD.png';
const buildDir = 'build';

// Vérifier que l'image source existe
if (!fs.existsSync(sourceImage)) {
  console.error(`❌ Erreur: Image source ${sourceImage} introuvable`);
  process.exit(1);
}

// Créer le dossier build s'il n'existe pas
if (!fs.existsSync(buildDir)) {
  fs.mkdirSync(buildDir, { recursive: true });
}

console.log('✅ Image source trouvée:', sourceImage);

// Essayer d'abord electron-icon-builder (plus direct)
try {
  console.log('🔄 Tentative avec electron-icon-builder...');
  execSync(`npx electron-icon-builder --input=${sourceImage} --output=${buildDir} --flatten`, { 
    stdio: 'pipe' 
  });
  
  // Vérifier que les icônes ont été générées correctement
  if (fs.existsSync(path.join(buildDir, 'icon.ico')) && 
      fs.existsSync(path.join(buildDir, 'icon.icns'))) {
    console.log('✅ Icônes générées avec succès par electron-icon-builder');
    console.log('  ✓ build/icon.ico');
    console.log('  ✓ build/icon.icns');
    process.exit(0);
  }
} catch (error) {
  console.log('⚠️  electron-icon-builder a échoué, tentative avec electron-icon-maker...');
}

// Fallback avec electron-icon-maker
try {
  console.log('🔄 Tentative avec electron-icon-maker...');
  execSync(`npx electron-icon-maker --input=${sourceImage} --output=${buildDir}`, { 
    stdio: 'pipe' 
  });
  
  // Copier les icônes aux bons endroits
  const macIcon = path.join(buildDir, 'icons', 'mac', 'icon.icns');
  const winIcon = path.join(buildDir, 'icons', 'win', 'icon.ico');
  const targetMacIcon = path.join(buildDir, 'icon.icns');
  const targetWinIcon = path.join(buildDir, 'icon.ico');
  
  if (fs.existsSync(macIcon)) {
    fs.copyFileSync(macIcon, targetMacIcon);
    console.log('✅ Icône macOS copiée:', targetMacIcon);
  }
  
  if (fs.existsSync(winIcon)) {
    fs.copyFileSync(winIcon, targetWinIcon);
    console.log('✅ Icône Windows copiée:', targetWinIcon);
  }
  
  // Vérification finale
  if (fs.existsSync(targetWinIcon) && fs.existsSync(targetMacIcon)) {
    console.log('✅ Icônes générées avec succès par electron-icon-maker');
    console.log('  ✓ build/icon.ico');
    console.log('  ✓ build/icon.icns');
    process.exit(0);
  }
  
} catch (error) {
  console.error('❌ electron-icon-maker a également échoué');
}

// Dernière tentative : copier les icônes existantes si elles existent déjà
console.log('⚠️  Tentative de récupération des icônes existantes...');

const existingIcons = [
  'logo-D.ico',
  'NewD.ico', 
  'Group-2.ico'
];

for (const iconFile of existingIcons) {
  if (fs.existsSync(iconFile)) {
    console.log(`📋 Utilisation de l'icône existante: ${iconFile}`);
    fs.copyFileSync(iconFile, path.join(buildDir, 'icon.ico'));
    
    // Pour macOS, on peut créer un .icns minimal à partir du .ico
    // Ou utiliser une icône .icns existante si disponible
    const icnsSource = path.join(buildDir, 'icon.icns');
    if (!fs.existsSync(icnsSource)) {
      // Créer un placeholder icns ou utiliser une icône existante
      if (fs.existsSync('build/icon.icns')) {
        console.log('✅ Icône macOS existante trouvée');
      } else {
        console.log('⚠️  Création d\'un placeholder pour macOS...');
        // Copier l'ico comme fallback temporaire
        fs.copyFileSync(iconFile, icnsSource);
      }
    }
    
    console.log('✅ Icônes de secours configurées');
    process.exit(0);
  }
}

console.error('❌ Impossible de générer ou trouver des icônes');
console.error('💡 Assurez-vous que:');
console.error('   - Le fichier DDD.png existe et fait au moins 1024x1024px');
console.error('   - Les packages electron-icon-builder ou electron-icon-maker sont installés');
process.exit(1); 