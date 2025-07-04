# Guide de Personnalisation des Raccourcis Clavier

## Vue d'ensemble

DimiCall permet maintenant de personnaliser complètement les raccourcis clavier des touches de fonction (F2-F10) pour modifier rapidement le statut des contacts.

## Fonctionnalités

### Configuration Personnalisable
- **9 touches configurables** : F2 à F10
- **Tous les statuts disponibles** : Prématuré, Mauvais num, Répondeur, À rappeler, Pas intéressé, Argumenté, DO, RO, Liste noire, Non défini
- **Sauvegarde automatique** : Les configurations sont persistées dans le localStorage
- **Interface intuitive** : Dialog dédié avec sélecteurs visuels

### Accès à la Configuration

#### Via le bouton "Fn Keys"
1. Cliquer sur le bouton **"Fn Keys"** dans la barre d'outils
2. S'ouvre directement le dialog de configuration

#### Via la fenêtre d'information
1. Cliquer sur **"Fn Keys"** → ouvre la fenêtre d'information
2. Cliquer sur **"Personnaliser les raccourcis"** → ouvre le dialog de configuration

## Interface de Configuration

### Éléments du Dialog
- **Titre** : "Configuration des Raccourcis Clavier"
- **Description** : Explication de la fonctionnalité
- **Grille de configuration** : Une ligne par touche avec sélecteur de statut
- **Actions** :
  - **"Valeurs par défaut"** : Remet la configuration d'origine
  - **"Annuler"** : Ferme sans sauvegarder
  - **"Sauvegarder"** : Sauvegarde et applique les modifications

### Configuration par Touche
Chaque ligne affiche :
- **Badge de touche** : Ex. `F2`, `F3`, etc.
- **Flèche** : `→`
- **Sélecteur de statut** : Dropdown avec tous les statuts disponibles, avec couleurs visuelles

### Indicateur de Modifications
- Badge **"Modifié"** affiché quand des changements non sauvegardés existent
- Bouton "Sauvegarder" activé uniquement s'il y a des modifications

## Retour Visuel

### Indicateur de Raccourci
Quand une touche de fonction est pressée :
- **Notification visuelle** en haut à droite
- **Contenu** : Touche pressée + statut appliqué
- **Durée** : 2 secondes
- **Animation** : Slide-in depuis la droite

### Notification de Sauvegarde
- Notification de succès "Configuration des raccourcis sauvegardée"
- Durée : 3 secondes

## Configuration Par Défaut

```
F2  → Prématuré
F3  → Mauvais num
F4  → Répondeur
F5  → À rappeler
F6  → Pas intéressé
F7  → Argumenté
F8  → DO
F9  → RO
F10 → Liste noire
```

## Stockage et Persistance

### Mécanisme de Sauvegarde
- **Clé localStorage** : `dimiCall_shortcuts_config`
- **Format** : JSON avec validation des données
- **Validation** : Vérification de la structure et des valeurs
- **Fallback** : Configuration par défaut en cas d'erreur

### Gestion des Erreurs
- Validation des données lors du chargement
- Retour à la configuration par défaut si corruption
- Messages d'erreur dans la console pour le débogage

## Utilisation

### Pour l'Utilisateur Final
1. **Configurer une seule fois** selon ses préférences
2. **Utiliser quotidiennement** les touches F2-F10 pour changer les statuts
3. **Voir le retour visuel** pour confirmer l'action
4. **Reconfigurer à tout moment** si les besoins changent

### Conseils d'Usage
- **Statuts fréquents** sur les touches faciles d'accès (F2-F5)
- **Statuts finaux** (DO/RO) sur les touches plus éloignées
- **Tester la configuration** avant de l'adopter quotidiennement

## Architecture Technique

### Service de Raccourcis (`shortcutService.ts`)
- **Singleton** : Une seule instance partagée
- **Méthodes principales** :
  - `getShortcuts()` : Récupère la configuration
  - `updateShortcut()` : Met à jour un raccourci
  - `updateAllShortcuts()` : Met à jour toute la configuration
  - `resetToDefaults()` : Remet les valeurs par défaut
  - `getStatusForKey()` : Récupère le statut d'une touche

### Composant de Configuration (`ShortcutConfigDialog.tsx`)
- **Props** : `isOpen`, `onClose`, `theme`, `onSave`
- **État local** : Configuration en cours d'édition
- **Validation** : Vérification avant sauvegarde

### Intégration dans App.tsx
- **Import** du service et des composants
- **État** pour gérer l'ouverture du dialog
- **Handler** modifié pour utiliser le service
- **Indicateur visuel** intégré

## Évolutions Futures Possibles

1. **Export/Import** de configurations
2. **Profils multiples** (par projet, par équipe)
3. **Raccourcis combinés** (Ctrl+F1, etc.)
4. **Configuration cloud** via Supabase
5. **Partage de configurations** entre utilisateurs 