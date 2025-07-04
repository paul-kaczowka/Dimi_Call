# 📱 Guide de Sélection Automatique de SIM

Cette fonctionnalité permet de sélectionner automatiquement la carte SIM "Pro" lors des appels, éliminant le besoin de choisir manuellement à chaque appel.

## 🎯 Contexte

Lorsque votre téléphone Android dispose de deux cartes SIM (double SIM), le système affiche une dialog de choix avant chaque appel. Cette dialog contient :

- **Option "Perso"** : `+33 7 69 35 27 28`
- **Option "Pro"** : `+33 7 66 90 67 89`
- **Checkbox** : "Mémoriser ce choix"

L'application DimiCall détecte automatiquement cette dialog et sélectionne l'option "Pro" pour vous.

## ⚙️ Configuration Requise

### Prérequis
- Appareil Android avec débogage USB activé
- Connexion USB entre votre téléphone et l'ordinateur
- Navigateur compatible WebUSB (Chrome, Edge)
- Téléphone avec double SIM (optionnel - ne fait rien si mono-SIM)

### Dépendances Installées
- ✅ `appium` v2.19.0
- ✅ `appium-uiautomator2-driver` v4.2.3
- ✅ `@yume-chan/adb` v2.0.1

## 🚀 Utilisation

### 1. Connexion Initiale
1. Lancez l'application DimiCall
2. Connectez votre téléphone Android via USB
3. Dans l'interface ADB, cliquez sur "Connecter ADB"
4. Autorisez la connexion sur votre téléphone

### 2. Surveillance Automatique
La surveillance se déclenche automatiquement lors des appels :

```typescript
// Lors d'un appel, le système :
1. Démarre la surveillance de dialog SIM
2. Initie l'appel via ADB
3. Détecte la dialog de choix SIM (si elle apparaît)
4. Clique automatiquement sur "Pro"
5. Arrête la surveillance
```

### 3. Interface Utilisateur
Un panneau de contrôle est disponible dans l'interface ADB :

- **Surveillance automatique** : Toggle on/off
- **Statut actuel** : Active/Inactive
- **Vérifier maintenant** : Test manuel
- **Dernier résultat** : Status de la dernière vérification

## 🔧 Fonctionnalités Techniques

### Détection de Dialog
Le système détecte la dialog en recherchant :
- Titre : "Choisir la carte SIM pour cet appel"
- Package : `com.google.android.dialer`
- Textes : "Perso" et "Pro"
- Numéros de téléphone correspondants

### Méthodes de Sélection
Plusieurs méthodes sont utilisées en cascade :

1. **Par texte** : Recherche du texte "Pro"
2. **Par numéro** : Recherche du numéro `+33 7 66 90 67 89`
3. **Par coordonnées** : Clic aux coordonnées (606, 1239)
4. **Par resource-id** : Utilisation du `resource-id` Android

### Coordonnées Calculées
Basées sur votre fichier XML :
- **Zone Pro** : `[291,1206] à [921,1272]`
- **Centre calculé** : `(606, 1239)`

## 🧪 Tests et Validation

### Script de Test
Exécutez le script de validation :

```bash
npm run test:sim
```

Ce script vérifie :
- ✅ Présence des fichiers requis
- ✅ Analyse du XML de test
- ✅ Dépendances installées
- ✅ Simulation de détection

### Test Manuel
1. Activez la surveillance dans l'interface
2. Cliquez sur "Vérifier maintenant"
3. Vérifiez le statut dans le panneau

## 🔍 Débogage

### Logs Console
Surveillez les logs dans la console du navigateur :

```javascript
🔧 Service de sélection SIM initialisé
👁️ Surveillance de la dialog SIM démarrée
📱 Dialog de choix SIM détectée
✅ Cliqué sur "Pro" par texte
🛑 Surveillance de la dialog SIM arrêtée
```

### Problèmes Courants

#### Dialog Non Détectée
- Vérifiez que le téléphone a bien une double SIM
- Assurez-vous que l'appel passe par l'app Google Dialer
- Contrôlez que le débogage USB est actif

#### Clic Échoué
- Vérifiez les coordonnées dans les logs
- Testez manuellement la zone de clic
- Contrôlez l'orientation de l'écran

#### Connexion ADB Perdue
- Reconnectez le câble USB
- Relancez la connexion ADB
- Vérifiez les autorisations USB

## 🔒 Sécurité et Permissions

### Permissions Requises
- **Débogage USB** : Pour la communication ADB
- **Accès à l'interface utilisateur** : Pour détecter les dialogs
- **Simulation de clics** : Pour automatiser la sélection

### Compatibilité
- ✅ **Utilisateurs double SIM** : Fonctionnalité active
- ✅ **Utilisateurs mono SIM** : Pas d'impact (ne fait rien)
- ✅ **Différentes marques Android** : Compatible
- ⚠️ **Applications d'appel tierces** : Peut ne pas fonctionner

## 📊 Statistiques d'Utilisation

Le système suit :
- Nombre de dialogs détectées
- Taux de réussite des clics
- Temps de réponse
- Erreurs rencontrées

## 🔄 Mises à Jour

### Version Actuelle
- **Service SIM** : v1.0.0
- **Interface** : Intégrée au panneau ADB
- **Tests** : Script automatisé inclus

### Améliorations Futures
- Support d'autres langues
- Mémorisation des préférences par contact
- Statistiques détaillées
- Configuration avancée

## 💡 Conseils d'Utilisation

1. **Laissez la surveillance activée** pour un fonctionnement automatique
2. **Testez régulièrement** avec "Vérifier maintenant"
3. **Surveillez les logs** pour détecter les problèmes
4. **Gardez le câble USB connecté** pendant les appels
5. **Autorisez toujours** les demandes de permission ADB

---

🎉 **La sélection automatique de SIM Pro est maintenant active !**

Pour toute question ou problème, consultez les logs de l'application ou testez avec `npm run test:sim`. 