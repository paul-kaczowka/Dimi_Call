# DimiCall - Application de Gestion de Contacts Professionnelle

DimiCall est une application web moderne de gestion de contacts avec des fonctionnalités avancées incluant ADB browser-only, synchronisation Supabase en temps réel, interface virtualisée haute performance, et capacités PWA.

## 🚀 Fonctionnalités Principales

### ✅ Gestion de Contacts
- Import/Export CSV et Excel avec Web Workers
- Interface virtualisée pour des milliers de contacts (60fps)
- Édition en ligne avec validation
- Filtrage et tri avancés
- Statuts de contact personnalisables

### ✅ ADB Browser-Only (WebUSB)
- Connexion directe aux appareils Android via WebUSB
- Appels téléphoniques automatisés
- Envoi de SMS
- Monitoring de batterie en temps réel
- Pas besoin d'installation d'ADB sur le système

### ✅ Synchronisation Supabase
- Synchronisation temps réel avec TanStack Query
- Gestion des conflits automatique
- Cache intelligent et optimisations réseau
- Support multi-utilisateurs

### ✅ Performance & Monitoring
- Web Vitals en temps réel (LCP, FID, CLS, etc.)
- Dashboard de performance intégré
- Métriques personnalisées pour les actions utilisateur
- Export des rapports de performance

### ✅ PWA (Progressive Web App)
- Installation native sur desktop et mobile
- Icônes générées automatiquement
- Window Controls Overlay
- Gestion des protocoles tel: et sms:
- Raccourcis d'application

## 🛠️ Technologies Utilisées

- **Frontend**: React 19 + TypeScript
- **Styling**: Tailwind CSS v4 avec thèmes Dark/Light
- **État**: Zustand + TanStack Query v5
- **Tableaux**: TanStack Table + TanStack Virtual
- **ADB**: @yume-chan/adb (WebUSB)
- **Base de données**: Supabase avec temps réel
- **Performance**: Web Vitals + monitoring personnalisé
- **Build**: Vite + PWA

## 📦 Installation

```bash
# Cloner le projet
git clone <repository-url>
cd DimiCall

# Installer les dépendances avec pnpm
pnpm install

# Lancer en développement
pnpm run dev

# Build pour production
pnpm run build
```

## ⚙️ Configuration

### 1. Configuration Supabase

Créez un fichier `.env.local` :

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Ou configurez directement dans l'interface utilisateur via le service Supabase.

### 2. Structure de la base Supabase

Créez une table `DimiTable` avec les colonnes :

```sql
CREATE TABLE DimiTable (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  prenom TEXT,
  nom TEXT,
  telephone TEXT,
  email TEXT,
  ecole TEXT,
  statut TEXT,
  commentaire TEXT,
  date_rappel TEXT,
  heure_rappel TEXT,
  date_rdv TEXT,
  heure_rdv TEXT,
  date_appel TEXT,
  heure_appel TEXT,
  duree_appel TEXT,
  uid_supabase TEXT
);
```

## 🧪 Tests des Fonctionnalités

### Test ADB (WebUSB)

1. **Prérequis** :
   - Navigateur Chrome ou Edge
   - Appareil Android avec débogage USB activé
   - Câble USB

2. **Procédure** :
   ```bash
   # Ouvrir l'application
   pnpm run dev
   
   # Aller dans l'onglet ADB Panel
   # Cliquer sur "Connecter ADB"
   # Sélectionner votre appareil Android
   # Autoriser la connexion sur le téléphone
   ```

3. **Tests disponibles** :
   - Connexion/déconnexion
   - Monitoring batterie
   - Appels téléphoniques
   - Envoi SMS

### Test Performance Dashboard

1. **Accès** : Onglet "Performance" dans l'interface
2. **Métriques surveillées** :
   - LCP (Largest Contentful Paint)
   - FID (First Input Delay)
   - CLS (Cumulative Layout Shift)
   - Actions personnalisées

3. **Fonctionnalités** :
   - Visualisation temps réel
   - Export des rapports JSON
   - Conseils d'optimisation

### Test Tableau Virtualisé

1. **Import de données** : Importez un fichier CSV avec 1000+ contacts
2. **Performance** : Le tableau doit rester fluide à 60fps
3. **Fonctionnalités** :
   - Scroll infini
   - Tri et filtrage
   - Sélection multiple
   - Édition en ligne

### Test PWA

1. **Installation** :
   ```bash
   # Build production
   pnpm run build
   pnpm run preview
   
   # Dans Chrome : Menu > Installer DimiCall
   ```

2. **Fonctionnalités PWA** :
   - Installation native
   - Raccourcis d'application
   - Gestion des protocoles tel:/sms:

## 🔧 Développement

### Structure du Projet

```
DimiCall/
├── components/           # Composants React
│   ├── AdbPanel.tsx     # Interface ADB
│   ├── PerformanceDashboard.tsx
│   └── VirtualizedContactTable.tsx
├── hooks/               # Hooks personnalisés
│   ├── useAdb.ts       # Hook ADB
│   └── useWebVitals.ts # Hook performance
├── services/           # Services métier
│   ├── adbService.ts   # Service ADB WebUSB
│   ├── supabaseService.ts
│   ├── webVitalsService.ts
│   └── fileWorkerService.ts
├── public/
│   ├── manifest.json   # Manifest PWA
│   └── icons/         # Icônes générées
└── scripts/
    └── generate-icons.js # Génération d'icônes
```

### Commandes Utiles

```bash
# Génération des icônes PWA
node scripts/generate-icons.js

# Linting TypeScript
pnpm run build

# Tests de performance
# Ouvrir DevTools > Lighthouse
```

## 🐛 Dépannage

### Problèmes ADB

