import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import type { Contact } from '@/lib/schemas/contact';
import { QueryKeys } from '@/lib/optimizedQueries';

/**
 * Hook optimisé pour interroger les contacts avec des performances améliorées
 */
export function useContactsQuery() {
  return useQuery<Contact[], Error>({
    queryKey: QueryKeys.contacts.list(),
    queryFn: async () => {
      try {
        const response = await fetch('/api/contacts');
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }
        return response.json();
      } catch (error) {
        console.error('Erreur lors de la récupération des contacts:', error);
        toast.error('Impossible de charger les contacts. Veuillez réessayer.');
        throw error;
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes avant de considérer les données obsolètes
    gcTime: 10 * 60 * 1000, // 10 minutes avant de supprimer du cache
    refetchOnWindowFocus: false, // Éviter les rafraîchissements inutiles
    refetchOnMount: true, // Mais toujours rafraîchir lors du montage initial
    refetchOnReconnect: true, // Rafraîchir après reconnexion réseau
    retry: 2, // Réessayer 2 fois en cas d'échec
    retryDelay: attempt => Math.min(1000 * 2 ** attempt, 10000), // Backoff exponentiel
  });
}

/**
 * Hook pour récupérer un contact spécifique par ID
 */
export function useContactQuery(contactId: string) {
  return useQuery<Contact, Error>({
    queryKey: QueryKeys.contacts.detail(contactId),
    queryFn: async () => {
      try {
        const response = await fetch(`/api/contacts/${contactId}`);
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }
        return response.json();
      } catch (error) {
        console.error(`Erreur lors de la récupération du contact ${contactId}:`, error);
        toast.error('Impossible de charger les détails du contact.');
        throw error;
      }
    },
    staleTime: 2 * 60 * 1000, // 2 minutes avant de considérer les données obsolètes
    gcTime: 5 * 60 * 1000, // 5 minutes avant de supprimer du cache
    enabled: !!contactId, // N'exécuter que si contactId est défini
  });
}

/**
 * Hook pour rechercher des contacts avec un filtre
 */
export function useFilteredContactsQuery(filter: string) {
  return useQuery<Contact[], Error>({
    queryKey: QueryKeys.contacts.filtered(filter),
    queryFn: async () => {
      try {
        const response = await fetch(`/api/contacts?filter=${encodeURIComponent(filter)}`);
        if (!response.ok) {
          throw new Error(`Erreur HTTP: ${response.status}`);
        }
        return response.json();
      } catch (error) {
        console.error('Erreur lors de la recherche de contacts:', error);
        toast.error('Impossible d\'effectuer la recherche.');
        throw error;
      }
    },
    staleTime: 30 * 1000, // 30 secondes avant de considérer les données obsolètes
    gcTime: 2 * 60 * 1000, // 2 minutes avant de supprimer du cache
    enabled: filter.length > 0, // N'exécuter que si un filtre est spécifié
  });
} 