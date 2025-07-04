# Guide du Mécanisme des Touches Fn - DimiCall

## 🎯 Vue d'ensemble

Le système de touches Fn (F2 à F10) permet de changer rapidement le statut des contacts et d'automatiser le workflow d'appels dans DimiCall avec un système **séquentiel robuste** incluant des vérifications d'état à chaque étape.

## ⌨️ Mapping des Touches Fn vers les Statuts

| Touche | Statut | Description |
|--------|--------|-------------|
| **F2** | Prématuré | Contact contacté trop tôt |
| **F3** | Mauvais num | Numéro incorrect ou non attribué |
| **F4** | Répondeur | Tombé sur le répondeur |
| **F5** | À rappeler | Contact à rappeler plus tard |
| **F6** | Pas intéressé | Contact non intéressé par l'offre |
| **F7** | Argumenté | Contact argumenté, en réflexion |
| **F8** | DO | Décision d'Ouverture (rendez-vous pris) |
| **F9** | RO | Recommandation d'Ouverture |
| **F10** | Liste noire | Contact à ne plus rappeler |

## 🔄 Workflow Séquentiel Robuste

Le nouveau système exécute un **workflow séquentiel avec vérifications** en 4 étapes obligatoires. Chaque étape doit être **validée avant de passer à la suivante**.

### ✅ Étape 1: Raccrochage Automatique (si appel en cours)
```javascript
📞 [WORKFLOW] Étape 1/4: Raccrochage en cours...
📞 [HANGUP] Tentative 1/3 de raccrochage...
⏳ [WAIT] Vérification raccrochage (tentative 1) (300ms)...
✅ [HANGUP] Raccrochage vérifié à la tentative 1
✅ [WORKFLOW] Étape 1/4: Raccrochage confirmé
⏳ [WAIT] Stabilisation après raccrochage (500ms)...
```

