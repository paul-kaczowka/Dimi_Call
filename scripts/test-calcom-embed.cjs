#!/usr/bin/env node

/**
 * Script de test pour debugger l'embed Cal.com
 * Usage: node scripts/test-calcom-embed.js
 */

console.log('🧪 Test Cal.com Embed - Debug');
console.log('================================');

console.log('✅ Test simplifié sans dépendances');

// Informations de test
const testData = {
  calLink: "dimitri-morel-arcanis-conseil/audit-patrimonial",
  calUrl: "https://cal.com/dimitri-morel-arcanis-conseil/audit-patrimonial",
  contact: {
    nom: "DIALLO",
    prenom: "Boubacar", 
    email: "test@example.com",
    telephone: "0123456789"
  }
};

console.log('📋 Données de test:', testData);

// Test 1: Vérifier si l'URL Cal.com est accessible
async function testCalcomUrl() {
  console.log('\n🌐 Test 1: Accessibilité URL Cal.com');
  console.log('-----------------------------------');
  
  try {
    // Simuler une requête HTTP (nécessiterait fetch en vrai environnement)
    console.log('🔗 URL testée:', testData.calUrl);
    console.log('✅ URL semble valide (vérification manuelle requise)');
    console.log('💡 Ouvrez cette URL dans votre navigateur pour vérifier');
  } catch (error) {
    console.error('❌ Erreur URL:', error.message);
  }
}

// Test 2: Configuration des paramètres
function testCalcomConfig() {
  console.log('\n⚙️ Test 2: Configuration Cal.com');
  console.log('---------------------------------');
  
  const config = {
    layout: "month_view",
    theme: "light"
  };
  
  if (testData.contact.nom) config.name = testData.contact.nom;
  if (testData.contact.prenom) config.Prenom = testData.contact.prenom;
  if (testData.contact.email) config.email = testData.contact.email;
  if (testData.contact.telephone) {
    let phoneNumber = testData.contact.telephone.replace(/[\s\-\(\)]/g, '');
    if (!phoneNumber.startsWith('+')) {
      if (phoneNumber.startsWith('0')) {
        phoneNumber = '+33' + phoneNumber.substring(1);
      } else if (!phoneNumber.startsWith('33')) {
        phoneNumber = '+33' + phoneNumber;
      } else {
        phoneNumber = '+' + phoneNumber;
      }
    }
    config.smsReminderNumber = phoneNumber;
  }
  
  console.log('📋 Configuration générée:', JSON.stringify(config, null, 2));
  
  return config;
}

// Test 3: URL avec paramètres
function testCalcomUrlWithParams() {
  console.log('\n🔗 Test 3: URL avec paramètres');
  console.log('------------------------------');
  
  const queryParams = new URLSearchParams();
  
  if (testData.contact.nom) queryParams.append('name', testData.contact.nom);
  if (testData.contact.prenom) queryParams.append('Prenom', testData.contact.prenom);
  if (testData.contact.email) queryParams.append('email', testData.contact.email);
  if (testData.contact.telephone) {
    let phoneNumber = testData.contact.telephone.replace(/[\s\-\(\)]/g, '');
    if (!phoneNumber.startsWith('+')) {
      if (phoneNumber.startsWith('0')) {
        phoneNumber = '+33' + phoneNumber.substring(1);
      } else if (!phoneNumber.startsWith('33')) {
        phoneNumber = '+33' + phoneNumber;
      } else {
        phoneNumber = '+' + phoneNumber;
      }
    }
    queryParams.append('smsReminderNumber', phoneNumber);
  }
  
  const finalUrl = `${testData.calUrl}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  
  console.log('🔗 URL finale avec paramètres:');
  console.log(finalUrl);
  console.log('💡 Copiez cette URL dans votre navigateur pour tester le pré-remplissage');
  
  return finalUrl;
}

// Test 4: Simulation embed Cal.com
function testCalcomEmbed() {
  console.log('\n📱 Test 4: Simulation Embed Cal.com');
  console.log('-----------------------------------');
  
  console.log('ℹ️  L\'API @calcom/embed-react nécessite un environnement browser complet');
  console.log('ℹ️  Ce test simule les appels qui seraient faits dans l\'application');
  
  const config = testCalcomConfig();
  
  // Simuler les appels Cal.com
  console.log('🔄 Simulation: getCalApi()');
  console.log('🔄 Simulation: cal("on", { action: "bookingSuccessful", callback: ... })');
  console.log('🔄 Simulation: cal("on", { action: "linkReady", callback: ... })');
  console.log('🔄 Simulation: cal("on", { action: "linkFailed", callback: ... })');
  console.log('🔄 Simulation: cal("modal", { calLink: "' + testData.calLink + '", config: ... })');
  
  console.log('✅ Simulation complétée');
}

// Exécution des tests
async function runAllTests() {
  console.log('🚀 Début des tests Cal.com\n');
  
  await testCalcomUrl();
  testCalcomConfig();
  testCalcomUrlWithParams();
  testCalcomEmbed();
  
  console.log('\n✅ Tests terminés');
  console.log('\n📝 Résumé:');
  console.log('- Vérifiez l\'URL Cal.com manuellement dans un navigateur');
  console.log('- Testez l\'URL avec paramètres pour le pré-remplissage');
  console.log('- Dans DimiCall, regardez les logs console pour les détails');
  console.log('- Si l\'embed échoue, le fallback ouvrira automatiquement un nouvel onglet');
}

// Point d'entrée
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testCalcomUrl,
  testCalcomConfig,
  testCalcomUrlWithParams,
  testCalcomEmbed
}; 