"use client";

import { getCalApi } from "@calcom/embed-react";
import { useEffect, useMemo } from "react";
import type { Contact } from "@/types/contact";

interface CalComButtonProps {
  activeContact: Contact | null;
  onBookingCreated?: (bookingInfo: { date: string; time: string; bookingId: string }) => void;
}

// Configuration de base pour l'UI du calendrier Cal.com
const calUiConfig = {
  theme: "dark" as const,
  layout: "month_view" as const,
  hideEventTypeDetails: false,
};

const CAL_LINK = "dimitri-morel-arcanis-conseil/audit-patrimonial";
const CAL_NAMESPACE = "audit-patrimonial";

// Interface pour les événements de Cal.com
interface CalEvent {
  type: string;
  detail: {
    data?: {
      date?: string;
      bookingId?: string;
      [key: string]: unknown;
    };
    [key: string]: unknown;
  };
}

export default function CalComButton({ activeContact, onBookingCreated }: CalComButtonProps) {
  // Générer le contenu JSON pour data-cal-config de manière dynamique
  const calConfigString = useMemo(() => {
    const config: Record<string, unknown> = {
      theme: calUiConfig.theme, // Important d'inclure le thème dans data-cal-config pour éviter le clignotement
    };

    // Ajouter les données de pré-remplissage si un contact est actif
    if (activeContact) {
      // Séparation du prénom et du nom
      if (activeContact.lastName) {
        config.name = activeContact.lastName; // Nom de famille uniquement dans le champ 'name'
      }
      
      if (activeContact.firstName) {
        config.Prenom = activeContact.firstName; // Prénom dans le champ 'Prenom' (avec P majuscule)
      }
      
      // Email
      if (activeContact.email) {
        config.email = activeContact.email;
      }
      
      // Téléphone - formaté en tant que location pour Cal.com
      if (activeContact.phoneNumber) {
        config.location = JSON.stringify({
          value: "phone",
          optionValue: activeContact.phoneNumber,
        });
      }
    }

    return JSON.stringify(config);
  }, [activeContact]);

  // Initialiser l'API Cal.com pour la configuration globale de l'UI et l'écoute d'événements
  useEffect(() => {
    const initCalApi = async () => {
      try {
        const cal = await getCalApi({ namespace: CAL_NAMESPACE });
        
        // Configuration de l'UI
        cal("ui", {
          theme: calUiConfig.theme,
          layout: calUiConfig.layout,
          hideEventTypeDetails: calUiConfig.hideEventTypeDetails,
          cssVarsPerTheme: {
            dark: {
              "cal-brand-color": "#0ea5e9" // Couleur principale en mode sombre
            },
            light: {
              "cal-brand-color": "#0284c7" // Couleur principale en mode clair
            }
          }
        });
        
        // Utiliser addEventListener au lieu de l'API "on" pour la compatibilité des types
        window.addEventListener("cal:bookingSuccessful", (event: Event) => {
          const calEvent = event as unknown as CalEvent;
          console.log("[CalComButton] Booking successful event:", calEvent);
          
          // Vérifier si event.detail.data.date existe
          const date = calEvent.detail.data?.date;
          if (date) {
            try {
              // Extraire la date et l'heure du format retourné par Cal.com
              // Format typique: "vendredi 16 mai 2025<br>20:00 – 20:30"
              const parts = date.split('<br>');
              
              if (parts.length === 2) {
                const dateStr = parts[0]; // "vendredi 16 mai 2025"
                const timeRange = parts[1]; // "20:00 – 20:30"
                const startTime = timeRange.split('–')[0].trim(); // "20:00"
                
                // Appeler le callback avec les informations extraites
                if (onBookingCreated) {
                  onBookingCreated({
                    date: dateStr,
                    time: startTime,
                    bookingId: calEvent.detail.data?.bookingId || '',
                  });
                }
              }
            } catch (error) {
              console.error("[CalComButton] Error parsing booking date:", error);
            }
          }
        });
        
        console.log("[CalComButton] Cal.com API initialized with namespace:", CAL_NAMESPACE);
      } catch (error) {
        console.error("[CalComButton] Error initializing Cal.com API:", error);
      }
    };
    initCalApi();
  }, [onBookingCreated]);

  console.log("[CalComButton] Rendering button. Active contact:", activeContact ? activeContact.id : "none");
  console.log("[CalComButton] data-cal-config:", calConfigString);

  return (
    <button
      data-cal-namespace={CAL_NAMESPACE}
      data-cal-link={CAL_LINK}
      data-cal-config={calConfigString}
      data-slot="tooltip-trigger"
      className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50 rounded-md has-[>svg]:px-4 flex-1 flex-col h-auto p-2 min-w-[70px]"
      type="button"
      data-state="closed"
    >
      <div className="flex flex-col items-center justify-center h-full">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="lucide lucide-calendar-days h-5 w-5 mb-1"
          aria-hidden="true"
        >
          <path d="M8 2v4"></path>
          <path d="M16 2v4"></path>
          <rect width="18" height="18" x="3" y="4" rx="2"></rect>
          <path d="M3 10h18"></path>
          <path d="M8 14h.01"></path>
          <path d="M12 14h.01"></path>
          <path d="M16 14h.01"></path>
          <path d="M8 18h.01"></path>
          <path d="M12 18h.01"></path>
          <path d="M16 18h.01"></path>
        </svg>
        <span className="text-xs">Rendez-vous</span>
      </div>
    </button>
  );
} 