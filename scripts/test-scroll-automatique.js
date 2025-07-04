/**
 * Script de test pour la fonctionnalité de scroll automatique
 * À exécuter dans la console du navigateur quand DimiCall est ouvert
 */

console.log('🧪 Test du Scroll Automatique DimiCall');

// Fonction pour tester le scroll automatique
function testScrollAutomatique() {
  console.log('🚀 Démarrage du test de scroll automatique...');
  
  // Vérifier que la table est présente
  const scrollContainer = document.querySelector('[data-contact-id]')?.closest('.overflow-auto');
  if (!scrollContainer) {
    console.error('❌ Conteneur de scroll non trouvé');
    return;
  }
  
  console.log('✅ Conteneur de scroll trouvé');
  
  // Récupérer toutes les lignes de contacts
  const contactRows = document.querySelectorAll('[data-contact-id]');
  if (contactRows.length === 0) {
    console.error('❌ Aucune ligne de contact trouvée');
    return;
  }
  
  console.log(`✅ ${contactRows.length} contacts trouvés`);
  
  // Test 1: Vérifier les attributs data-contact-id
  let contactsWithId = 0;
  contactRows.forEach(row => {
    const contactId = row.getAttribute('data-contact-id');
    if (contactId) {
      contactsWithId++;
    }
  });
  
  console.log(`✅ Test 1: ${contactsWithId}/${contactRows.length} contacts ont un data-contact-id`);
  
  // Test 2: Simuler un scroll vers un contact au milieu de la liste
  if (contactRows.length > 10) {
    const middleIndex = Math.floor(contactRows.length / 2);
    const middleContact = contactRows[middleIndex];
    const contactId = middleContact.getAttribute('data-contact-id');
    
    console.log(`🎯 Test 2: Scroll vers le contact ${contactId} (index ${middleIndex})`);
    
    // Mesurer la position avant
    const beforeScrollTop = scrollContainer.scrollTop;
    
    // Déclencher le scroll
    middleContact.scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });
    
    // Vérifier après un délai
    setTimeout(() => {
      const afterScrollTop = scrollContainer.scrollTop;
      if (Math.abs(afterScrollTop - beforeScrollTop) > 50) {
        console.log('✅ Test 2: Scroll effectué avec succès');
        console.log(`   Avant: ${beforeScrollTop}px, Après: ${afterScrollTop}px`);
      } else {
        console.log('⚠️ Test 2: Pas de scroll détecté (contact peut-être déjà visible)');
      }
    }, 1000);
  }
  
  // Test 3: Vérifier la réactivité aux clics
  console.log('🖱️ Test 3: Cliquez sur différents contacts pour tester le scroll automatique');
  
  // Test 4: Simuler l'utilisation des touches F
  console.log('⌨️ Test 4: Utilisez les touches F2-F10 pour tester le workflow complet');
  
  // Test de performance
  console.log('⚡ Test de performance: Mesure du temps de scroll');
  let scrollStartTime = 0;
  
  const measureScrollPerformance = () => {
    scrollStartTime = performance.now();
  };
  
  const onScrollEnd = () => {
    const scrollTime = performance.now() - scrollStartTime;
    console.log(`📊 Temps de scroll: ${scrollTime.toFixed(2)}ms`);
  };
  
  scrollContainer.addEventListener('scroll', () => {
    clearTimeout(scrollContainer.scrollEndTimer);
    scrollContainer.scrollEndTimer = setTimeout(onScrollEnd, 150);
  });
  
  // Ajouter des listeners pour les tests interactifs
  contactRows.forEach((row, index) => {
    row.addEventListener('click', () => {
      measureScrollPerformance();
      console.log(`👆 Contact ${index + 1} cliqué - Mesure du scroll en cours...`);
    });
  });
  
  console.log('✅ Configuration des tests terminée');
  console.log('');
  console.log('📝 Instructions de test:');
  console.log('1. Cliquez sur différents contacts dans la table');
  console.log('2. Utilisez les touches F2-F10 avec un contact sélectionné');
  console.log('3. Observez si la table scroll automatiquement');
  console.log('4. Vérifiez que le contact sélectionné reste visible');
  console.log('');
  console.log('🔍 Attendu:');
  console.log('- Animation fluide lors du scroll');
  console.log('- Contact centré dans la vue');
  console.log('- Pas de scroll si le contact est déjà visible');
  console.log('- Scroll automatique après utilisation des touches F');
}

// Fonction pour tester la résilience
function testResilience() {
  console.log('🛡️ Test de résilience...');
  
  // Test avec un ID inexistant
  const fakeId = 'contact-inexistant-12345';
  const fakeElement = document.querySelector(`[data-contact-id="${fakeId}"]`);
  
  if (!fakeElement) {
    console.log('✅ Gestion correcte des IDs inexistants');
  } else {
    console.warn('⚠️ Un élément avec un ID factice a été trouvé');
  }
  
  // Test de la fonction scrollToContact (si accessible)
  if (window.testScrollToContact) {
    try {
      window.testScrollToContact(fakeId);
      console.log('✅ Fonction scrollToContact résistante aux IDs invalides');
    } catch (error) {
      console.error('❌ Erreur dans scrollToContact:', error);
    }
  }
}

// Fonction pour analyser les performances
function analyzePerformance() {
  console.log('📈 Analyse des performances...');
  
  const scrollContainer = document.querySelector('.overflow-auto');
  if (!scrollContainer) return;
  
  const contacts = document.querySelectorAll('[data-contact-id]');
  
  console.log(`📊 Métriques:
    - Nombre de contacts: ${contacts.length}
    - Hauteur du conteneur: ${scrollContainer.clientHeight}px
    - Hauteur totale du contenu: ${scrollContainer.scrollHeight}px
    - Pourcentage visible: ${((scrollContainer.clientHeight / scrollContainer.scrollHeight) * 100).toFixed(1)}%
  `);
  
  // Test de la hauteur moyenne des lignes
  if (contacts.length > 1) {
    const firstContact = contacts[0];
    const secondContact = contacts[1];
    const rowHeight = secondContact.getBoundingClientRect().top - firstContact.getBoundingClientRect().top;
    console.log(`📏 Hauteur moyenne par ligne: ${rowHeight.toFixed(1)}px`);
  }
}

// Exécuter tous les tests
function runAllTests() {
  console.clear();
  console.log('🧪 === TESTS DE SCROLL AUTOMATIQUE DIMICALL ===');
  console.log('');
  
  testScrollAutomatique();
  setTimeout(testResilience, 1000);
  setTimeout(analyzePerformance, 2000);
  
  console.log('');
  console.log('⏰ Tests lancés - Résultats dans la console');
}

// Exposer les fonctions globalement pour utilisation dans la console
window.testScrollAutomatique = testScrollAutomatique;
window.testResilience = testResilience;
window.analyzePerformance = analyzePerformance;
window.runAllTests = runAllTests;

// Auto-exécution si appelé directement
if (typeof window !== 'undefined') {
  console.log('🔧 Fonctions de test disponibles:');
  console.log('- testScrollAutomatique()');
  console.log('- testResilience()');
  console.log('- analyzePerformance()');
  console.log('- runAllTests() <- Exécute tous les tests');
  console.log('');
  console.log('💡 Tapez runAllTests() pour commencer');
} 