# Guide Complet pour la Publication de la Version macOS (.dmg) de **DimiCall**

Ce document décrit pas-à-pas la procédure pour générer un installeur **DMG** sous macOS, le publier sur GitHub Releases et, le cas échéant, assurer la mise à jour automatique côté utilisateur.

---

## Sommaire
1. [Prérequis](#1-prérequis)
2. [Processus de Publication Étape par Étape](#2-processus-de-publication-étape-par-étape)
   - [Étape A : Finaliser le Développement](#étape-a--finaliser-le-développement)
   - [Étape B : Incrémenter la Version](#étape-b--incrémenter-la-version)
   - [Étape C : Lancer la Publication](#étape-c--lancer-la-publication)
   - [Étape D : Finaliser la Release sur GitHub](#étape-d--finaliser-la-release-sur-github)
3. [Cycle de Test Recommandé](#3-cycle-de-test-recommandé)
4. [Dépannage des Erreurs Courantes](#4-dépannage-des-erreurs-courantes)

---

## 1. Prérequis

| Élément | Détail |
|---------|--------|
| **Machine macOS** | macOS 12 ou supérieur (Apple Silicon **ou** Intel). |
| **Xcode / CLT**   | `xcode-select --install` suffit pour disposer des outils nécessaires à la création du DMG. |
| **Node.js 18+ & pnpm** | Identique au projet Windows. |
| **`GH_TOKEN`** | Variable d’environnement avec l’autorisation `public_repo` (publier la release). |
| **Icône** | Le fichier `build/icon.icns` doit exister (déjà présent). |
| **Configuration `package.json`** | ```json
  "build": {
    "publish": { "provider": "github", "owner": "paul-kaczowka", "repo": "DimiCall" },
    "mac": {
      "icon": "build/icon.icns",
      "identity": null,
      "target": [{ "target": "dmg", "arch": ["x64", "arm64"] }]
    }
  }
  ```
  *`identity: null`* désactive la signature : pas de notarisation requise. |

> ⚠️ **Mise à jour automatique** : Electron requiert une app **signée** pour appliquer les mises à jour en tâche de fond sur macOS ([documentation](https://www.electron.build/auto-update)). Sans signature, l’utilisateur devra télécharger la nouvelle DMG manuellement. Ce guide part donc du principe que **la signature n’est pas souhaitée**.

---

## 2. Processus de Publication Étape par Étape

### Étape A : Finaliser le Développement

1. Commitez et poussez vos modifications sur `main`.
2. Vérifiez que l’application se lance correctement en mode développement :`pnpm dev`.

### Étape B : Incrémenter la Version

Même logique que pour Windows : ouvrez `package.json`, augmentez le champ `"version"` selon [SemVer](https://semver.org/lang/fr/), puis sauvegardez et commitez.

### Étape C : Lancer la Publication

Exécutez **depuis la machine macOS** :

```bash
# Génère le build et publie la DMG sur GitHub Releases
npm run publish            # ou pnpm publish
```

Cette commande :
1. compile le renderer et le main (`npm run build`),
2. invoque `electron-builder --publish always` ;
3. construit `DimiCall-<version>-x64.dmg` **et** `DimiCall-<version>-arm64.dmg` ;
4. crée (ou met à jour) la release GitHub correspondant au tag `v<version>` ;
5. téléverse la DMG et le fichier `latest-mac.yml` nécessaire aux mises à jour (signées !).

*Alternative* : cibler uniquement macOS :
```bash
npm run build && electron-builder --mac --publish always
```

### Étape D : Finaliser la Release sur GitHub

1. Ouvrez l’onglet **"Releases"** de votre dépôt.
2. La nouvelle release est déjà marquée **Latest**. Cliquez sur ✏️ "Edit".
3. Rédigez des notes de version claires (_nouveautés_, _corrections_, _informations spécifiques à macOS_, etc.).
4. **Update release** pour sauvegarder.

---

## 3. Cycle de Test Recommandé

1. Téléchargez la **DMG** d'une version antérieure (ex. `DimiCall-3.0.6.dmg`).
2. Supprimez toute version existante de DimiCall :
   - Glissez l'app dans la corbeille ;
   - Videz la corbeille.
3. Montez l'ancienne DMG et glissez l'app dans `/Applications`.
4. Lancez l'application : vérifiez qu'elle fonctionne.
5. Téléchargez la **nouvelle** DMG (ex. `3.0.7`) depuis GitHub, montez-la et remplacez l'ancienne app.
6. Vérifiez que l'application se lance correctement et affiche la nouvelle version (`Menu → À propos…`).

> 💡 Si vous implémentez plus tard la signature + auto-update macOS, ajoutez un test de mise à jour silencieuse comme décrit dans le guide Windows.

---

## 4. Dépannage des Erreurs Courantes

| Problème | Cause probable | Solution |
|----------|----------------|----------|
| `HttpError: 401 Unauthorized` | `GH_TOKEN` manquant ou mal configuré. | Vérifiez la variable et ses scopes. |
| `existing type not compatible with publishing type` ou 422 | Release ou tag déjà existant. | Supprimez la release/tag et relancez la publication (ou incrémentez à nouveau la version). |
| **DMG ne se génère pas** | Commande lancée depuis Windows/Linux. | Compiler/publier sur **macOS** uniquement. |
| **Icone générique dans DMG** | `build/icon.icns` absent ou mal formé. | Vérifiez que le fichier existe (512×512 min.) et purgez le cache macOS (`touch <app>.app`). |
| **Mise à jour automatique inactive** | App non signée. | Ajouter une identité de signature et un compte développeur Apple (hors périmètre de ce guide). |

---

## En résumé

- **1 commit** pour changer la version → **1 commande** (`npm run publish`) → **1 release** GitHub avec la DMG prête à l'emploi.
- Pas de signature ? L'utilisateur mettra à jour manuellement.
- Signature + notarisation plus tard ? Ajoutez‐les et les mises à jour seront automatiques.

> Référez-vous à la documentation officielle d'Electron Builder pour plus de détails sur la cible DMG : [electron.build/dmg](https://www.electron.build/dmg). 