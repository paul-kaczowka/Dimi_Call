import { useState, useEffect } from 'react';

/**
 * Hook pour débouncer une valeur
 * Évite les requêtes excessives lors de la saisie
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook pour débouncer spécifiquement les recherches
 * Inclut une logique spécialisée pour les termes de recherche
 */
export function useSearchDebounce(searchTerm: string, delay: number = 300): {
  debouncedSearchTerm: string;
  isDebouncing: boolean;
} {
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(searchTerm);
  const [isDebouncing, setIsDebouncing] = useState(false);

  useEffect(() => {
    if (searchTerm !== debouncedSearchTerm) {
      setIsDebouncing(true);
    }

    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setIsDebouncing(false);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm, delay, debouncedSearchTerm]);

  return { debouncedSearchTerm, isDebouncing };
} 