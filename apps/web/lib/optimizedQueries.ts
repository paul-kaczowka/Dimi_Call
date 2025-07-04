/**
 * Configurations de requêtes optimisées pour différents cas d'utilisation
 * Ce fichier définit des préréglages pour TanStack Query adaptés à différents scénarios
 */

import { QueryClient, queryOptions } from '@tanstack/react-query';
import type { Contact } from './schemas/contact';

// Variable globale pour accéder au QueryClient depuis les fonctions d'aide
let queryClient: QueryClient;

// Fonction pour définir le QueryClient (à appeler depuis providers.tsx)
export function setQueryClient(client: QueryClient) {
  queryClient = client;
}

// Clés de requête typées pour éviter les erreurs d'orthographe
export const QueryKeys = {
  contacts: {
    all: ['contacts'] as const,
    list: () => [...QueryKeys.contacts.all, 'list'] as const,
    detail: (id: string) => [...QueryKeys.contacts.all, 'detail', id] as const,
    filtered: (filter: string) => [...QueryKeys.contacts.all, 'filtered', filter] as const,
  },
  settings: {
    all: ['settings'] as const,
    user: () => [...QueryKeys.settings.all, 'user'] as const,
  }
};

// Configuration pour les listes de contacts (durée de vie plus longue car change moins souvent)
export const contactsListOptions = queryOptions({
  queryKey: QueryKeys.contacts.list(),
  queryFn: async (): Promise<Contact[]> => {
    const response = await fetch('/api/contacts');
    if (!response.ok) {
      throw new Error('Erreur lors de la récupération des contacts');
    }
    return response.json();
  },
  staleTime: 5 * 60 * 1000, // 5 minutes
  gcTime: 10 * 60 * 1000, // 10 minutes
  refetchOnWindowFocus: false,
  refetchOnMount: true,
});

// Configuration pour un contact spécifique (plus réactif aux changements)
export const contactDetailOptions = (id: string) => queryOptions({
  queryKey: QueryKeys.contacts.detail(id),
  queryFn: async (): Promise<Contact> => {
    const response = await fetch(`/api/contacts/${id}`);
    if (!response.ok) {
      throw new Error(`Erreur lors de la récupération du contact ${id}`);
    }
    return response.json();
  },
  staleTime: 2 * 60 * 1000, // 2 minutes
  gcTime: 5 * 60 * 1000, // 5 minutes
  refetchOnWindowFocus: true,
  retry: 2,
});

// Configuration pour filtrer les contacts (très réactive aux changements)
export const filteredContactsOptions = (filter: string) => queryOptions({
  queryKey: QueryKeys.contacts.filtered(filter),
  queryFn: async (): Promise<Contact[]> => {
    // Utilisation des paramètres de requête pour filtrer côté serveur
    const response = await fetch(`/api/contacts?filter=${encodeURIComponent(filter)}`);
    if (!response.ok) {
      throw new Error('Erreur lors de la recherche de contacts');
    }
    return response.json();
  },
  staleTime: 30 * 1000, // 30 secondes
  gcTime: 2 * 60 * 1000, // 2 minutes
  refetchOnWindowFocus: true,
  enabled: filter.length > 0, // N'active la requête que si un filtre est spécifié
});

// Fonction pour valider si la réponse HTTP est OK
export const validateResponse = async (response: Response): Promise<Response> => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(errorData.message || 'Erreur réseau');
  }
  return response;
};

// Fonction d'aide pour gérer les erreurs de réseau
export const handleQueryError = (error: Error, queryKey: unknown[]) => {
  console.error(`Erreur pour la requête ${JSON.stringify(queryKey)}:`, error);
  // Vous pourriez également envoyer l'erreur à un service de surveillance ici
};

// Fonction pour préparer les options de mutation optimiste
export const createOptimisticOptions = <T extends { id: string }>(
  queryKey: readonly unknown[],
  updateFn: (old: T[], newItem: T) => T[],
) => ({
  // Avant la mutation, mettre à jour l'UI de manière optimiste
  onMutate: async (newItem: T) => {
    if (!queryClient) {
      console.error('QueryClient non initialisé. Appelez setQueryClient() avant d\'utiliser cette fonction.');
      return {};
    }
    
    // Annuler les requêtes en cours pour ce queryKey
    await queryClient.cancelQueries({ queryKey });
    
    // Sauvegarder les données précédentes
    const previousData = queryClient.getQueryData<T[]>(queryKey as any);
    
    // Mettre à jour le cache avec les nouvelles données
    if (previousData) {
      queryClient.setQueryData<T[]>(
        queryKey as any,
        old => updateFn(old || [], newItem)
      );
    }
    
    return { previousData };
  },
  
  // En cas d'erreur, restaurer les données précédentes
  onError: (_error: Error, _vars: T, context: any) => {
    if (!queryClient) {
      console.error('QueryClient non initialisé.');
      return;
    }
    
    if (context?.previousData) {
      queryClient.setQueryData(queryKey, context.previousData);
    }
  },
  
  // Après une mutation réussie ou échouée, toujours re-valider les données
  onSettled: () => {
    if (!queryClient) {
      console.error('QueryClient non initialisé.');
      return;
    }
    
    queryClient.invalidateQueries({ queryKey });
  },
}); 