**Vérifications :**
- ✅ Tentatives multiples (jusqu'à 3)
- ✅ Vérification que `activeCallContactId === null`
- ✅ Délai de stabilisation de 500ms
- ✅ Fallback en cas d'échec

### ✅ Étape 2: Application du Statut avec Vérification
```javascript
📝 [WORKFLOW] Étape 2/4: Application du statut "Répondeur"...
⏳ [WAIT] Propagation de la mise à jour du statut (200ms)...
✅ [STATUS] Statut "Répondeur" vérifié dans les données (tentative 1)
✅ [WORKFLOW] Étape 2/4: Statut "Répondeur" appliqué et vérifié
⏳ [WAIT] Mise à jour de l'interface (400ms)...
```

**Vérifications :**
- ✅ Mise à jour effective dans les données
- ✅ Vérification avec 5 tentatives maximum
- ✅ Délai pour propagation interface (400ms)
- ✅ Notification utilisateur

### ✅ Étape 3: Sélection du Contact Suivant avec Vérification
```javascript
➡️ [WORKFLOW] Étape 3/4: Recherche et sélection du contact suivant...
➡️ [SELECT] Contact suivant trouvé: Pierre (index 5)
⏳ [WAIT] Application de la sélection (200ms)...
✅ [SELECT] Sélection du contact Pierre initiée
✅ [WORKFLOW] Étape 3/4: Contact suivant sélectionné - Pierre
⏳ [WAIT] Finalisation de la sélection (300ms)...
```

**Vérifications :**
- ✅ Contact trouvé dans `filteredContacts`
- ✅ Index valide (pas fin de liste)
- ✅ Sélection appliquée avec `setSelectedContact`
- ✅ Délai de finalisation (300ms)

### ✅ Étape 4: Lancement de l'Appel avec Vérification
```javascript
📞 [WORKFLOW] Étape 4/4: Lancement appel vers Pierre...
📞 [CALL] Lancement de l'appel vers Pierre (+33695905812)
⏳ [WAIT] Initialisation de l'appel (600ms)...
✅ [CALL] Appel vérifié actif pour Pierre (tentative 1)
✅ [WORKFLOW] Étape 4/4: Appel initié avec succès vers Pierre
🎉 [WORKFLOW] Workflow complet F4 → Répondeur terminé avec succès !
```

**Vérifications :**
- ✅ Appel lancé avec `makePhoneCall()`
- ✅ Délai d'initialisation (600ms)
- ✅ Vérification avec 3 tentatives maximum
- ✅ Confirmation finale

## 🛡️ Système de Protection et Retry

### Protection contre les Appels Multiples
```javascript
let isProcessing = false;
if (isProcessing) {
  console.log(`⏳ [ELECTRON_FN] Workflow en cours, ${key} ignoré`);
  return;
}
```

### Retry Logic pour le Raccrochage
- **3 tentatives maximum** avec délai entre tentatives
- **Vérification après chaque tentative** (300ms)
- **Fallback forcé** si toutes les tentatives échouent
- **Délai progressif** : 400ms entre tentatives

### Gestion d'Erreur Robuste
```javascript
try {
  await executeSequentialWorkflow(key, newStatus, currentSelectedContact);
} catch (error) {
  console.error(`❌ [WORKFLOW] Erreur dans le workflow ${key}:`, error);
  showNotification('error', `Erreur lors du workflow ${key}: ${error}`);
} finally {
  isProcessing = false; // Toujours débloquer
}
```

## ⏱️ Délais et Temporisations

| Étape | Délai | Raison |
|-------|-------|--------|
| **Après raccrochage** | 500ms | Stabilisation ADB |
| **Vérification raccrochage** | 300ms | Confirmation état |
| **Propagation statut** | 200ms | Mise à jour données |
| **Interface refresh** | 400ms | Re-render React |
| **Application sélection** | 200ms | State update |
| **Finalisation sélection** | 300ms | UI sync |
| **Initialisation appel** | 600ms | ADB call setup |
| **Retry raccrochage** | 400ms | Délai entre tentatives |

## 🛠️ Architecture Technique Améliorée

### Handler Principal (Async/Await)
```javascript
const handleGlobalFnKey = async (event: any, key: string) => {
  // Récupération immédiate du contact sélectionné
  const currentSelectedContact = selectedContact;
  if (!currentSelectedContact) {
    showNotification('error', `Veuillez sélectionner un contact avant d'utiliser ${key}`);
    return;
  }
  
  isProcessing = true;
  try {
    await executeSequentialWorkflow(key, newStatus, currentSelectedContact);
  } catch (error) {
    // Gestion d'erreur
  } finally {
    isProcessing = false;
  }
};
```

### Fonctions de Vérification Spécialisées
```javascript
- performHangupWithRetry(): Promise<boolean>
- performStatusUpdateWithVerification(): Promise<boolean>
- findAndSelectNextContact(): Promise<Contact | null>
- performCallWithVerification(): Promise<boolean>
- waitWithLog(): Promise<void>
```

## 🧪 Tests et Validation

### Script de Test Automatisé
Le système inclut un script de test complet qui simule tous les scénarios :

```bash
node scripts/test-fn-workflow.js
```

**Résultats de test :**
```
📊 Résultats des tests:
   Test 1 (Sélection): ✅ Réussi
   Test 2 (Appel): ✅ Réussi
   Test 3 (Workflow avec appel): ✅ Réussi
   Test 4 (Workflow sans appel): ✅ Réussi
   Test 5 (Fin de liste): ✅ Réussi

