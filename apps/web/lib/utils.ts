import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPhoneNumber(phoneNumber: string | null | undefined): string {
  if (!phoneNumber) {
    return '';
  }

  // 1. Nettoyer le numéro de tous les caractères non numériques sauf +
  let cleaned = phoneNumber.replace(/[^\d+]/g, '');
  
  // 2. Traitement spécial pour les cas particuliers
  
  // Cas spécial: +33(X)... -> +33X...
  cleaned = cleaned.replace(/^\+33\(\d\)/, match => '+33' + match.charAt(4));
  
  // Convertir 00XX en +XX
  cleaned = cleaned.replace(/^00(\d{2})/, '+$1');
  
  // 3. Gérer les formats incorrects ou spéciaux
  
  // Si commence par +0, supposer que c'est +33 (erreur courante pour la France)
  if (cleaned.startsWith('+0') && cleaned.length >= 10) {
    cleaned = '+33' + cleaned.substring(2);
  }
  
  // Correction importante: +330... -> +33 (supprime le 0 redondant après +33)
  if (cleaned.startsWith('+330') && cleaned.length >= 11) {
    cleaned = '+33' + cleaned.substring(4);
  }
  
  // 4. Convertir les numéros français nationaux en format international
  if (cleaned.startsWith('0') && cleaned.length === 10 && /^0[1-9]/.test(cleaned)) {
    cleaned = '+33' + cleaned.substring(1); // 0X... -> +33X...
  }
  
  // 5. Formatage spécifique selon le type de numéro
  
  // Format français: +33 suivi de 9 chiffres (le plus courant)
  if (cleaned.startsWith('+33') && cleaned.length === 12) {
    const nationalPart = cleaned.substring(3); // Retire +33
    const firstDigit = nationalPart.charAt(0);
    const remainingDigits = nationalPart.substring(1);
    
    // Format standard français: +33 X XX XX XX XX
    return `+33 ${firstDigit} ${remainingDigits.substring(0,2)} ${remainingDigits.substring(2,4)} ${remainingDigits.substring(4,6)} ${remainingDigits.substring(6,8)}`;
  }
  
  // Format suisse: +41 XX XXX XX XX
  if (cleaned.startsWith('+41') && cleaned.length >= 11) {
    const nationalPart = cleaned.substring(3); // Retire +41
    if (nationalPart.length >= 9) {
      const firstDigit = nationalPart.charAt(0);
      const remainingDigits = nationalPart.substring(1);
      
      // Format standard suisse: +41 XX XXX XX XX
      return `+41 ${firstDigit}${remainingDigits.substring(0,1)} ${remainingDigits.substring(1,4)} ${remainingDigits.substring(4,6)} ${remainingDigits.substring(6)}`;
    }
  }
  
  // Autres numéros internationaux commençant par + (format générique)
  if (cleaned.startsWith('+')) {
    // Trouver l'indicatif pays
    let countryCode = '+';
    let i = 1;
    
    // Extraire l'indicatif pays (généralement 1-3 chiffres après le +)
    while (i < cleaned.length && i <= 3 && /\d/.test(cleaned[i])) {
      countryCode += cleaned[i];
      i++;
    }
    
    // Extraire la partie nationale
    const nationalPart = cleaned.substring(i);
    
    if (nationalPart.length > 0) {
      // Groupe les chiffres par paires pour plus de lisibilité
      const groups = [];
      for (let j = 0; j < nationalPart.length; j += 2) {
        groups.push(nationalPart.substring(j, Math.min(j + 2, nationalPart.length)));
      }
      return `${countryCode} ${groups.join(' ')}`;
    } else {
      return countryCode;
    }
  }
  
  // Fallback: formatter par paires pour les numéros qui ne correspondent à aucun motif connu
  if (cleaned.length > 0) {
    const groups = [];
    for (let i = 0; i < cleaned.length; i += 2) {
      groups.push(cleaned.substring(i, Math.min(i + 2, cleaned.length)));
    }
    return groups.join(' ');
  }
  
  return cleaned; // Dernier recours si tout échoue
}

// Animation style pour dessiner le symbole infini
export const animateDrawInfinity = `
  @keyframes drawInfinity {
    0% {
      stroke-dashoffset: 60;
    }
    100% {
      stroke-dashoffset: 0;
    }
  }
  
  .animate-draw-infinity {
    animation: drawInfinity 2s ease-in-out forwards;
  }
`;

export function appendStyleToHead(styleContent: string) {
  if (typeof document !== 'undefined') {
    // Vérifier si un style avec cette animation existe déjà
    const existingStyle = document.getElementById('animation-infinity-style');
    if (!existingStyle) {
      const styleElement = document.createElement('style');
      styleElement.id = 'animation-infinity-style';
      styleElement.textContent = styleContent;
      document.head.appendChild(styleElement);
    }
  }
}

// Appeler cette fonction lors de l'initialisation de l'application
export function initAnimationStyles() {
  appendStyleToHead(animateDrawInfinity);
}
