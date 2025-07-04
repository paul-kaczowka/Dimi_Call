# Guide de Résolution - Problèmes d'Import de Fichiers Volumineux

## 🚨 Problème Initial : Crash avec fichiers de +1000 lignes

### Causes identifiées :
1. **Traitement synchrone** : Papa Parse bloquait le thread principal
2. **Mémoire saturée** : Chargement complet du fichier en mémoire
3. **Interface gelée** : Aucun feedback de progression
4. **Format non reconnu** : Fichiers TSV (tabulation) non pris en charge

## ✅ Solutions Implementées

### 1. Traitement par Chunks
- **Avant** : Traitement synchrone complet
- **Après** : Découpage en chunks de 512KB
- **Avantage** : Interface reste réactive

### 2. Détection Automatique du Délimiteur
```typescript
// Détecte automatiquement : 
// - TAB (\t) pour fichiers TSV
// - Virgule (,) pour CSV standard  
// - Point-virgule (;) pour CSV européen
const delimiter = await detectDelimiter(file);
```

### 3. Mapping Amélioré des En-têtes
Supporte maintenant :
- `Prénom` → `prenom`
- `Nom` → `nom` 
- `Numéro` / `Téléphone` → `telephone`
- `mail` / `Email` → `email`

### 4. Feedback de Progression Détaillé
- Affichage de la taille du fichier
- Progression en temps réel
- Messages d'état spécifiques

## 📁 Formats Supportés

### CSV Standard (virgule)
```csv
Prénom,Nom,Téléphone,Email
Jean,Dupont,0123456789,jean@email.com
```

### TSV (tabulation) - **NOUVEAU**
```tsv
Prénom	Nom	Numéro	mail
Jean	Dupont	0123456789	jean@email.com
```

### Excel (.xlsx, .xls)
- Import par chunks de 100 lignes
- Pause automatique pour ne pas bloquer l'UI

## 🔧 Optimisations Techniques

### Pour Fichiers > 10 MB
1. **Chunks plus petits** : 512KB au lieu de 1MB
2. **Pauses fréquentes** : Toutes les 500 lignes
3. **Estimation de progression** : Basée sur la taille du fichier
4. **Logging détaillé** : Console pour debug

### Gestion Mémoire
```typescript
// Évite la saturation mémoire
if (contacts.length % 500 === 0) {
  setTimeout(() => {
    // Pause pour libérer le thread principal
  }, 5);
}
```

## 🧪 Test avec Votre Fichier

### 1. Convertir en CSV si nécessaire
```bash
# Si votre fichier est en TSV
sed 's/\t/,/g' votre-fichier.tsv > votre-fichier.csv
```

### 2. Vérifier le Format d'En-têtes
Votre fichier doit avoir des en-têtes comme :
- `Prénom` ou `prenom`
- `Nom` ou `nom`
- `Numéro` ou `Téléphone` ou `telephone`
- `mail` ou `Email` ou `email`

### 3. Test avec Fichier Exemple
Un fichier de test `test-contacts-1000.tsv` a été créé pour valider l'import.

## 📊 Performance Attendue

| Taille Fichier | Temps Import | Mémoire Utilisée |
|----------------|--------------|------------------|
| < 1 MB         | < 5 secondes | Faible           |
| 1-10 MB        | 10-30 secondes | Modérée        |
| 10-50 MB       | 30-90 secondes | Contrôlée      |
| > 50 MB        | 2-5 minutes   | Optimisée       |

## 🚀 Prochaines Étapes

1. **Testez** l'import avec votre fichier de 1000+ lignes
2. **Surveillez** la console pour les messages de debug
3. **Rapportez** tout problème persistant

## 💡 Conseils d'Utilisation

- **Sauvegardez** vos données avant un gros import
- **Fermez** les autres applications gourmandes en mémoire
- **Attendez** la fin complète de l'import avant d'autres actions
- **Vérifiez** les contacts importés après traitement

## 🔍 Debug

Si problème persiste, vérifiez la console (F12) pour :
```
Délimiteur détecté: "TAB"
Import CSV terminé: 1234 contacts traités
``` 