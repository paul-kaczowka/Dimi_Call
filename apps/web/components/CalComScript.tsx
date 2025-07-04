'use client';

// import Script from 'next/script'; // Supprimer l'import de next/script
import { getCalApi } from '@calcom/embed-react';
import { useEffect, useRef } from 'react'; // Importer useEffect et useRef directement

export function CalComScript() {
  const calUiConfiguredRef = useRef(false);

  useEffect(() => {
    const configureCalUI = async () => {
      if (calUiConfiguredRef.current) {
        // console.log("[CalComScript] UI Cal.com déjà configurée ou tentative en cours. Annulation.");
        return;
      }
      calUiConfiguredRef.current = true;
      // console.log("[CalComScript] Début de la configuration de l'UI Cal.com via useEffect.");

      try {
        // console.log("[CalComScript] Appel de getCalApi({ namespace: \"audit-patrimonial\" })... (devrait charger embed.js si nécessaire)");
        const cal = await getCalApi({ namespace: "audit-patrimonial" }); 
        // console.log("[CalComScript] getCalApi() retourné.", cal);
        
        if (typeof cal === 'function') {
          cal("ui", { 
            "theme": "dark", 
            "hideEventTypeDetails": false, 
            "layout": "month_view",
            "cssVarsPerTheme": {
              dark: {
                "cal-brand-color": "#0ea5e9" // Couleur principale en mode sombre
              },
              light: {
                "cal-brand-color": "#0284c7" // Couleur principale en mode clair
              }
            }
          });
          // console.log("[CalComScript] Configuration de l'UI Cal.com terminée avec succès.");
        } else {
          console.error("[CalComScript] Erreur: getCalApi() n'a pas retourné une fonction.", cal);
          calUiConfiguredRef.current = false; // Permettre une nouvelle tentative si le composant est remonté
        }
      } catch (error) {
        console.error("[CalComScript] Erreur lors de l'appel à getCalApi() ou de la configuration de l'UI Cal.com:", error);
        calUiConfiguredRef.current = false; // Permettre une nouvelle tentative
      }
    };

    configureCalUI();

  }, []); // Le tableau de dépendances vide assure une exécution unique après le montage

  return null; // Ce composant n'a pas besoin de rendre de JSX
} 