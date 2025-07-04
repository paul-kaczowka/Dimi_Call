#!/usr/bin/env node

/**
 * Script de test pour le workflow des touches Fn dans DimiCall
 * 
 * Ce script simule le processus de workflow des touches F2-F10 :
 * 1. Sélection d'un contact
 * 2. Appel du contact
 * 3. Appui sur une touche Fn
 * 4. Vérification du workflow séquentiel
 */

console.log('🧪 [TEST] Démarrage du test du workflow des touches Fn\n');

// Simulation des données de test
const testContacts = [
  { id: '1', prenom: 'Paul', nom: 'Albreg', telephone: '+33695905812', statut: 'Non défini' },
  { id: '2', prenom: 'Marie', nom: 'Dupont', telephone: '+33612345678', statut: 'Non défini' },
  { id: '3', prenom: 'Jean', nom: 'Martin', telephone: '+33687654321', statut: 'Non défini' }
];

const fnKeyStatusMap = {
  'F2': 'Prématuré',
  'F3': 'Mauvais num',
  'F4': 'Répondeur',
  'F5': 'À rappeler',
  'F6': 'Pas intéressé',
  'F7': 'Argumenté',
  'F8': 'DO',
  'F9': 'RO',
  'F10': 'Liste noire'
};

// Simulation des états
let selectedContact = null;
let activeCallContactId = null;
let contacts = [...testContacts];

// Fonctions utilitaires de simulation
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const log = (level, message) => {
  const timestamp = new Date().toLocaleTimeString();
  const icon = {
    'info': '📋',
    'success': '✅',
    'warning': '⚠️',
    'error': '❌',
    'workflow': '🔄'
  }[level] || '📝';
  
  console.log(`[${timestamp}] ${icon} ${message}`);
};

// Simulation des fonctions de l'application
const simulateSelectContact = (contact) => {
  selectedContact = contact;
  log('info', `Contact sélectionné: ${contact.prenom} ${contact.nom}`);
};

const simulateStartCall = async (contact) => {
  log('info', `🔄 Démarrage d'appel vers ${contact.prenom}...`);
  await wait(500);
  activeCallContactId = contact.id;
  log('success', `📞 Appel actif vers ${contact.prenom} (${contact.telephone})`);
};

const simulateEndCall = async () => {
  if (activeCallContactId) {
    log('info', '🔄 Raccrochage en cours...');
    await wait(300);
    activeCallContactId = null;
    log('success', '📞 Appel raccroché avec succès');
    return true;
  }
  return false;
};

const simulateUpdateContactStatus = async (contactId, newStatus) => {
  log('info', `🔄 Mise à jour du statut vers "${newStatus}"...`);
  await wait(200);
  
  const contactIndex = contacts.findIndex(c => c.id === contactId);
  if (contactIndex !== -1) {
    contacts[contactIndex].statut = newStatus;
    log('success', `✅ Statut mis à jour: "${newStatus}"`);
    return true;
  }
  return false;
};

const simulateSelectNextContact = async (currentContact) => {
  const currentIndex = contacts.findIndex(c => c.id === currentContact.id);
  if (currentIndex < contacts.length - 1) {
    const nextContact = contacts[currentIndex + 1];
    selectedContact = nextContact;
    log('success', `➡️ Contact suivant sélectionné: ${nextContact.prenom} ${nextContact.nom}`);
    await wait(200);
    return nextContact;
  } else {
    log('warning', '🏁 Fin de liste atteinte');
    return null;
  }
};

