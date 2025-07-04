# Guide du Scroll Automatique

## Vue d'ensemble
La fonctionnalité de scroll automatique permet de toujours garder la ligne active visible lors de l'utilisation des raccourcis clavier F2-F10. Lorsque vous passez d'un contact à l'autre avec les touches de fonction, la table se déplace automatiquement pour afficher le contact sélectionné.

## Fonctionnement

### 🎯 Déclenchement Automatique
Le scroll automatique se déclenche dans les situations suivantes :

1. **Utilisation des touches F2-F10** : Après avoir changé le statut d'un contact, la table se déplace automatiquement vers le contact suivant
2. **Sélection manuelle** : Quand vous cliquez sur un contact, la table se centre sur celui-ci
3. **Recherche et filtrage** : Quand vous sélectionnez un contact dans des résultats filtrés

### 🎮 Comportement Intelligent
- **Détection de visibilité** : Si le contact est déjà visible à l'écran, aucun scroll n'est effectué
- **Centrage intelligent** : Le contact sélectionné est centré dans la vue pour une meilleure visibilité
- **Animation fluide** : Le scroll utilise une animation douce (`smooth`) pour une expérience agréable
- **Marge de sécurité** : Une marge est appliquée pour éviter que la ligne soit trop près des bords

### 📐 Méthodes de Scroll

#### Méthode Principale : scrollIntoView
```javascript
contactRow.scrollIntoView({
  behavior: 'smooth',      // Animation fluide
  block: 'center',         // Centre la ligne dans la vue
  inline: 'nearest'        // Positionnement horizontal optimal
});
```

#### Méthode de Fallback : Position calculée
Si l'élément DOM n'est pas trouvé directement, le système utilise :
- Calcul de la position basé sur l'index du contact
- Hauteur estimée par ligne (40px)
- Scroll manuel avec marge de sécurité (80px)

## Avantages

### ✅ Productivité Améliorée
- **Navigation sans interruption** : Plus besoin de faire défiler manuellement pour voir le contact suivant
- **Workflow optimisé** : Concentration maximale sur les appels sans distraction visuelle
- **Efficacité accrue** : Traitement plus rapide des listes de contacts importantes

### ✅ Expérience Utilisateur
- **Confort visuel** : Le contact actif est toujours visible et centré
- **Réduction de la fatigue** : Moins de mouvements oculaires et de manipulation de scroll
- **Interface intuitive** : Le comportement est prévisible et naturel

### ✅ Adaptabilité
- **Gestion des listes importantes** : Fonctionne parfaitement avec des milliers de contacts
- **Tri et filtrage** : S'adapte automatiquement aux différents ordres de tri
- **Responsive** : Fonctionne sur toutes les tailles d'écran

## Architecture Technique

### Structure du Code
```
App.tsx
├── contactTableRef (useRef<ContactTableRef>)
├── findAndSelectNextContact()
│   └── contactTableRef.current.scrollToContact(nextContact.id)
└── ContactTable (ref={contactTableRef})

ContactTable.tsx
├── scrollContainerRef (useRef<HTMLDivElement>)
├── scrollToContact() (useCallback)
├── useImperativeHandle() (expose scrollToContact)
├── useEffect() (auto-scroll on selectedContactId change)
└── JSX avec data-contact-id attributes
```

### Points Clés
- **ForwardRef** : Le composant ContactTable utilise forwardRef pour exposer ses méthodes
- **useImperativeHandle** : Expose la fonction scrollToContact au composant parent
- **useCallback** : Optimisation des performances pour éviter les re-renders inutiles
- **data-contact-id** : Attributs HTML pour l'identification précise des lignes

## Configuration

### Paramètres Ajustables
Dans `ContactTable.tsx`, vous pouvez modifier :

```javascript
// Hauteur estimée par ligne (pour le fallback)
const rowHeight = 40;

// Marge de sécurité pour le scroll
const margin = 80;

// Délai avant scroll automatique
const timeoutId = setTimeout(() => {
  scrollToContact(selectedContactId);
}, 100); // 100ms par défaut
```

### Désactivation (si nécessaire)
Pour désactiver le scroll automatique, commentez ou supprimez le useEffect dans ContactTable :

```javascript
// Scroll automatique quand le contact sélectionné change
// useEffect(() => {
//   if (selectedContactId) {
//     const timeoutId = setTimeout(() => {
//       scrollToContact(selectedContactId);
//     }, 100);
//     return () => clearTimeout(timeoutId);
//   }
// }, [selectedContactId, scrollToContact]);
```

## Utilisation Pratique

### Workflow Type
1. **Importez** votre liste de contacts
2. **Sélectionnez** le premier contact
3. **Utilisez F2-F10** pour changer les statuts rapidement
4. **Observez** le scroll automatique vers chaque contact suivant
5. **Continuez** sans interruption jusqu'à la fin de votre liste

### Conseils d'Optimisation
- **Triez vos contacts** selon vos besoins avant de commencer
- **Utilisez les filtres** pour traiter des segments spécifiques
- **Configurez vos raccourcis** selon vos statuts les plus fréquents
- **Profitez de la fluidité** : pas besoin de vérifier visuellement, le scroll suit automatiquement

Cette fonctionnalité transforme DimiCall en un outil de productivité encore plus puissant pour le traitement efficace de grandes listes de contacts ! 🚀 