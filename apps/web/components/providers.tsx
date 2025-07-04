'use client';

import React, { useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { persistQueryClient } from '@tanstack/react-query-persist-client';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { get, set, del } from 'idb-keyval';
import { AnimatePresence } from 'framer-motion';
import { ThemeProvider } from 'next-themes';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { setQueryClient } from '@/lib/optimizedQueries';

// Configuration avancée du QueryClient pour optimiser les performances
const createOptimizedQueryClient = () => {
  const client = new QueryClient({
    defaultOptions: {
      queries: {
        // Configuration pour les requêtes
        gcTime: 1000 * 60 * 60 * 24, // 24 heures de durée de vie dans le cache
        staleTime: 1000 * 60 * 5, // 5 minutes avant considérer les données comme obsolètes
        retry: 2, // Limiter le nombre de tentatives pour éviter de surcharger le serveur
        retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000), // Backoff exponentiel
        refetchOnWindowFocus: false, // Désactiver le refetch automatique pour réduire les requêtes
        refetchOnReconnect: true, // Toujours refetch après reconnexion
      },
      mutations: {
        // Configuration pour les mutations
        retry: 1, // Limiter les tentatives pour les mutations
        retryDelay: 1000, // Délai fixe entre les tentatives
      },
    },
  });
  
  // Rendre le queryClient disponible pour les fonctions utilitaires
  setQueryClient(client);
  
  return client;
};

// Persister amélioré pour le stockage IndexedDB
const createOptimizedStoragePersister = () => createAsyncStoragePersister({
  storage: {
    getItem: async (key: string) => {
      try {
        const value = await get(key);
        if (value === undefined) return null;
        return JSON.stringify(value);
      } catch (error) {
        console.error('Erreur lors de la récupération des données persistées:', error);
        return null;
      }
    },
    setItem: async (key: string, value: string) => {
      try {
        await set(key, JSON.parse(value));
      } catch (error) {
        console.error('Erreur lors de la persistance des données:', error);
      }
    },
    removeItem: async (key: string) => {
      try {
        await del(key);
      } catch (error) {
        console.error('Erreur lors de la suppression des données persistées:', error);
      }
    },
  },
  throttleTime: 1000, // Regrouper les écritures dans un intervalle de 1 seconde
});

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => createOptimizedQueryClient());
  const [persister] = useState(() => createOptimizedStoragePersister());
  const [isRestoring, setIsRestoring] = useState(false);

  // Configurer la persistance du client après l'initialisation des composants
  useEffect(() => {
    const setupPersistence = async () => {
      try {
        setIsRestoring(true);
        await persistQueryClient({
          queryClient,
          persister,
          maxAge: 1000 * 60 * 60 * 24, // 24 heures (même que gcTime)
          dehydrateOptions: {
            // Ne persister que les requêtes réussies
            shouldDehydrateQuery: query => query.state.status === 'success',
          },
        });
      } catch (error: unknown) {
        console.error('Erreur lors de la persistance du query client:', error);
      } finally {
        setIsRestoring(false);
      }
    };

    setupPersistence();
  }, [queryClient, persister]);

  // Définir une classe conditionnelle pour le chargement pendant la restauration
  const loadingClass = isRestoring ? 'opacity-60 pointer-events-none' : '';

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="dark"
      enableSystem={false}
    >
      <QueryClientProvider client={queryClient}>
        <div className={loadingClass}>
          <AnimatePresence
            mode="wait"
            initial={false}
          >
            {children}
          </AnimatePresence>
        </div>
        
        <ToastContainer
          position="bottom-right"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="dark"
        />
      </QueryClientProvider>
    </ThemeProvider>
  );
} 