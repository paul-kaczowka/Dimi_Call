require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://oqnagwoqlhqtnhfiakom.supabase.co';
const serviceKey = process.env.SUPABASE_SERVICE_KEY;

if (!serviceKey) {
  console.error('\x1b[31m%s\x1b[0m', 'Erreur : La variable d\'environnement SUPABASE_SERVICE_KEY est manquante.');
  console.log('Veuillez créer un fichier .env dans le dossier DimiCall/ et y ajouter votre clé de service Supabase.');
  console.log('Exemple: SUPABASE_SERVICE_KEY=votre_longue_cle_de_service');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: {
    // Il est important de désactiver la persistance de session pour les scripts côté serveur
    persistSession: false
  }
});

async function checkConnection() {
  console.log(`Tentative de connexion à Supabase sur : ${supabaseUrl}`);

  try {
    const { data: { users }, error } = await supabase.auth.admin.listUsers();

    if (error) {
      console.error('\x1b[31m%s\x1b[0m', '\nErreur lors de la récupération des utilisateurs:');
      console.error(error.message);
      if (error.message.includes('JWT')) {
          console.log('\x1b[33m%s\x1b[0m', 'Cette erreur indique souvent une clé de service (SUPABASE_SERVICE_KEY) incorrecte.');
      }
      return;
    }

    if (!users || users.length === 0) {
      console.log('\x1b[33m%s\x1b[0m', '\nConnexion réussie, mais aucun utilisateur trouvé dans Supabase Auth.');
      return;
    }

    console.log('\x1b[32m%s\x1b[0m', '\nConnexion à Supabase réussie !');
    console.log('Liste des utilisateurs autorisés :');
    
    const targetEmail = 'dipaserveurs@outlook.com';
    let targetFound = false;

    users.forEach(user => {
      if (user.email === targetEmail) {
        console.log(`- ${user.email} \x1b[32m(Cible trouvée)\x1b[0m`);
        targetFound = true;
      } else {
        console.log(`- ${user.email}`);
      }
    });

    if (targetFound) {
      console.log(`\n✅ L'utilisateur de test '${targetEmail}' a été trouvé.`);
    } else {
      console.log(`\n❌ L'utilisateur de test '${targetEmail}' n'a pas été trouvé dans la liste.`);
    }

  } catch (e) {
    console.error('\x1b[31m%s\x1b[0m', '\nUne erreur inattendue est survenue:');
    console.error(e);
  }
}

checkConnection(); 