// Simulation du workflow séquentiel des touches Fn
const simulateWorkflow = async (fnKey) => {
  const newStatus = fnKeyStatusMap[fnKey];
  
  if (!selectedContact) {
    log('error', `❌ Aucun contact sélectionné pour ${fnKey}`);
    return false;
  }
  
  log('workflow', `🚀 Démarrage du workflow ${fnKey} → ${newStatus} pour ${selectedContact.prenom}`);
  
  try {
    // ÉTAPE 1: Raccrochage (si appel en cours)
    const wasCallActive = activeCallContactId === selectedContact.id;
    if (wasCallActive) {
      log('workflow', '📞 Étape 1/4: Raccrochage en cours...');
      const hangupSuccess = await simulateEndCall();
      if (!hangupSuccess) {
        throw new Error('Échec du raccrochage');
      }
      await wait(500); // Stabilisation
      log('success', '✅ Étape 1/4: Raccrochage confirmé');
    } else {
      log('workflow', '📝 Étape 1/4: Aucun appel actif - Passage direct au statut');
    }

    // ÉTAPE 2: Application du statut
    log('workflow', `📝 Étape 2/4: Application du statut "${newStatus}"...`);
    const statusSuccess = await simulateUpdateContactStatus(selectedContact.id, newStatus);
    if (!statusSuccess) {
      throw new Error('Échec de la mise à jour du statut');
    }
    await wait(400); // Mise à jour interface
    log('success', `✅ Étape 2/4: Statut "${newStatus}" appliqué`);

    // ÉTAPE 3: Sélection du contact suivant
    log('workflow', '➡️ Étape 3/4: Recherche du contact suivant...');
    const nextContact = await simulateSelectNextContact(selectedContact);
    if (!nextContact) {
      log('info', '🏁 Fin de liste - Workflow terminé');
      return true;
    }
    await wait(300); // Finalisation sélection
    log('success', `✅ Étape 3/4: Contact suivant sélectionné`);

    // ÉTAPE 4: Lancement de l'appel suivant
    log('workflow', `📞 Étape 4/4: Lancement appel vers ${nextContact.prenom}...`);
    await simulateStartCall(nextContact);
    await wait(600); // Initialisation appel
    
    if (activeCallContactId === nextContact.id) {
      log('success', `✅ Étape 4/4: Appel initié vers ${nextContact.prenom}`);
      log('success', `🎉 Workflow ${fnKey} → ${newStatus} terminé avec succès !`);
      return true;
    } else {
      log('warning', `⚠️ Échec de l'appel vers ${nextContact.prenom}`);
      return false;
    }
    
  } catch (error) {
    log('error', `❌ Erreur dans le workflow ${fnKey}: ${error.message}`);
    return false;
  }
};

// Fonction de test principale
const runTests = async () => {
  console.log('📋 État initial:');
  console.log(`   Contacts: ${contacts.length}`);
  console.log(`   Contact sélectionné: ${selectedContact ? selectedContact.prenom : 'Aucun'}`);
  console.log(`   Appel actif: ${activeCallContactId ? 'Oui' : 'Non'}\n`);

  // Test 1: Sélectionner un contact
  log('info', '🧪 Test 1: Sélection d\'un contact');
  simulateSelectContact(testContacts[0]);
  await wait(200);

  // Test 2: Démarrer un appel
  log('info', '🧪 Test 2: Démarrage d\'un appel');
  await simulateStartCall(selectedContact);
  await wait(500);

  // Test 3: Workflow avec appel actif (F4 - Répondeur)
  log('info', '🧪 Test 3: Workflow F4 (Répondeur) avec appel actif');
  const workflow1Success = await simulateWorkflow('F4');
  await wait(1000);

  // Test 4: Workflow sans appel actif (F6 - Pas intéressé)
  log('info', '🧪 Test 4: Workflow F6 (Pas intéressé) sans appel actif');
  const workflow2Success = await simulateWorkflow('F6');
  await wait(1000);

  // Test 5: Test de fin de liste
  log('info', '🧪 Test 5: Test de fin de liste');
  simulateSelectContact(testContacts[testContacts.length - 1]); // Dernier contact
  const workflow3Success = await simulateWorkflow('F8');

  // Résultats
  console.log('\n📊 Résultats des tests:');
  console.log(`   Test 1 (Sélection): ✅ Réussi`);
  console.log(`   Test 2 (Appel): ✅ Réussi`);
  console.log(`   Test 3 (Workflow avec appel): ${workflow1Success ? '✅ Réussi' : '❌ Échoué'}`);
  console.log(`   Test 4 (Workflow sans appel): ${workflow2Success ? '✅ Réussi' : '❌ Échoué'}`);
  console.log(`   Test 5 (Fin de liste): ${workflow3Success ? '✅ Réussi' : '❌ Échoué'}`);

  console.log('\n📋 État final:');
  console.log('   Contacts et leurs statuts:');
  contacts.forEach((contact, index) => {
    const isSelected = selectedContact && selectedContact.id === contact.id;
    const isActive = activeCallContactId === contact.id;
    const markers = [];
    if (isSelected) markers.push('👆 Sélectionné');
    if (isActive) markers.push('📞 Appel actif');
    
    console.log(`     ${index + 1}. ${contact.prenom} ${contact.nom} - Statut: "${contact.statut}" ${markers.join(' ')}`);
  });

  const allTestsPassed = workflow1Success && workflow2Success && workflow3Success;
  console.log(`\n🎯 Résultat global: ${allTestsPassed ? '✅ TOUS LES TESTS RÉUSSIS' : '⚠️ CERTAINS TESTS ONT ÉCHOUÉ'}`);
  
  return allTestsPassed;
};

// Exécution des tests - Version ES modules
const isMainModule = process.argv[1] && import.meta.url.endsWith(process.argv[1].replace(/\\/g, '/'));

if (isMainModule) {
  runTests()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Erreur fatale dans les tests:', error);
      process.exit(1);
    });
}

export { runTests, simulateWorkflow }; 