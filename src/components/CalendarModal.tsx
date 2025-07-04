import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ExternalLink, RefreshCw, CheckCircle, Loader2, Calendar, Clock } from 'lucide-react';
import { getCalApi } from "@calcom/embed-react";
import { Contact } from '../types';
import { Theme } from '../types';

interface CalendarModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact?: Contact;
  theme: Theme;
  onSuccess?: () => void;
}

type LoadingState = 'idle' | 'loading' | 'success' | 'error' | 'timeout';

export const CalendarModal: React.FC<CalendarModalProps> = ({
  open,
  onOpenChange,
  contact,
  theme,
  onSuccess
}) => {
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [retryCount, setRetryCount] = useState(0);
  const [isEmbedReady, setIsEmbedReady] = useState(false);

  // Configuration Cal.com
  const calLink = "dimitri-morel-arcanis-conseil/audit-patrimonial?overlayCalendar=true";
  const calUrl = `https://cal.com/${calLink}`;

  // Réinitialiser l'état quand le modal s'ouvre
  useEffect(() => {
    if (open) {
      setLoadingState('loading');
      setErrorMessage('');
      setRetryCount(0);
      setIsEmbedReady(false);
      initializeCalcom();
    } else {
      setLoadingState('idle');
    }
  }, [open]);

  // Configuration du contact pour Cal.com
  const getContactConfig = useCallback(() => {
    if (!contact) return {};

    const config: any = {
      layout: "month_view",
      theme: theme === Theme.Dark ? "dark" : "light"
    };

    if (contact.nom) {
      config.name = contact.nom;
    }
    if (contact.prenom) {
      config.Prenom = contact.prenom;
    }
    if (contact.email && contact.email.trim() !== '') {
      config.email = contact.email;
    }
    if (contact.telephone) {
      let phoneNumber = contact.telephone.replace(/[\s\-\(\)]/g, '');
      if (!phoneNumber.startsWith('+')) {
        if (phoneNumber.startsWith('0')) {
          phoneNumber = '+33' + phoneNumber.substring(1);
        } else if (!phoneNumber.startsWith('33')) {
          phoneNumber = '+33' + phoneNumber;
        } else {
          phoneNumber = '+' + phoneNumber;
        }
      }
      config.smsReminderNumber = phoneNumber;
    }

    return config;
  }, [contact, theme]);

  // Fonction pour initialiser Cal.com
  const initializeCalcom = useCallback(async () => {
    try {
      setLoadingState('loading');
      setErrorMessage('');

      // Timeout pour éviter l'attente infinie
      const timeoutId = setTimeout(() => {
        console.log('⏰ Timeout atteint (15s) - loadingState actuel:', loadingState);
        setLoadingState('timeout');
        setErrorMessage('Le chargement du calendrier a pris trop de temps');
      }, 15000); // 15 secondes timeout

      console.log('🗓️ Initialisation Cal.com...');
      
      const cal = await getCalApi();
      clearTimeout(timeoutId);

      if (!cal) {
        throw new Error('Impossible de charger l\'API Cal.com');
      }

      console.log('✅ API Cal.com chargée, type:', typeof cal);

      // Configuration
      const config = getContactConfig();
      console.log('⚙️ Configuration Cal.com:', config);
      
      // Écouter les événements Cal.com essentiels
      cal("on", {
        action: "bookingSuccessful",
        callback: (e: any) => {
          console.log('📡 Événement Cal.com [bookingSuccessful]:', e);
          console.log('📅 Réservation réussie');
          setLoadingState('success');
          onSuccess?.();
        }
      });

      cal("on", {
        action: "linkReady",
        callback: (e: any) => {
          console.log('📡 Événement Cal.com [linkReady]:', e);
          console.log('🔗 Lien Cal.com prêt');
          setIsEmbedReady(true);
          setLoadingState('success');
        }
      });

      cal("on", {
        action: "linkFailed",
        callback: (e: any) => {
          console.log('📡 Événement Cal.com [linkFailed]:', e);
          console.error('❌ Erreur Cal.com');
          setLoadingState('error');
          setErrorMessage('Erreur lors du chargement du calendrier');
        }
      });

      cal("on", {
        action: "__closeIframe",
        callback: (e: any) => {
          console.log('📡 Événement Cal.com [__closeIframe]:', e);
          console.log('🚪 Modal Cal.com fermé');
          onOpenChange(false);
        }
      });

      // Essayer différentes méthodes d'ouverture
      console.log('🚀 Tentative d\'ouverture du modal Cal.com...');
      
      try {
        // Méthode 1: Modal avec config
        cal("modal", {
          calLink: calLink,
          config: config
        });
        console.log('✅ Méthode 1 (modal + config) exécutée');
      } catch (modalError) {
        console.error('❌ Erreur méthode 1:', modalError);
        
        try {
          // Méthode 2: Modal simple avec objet
          cal("modal", {
            calLink: calLink
          });
          console.log('✅ Méthode 2 (modal simple) exécutée');
        } catch (simpleError) {
          console.error('❌ Erreur méthode 2:', simpleError);
          
          // Méthode 3: UI avec config
          cal("ui", config);
          console.log('✅ Méthode 3 (ui config) exécutée');
        }
      }

      // Écouter les erreurs de console pour détecter X-Frame-Options
      const originalConsoleError = console.error;
      console.error = (...args) => {
        const message = args.join(' ');
        if (message.includes('X-Frame-Options') || message.includes('sameorigin') || message.includes('Refused to display')) {
          console.log('🚫 Détection X-Frame-Options: Cal.com refuse l\'embedding');
          setLoadingState('error');
          setErrorMessage('Cal.com ne permet pas l\'embedding. Ouverture automatique en nouvel onglet...');
          
          // Ouvrir automatiquement en nouvel onglet après 2 secondes
          setTimeout(() => {
            openInNewTab();
          }, 2000);
        }
        originalConsoleError.apply(console, args);
      };

      // Fallback rapide pour X-Frame-Options (3 secondes)
      setTimeout(() => {
        console.log('⏰ Vérification fallback rapide - isEmbedReady:', isEmbedReady, 'loadingState:', loadingState);
        if (!isEmbedReady && loadingState === 'loading') {
          console.log('🚫 Probable problème X-Frame-Options - basculement rapide vers nouvel onglet');
          setLoadingState('error');
          setErrorMessage('L\'embedding Cal.com a échoué. Ouverture en nouvel onglet...');
          setTimeout(() => openInNewTab(), 1000);
        }
      }, 3000);

      // Fallback standard (8 secondes)
      setTimeout(() => {
        console.log('⏰ Fallback standard - loadingState:', loadingState);
        if (!isEmbedReady && loadingState === 'loading') {
          console.log('⏰ Fallback: considération comme succès après 8s');
          setLoadingState('success');
        }
      }, 8000);

      // Fallback ultime (12 secondes)
      setTimeout(() => {
        console.log('🆘 Fallback ultime - loadingState:', loadingState);
        if (loadingState === 'loading') {
          console.log('🆘 Échec total - basculement vers erreur');
          setLoadingState('error');
          setErrorMessage('Le calendrier ne répond pas. Utilisez le bouton pour ouvrir en nouvel onglet.');
        }
      }, 12000);

    } catch (error) {
      console.error('❌ Erreur lors de l\'initialisation Cal.com:', error);
      console.error('❌ Stack trace:', error instanceof Error ? error.stack : 'Pas de stack trace');
      setLoadingState('error');
      setErrorMessage(error instanceof Error ? error.message : 'Erreur inconnue');
    }
  }, [calLink, getContactConfig, loadingState, isEmbedReady, onSuccess]);

  // Fonction de retry
  const handleRetry = useCallback(() => {
    const newRetryCount = retryCount + 1;
    setRetryCount(newRetryCount);
    
    if (newRetryCount >= 3) {
      setLoadingState('error');
      setErrorMessage('Trop de tentatives échouées. Utilisez le lien direct.');
      return;
    }
    
    initializeCalcom();
  }, [retryCount, initializeCalcom]);

  // Fonction pour ouvrir en nouvel onglet
  const openInNewTab = useCallback(() => {
    const queryParams = new URLSearchParams();
    
    if (contact) {
      if (contact.nom) queryParams.append('name', contact.nom);
      if (contact.prenom) queryParams.append('Prenom', contact.prenom);
      if (contact.email && contact.email.trim() !== '') queryParams.append('email', contact.email);
      if (contact.telephone) {
        let phoneNumber = contact.telephone.replace(/[\s\-\(\)]/g, '');
        if (!phoneNumber.startsWith('+')) {
          if (phoneNumber.startsWith('0')) {
            phoneNumber = '+33' + phoneNumber.substring(1);
          } else if (!phoneNumber.startsWith('33')) {
            phoneNumber = '+33' + phoneNumber;
          } else {
            phoneNumber = '+' + phoneNumber;
          }
        }
        queryParams.append('smsReminderNumber', phoneNumber);
      }
    }
    
    const finalUrl = `${calUrl}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    window.open(finalUrl, '_blank');
    onOpenChange(false);
  }, [contact, calUrl, onOpenChange]);

  // Contenu en fonction de l'état
  const renderContent = () => {
    switch (loadingState) {
      case 'loading':
        return (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="relative">
              <Loader2 className="w-12 h-12 animate-spin text-primary" />
              <div className="absolute inset-0 w-12 h-12 border-4 border-primary/20 rounded-full animate-pulse" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-medium">Chargement du calendrier...</h3>
              <p className="text-sm text-muted-foreground">
                Initialisation de Cal.com en cours
                {retryCount > 0 && ` (Tentative ${retryCount + 1})`}
              </p>
              <p className="text-xs text-muted-foreground">
                Note: En cas de problème d'embedding, ouverture automatique en nouvel onglet
              </p>
            </div>
            <div className="w-full max-w-xs">
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <div className="h-full bg-primary animate-pulse rounded-full" style={{width: '60%'}} />
              </div>
            </div>
            
            {/* Bouton d'urgence pour ouverture directe */}
            <div className="mt-4">
              <Button onClick={openInNewTab} variant="outline" size="sm">
                <ExternalLink className="w-4 h-4 mr-2" />
                Ouvrir maintenant en nouvel onglet
              </Button>
            </div>
          </div>
        );

      case 'success':
        return (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="relative">
              <CheckCircle className="w-12 h-12 text-green-500" />
              <div className="absolute inset-0 w-12 h-12 border-4 border-green-500/20 rounded-full animate-ping" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-medium">Calendrier chargé !</h3>
              <p className="text-sm text-muted-foreground">
                Le calendrier Cal.com est maintenant disponible.
                {contact && ` Les informations de ${contact.prenom} ${contact.nom} ont été pré-remplies.`}
              </p>
            </div>
            <Button onClick={() => onOpenChange(false)} className="mt-4">
              Fermer
            </Button>
          </div>
        );

      case 'timeout':
      case 'error':
        return (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="relative">
              <AlertTriangle className="w-12 h-12 text-orange-500" />
            </div>
            <div className="text-center space-y-2">
              <h3 className="text-lg font-medium">
                {loadingState === 'timeout' ? 'Timeout de chargement' : 'Erreur de chargement'}
              </h3>
              <p className="text-sm text-muted-foreground max-w-md">
                {errorMessage || 'Le calendrier Cal.com n\'a pas pu se charger correctement.'}
              </p>
              {contact && (
                <div className="bg-muted/50 rounded-lg p-3 mt-4 text-left max-w-md">
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    Informations du contact
                  </h4>
                  <div className="text-xs space-y-1 text-muted-foreground">
                    <div>Nom: {contact.prenom} {contact.nom}</div>
                    {contact.email && <div>Email: {contact.email}</div>}
                    {contact.telephone && <div>Téléphone: {contact.telephone}</div>}
                  </div>
                </div>
              )}
            </div>
            <div className="flex gap-3">
              {retryCount < 3 && (
                <Button onClick={handleRetry} variant="outline">
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Réessayer
                </Button>
              )}
              <Button onClick={openInNewTab} className="flex items-center gap-2">
                <ExternalLink className="w-4 h-4" />
                Ouvrir dans un nouvel onglet
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl" aria-describedby="calendar-modal-description">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Prise de Rendez-vous - Cal.com
          </DialogTitle>
        </DialogHeader>
        
        <div id="calendar-modal-description" className="sr-only">
          Interface de prise de rendez-vous Cal.com pour {contact ? `${contact.prenom} ${contact.nom}` : 'un contact'}
        </div>
        
        {renderContent()}
        
        {/* Footer avec informations utiles */}
        {loadingState !== 'loading' && (
          <div className="border-t pt-4 mt-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Clock className="w-3 h-3" />
                <span>Rendez-vous de 30 minutes</span>
              </div>
              <div className="flex items-center gap-2">
                <span>Powered by Cal.com</span>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}; 