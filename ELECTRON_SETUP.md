# Configuration Electron DimiCall

## 🚀 Installation et Lancement

### Prérequis
- Node.js 18+ 
- pnpm (gestionnaire de paquets requis)

### Installation des dépendances
```bash
cd DimiCall
pnpm install
```

### Lancement en développement
```bash
pnpm dev
```

### Build pour production
```bash
# Build général
pnpm build

# Build spécifique Windows
pnpm dist:win

# Build spécifique macOS  
pnpm dist:mac

# Build spécifique Linux
pnpm dist:linux
```

## 🎨 Fonctionnalités

### Barre de titre personnalisée
- ✅ Barre de titre intégrée dans l'interface
- ✅ Boutons minimiser, maximiser/restaurer, fermer
- ✅ Support thème sombre/clair
- ✅ Draggable pour déplacer la fenêtre

### Architecture Electron
```
DimiCall/
├── electron/
│   ├── main.ts          # Processus principal
│   └── preload.ts       # Script de preload sécurisé
├── src/
│   ├── components/
│   │   └── TitleBar.tsx # Barre de titre personnalisée
│   ├── main.tsx         # Point d'entrée React
│   └── App.tsx          # Application principale
└── electron.vite.config.ts # Configuration Electron Vite
```

### Communication IPC
- `app:close` - Fermer l'application
- `app:minimize` - Minimiser la fenêtre
- `app:maximize` - Maximiser/restaurer la fenêtre
- `app:is-maximized` - Vérifier l'état maximisé

### Configuration de fenêtre
- Taille initiale: 1200x670px
- Taille minimale: 800x600px
- Frame natif désactivé (frameless)
- Barre de titre masquée (titleBarStyle: 'hidden')
- Context isolation activée pour la sécurité

## 🛠️ Développement

### Hot Reload
- ✅ HMR pour le processus Renderer (React)
- ✅ Rechargement automatique du processus Main
- ✅ DevTools intégrés

### Scripts disponibles
- `pnpm dev` - Mode développement
- `pnpm build` - Build production
- `pnpm start` - Preview du build
- `pnpm dist` - Package complet

### Structure des contrôles de fenêtre
```tsx
// Utilisation dans le composant
window.electronAPI.closeApp()     // Fermer
window.electronAPI.minimizeApp()  // Minimiser  
window.electronAPI.maximizeApp()  // Maximiser/Restaurer
```

## 🎯 Personnalisation

### Thème de la barre de titre
La barre de titre s'adapte automatiquement au thème de l'application :
- Mode sombre : `bg-gray-900 border-gray-700`
- Mode clair : `bg-gray-50 border-gray-200`

### Icônes et boutons
- Utilise Lucide React pour les icônes
- Survol avec effets de transition
- Bouton fermer avec couleur rouge au survol

## 📦 Packaging

L'application peut être packagée pour :
- Windows (NSIS installer)
- macOS (DMG, support M1/Intel)
- Linux (AppImage)

Les fichiers de sortie sont générés dans le dossier `release/`. 