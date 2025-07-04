# Guide de Résolution des Problèmes d'Autorisation ADB

## Problème : Appareil Android "Unauthorized" (Non Autorisé)

Lorsque votre appareil Android apparaît comme "unauthorized" dans DimiCall, cela signifie qu'il est détecté par ADB mais n'est pas autorisé à communiquer avec votre ordinateur.

### Diagnostic Automatique

DimiCall dispose maintenant d'un **diagnostic automatique** qui peut résoudre la plupart des problèmes d'autorisation :

1. **Connectez votre appareil Android** via USB
2. **Activez le débogage USB** sur votre appareil
3. **Lancez DimiCall** et essayez de vous connecter
4. Si l'erreur "unauthorized" apparaît, **un dialog de diagnostic s'ouvrira automatiquement**
5. **Cliquez sur "Diagnostiquer et Corriger Automatiquement"**

### Solutions Manuelles

Si le diagnostic automatique ne fonctionne pas, suivez ces étapes :

#### Étape 1 : Vérifier le Débogage USB
1. Ouvrez **Paramètres** sur votre Android
2. Allez dans **À propos du téléphone**
3. Appuyez **7 fois** sur **Numéro de build** pour activer les options développeur
4. Retournez dans **Paramètres** → **Options de développement**
5. Activez **Débogage USB**

#### Étape 2 : Révoquer les Autorisations
1. Dans **Options de développement**
2. Appuyez sur **Révoquer les autorisations de débogage USB**
3. Confirmez l'action

#### Étape 3 : Nettoyer les Clés ADB (PC)
**Méthode 1 : Via DimiCall (Recommandé)**
- Utilisez le bouton **🔧** à côté du bouton de connexion
- Cliquez sur **"Nettoyer les Clés d'Autorisation"**

**Méthode 2 : Manuelle**
1. Fermez DimiCall
2. Ouvrez l'Explorateur de fichiers
3. Naviguez vers `C:\Users\[VotreNom]\.android\`
4. Supprimez les fichiers `adbkey` et `adbkey.pub`
5. Relancez DimiCall

#### Étape 4 : Reconnexion
1. **Débranchez** le câble USB
2. **Rebranchez** le câble USB
3. **Lancez DimiCall** et essayez de vous connecter
4. **Autorisez la connexion** sur votre appareil quand la popup apparaît
5. **Cochez "Toujours autoriser cet ordinateur"**

### Commandes de Diagnostic ADB

Si vous avez ADB installé séparément, vous pouvez utiliser ces commandes pour diagnostiquer :

```bash
# Lister les appareils
adb devices

# Redémarrer le serveur ADB
adb kill-server
adb start-server

# Vérifier la connexion
adb shell echo "Test de connexion"
```

### Messages d'Erreur Courants

| Erreur | Signification | Solution |
|--------|---------------|----------|
| `unauthorized` | Appareil non autorisé | Suivre les étapes ci-dessus |
| `device offline` | Appareil hors ligne | Redémarrer l'appareil et ADB |
| `no devices found` | Aucun appareil trouvé | Vérifier la connexion USB |

### Dépannage Avancé

#### Problème : Aucune Popup d'Autorisation
1. **Changez de port USB** (essayez USB 2.0 si vous utilisez USB 3.0)
2. **Changez de câble USB** (utilisez un câble de données, pas seulement de charge)
3. **Redémarrez l'appareil Android**
4. **Redémarrez l'ordinateur**

#### Problème : Popup Apparaît mais Disparaît
1. Désactivez **Débogage USB**
2. Attendez 10 secondes
3. Réactivez **Débogage USB**
4. Reconnectez immédiatement le câble

#### Problème : Erreur Persistante
1. **Désinstallez les pilotes USB** de l'appareil dans le Gestionnaire de périphériques
2. **Reconnectez l'appareil** pour réinstaller les pilotes
3. **Essayez un autre ordinateur** pour tester l'appareil

### Fonctionnalités DimiCall

Le nouveau système de diagnostic de DimiCall inclut :

- ✅ **Détection automatique** des problèmes d'autorisation
- ✅ **Diagnostic en un clic** avec corrections automatiques
- ✅ **Nettoyage des clés ADB** intégré
- ✅ **Instructions détaillées** pour les corrections manuelles
- ✅ **Journal des opérations** en temps réel

### Support

Si le problème persiste après avoir essayé toutes ces solutions :

1. **Copiez les logs** du journal des opérations dans DimiCall
2. **Notez le modèle** de votre appareil Android
3. **Notez la version Android** de votre appareil
4. **Contactez le support** avec ces informations

---

*Dernière mise à jour : Décembre 2024* 