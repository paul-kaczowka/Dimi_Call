# Guide de Publication Automatisée avec GitHub Actions pour DimiCall

Ce document a pour but de remplacer les guides `GUIDE_PUBLICATION_MAJ.md` et `GUIDE_PUBLICATION_MAC.md`. Il établit une procédure unifiée et automatisée pour publier des versions de DimiCall pour Windows (.exe) et macOS (.dmg) en utilisant GitHub Actions.

Cette méthode suit les meilleures pratiques, incluant la signature de code (essentielle pour les mises à jour automatiques sur macOS) et garantit un processus de publication fiable et reproductible.

---

## Sommaire
1. [Prérequis : Configuration Unique](#1-prérequis--configuration-unique)
2. [Le Fichier de Workflow GitHub Actions](#2-le-fichier-de-workflow-github-actions)
3. [Processus de Publication d'une Nouvelle Version](#3-processus-de-publication-dune-nouvelle-version)
4. [Mise à Jour de la Configuration `package.json`](#4-mise-à-jour-de-la-configuration-packagejson)
5. [Avantages de cette Approche](#5-avantages-de-cette-approche)

---

## 1. Prérequis : Configuration Unique

Cette configuration est à faire une seule fois. Elle permet à GitHub Actions d'accéder aux ressources nécessaires pour signer et publier l'application en votre nom.

Rendez-vous dans votre dépôt GitHub, puis dans `Settings > Secrets and variables > Actions`.

### A. Jeton d'accès GitHub

Créez un nouveau "Repository secret" :
- **Nom** : `GH_TOKEN`
- **Valeur** : Un [Personal Access Token (classic)](https://github.com/settings/tokens?type=beta) que vous avez généré. Assurez-vous qu'il possède le scope **`repo`** pour permettre la création de releases.

### B. Certificats de Signature (Recommandé mais crucial)

Pour que `electron-builder` signe automatiquement votre application, il a besoin de certificats.

#### Pour macOS (Obligatoire pour l'auto-update) :
1.  Vous devez être inscrit au programme développeur d'Apple.
2.  Exportez votre certificat "Developer ID Application" depuis votre Trousseau d'accès macOS en tant que fichier `.p12`.
3.  Encodez ce fichier en Base64. Sur macOS, vous pouvez utiliser la commande :
    ```bash
    base64 -i MonCertificat.p12 -o MonCertificat.p12.b64
    ```
4.  Créez les secrets suivants dans GitHub :
    - **`MAC_CERT_P12_B64`** : Le contenu du fichier `.b64` que vous venez de créer.
    - **`MAC_CERT_PASSWORD`** : Le mot de passe que vous avez défini lors de l'export du certificat `.p12`.

> **Notarisation (Optionnel mais recommandé)**: Pour une distribution parfaite sur macOS et éviter tous les avertissements de sécurité, la notarisation est nécessaire. Elle requiert des secrets supplémentaires : `APPLE_ID`, `APPLE_ID_PASSWORD`, et `TEAM_ID`. Le workflow est pré-configuré pour les utiliser s'ils sont présents.

#### Pour Windows (Fortement recommandé) :
1.  Obtenez un certificat de signature de code auprès d'une autorité de certification (ex: Sectigo, DigiCert).
2.  Exportez-le en format `.p12` (parfois appelé `.pfx`).
3.  Encodez ce fichier en Base64 comme pour macOS.
4.  Créez les secrets suivants dans GitHub :
    - **`WIN_CERT_P12_B64`** : Le contenu du fichier `.b64`.
    - **`WIN_CERT_PASSWORD`** : Le mot de passe du certificat.

---

## 2. Le Fichier de Workflow GitHub Actions

Créez le fichier suivant : `.github/workflows/release.yml`. Ce workflow va se charger de tout.

```yaml
name: Publish DimiCall Release

# Se déclenche manuellement depuis l'onglet Actions de GitHub
on:
  workflow_dispatch:

jobs:
  publish-electron-app:
    # Utilise une matrice pour lancer les builds sur Windows et macOS en parallèle
    strategy:
      matrix:
        os: [macos-latest, windows-latest]

    runs-on: ${{ matrix.os }}

    steps:
      - name: 1. Cloner le dépôt
        uses: actions/checkout@v4

      - name: 2. Configurer Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20' # ou la version que vous utilisez
          cache: 'npm'

      - name: 3. Installer les dépendances
        run: npm ci

      # --- Étape spécifique à macOS pour la signature ---
      - name: 4. (macOS) Importer le certificat de signature
        if: runner.os == 'macOS' && secrets.MAC_CERT_P12_B64 != ''
        run: |
          # Créer un Trousseau d'accès temporaire
          keychain_path=$RUNNER_TEMP/app-signing.keychain-db
          security create-keychain -p "${{ secrets.MAC_KEYCHAIN_PASSWORD }}" $keychain_path
          security set-keychain-settings -lut 21600 $keychain_path
          security unlock-keychain -p "${{ secrets.MAC_KEYCHAIN_PASSWORD }}" $keychain_path
          
          # Importer le certificat depuis le secret encodé en Base64
          cert_path=$RUNNER_TEMP/cert.p12
          echo -n "${{ secrets.MAC_CERT_P12_B64 }}" | base64 --decode -o $cert_path
          security import $cert_path -P "${{ secrets.MAC_CERT_PASSWORD }}" -A -t cert -f pkcs12 -k $keychain_path
          
          # Indiquer à electron-builder d'utiliser ce Trousseau
          echo "CSC_KEYCHAIN=./app-signing.keychain-db" >> $GITHUB_ENV
        env:
          # Mot de passe pour le Trousseau temporaire, pas besoin qu'il soit secret
          MAC_KEYCHAIN_PASSWORD: "temp_password"
          
      # --- Publication avec electron-builder ---
      - name: 5. Construire et publier l'application
        run: npm run publish
        env:
          # Le jeton pour publier sur GitHub Releases
          GH_TOKEN: ${{ secrets.GH_TOKEN }}

          # === Secrets pour la SIGNATURE ===
          # Ces variables sont lues par electron-builder
          
          # --- macOS ---
          # Le lien vers le certificat (format .p12 encodé en base64)
          CSC_LINK: ${{ secrets.MAC_CERT_P12_B64 }}
          # Le mot de passe du certificat
          CSC_KEY_PASSWORD: ${{ secrets.MAC_CERT_PASSWORD }}

          # --- Windows ---
          # Le lien vers le certificat (format .p12/.pfx encodé en base64)
          WIN_CSC_LINK: ${{ secrets.WIN_CERT_P12_B64 }}
          # Le mot de passe du certificat
          WIN_CSC_KEY_PASSWORD: ${{ secrets.WIN_CERT_PASSWORD }}
          
          # === Secrets pour la NOTARISATION (macOS uniquement) ===
          # Décommenter si vous configurez la notarisation
          # APPLE_ID: ${{ secrets.APPLE_ID }}
          # APPLE_ID_PASSWORD: ${{ secrets.APPLE_ID_PASSWORD }}
          # APPLE_TEAM_ID: ${{ secrets.TEAM_ID }}
```

---

## 3. Processus de Publication d'une Nouvelle Version

Le processus manuel est maintenant remplacé par 3 étapes simples :

1.  **Finaliser le développement** :
    Assurez-vous que toutes vos modifications sont finalisées et poussées sur votre branche principale (ex: `main`).

2.  **Incrémenter la version (Étape critique)** :
    Ouvrez `package.json` et incrémentez le numéro de version (ex: `3.0.8` -> `3.0.9`). C'est ce changement qui signale une nouvelle mise à jour.
    ```json
    "version": "3.0.9",
    ```
    Commitez et poussez cette modification.

3.  **Lancer le workflow de publication** :
    - Allez dans l'onglet **"Actions"** de votre dépôt GitHub.
    - Dans la barre latérale gauche, cliquez sur **"Publish DimiCall Release"**.
    - Cliquez sur le bouton **"Run workflow"**, en vous assurant que vous le lancez sur votre branche principale.

Le workflow va maintenant s'exécuter. Il prendra plusieurs minutes et créera les builds pour Windows et macOS. Une fois terminé, une nouvelle "Release" sera disponible sur GitHub, contenant les installeurs `.exe` et `.dmg` signés.

N'oubliez pas d'aller **éditer la release sur GitHub** pour y ajouter des notes de version claires et détaillées !

---

## 4. Mise à Jour de la Configuration `package.json`

Pour que `electron-builder` utilise la configuration de signature fournie par le workflow, il est préférable de retirer les options qui pourraient entrer en conflit.

Dans votre `package.json`, modifiez la section `build` :

```json
// package.json (extraits)
"build": {
  // ... autres configurations
  "mac": {
    "icon": "build/icon.icns",
    // "identity": null, // SUPPRIMEZ ou commentez cette ligne
    "target": [
      {
        "target": "dmg",
        "arch": [ "x64", "arm64" ]
      }
    ]
  },
  "win": {
    "icon": "build/icon.ico",
    "target": [
      {
        "target": "nsis",
        "arch": [ "x64" ]
      }
    ],
    // "forceCodeSigning": false, // SUPPRIMEZ ou commentez cette ligne
    // ... autres configurations
  },
  // ...
}
```
En retirant `identity: null` et `forceCodeSigning: false`, vous laissez `electron-builder` détecter automatiquement les certificats fournis dans l'environnement du workflow, ce qui est la pratique recommandée.

---

## 5. Avantages de cette Approche

- **Automatisation complète** : Plus aucune commande à lancer localement. Le processus est 100% dans le cloud.
- **Fiabilité** : Les builds sont effectués dans un environnement propre et cohérent à chaque fois.
- **Builds Multi-plateformes** : Génère les installeurs Windows et macOS en parallèle, sans nécessiter de machine physique dédiée.
- **Sécurité** : Les certificats et secrets sont stockés de manière sécurisée dans GitHub.
- **Mises à jour automatiques fonctionnelles** : La signature de code étant intégrée, le service `update-electron-app` fonctionnera de manière optimale sur les deux plateformes. 