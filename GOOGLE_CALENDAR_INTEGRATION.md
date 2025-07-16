# Intégration Google Calendar

## Fonctionnalité

Cette fonctionnalité permet de générer automatiquement des événements Google Calendar pré-remplis avec les informations du contact sélectionné lors de la création de rappels ou de rendez-vous.

## Comment ça fonctionne

### Pour les Rappels

1. **Clic sur le bouton "Rappel"** dans la barre d'outils
2. **Saisie de la date et de l'heure** dans le popover
3. **Clic sur "Enregistrer"**
4. **Ouverture automatique** de Google Calendar dans un nouvel onglet avec :
   - Titre : "Rappeler - [Prénom] [Nom]"
   - Date et heure pré-remplies
   - Description contenant toutes les informations du contact

### Pour les Rendez-vous

1. **Clic sur le bouton "Rendez-vous"** dans la barre d'outils
2. **Choix de l'option** :
   - **Cal.com (Recommandé)** : Ouvre Cal.com comme avant
   - **Google Calendar** : Ouvre directement Google Calendar
3. **Si Google Calendar est choisi** : Ouverture automatique avec :
   - Titre : "Rendez-vous - [Prénom] [Nom]"
   - Date (demain) et heure actuelles pré-remplies
   - Description contenant toutes les informations du contact

## Informations incluses dans la description

La description de l'événement Google Calendar inclut automatiquement :

- 📞 **Téléphone** du contact
- 📧 **Email** du contact  
- 💬 **Commentaire** du contact
- 📋 **Source** du contact
- 🏷️ **Statut** du contact
- 👤 **Sexe** du contact
- 💰 **Don** du contact
- ⭐ **Qualité** du contact
- 📝 **Type** du contact
- 📞 **Statut appel** du contact
- 📅 **Statut RDV** du contact
- 📝 **Commentaire RDV** du contact

## Format de l'URL générée

L'URL Google Calendar utilise le format standard :
```
https://calendar.google.com/calendar/render?action=TEMPLATE&text=[Titre]&dates=[DateDébut]/[DateFin]&details=[Description]&sf=true&output=xml
```

## Durée des événements

- **Rappels** : 30 minutes par défaut
- **Rendez-vous** : 30 minutes par défaut

## Compatibilité

Cette fonctionnalité fonctionne dans :
- ✅ L'application Electron principale (`src/components/Dialogs.tsx`)
- ✅ L'application web (`apps/web/components/Ribbon.tsx`)

## Fichiers modifiés

- `src/services/dataService.ts` : Ajout de la fonction `generateGoogleCalendarUrl`
- `src/components/Dialogs.tsx` : Modification des composants `RappelDialog` et `RendezVousDialog`
- `apps/web/lib/actions-utils.ts` : Ajout de la fonction `generateGoogleCalendarUrl` pour l'app web
- `apps/web/components/Ribbon.tsx` : Modification du bouton rappel et ajout d'un popover pour les rendez-vous

## Utilisation

1. Sélectionnez un contact dans la liste
2. Cliquez sur le bouton "Rappel" ou "Rendez-vous"
3. Remplissez la date et l'heure (pour les rappels)
4. Cliquez sur "Sauvegarder" ou choisissez "Google Calendar"
5. Google Calendar s'ouvre automatiquement avec l'événement pré-rempli
6. Vous pouvez alors modifier l'événement si nécessaire et l'enregistrer 