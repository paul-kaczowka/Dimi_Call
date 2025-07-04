#!/usr/bin/env node
// Script d'analyse du XML fourni pour optimiser la sélection SIM Pro

const fs = require('fs');
const path = require('path');

console.log('🧪 Analyse approfondie du XML fourni pour la sélection SIM Pro\n');

// Analyser le fichier XML fourni
const xmlPath = path.join(__dirname, '..', 'window_dump (2).xml');

if (!fs.existsSync(xmlPath)) {
  console.log('❌ Fichier XML non trouvé:', xmlPath);
  process.exit(1);
}

const xmlContent = fs.readFileSync(xmlPath, 'utf-8');

console.log('📊 ANALYSE DU XML FOURNI');
console.log('========================\n');

// Analyse générale
console.log('📱 Informations générales:');
console.log('- Package:', xmlContent.includes('com.google.android.dialer') ? 'Google Dialer ✅' : 'Autre');
console.log('- Titre:', xmlContent.includes('Choisir la carte SIM pour cet appel') ? 'Détecté ✅' : 'Non détecté');
console.log('- Options SIM:', 
  xmlContent.includes('text="Pro"') && xmlContent.includes('text="Perso"') ? 'Pro & Perso détectés ✅' : 'Problème');

console.log('\n🎯 ANALYSE DES COORDONNÉES');
console.log('========================\n');

// Extraire les coordonnées de l'option Pro
const proTextMatch = xmlContent.match(/text="Pro"[^>]*bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/);
if (proTextMatch) {
  const [, x1, y1, x2, y2] = proTextMatch.map(Number);
  const centerX = Math.round((x1 + x2) / 2);
  const centerY = Math.round((y1 + y2) / 2);
  
  console.log('📍 Coordonnées du texte "Pro":');
  console.log(`   Bounds: [${x1},${y1}][${x2},${y2}]`);
  console.log(`   Centre: (${centerX}, ${centerY})`);
  console.log(`   Largeur: ${x2 - x1}px, Hauteur: ${y2 - y1}px`);
}

// Extraire les coordonnées du container parent de Pro
const proContainerPattern = /text="Pro"[\s\S]*?class="android\.widget\.LinearLayout"[^>]*bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/;
const proContainerMatch = xmlContent.match(proContainerPattern);

if (proContainerMatch) {
  const [, x1, y1, x2, y2] = proContainerMatch.map(Number);
  const centerX = Math.round((x1 + x2) / 2);
  const centerY = Math.round((y1 + y2) / 2);
  
  console.log('\n📍 Coordonnées du container Pro (LinearLayout):');
  console.log(`   Bounds: [${x1},${y1}][${x2},${y2}]`);
  console.log(`   Centre: (${centerX}, ${centerY})`);
  console.log(`   Largeur: ${x2 - x1}px, Hauteur: ${y2 - y1}px`);
}

// Extraire les numéros de téléphone et leurs coordonnées
console.log('\n📱 NUMÉROS DE TÉLÉPHONE');
console.log('======================\n');

const proNumberMatch = xmlContent.match(/text="\+33 7 66 90 67 89"[^>]*bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/);
if (proNumberMatch) {
  const [, x1, y1, x2, y2] = proNumberMatch.map(Number);
  const centerX = Math.round((x1 + x2) / 2);
  const centerY = Math.round((y1 + y2) / 2);
  
  console.log('📞 Numéro Pro (+33 7 66 90 67 89):');
  console.log(`   Bounds: [${x1},${y1}][${x2},${y2}]`);
  console.log(`   Centre: (${centerX}, ${centerY})`);
}

