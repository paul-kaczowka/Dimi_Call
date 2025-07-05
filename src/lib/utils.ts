import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Filtre les valeurs vides/nulles/undefined/N/A et retourne une chaîne propre
 * @param values - Les valeurs à filtrer et concaténer
 * @returns Une chaîne propre sans valeurs vides
 */
export const filterAndJoin = (...values: (string | null | undefined)[]): string => {
  return values
    .filter(val => val && val.trim() !== '' && val.toLowerCase() !== 'n/a' && val !== 'null' && val !== 'undefined')
    .map(val => val!.trim())
    .join(' ')
    .trim();
};

// Variables globales pour garder les références des fenêtres de recherche
let linkedInWindowRef: Window | null = null;
let googleWindowRef: Window | null = null;

/**
 * Ouvre une URL LinkedIn dans une fenêtre dédiée qui sera réutilisée pour tous les liens LinkedIn
 * Si la fenêtre existe déjà, elle sera réutilisée et rechargée avec la nouvelle URL
 * @param url - L'URL LinkedIn à ouvrir
 */
export const openLinkedInWindow = (url: string): void => {
  // Vérifier si la fenêtre existe déjà et n'est pas fermée
  if (linkedInWindowRef && !linkedInWindowRef.closed) {
    try {
      // Naviguer vers la nouvelle URL dans la fenêtre existante (recharge la page)
      linkedInWindowRef.location.href = url;
      // Donner le focus à la fenêtre
      linkedInWindowRef.focus();
    } catch (error) {
      // En cas d'erreur (ex: fenêtre fermée), créer une nouvelle fenêtre
      console.log('Erreur lors du rechargement de la fenêtre LinkedIn, création d\'une nouvelle fenêtre');
      linkedInWindowRef = window.open(url, 'dimicall-linkedin-window', 'width=1200,height=800,scrollbars=yes,resizable=yes');
    }
  } else {
    // Créer une nouvelle fenêtre et garder la référence
    linkedInWindowRef = window.open(url, 'dimicall-linkedin-window', 'width=1200,height=800,scrollbars=yes,resizable=yes');
  }
};

/**
 * Ouvre une URL Google dans une fenêtre dédiée qui sera réutilisée pour toutes les recherches Google
 * Si la fenêtre existe déjà, elle sera réutilisée et rechargée avec la nouvelle URL
 * @param url - L'URL Google à ouvrir
 */
export const openGoogleWindow = (url: string): void => {
  // Vérifier si la fenêtre existe déjà et n'est pas fermée
  if (googleWindowRef && !googleWindowRef.closed) {
    try {
      // Naviguer vers la nouvelle URL dans la fenêtre existante (recharge la page)
      googleWindowRef.location.href = url;
      // Donner le focus à la fenêtre
      googleWindowRef.focus();
    } catch (error) {
      // En cas d'erreur (ex: fenêtre fermée), créer une nouvelle fenêtre
      console.log('Erreur lors du rechargement de la fenêtre Google, création d\'une nouvelle fenêtre');
      googleWindowRef = window.open(url, 'dimicall-google-window', 'width=1200,height=800,scrollbars=yes,resizable=yes');
    }
  } else {
    // Créer une nouvelle fenêtre et garder la référence
    googleWindowRef = window.open(url, 'dimicall-google-window', 'width=1200,height=800,scrollbars=yes,resizable=yes');
  }
};

/**
 * Génère une URL de recherche LinkedIn et l'ouvre dans la fenêtre dédiée
 * @param prenom - Prénom de la personne à rechercher
 * @param nom - Nom de la personne à rechercher
 */
export const searchLinkedIn = (prenom: string, nom: string): void => {
  const query = filterAndJoin(prenom, nom);
  if (!query) {
    console.warn('Aucune valeur valide pour la recherche LinkedIn');
    return;
  }
  const url = `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(query)}`;
  openLinkedInWindow(url);
};

/**
 * Génère une URL de recherche Google et l'ouvre dans la fenêtre dédiée
 * @param prenom - Prénom de la personne à rechercher
 * @param nom - Nom de la personne à rechercher
 */
export const searchGoogle = (prenom: string, nom: string): void => {
  const query = filterAndJoin(prenom, nom);
  if (!query) {
    console.warn('Aucune valeur valide pour la recherche Google');
    return;
  }
  const url = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
  openGoogleWindow(url);
};