1. **WebUSB non supporté** :
   - Utilisez Chrome ou Edge
   - Vérifiez que WebUSB est activé

2. **Appareil non détecté** :
   - Activez le débogage USB
   - Autorisez l'ordinateur sur Android
   - Vérifiez le câble USB

3. **Erreurs de connexion** :
   - Redémarrez ADB : `adb kill-server && adb start-server`
   - Changez de port USB
   - Vérifiez les pilotes Android

### Problèmes Supabase

1. **Erreurs de connexion** :
   - Vérifiez les variables d'environnement
   - Contrôlez les permissions RLS
   - Testez la connectivité réseau

2. **Temps réel non fonctionnel** :
   - Vérifiez la configuration Realtime
   - Contrôlez les filtres de table
   - Redémarrez la connexion

## 📊 Métriques de Performance

L'application surveille automatiquement :

- **Core Web Vitals** : LCP, FID, CLS
- **Métriques réseau** : TTFB, FCP
- **Actions utilisateur** : Import, export, recherche
- **Rendu des composants** : Temps de rendu React

Les rapports peuvent être exportés en JSON pour analyse.

## 🔒 Sécurité

- **ADB** : Connexions chiffrées via WebUSB
- **Supabase** : Authentification et RLS
- **PWA** : HTTPS requis pour toutes les fonctionnalités
- **Données** : Stockage local sécurisé

## 📱 Compatibilité

- **Navigateurs** : Chrome 89+, Edge 89+
- **Systèmes** : Windows 10+, macOS 10.15+, Linux
- **Android** : API 21+ (Android 5.0+)
- **PWA** : Support complet sur Chrome/Edge

## 🤝 Contribution

1. Fork le projet
2. Créez une branche feature (`git checkout -b feature/AmazingFeature`)
3. Committez vos changements (`git commit -m 'Add AmazingFeature'`)
4. Push vers la branche (`git push origin feature/AmazingFeature`)
5. Ouvrez une Pull Request

## 📄 Licence

Ce projet est sous licence MIT. Voir le fichier `LICENSE` pour plus de détails.

## 🙏 Remerciements

- [ya-webadb](https://github.com/yume-chan/ya-webadb) - Implémentation ADB WebUSB
- [TanStack](https://tanstack.com/) - Outils React performants
- [Supabase](https://supabase.com/) - Backend-as-a-Service
- [Tailwind CSS](https://tailwindcss.com/) - Framework CSS utilitaire

## ✨ Nouvelles Fonctionnalités ADB

### 🔧 Configuration ADB

1. **Pré-requis :**
   - Android SDK avec ADB installé et accessible via PATH
   - Débogage USB activé sur votre téléphone Android
   - Téléphone connecté en USB et autorisé pour le débogage

2. **Connexion automatique :**
   - L'application se connecte automatiquement à votre téléphone au démarrage
   - Indicateur d'état ADB visible en temps réel (rouge/jaune/vert)
   - Niveau de batterie affiché automatiquement

### 📞 Appels Téléphoniques Réels

**Comment passer un appel :**

1. **Sélectionnez un contact** dans la liste en cliquant sur la ligne
2. **Cliquez sur "Appeler"** dans le ruban OU **appuyez sur Entrée**
3. L'application **lance automatiquement l'appel** sur votre téléphone
4. **Surveillance automatique** de l'état d'appel en temps réel

**États d'appel surveillés :**
- `idle` : Aucun appel en cours
- `ringing` : Appel en cours de numérotation
- `offhook` : Communication établie
- `disconnected` : Appel terminé (automatiquement détecté)

**Détection automatique de fin d'appel :**
- L'application détecte quand vous raccrochez depuis votre téléphone
- Mise à jour automatique des données de durée d'appel
- Passage automatique au contact suivant si configuré

### 🔄 Surveillance en Temps Réel

L'application surveille en permanence :
- État de connexion du téléphone
- Niveau de batterie
- État des appels en cours
- Détection automatique de déconnexion

### 📋 Raccourcis Clavier

- **Entrée** : Passer un appel au contact sélectionné
- **F2-F10** : Changer le statut du contact + appel automatique au suivant
- **Navigation** : Flèches pour naviguer dans la liste

### 🚨 Dépannage ADB

Si l'ADB ne se connecte pas :

1. **Vérifiez la connexion USB** et autorisez le débogage
2. **Redémarrez le serveur ADB** (bouton dans le panel ADB)
3. **Vérifiez que ADB est dans le PATH** système
4. **Autorisez l'empreinte** de l'ordinateur sur le téléphone

### 💡 Conseils d'Utilisation

- **Gardez le téléphone déverrouillé** pendant les sessions d'appel
- **L'application affiche l'état en temps réel** dans la barre de statut
- **Les appels sont vrais** - vérifiez votre forfait téléphonique
- **La surveillance fonctionne même si vous raccrochez manuellement**

---

## 🔧 Configuration et Installation

### Prérequis
- Node.js 18+
- npm 
- Android SDK avec ADB (pour les fonctionnalités téléphoniques)

### Installation
```bash
npm install
npm run dev
```

### Build
```bash
npm run build
npm run dist
```

## 📱 Intégrations

- **Supabase** : Synchronisation temps réel des données
- **ADB Android** : Appels téléphoniques réels
- **Import/Export** : CSV, Excel
- **Recherche web** : LinkedIn, Google
- **Notifications** : Système intégré

## 🎯 Fonctionnalités Principales

- Gestion complète de contacts
- Appels téléphoniques réels via ADB
- Surveillance d'état d'appel automatique
- Import/Export de données
- Recherche web intégrée
- Interface moderne et responsive
- Mode sombre/clair
- Raccourcis clavier optimisés
- Synchronisation Supabase en temps réel

---

**Développé par Dimultra - Optimisé pour une productivité maximale** 📈
