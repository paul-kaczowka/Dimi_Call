// Script pour générer les icônes PWA
// Utilise Canvas API pour créer des icônes SVG programmatiquement

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration des tailles d'icônes
const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Couleurs du thème
const colors = {
  primary: '#0A84FF',
  background: '#0A0A0A',
  text: '#EAEAEA'
};

// Fonction pour créer un SVG d'icône
function createIconSVG(size) {
  const padding = size * 0.15;
  const iconSize = size - (padding * 2);
  const centerX = size / 2;
  const centerY = size / 2;
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <!-- Arrière-plan avec dégradé -->
  <defs>
    <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${colors.primary};stop-opacity:1" />
      <stop offset="100%" style="stop-color:#0060DF;stop-opacity:1" />
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="2" dy="2" stdDeviation="3" flood-color="rgba(0,0,0,0.3)"/>
    </filter>
  </defs>
  
  <!-- Arrière-plan arrondi -->
  <rect width="${size}" height="${size}" rx="${size * 0.2}" ry="${size * 0.2}" fill="url(#bgGradient)" filter="url(#shadow)"/>
  
  <!-- Icône téléphone stylisée -->
  <g transform="translate(${centerX}, ${centerY})">
    <!-- Corps du téléphone -->
    <rect x="${-iconSize * 0.15}" y="${-iconSize * 0.25}" width="${iconSize * 0.3}" height="${iconSize * 0.5}" 
          rx="${iconSize * 0.05}" ry="${iconSize * 0.05}" fill="${colors.text}" opacity="0.9"/>
    
    <!-- Écran -->
    <rect x="${-iconSize * 0.12}" y="${-iconSize * 0.2}" width="${iconSize * 0.24}" height="${iconSize * 0.35}" 
          rx="${iconSize * 0.02}" ry="${iconSize * 0.02}" fill="${colors.background}" opacity="0.8"/>
    
    <!-- Bouton home -->
    <circle cx="0" cy="${iconSize * 0.2}" r="${iconSize * 0.03}" fill="${colors.text}" opacity="0.7"/>
    
    <!-- Ondes de signal -->
    <g opacity="0.6">
      <path d="M ${iconSize * 0.25} ${-iconSize * 0.1} Q ${iconSize * 0.35} ${-iconSize * 0.2} ${iconSize * 0.25} ${-iconSize * 0.3}" 
            stroke="${colors.text}" stroke-width="${iconSize * 0.02}" fill="none"/>
      <path d="M ${iconSize * 0.3} ${-iconSize * 0.05} Q ${iconSize * 0.45} ${-iconSize * 0.2} ${iconSize * 0.3} ${-iconSize * 0.35}" 
            stroke="${colors.text}" stroke-width="${iconSize * 0.02}" fill="none"/>
      <path d="M ${iconSize * 0.35} 0 Q ${iconSize * 0.55} ${-iconSize * 0.2} ${iconSize * 0.35} ${-iconSize * 0.4}" 
            stroke="${colors.text}" stroke-width="${iconSize * 0.02}" fill="none"/>
    </g>
  </g>
  
  <!-- Texte DimiCall (pour les grandes tailles) -->
  ${size >= 192 ? `
  <text x="${centerX}" y="${size - padding * 0.5}" text-anchor="middle" 
        font-family="Arial, sans-serif" font-size="${size * 0.08}" font-weight="bold" 
        fill="${colors.text}" opacity="0.8">DimiCall</text>
  ` : ''}
</svg>`;
}

// Fonction pour créer les icônes de raccourcis
function createShortcutIcon(type, size = 96) {
  const padding = size * 0.2;
  const iconSize = size - (padding * 2);
  const centerX = size / 2;
  const centerY = size / 2;
  
  let iconContent = '';
  let bgColor = colors.primary;
  
  switch (type) {
    case 'new':
      bgColor = '#30D158'; // Vert
      iconContent = `
        <!-- Icône plus -->
        <rect x="${centerX - iconSize * 0.02}" y="${centerY - iconSize * 0.2}" width="${iconSize * 0.04}" height="${iconSize * 0.4}" fill="${colors.text}"/>
        <rect x="${centerX - iconSize * 0.2}" y="${centerY - iconSize * 0.02}" width="${iconSize * 0.4}" height="${iconSize * 0.04}" fill="${colors.text}"/>
      `;
      break;
    case 'import':
      bgColor = '#FF9F0A'; // Orange
      iconContent = `
        <!-- Icône import -->
        <rect x="${centerX - iconSize * 0.15}" y="${centerY - iconSize * 0.1}" width="${iconSize * 0.3}" height="${iconSize * 0.2}" 
              rx="${iconSize * 0.02}" fill="none" stroke="${colors.text}" stroke-width="${iconSize * 0.02}"/>
        <path d="M ${centerX} ${centerY - iconSize * 0.25} L ${centerX} ${centerY + iconSize * 0.1}" 
              stroke="${colors.text}" stroke-width="${iconSize * 0.03}" marker-end="url(#arrowhead)"/>
        <defs>
          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="${colors.text}"/>
          </marker>
        </defs>
      `;
      break;
  }
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="1" dy="1" stdDeviation="2" flood-color="rgba(0,0,0,0.3)"/>
    </filter>
  </defs>
  
  <!-- Arrière-plan -->
  <rect width="${size}" height="${size}" rx="${size * 0.2}" ry="${size * 0.2}" fill="${bgColor}" filter="url(#shadow)"/>
  
  <!-- Contenu de l'icône -->
  <g>
    ${iconContent}
  </g>
</svg>`;
}

// Créer le dossier icons s'il n'existe pas
const iconsDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Générer toutes les icônes principales
iconSizes.forEach(size => {
  const svg = createIconSVG(size);
  const filename = `icon-${size}x${size}.svg`;
  fs.writeFileSync(path.join(iconsDir, filename), svg);
  console.log(`✅ Généré: ${filename}`);
});

// Générer les icônes de raccourcis
const shortcutIcons = [
  { type: 'new', name: 'shortcut-new.svg' },
  { type: 'import', name: 'shortcut-import.svg' }
];

shortcutIcons.forEach(({ type, name }) => {
  const svg = createShortcutIcon(type);
  fs.writeFileSync(path.join(iconsDir, name), svg);
  console.log(`✅ Généré: ${name}`);
});

// Créer un favicon.ico simple (SVG)
const faviconSVG = createIconSVG(32);
fs.writeFileSync(path.join(iconsDir, 'favicon.svg'), faviconSVG);
console.log(`✅ Généré: favicon.svg`);

// Créer un apple-touch-icon
const appleTouchIcon = createIconSVG(180);
fs.writeFileSync(path.join(iconsDir, 'apple-touch-icon.svg'), appleTouchIcon);
console.log(`✅ Généré: apple-touch-icon.svg`);

console.log('\n🎉 Toutes les icônes PWA ont été générées avec succès !');
console.log(`📁 Emplacement: ${iconsDir}`);
console.log('\n📋 Icônes générées:');
console.log('   • Icônes principales:', iconSizes.map(s => `${s}x${s}`).join(', '));
console.log('   • Icônes de raccourcis: nouveau contact, import');
console.log('   • Favicon et Apple Touch Icon');
console.log('\n💡 Conseil: Vous pouvez convertir les SVG en PNG avec un outil comme ImageMagick si nécessaire.'); 