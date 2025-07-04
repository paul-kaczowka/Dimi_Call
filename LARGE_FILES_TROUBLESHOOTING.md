# 🗂️ Guide de Dépannage pour les Gros Fichiers

## 🚨 Problèmes Courants avec les Gros Fichiers XLSX

### Symptômes
- Crash avec message "JavaScript heap out of memory"
- Erreur "QuotaExceededError" lors de la sauvegarde
- Application qui se fige pendant l'import
- Handlers qui prennent plus de 500ms

## 🛡️ Solutions Implémentées

### 1. Protection Mémoire

**Limites de Fichier :**
- **Maximum 50MB** par fichier pour éviter les crashes
- **Avertissement à 20MB** avec traitement optimisé
- **Traitement par chunks** adaptatif selon la taille

```typescript
// Vérification automatique de la taille
if (fileSizeInMB > 50) {
  throw new Error(`❌ Fichier trop volumineux (${fileSizeInMB.toFixed(1)}MB). Limite: 50MB`);
}
```

### 2. Optimisation LocalStorage

**Protection contre la saturation :**
- **Limite 5000 contacts** en localStorage
- **Vérification de la taille** avant sauvegarde (limite 4MB)
- **Sauvegarde métadonnées uniquement** pour les gros fichiers
- **Nettoyage automatique** en cas de saturation

```typescript
// Sauvegarde intelligente
if (sizeInMB > 4) {
  // Sauvegarder seulement les métadonnées
  const metadataOnly = { contacts: [], metadata: {...} };
}
```

### 3. Traitement par Chunks Optimisé

**Tailles de chunks adaptatifs :**
- **50 lignes** pour fichiers > 20MB
- **100 lignes** pour fichiers > 10MB  
- **250 lignes** pour fichiers normaux

**Pauses entre chunks :**
- **25ms** pour fichiers > 20MB
- **15ms** pour fichiers > 10MB
- **10ms** pour fichiers normaux

### 4. Gestion Mémoire Avancée

```typescript
// Nettoyage automatique
if ((window as any).gc) {
  (window as any).gc(); // Force garbage collection
}

// Monitoring mémoire
if ((performance as any).memory) {
  const used = memory.usedJSHeapSize / 1048576;
  console.log(`💾 Mémoire: ${used}MB utilisés`);
}
```

## 📊 Types de Fichiers Supportés

| Format | Taille Max | Optimisations |
|--------|------------|---------------|
| **CSV/TSV** | 50MB | ✅ Streaming, chunks 512KB |
| **XLSX** | 50MB | ✅ Mode dense, chunks adaptatifs |
| **XLS** | 50MB | ✅ Traitement optimisé |

## 🎯 Recommandations d'Usage

### Pour les Gros Fichiers (>10MB)
1. **Diviser les fichiers** en plusieurs parties si possible
2. **Supprimer les colonnes inutiles** avant import
3. **Utiliser CSV** plutôt qu'XLSX quand possible
4. **Fermer autres onglets** pour libérer la mémoire

### Surveillance des Performances
```javascript
// Vérifier l'état de la mémoire
optimizeMemoryUsage();

// Vérifier l'espace localStorage
const storage = checkStorageQuota();
console.log(`Storage: ${storage.percentage}% utilisé`);
```

## 🔧 Diagnostic en Cas de Problème

### 1. Vérifications Automatiques
L'application vérifie automatiquement :
- ✅ Taille du fichier
- ✅ Utilisation mémoire
- ✅ Espace localStorage disponible
- ✅ Format des en-têtes

### 2. Messages d'Erreur Typiques

**"Fichier trop volumineux"**
```
❌ Fichier trop volumineux (52.3MB). Limite: 50MB pour éviter les crashes.
```
→ **Solution:** Diviser le fichier ou supprimer des colonnes

**"QuotaExceededError"**
```
❌ LocalStorage saturé ! Sauvegarde des métadonnées uniquement...
```
→ **Solution:** Automatiquement géré, seules les métadonnées sont sauvées

**"JavaScript heap out of memory"**
```
[ERROR] OOM error in V8: JavaScript heap out of memory
```
→ **Solution:** Redémarrer l'application, vérifier la taille du fichier

### 3. Logs de Diagnostic

```
📄 Traitement du fichier: contacts.xlsx (15.2MB)
⚠️ Fichier volumineux (15.2MB), traitement avec précautions...
📊 Lecture du fichier Excel en cours...
📋 Traitement de 12543 lignes (15.2MB)
⚙️ Traitement par chunks de 100 lignes...
⏳ Progression: 50% (6271 contacts valides)
💾 Mémoire: 245MB utilisés / 512MB total (limite: 2048MB)
💾 Table importée sauvegardée: 5000/12543 contacts (tronqué pour économiser l'espace)
```

## 🚀 Optimisations Futures

- [ ] **Streaming XLSX** avec workers
- [ ] **Base de données locale** (IndexedDB)
- [ ] **Compression des données**
- [ ] **Pagination avancée**

## 📞 Support

En cas de problème persistant :
1. Vérifier les logs dans la console (F12)
2. Noter la taille exacte du fichier
3. Essayer de diviser le fichier en parties plus petites
4. Redémarrer l'application si nécessaire 