const persoNumberMatch = xmlContent.match(/text="\+33 7 69 35 27 28"[^>]*bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/);
if (persoNumberMatch) {
  const [, x1, y1, x2, y2] = persoNumberMatch.map(Number);
  const centerX = Math.round((x1 + x2) / 2);
  const centerY = Math.round((y1 + y2) / 2);
  
  console.log('\n📞 Numéro Perso (+33 7 69 35 27 28):');
  console.log(`   Bounds: [${x1},${y1}][${x2},${y2}]`);
  console.log(`   Centre: (${centerX}, ${centerY})`);
}

// Proposer une stratégie optimisée
console.log('\n🎯 STRATÉGIE RECOMMANDÉE');
console.log('=======================\n');

console.log('Ordre de priorité des coordonnées à tester:');

if (proTextMatch) {
  const [, x1, y1, x2, y2] = proTextMatch.map(Number);
  const centerX = Math.round((x1 + x2) / 2);
  const centerY = Math.round((y1 + y2) / 2);
  console.log(`1. 🎯 Centre du texte "Pro": (${centerX}, ${centerY}) - PRIORITÉ MAX`);
}

if (proContainerMatch) {
  const [, x1, y1, x2, y2] = proContainerMatch.map(Number);
  const centerX = Math.round((x1 + x2) / 2);
  const centerY = Math.round((y1 + y2) / 2);
  console.log(`2. 📦 Centre du container Pro: (${centerX}, ${centerY}) - PRIORITÉ HAUTE`);
}

if (proNumberMatch) {
  const [, x1, y1, x2, y2] = proNumberMatch.map(Number);
  const centerX = Math.round((x1 + x2) / 2);
  const centerY = Math.round((y1 + y2) / 2);
  console.log(`3. 📞 Centre du numéro Pro: (${centerX}, ${centerY}) - PRIORITÉ MOYENNE`);
}

// Générer une grille de coordonnées de fallback
console.log('\n🕸️ GRILLE DE FALLBACK');
console.log('====================\n');

if (proContainerMatch) {
  const [, x1, y1, x2, y2] = proContainerMatch.map(Number);
  
  console.log('Points de grille dans la zone Pro (container):');
  const gridPoints = [];
  
  // Grille 3x3 dans le container Pro
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      const x = Math.round(x1 + (x2 - x1) * (col + 1) / 4);
      const y = Math.round(y1 + (y2 - y1) * (row + 1) / 4);
      gridPoints.push({ x, y, name: `Grille[${row},${col}]` });
    }
  }
  
  gridPoints.forEach((point, index) => {
    console.log(`${index + 4}. ${point.name}: (${point.x}, ${point.y})`);
  });
}

// Résumé de l'implémentation
console.log('\n💡 IMPLÉMENTATION RECOMMANDÉE');
console.log('=============================\n');

console.log('Dans le service simSelectionService.ts, utiliser cette séquence:');
console.log('');
console.log('```typescript');
console.log('const coordinates = [');
if (proTextMatch) {
  const [, x1, y1, x2, y2] = proTextMatch.map(Number);
  const centerX = Math.round((x1 + x2) / 2);
  const centerY = Math.round((y1 + y2) / 2);
  console.log(`  { x: ${centerX}, y: ${centerY}, name: "Centre texte Pro" },`);
}
if (proContainerMatch) {
  const [, x1, y1, x2, y2] = proContainerMatch.map(Number);
  const centerX = Math.round((x1 + x2) / 2);
  const centerY = Math.round((y1 + y2) / 2);
  console.log(`  { x: ${centerX}, y: ${centerY}, name: "Centre container Pro" },`);
}
if (proNumberMatch) {
  const [, x1, y1, x2, y2] = proNumberMatch.map(Number);
  const centerX = Math.round((x1 + x2) / 2);
  const centerY = Math.round((y1 + y2) / 2);
  console.log(`  { x: ${centerX}, y: ${centerY}, name: "Centre numéro Pro" },`);
}
console.log('];');
console.log('```');

console.log('\n✨ Analyse terminée ! Utilisez ces coordonnées dans votre service.');
console.log('\n🚀 Pour tester: npm run test:sim'); 