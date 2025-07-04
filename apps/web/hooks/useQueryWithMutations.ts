import React, { useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';

// Définir des types pour la file d'attente et les options
type MutationQueueItem = {
  id: string;
  execute: () => Promise<void>;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  retryCount: number;
  timestamp: number;
};

interface UseQueryWithMutationsOptions<TMutationResult> {
  onMutationSuccess?: (data: TMutationResult) => void;
  onMutationError?: (error: Error) => void;
  optimisticUpdate?: boolean;
  throttleTime?: number;
  maxRetries?: number;
}

interface MutationContext<TData> {
  previousData?: TData;
}

/**
 * Hook personnalisé qui combine les requêtes et les mutations avec gestion de file d'attente
 * et optimisations de performance.
 */
export function useQueryWithMutations<
  TData = unknown,
  TError = Error,
  TMutationData = Record<string, unknown>,
  TMutationResult = unknown
>(
  queryKey: string[],
  queryFn: () => Promise<TData>,
  mutationFn: (data: TMutationData) => Promise<TMutationResult>,
  options: UseQueryWithMutationsOptions<TMutationResult> = {}
) {
  const queryClient = useQueryClient();
  const {
    onMutationSuccess,
    onMutationError,
    optimisticUpdate = true,
    throttleTime = 300,
    maxRetries = 3
  } = options;

  // État interne de la file d'attente (implémenté via ref pour éviter les re-renders)
  const mutationQueueRef = useRef<MutationQueueItem[]>([]);
  const isProcessingRef = useRef<boolean>(false);

  // Requête TanStack Query
  const query = useQuery<TData, TError>({
    queryKey,
    queryFn,
    staleTime: 1000 * 60 * 5, // 5 minutes avant de considérer comme obsolète
  });

  // Mutation TanStack Query
  const mutation = useMutation<TMutationResult, Error, TMutationData, MutationContext<TData>>({
    mutationFn,
    onMutate: async (variables) => {
      if (optimisticUpdate) {
        // Annuler les requêtes en cours pour ce queryKey
        await queryClient.cancelQueries({ queryKey });

        // Sauvegarder l'état précédent
        const previousData = queryClient.getQueryData<TData>(queryKey);

        // Mettre à jour le cache optimistiquement (via la fonction de callback)
        try {
          // Cette logique dépendra de la structure de vos données
          if (typeof variables === 'object' && variables !== null && 'id' in variables) {
            queryClient.setQueryData<unknown>(queryKey, (oldData: unknown) => {
              if (Array.isArray(oldData)) {
                return oldData.map(item => 
                  'id' in item && item.id === (variables as { id: string }).id ? { ...item, ...variables } : item
                );
              }
              return oldData;
            });
          }
        } catch (err) {
          console.error('Erreur lors de la mise à jour optimiste:', err);
        }

        return { previousData };
      }
      return {};
    },
    onSuccess: (data) => {
      // Invalider et re-récupérer pour s'assurer que les données sont à jour
      queryClient.invalidateQueries({ queryKey });
      
      // Notification utilisateur
      toast.success('Opération réussie');
      
      // Callback personnalisé
      if (onMutationSuccess) {
        onMutationSuccess(data);
      }
    },
    onError: (error: Error, _variables, context) => {
      // En cas d'erreur, restaurer l'état précédent si mise à jour optimiste
      if (optimisticUpdate && context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
      
      // Notification utilisateur
      toast.error(`Erreur: ${error.message}`);
      
      // Callback personnalisé
      if (onMutationError) {
        onMutationError(error);
      }
    },
  });

  // Ajouter une mutation à la file d'attente
  const enqueueMutation = useCallback((data: TMutationData) => {
    const id = Date.now().toString();
    
    // Créer un élément de file d'attente
    const queueItem: MutationQueueItem = {
      id,
      execute: async () => {
        try {
          await mutation.mutateAsync(data);
          // Marquer comme complété en cas de succès
          mutationQueueRef.current = mutationQueueRef.current.map(item => 
            item.id === id ? { ...item, status: 'completed' } : item
          );
        } catch (/* eslint-disable-next-line @typescript-eslint/no-unused-vars */ _error) {
          // Incrémenter le compteur de tentatives en cas d'échec
          const currentItem = mutationQueueRef.current.find(item => item.id === id);
          if (currentItem && currentItem.retryCount < maxRetries) {
            mutationQueueRef.current = mutationQueueRef.current.map(item => 
              item.id === id ? { ...item, status: 'pending', retryCount: item.retryCount + 1 } : item
            );
          } else {
            // Marquer comme échoué après trop de tentatives
            mutationQueueRef.current = mutationQueueRef.current.map(item => 
              item.id === id ? { ...item, status: 'failed' } : item
            );
          }
        }
      },
      status: 'pending',
      retryCount: 0,
      timestamp: Date.now(),
    };
    
    // Ajouter à la file d'attente
    mutationQueueRef.current = [...mutationQueueRef.current, queueItem];
    
    // Démarrer le traitement si pas déjà en cours
    if (!isProcessingRef.current) {
      processQueue();
    }
  }, [mutation, maxRetries]);

  // Fonction pour traiter la file d'attente
  const processQueue = useCallback(async () => {
    if (isProcessingRef.current || mutationQueueRef.current.length === 0) {
      return;
    }
    
    isProcessingRef.current = true;
    
    // Trouver le prochain élément en attente
    const nextItem = mutationQueueRef.current.find(item => item.status === 'pending');
    if (nextItem) {
      // Mettre à jour le statut
      mutationQueueRef.current = mutationQueueRef.current.map(item => 
        item.id === nextItem.id ? { ...item, status: 'processing' } : item
      );
      
      // Traiter avec un délai pour éviter les rafales
      await new Promise(resolve => setTimeout(resolve, throttleTime));
      
      // Exécuter la mutation
      await nextItem.execute();
      
      // Nettoyer la file d'attente (supprimer les éléments terminés de plus de 5 minutes)
      const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
      mutationQueueRef.current = mutationQueueRef.current.filter(item => 
        item.status !== 'completed' || item.timestamp > fiveMinutesAgo
      );
    }
    
    isProcessingRef.current = false;
    
    // Continuer avec le prochain élément s'il y en a
    if (mutationQueueRef.current.some(item => item.status === 'pending')) {
      processQueue();
    }
  }, [throttleTime]);

  return {
    // Données et état de la requête
    data: query.data,
    isLoading: query.isPending,
    isError: query.isError,
    error: query.error,
    
    // Fonctions de mutation
    mutate: enqueueMutation,
    
    // État de la mutation
    isMutating: mutation.isPending,
    
    // Fonction de rafraîchissement manuel
    refetch: query.refetch,
    
    // État de la file d'attente (pour information)
    queueSize: mutationQueueRef.current.length,
    hasPendingMutations: mutationQueueRef.current.some(item => 
      item.status === 'pending' || item.status === 'processing'
    ),
  };
} 