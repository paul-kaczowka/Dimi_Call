import React, { useState, useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { AnimatePresence } from 'framer-motion'
import App from './App'
import ModernLoader from './components/ModernLoader'
import { useSupabaseAuth } from './lib/auth-client'
import './index.css'

// Fonction pour masquer l'écran de chargement HTML initial
const hideInitialLoadingScreen = () => {
  const loadingScreen = document.getElementById('loading-screen')
  if (loadingScreen) {
    loadingScreen.style.display = 'none'
  }
}

// Wrapper pour l'App avec gestion de l'écran de chargement moderne
const AppWithModernLoader = () => {
  const { isLoading } = useSupabaseAuth();
  const [showModernLoader, setShowModernLoader] = useState(true);

  useEffect(() => {
    // Masquer immédiatement l'écran de chargement HTML
    hideInitialLoadingScreen();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      // Attendre un peu avant de masquer le loader moderne pour une transition fluide
      setTimeout(() => {
        setShowModernLoader(false);
      }, 800);
    }
  }, [isLoading]);

  return (
    <>
      <AnimatePresence mode="wait">
        {showModernLoader && (
          <ModernLoader key="modern-loader" />
        )}
      </AnimatePresence>
      {!showModernLoader && <App />}
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <AppWithModernLoader />
  </React.StrictMode>
) 