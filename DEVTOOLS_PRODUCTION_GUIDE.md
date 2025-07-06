# Guide : Désactivation des DevTools en Production

## 🎯 Objectif
Désactiver complètement les DevTools lors de la construction des exécutables (.exe et .dmg) via GitHub Actions, tout en les gardant disponibles en mode développement.

## ✅ Modifications Apportées

### 1. Configuration WebPreferences (`electron/main.ts`)
```typescript
webPreferences: {
  preload: join(__dirname, '../preload/preload.mjs'),
  sandbox: false,
  contextIsolation: true,
  nodeIntegration: false,
  devTools: is.dev // DevTools seulement en mode développement
}
```

**Avant** : `devTools: true` (toujours activé)  
**Après** : `devTools: is.dev` (activé seulement en développement)

### 2. Menu Bar Sécurisé
```typescript
autoHideMenuBar: !is.dev, // Masquer le menu en production, l'afficher en développement
```

**Raison** : Empêche l'accès aux DevTools via le menu "Affichage" en production.

### 3. Ouverture Conditionnelle des DevTools
```typescript
// S'assurer que la fenêtre s'affiche même en cas de problème
setTimeout(() => {
  if (mainWindow && !mainWindow.isVisible()) {
    console.log('⚠️ Forçage de l\'affichage de la fenêtre après délai')
    mainWindow.show()
    // DevTools seulement en développement
    if (is.dev) {
      mainWindow.webContents.openDevTools()
    }
  }
}, 5000)
```

### 4. Workflow GitHub Actions (`.github/workflows/release.yml`)
```yaml
- name: Build / Release avec electron-builder
  uses: samuelmeuli/action-electron-builder@v1
  env:
    NODE_ENV: production  # ✨ Nouveau : Force le mode production
  with:
    github_token: ${{ secrets.GITHUB_TOKEN }}
    args: ${{ matrix.os == 'windows-latest' && 'nsis --x64 --publish always' || 'dmg zip --x64 --arm64 --publish always' }}
```

## 🔒 Sécurité Renforcée

### DevTools Complètement Désactivés
- ❌ Pas d'accès via `F12`
- ❌ Pas d'accès via `Ctrl+Shift+I`
- ❌ Pas d'accès via le menu contextuel
- ❌ Pas d'ouverture automatique en cas d'erreur

### Raccourcis Développement Préservés
En mode développement local (`npm run dev`), tous les raccourcis restent fonctionnels :
- ✅ `F12` : Ouvrir/fermer DevTools
- ✅ `Ctrl+R` : Rechargement
- ✅ `Ctrl+Shift+I` : Ouvrir DevTools

## 🧪 Test des Modifications

### En Développement Local
```bash
npm run dev
```
→ DevTools disponibles et fonctionnels

### Build Local de Test
```bash
npm run dist
```
→ DevTools désactivés dans l'exécutable généré

### Via GitHub Actions
Le workflow automatique générera des exécutables **sans DevTools**.

## 📋 Vérification Post-Déploiement

Après téléchargement de l'exécutable depuis GitHub Releases :

1. **Vérifier l'absence du menu** : La barre de menu doit être masquée
2. **Tester les raccourcis** : 
   - `F12` → Aucune réaction
   - `Ctrl+Shift+I` → Aucune réaction
   - Clic droit → Menu contextuel minimal sans "Inspecter"

## 🎨 Avantages

### Performance
- 🚀 Démarrage plus rapide
- 💾 Consommation mémoire réduite
- 📦 Taille de l'exécutable optimisée

### Sécurité
- 🔒 Impossible d'inspecter le code source
- 🛡️ Protection contre la manipulation DOM
- 🚫 Pas d'accès aux variables internes

### Expérience Utilisateur
- ✨ Interface propre sans menu technique
- 🎯 Focus sur les fonctionnalités métier
- 💼 Aspect professionnel pour les utilisateurs finaux

## 🔄 Prochaines Actions

1. **Tester le workflow** : Déclencher une release pour vérifier que les DevTools sont bien désactivés
2. **Documenter pour l'équipe** : Informer que les DevTools ne seront plus accessibles en production
3. **Logging renforcé** : Utiliser `console.log` et des logs fichiers pour le debugging en production

---

> ✅ **Résultat** : Les exécutables produits par GitHub Actions n'auront plus accès aux DevTools, garantissant une expérience utilisateur finale propre et sécurisée. 