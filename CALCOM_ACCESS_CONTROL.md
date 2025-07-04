# Contrôle d'Accès au Bouton Cal.com

## Vue d'Ensemble
Ce document décrit l'implémentation du contrôle d'accès pour la fonctionnalité de configuration de Cal.com dans DimiCall.

## Fonctionnalité Implémentée

### Restriction du Clic Droit
Le clic droit sur le bouton "Cal.com" dans le ruban est désormais **restreint selon le niveau d'authentification** :

#### 🔓 **Accès Autorisé** (Authentification avec Mot de Passe)
- **Condition** : L'utilisateur s'est authentifié avec prénom, nom **ET** mot de passe (`hasSpecialAccess = true`)
- **Clic Droit** : ✅ Ouvre la boîte de dialogue de configuration Cal.com
- **Action** : Permet de modifier l'URL Cal.com personnalisée

#### 🔒 **Accès Restreint** (Authentification Basique)
- **Condition** : L'utilisateur s'est authentifié uniquement avec prénom et nom (`hasSpecialAccess = false`)
- **Clic Droit** : ❌ Affiche une notification d'erreur
- **Message** : "Accès restreint : Authentifiez-vous avec un mot de passe pour configurer Cal.com"

## Indicateurs Visuels

### 1. Badge d'État sur le Bouton
Le bouton Cal.com affiche un petit badge dans le coin supérieur droit :
- **🔓 Badge Vert** : Accès autorisé (configuration possible)
- **🔒 Badge Rouge** : Accès restreint (configuration verrouillée)

### 2. Tooltip Informatif
Au survol du bouton Cal.com, un tooltip apparaît avec :
- **Titre** : "Calendrier Cal.com"
- **Instructions** : 
  - "Clic gauche : Ouvrir calendrier"
  - "Clic droit : Configurer URL (🔓 Accès autorisé)" ou "Configuration verrouillée (🔒 Mot de passe requis)"

### 3. Notification d'Erreur
Lors d'une tentative de clic droit sans autorisation :
- **Type** : Erreur (fond rouge)
- **Durée** : 4 secondes
- **Message** explicatif sur la restriction d'accès

## Implémentation Technique

### Fichiers Modifiés
- **`src/App.tsx`** : Logique principale du contrôle d'accès

### Code Clé
```typescript
// Contrôle d'accès pour le clic droit
onContextMenu={hasSpecialAccess ? (e) => {
  e.preventDefault();
  setIsCalcomConfigOpen(true);
} : (e) => {
  e.preventDefault();
  showNotification('error', 'Accès restreint : Authentifiez-vous avec un mot de passe pour configurer Cal.com', 4000);
}}

// Badge visuel d'état
<div className={cn(
  "absolute -top-1 -right-1 w-3 h-3 rounded-full text-[8px] flex items-center justify-center",
  hasSpecialAccess 
    ? "bg-green-500 text-white" 
    : "bg-red-500 text-white"
)}>
  {hasSpecialAccess ? "🔓" : "🔒"}
</div>
```

## Flux d'Authentification

### Authentification Basique
1. L'utilisateur saisit **prénom + nom**
2. `auth.isAuthenticated = true`
3. `hasSpecialAccess = false`
4. **Résultat** : Accès au calendrier mais pas à la configuration

### Authentification Complète
1. L'utilisateur saisit **prénom + nom**
2. L'utilisateur active le **mode mot de passe**
3. L'utilisateur saisit le **mot de passe spécial** (`DimiAccess2024`)
4. `auth.isAuthenticated = true` ET `hasSpecialAccess = true`
5. **Résultat** : Accès complet (calendrier + configuration)

## Sécurité

### Mot de Passe Spécial
- **Valeur** : `DimiAccess2024` (défini dans `src/lib/auth.ts`)
- **Stockage** : LocalStorage avec préfixe `special_access_${userId}`
- **Vérification** : Fonction `grantSpecialAccess()` dans `useCustomAuth`

### Avantages
- ✅ **Séparation des niveaux d'accès** : utilisateurs basiques vs administrateurs
- ✅ **Interface claire** : indicateurs visuels explicites
- ✅ **Expérience utilisateur** : feedback immédiat sans confusion
- ✅ **Sécurité** : configuration protégée par mot de passe
- ✅ **Flexibilité** : possibilité d'étendre à d'autres fonctionnalités

## Note de Maintenance

Cette implémentation s'appuie sur le système d'authentification Better Auth existant et peut être facilement étendue à d'autres boutons ou fonctionnalités nécessitant des niveaux d'accès différenciés. 