🎯 Résultat global: ✅ TOUS LES TESTS RÉUSSIS
```

### Scénarios Testés
1. **Sélection d'un contact** ✅
2. **Démarrage d'un appel** ✅
3. **Workflow avec appel actif** (F4 - Répondeur) ✅
4. **Workflow sans appel actif** (F6 - Pas intéressé) ✅
5. **Gestion de fin de liste** (F8 - DO) ✅

## 🔍 Debugging Avancé

### Logs Détaillés par Étape
```
🚀 [WORKFLOW] Démarrage du workflow séquentiel pour F4 → Répondeur
📞 [WORKFLOW] Étape 1/4: Raccrochage en cours...
📞 [HANGUP] Tentative 1/3 de raccrochage...
⏳ [WAIT] Vérification raccrochage (tentative 1) (300ms)...
✅ [HANGUP] Raccrochage vérifié à la tentative 1
✅ [WORKFLOW] Étape 1/4: Raccrochage confirmé
⏳ [WAIT] Stabilisation après raccrochage (500ms)...
📝 [WORKFLOW] Étape 2/4: Application du statut "Répondeur"...
⏳ [WAIT] Propagation de la mise à jour du statut (200ms)...
✅ [STATUS] Statut "Répondeur" vérifié dans les données (tentative 1)
✅ [WORKFLOW] Étape 2/4: Statut "Répondeur" appliqué et vérifié
⏳ [WAIT] Mise à jour de l'interface (400ms)...
➡️ [WORKFLOW] Étape 3/4: Recherche et sélection du contact suivant...
➡️ [SELECT] Contact suivant trouvé: Pierre (index 5)
⏳ [WAIT] Application de la sélection (200ms)...
✅ [SELECT] Sélection du contact Pierre initiée
✅ [WORKFLOW] Étape 3/4: Contact suivant sélectionné - Pierre
⏳ [WAIT] Finalisation de la sélection (300ms)...
📞 [WORKFLOW] Étape 4/4: Lancement appel vers Pierre...
📞 [CALL] Lancement de l'appel vers Pierre (+33695905812)
⏳ [WAIT] Initialisation de l'appel (600ms)...
✅ [CALL] Appel vérifié actif pour Pierre (tentative 1)
✅ [WORKFLOW] Étape 4/4: Appel initié avec succès vers Pierre
🎉 [WORKFLOW] Workflow complet F4 → Répondeur terminé avec succès !
```

### Types d'Erreurs Gérées
- ❌ Contact non sélectionné
- ❌ Workflow déjà en cours
- ❌ Échec raccrochage (après 3 tentatives)
- ❌ Échec mise à jour statut (après 5 tentatives)
- ❌ Contact suivant non trouvé
- ❌ Échec lancement appel (après 3 tentatives)

## 🔧 Dépannage

### Problème : "Aucun contact sélectionné"
**Cause :** Aucun contact n'est sélectionné dans la table
**Solution :** Cliquer sur une ligne de la table pour sélectionner un contact

### Problème : "Workflow en cours"
**Cause :** Un autre workflow des touches Fn est déjà en cours d'exécution
**Solution :** Attendre la fin du workflow en cours (voir les logs)

### Problème : Statut ne se met pas à jour
**Cause :** Problème de synchronisation avec les données
**Solution :** Le système fait 5 tentatives automatiques, attendre la fin

### Problème : Appel ne se lance pas
**Cause :** Problème avec ADB ou appareil Android
**Solution :** Vérifier la connexion ADB et l'état de l'appareil

## 📝 Utilisation

1. **Sélectionner un contact** dans la table
2. **Appuyer sur la touche Fn correspondante** au statut souhaité
3. **Attendre la fin du workflow** (suivre les logs avec ✅)
4. **L'application automatise TOUT le reste** avec vérifications

## 🎉 Avantages du Nouveau Système

- ✅ **Stabilité maximale** : Chaque étape vérifiée
- ✅ **Robustesse** : Retry logic et fallbacks
- ✅ **Transparence** : Logs détaillés de chaque action
- ✅ **Synchronisation parfaite** : Délais adaptatifs
- ✅ **Gestion d'erreur complète** : Aucun cas non géré
- ✅ **Performance optimisée** : Délais minimaux mais suffisants
- ✅ **Débug facile** : Logs structurés et informatifs
- ✅ **Tests automatisés** : Validation complète du workflow
- ✅ **Protection CSP** : Sécurité Electron respectée

## 🚀 Conclusion

Le système de touches Fn est maintenant **ultra-robuste et prévisible** ! 

**Chaque étape est vérifiée**, **chaque erreur est gérée**, et **chaque délai est optimisé** pour garantir un fonctionnement parfait dans tous les scénarios.

Le workflow est **100% automatisé** : vous n'avez qu'à sélectionner un contact et appuyer sur la touche Fn correspondante. Le système s'occupe de tout le reste ! 🎯 