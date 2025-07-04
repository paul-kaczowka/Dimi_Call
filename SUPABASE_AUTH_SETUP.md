# Configuration de l'Authentification Supabase avec Magic Link

Ce document explique comment configurer et gérer l'authentification des utilisateurs pour DimiCall, qui utilise désormais un système de "magic link" (OTP par e-mail) via Supabase Auth.

L'ancien système basé sur une table `public.users` a été **complètement supprimé**. La seule source de vérité est maintenant la table `auth.users` gérée par Supabase.

---

## 🎯 Principe de fonctionnement

1.  **Liste Blanche via `auth.users`** : Seuls les utilisateurs que vous avez **invités** via le tableau de bord Supabase (ou via un script admin) existent dans la table `auth.users`. Ce sont les seuls utilisateurs autorisés.
2.  **Connexion sans mot de passe** : L'utilisateur saisit son adresse e-mail dans l'application.
3.  **Vérification par Supabase** : L'application demande à Supabase d'envoyer un lien de connexion. Grâce à l'option `shouldCreateUser: false`, Supabase n'enverra cet e-mail **que si l'adresse existe déjà** dans `auth.users`.
4.  **Session & Vérification de Licence** : Lorsque l'utilisateur clique sur le lien dans l'e-mail, il est redirigé vers l'application où une session sécurisée est créée. L'application vérifie alors les `app_metadata` de l'utilisateur pour s'assurer que sa licence n'a pas expiré.

---

## 🔧 Configuration Manuelle Requise (Étapes Uniques)

Il y a **DEUX ÉTAPES CRUCIALES** à réaliser dans votre tableau de bord Supabase pour que le système fonctionne comme prévu.

### Étape 1 : Désactiver les inscriptions automatiques

Ceci empêche quiconque de créer un compte.

1.  Allez à votre projet Supabase : [Project Dashboard](https://supabase.com/dashboard/project/oqnagwoqlhqtnhfiakom)
2.  Naviguez vers **Authentication** → **Providers**.
3.  Cliquez sur **Email** pour déplier les options.
4.  Assurez-vous que l'option **"Enable email sign-ups"** est **DÉCOCHÉE**.

![Désactiver les inscriptions par e-mail](https://i.imgur.com/GscFN9z.png)

### Étape 2 : Inviter votre premier utilisateur

Pour autoriser un utilisateur (par exemple, pour vos tests), vous devez l'inviter manuellement.

1.  Allez dans **Authentication** → **Users**.
2.  Cliquez sur le bouton **"Invite user"**.
3.  Entrez l'adresse e-mail de l'utilisateur (ex: `dipaserveurs@outlook.com`).
4.  Cliquez sur "Invite". L'utilisateur recevra une invitation pour définir un mot de passe, mais dans notre flux, il utilisera simplement le "magic link" pour se connecter.

---

## 📝 Gérer les Licences Utilisateur

La validité de la licence est stockée dans les métadonnées de l'utilisateur.

### Comment ajouter ou modifier la date d'expiration

1.  Allez dans **Authentication** → **Users**.
2.  Cliquez sur l'utilisateur que vous souhaitez modifier.
3.  Dans la section **"User Management"**, trouvez le champ **"User App Metadata"**.
4.  Entrez un objet JSON avec la clé `license_expires_at`. La date doit être au format ISO 8601.

**Exemple de JSON à insérer :**
```json
{
  "license_expires_at": "2025-12-31T23:59:59Z"
}
```

![Métadonnées de l'utilisateur](https://i.imgur.com/example-metadata.png) *(Note: lien d'image à remplacer par une vraie capture si nécessaire)*

Si la date d'expiration est passée ou absente, l'accès à l'application sera bloqué même après une connexion réussie.

---

## 🚀 Tester l'Application

1.  Assurez-vous d'avoir suivi les étapes 1 et 2 pour **inviter** l'e-mail `dipaserveurs@outlook.com`.
2.  Lancez l'application (`npm run dev`).
3.  Entrez `dipaserveurs@outlook.com` et cliquez sur "Envoyer le lien de connexion".
4.  Vérifiez la boîte de réception de cet e-mail, cliquez sur le lien.
5.  L'application devrait vous donner accès.
6.  Essayez avec une adresse non invitée : aucun e-mail ne devrait être envoyé, et le modal affichera une erreur.

## 🔒 Sécurité

- ✅ Row Level Security (RLS) activé sur la table `users`
- ✅ Politique de lecture seulement pour tous
- ✅ Pas de stockage de mots de passe
- ✅ Vérification de l'expiration des licences
- ✅ Session stockée localement avec vérification à chaque chargement

## 📝 Notes techniques

- Les sessions sont stockées dans `localStorage` avec la clé `supabase-user`
- Vérification automatique de l'autorisation à chaque chargement de l'app
- Si un utilisateur est supprimé de la table `users`, sa session sera invalidée au prochain chargement 