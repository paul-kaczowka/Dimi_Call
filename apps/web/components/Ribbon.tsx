'use client';

import * as React from 'react';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore TODO: Résoudre le problème de type/exécution avec useFormStatus
import { useFormStatus } from 'react-dom';
import { Button } from '@/components/ui/button';
import type { VariantProps } from 'class-variance-authority';
import { buttonVariants } from "@/components/ui/button";
import { 
  Phone, Mail, UploadCloud, DownloadCloud, Loader2, Trash2, CalendarDays,
  BellRing, /* PhoneOff, */ Linkedin, /* Search, */ Globe, ServerCrash,
  type LucideProps, MessageSquare
} from 'lucide-react';
import { useEffect, /* useRef, */ type ReactNode, useState, /* useCallback, */ startTransition } from 'react';
import { toast } from 'react-toastify';
import { getCalApi } from "@calcom/embed-react";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import { cn } from '@/lib/utils';
// import { AdbStatusBadge } from '@/components/ui/AdbStatusBadge'; // Supprimé
import type { Contact } from '@/lib/schemas/contact';
// import { MinimalDatePicker } from '@/components/ui/MinimalDatePicker'; // Supprimé
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { /* format, */ isValid, parseISO, format } from 'date-fns';
// import { fr } from 'date-fns/locale'; // Supprimé car inutilisé
// import { Calendar } from '@/components/ui/calendar'; // Supprimé car SimpleDateTimePicker est retiré
// import { MultiColorSwitch } from '@/components/ui/multicolor-switch'; // Supprimé
// import { StatusProgressChart } from "@/components/ui/StatusProgressChart"; // Supprimé car non utilisé
// import { DateTimePicker } from "./ui/DateTimePicker"; // Commenté car non utilisé pour l'instant
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { QualificationDialog } from "./ui/QualificationDialog";

// TODO: Remplacez "votre-nom-utilisateur/votre-type-d-evenement" par votre slug d'événement Cal.com réel
// Utilisation du calLink fourni par l'utilisateur
const CAL_COM_EVENT_SLUG = process.env.NEXT_PUBLIC_CAL_COM_EVENT_SLUG || "dimitri-morel-arcanis-conseil/audit-patrimonial";
const CAL_NAMESPACE = "audit-patrimonial"; // Réintroduction du namespace

// Types pour les données Cal.com
interface CalBooking {
  uid?: string;
  id?: string | number;
}

interface CalEventType {
  title?: string;
}

interface CalData {
  date: string;
  duration?: number;
  booking?: CalBooking;
  eventType?: CalEventType;
  organizer?: {
    name: string;
    email: string;
    timeZone: string;
  };
  confirmed: boolean;
}

interface RibbonProps {
  onClearAllData?: () => void;
  // isRowSelected?: boolean; // Décommenté car activeContact le remplace
  selectedContactEmail?: string | null; // Conservé car utilisé par handleEmail, bien que activeContact.email soit mieux
  // selectedContactId?: string | null; // Décommenté
  inputFileRef: React.RefObject<HTMLInputElement | null>;
  handleFileSelectedForImport: (event: React.ChangeEvent<HTMLInputElement>) => void;
  isImportPending?: boolean;
  onRequestClearAllData: () => void;
  activeContact?: Contact | null;
  onBookingCreated?: (bookingInfo: { date: string; time: string; }) => void;
  callFormAction: (payload: FormData) => void;
  // hangUpFormAction: (payload: FormData) => void; // Supprimé car nous retirons le bouton raccrocher
  contactInCallId?: string | null;
  onExportClick?: () => void; // Gardé
  // onRappelClick?: () => void; // Supprimé, géré par DateTimePicker
  // onEmailClick?: () => void; // Supprimé, handleEmail est local
  onRappelDateTimeSelected: (dateTime: Date) => void;
  // Nouvelles props pour la gestion de l'autosave
  // isAutosaveActive?: boolean;
  // onToggleAutosave?: () => void;
  // requestFileHandleForAutosave?: () => Promise<boolean>;
  // statusCompletionPercentage, // Supprimé car non utilisé
  onUpdateContact: (contactId: string, updates: Partial<Contact>) => void;
  sendSmsAction?: (phoneNumber: string, message: string) => Promise<void>;
}

export interface CustomButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

interface RibbonButtonProps {
  label: string;
  icon: React.ElementType<LucideProps>;
  onClick?: () => void;
  isSubmit?: boolean;
  variant?: CustomButtonProps['variant'];
  disabled?: boolean;
  tooltipContent?: ReactNode;
  className?: string;
  children?: ReactNode;
}

const RibbonButton = React.forwardRef<
    HTMLButtonElement, 
    RibbonButtonProps
>(({ 
    label, 
    icon: Icon, 
    onClick, 
    isSubmit,
    variant = "ghost", 
    disabled,
    tooltipContent,
    className,
    children
}, ref) => {
    const { pending: formPending } = useFormStatus();
    const actualDisabled = disabled || (isSubmit && formPending);

    const buttonContent = children ? children : (
        <div className="flex flex-col items-center justify-center h-full">
            <Icon className={cn("h-5 w-5 mb-1", actualDisabled ? "text-muted-foreground" : "")} />
            <span className={cn("text-xs", actualDisabled ? "text-muted-foreground" : "")} >{label}</span>
        </div>
    );

    const ButtonComponent = isSubmit ? 'button' : Button;

    return (
        <TooltipProvider delayDuration={300}>
            <Tooltip>
                <TooltipTrigger asChild>
                    {isSubmit && children ? (
                         <Button 
                            ref={ref} 
                            variant={variant} 
                            size="lg"
                            type="submit" 
                            disabled={actualDisabled}
                            className={cn("flex-1 flex-col h-auto p-2 min-w-[70px]", className)}
                        >
                            {formPending ? <Loader2 className="h-5 w-5 animate-spin" /> : children}
                        </Button>
                    ) : (
                        <ButtonComponent
                            ref={ref}
                            variant={variant}
                            size="lg"
                            onClick={onClick}
                            type={isSubmit ? "submit" : "button"}
                            disabled={actualDisabled}
                            className={cn(
                                buttonVariants({ variant, size: 'lg' }),
                                "flex-1 flex-col h-auto p-2 min-w-[70px]", 
                                className
                            )}
                        >
                             {(isSubmit && formPending) ? <Loader2 className="h-5 w-5 animate-spin" /> : buttonContent}
                        </ButtonComponent>
                    )}
                </TooltipTrigger>
                <TooltipContent>
                    <p>{tooltipContent || label}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
});
RibbonButton.displayName = "RibbonButton";

const RibbonSeparator = () => (
    <div className="h-12 w-px bg-border mx-2 self-center"></div>
);

// Type pour les états du toggle
type AutoSearchMode = 'disabled' | 'linkedin' | 'google';

// Composant TriStateToggle pour la recherche automatique
interface TriStateToggleProps {
  value: AutoSearchMode;
  onChange: (value: AutoSearchMode) => void;
  disabled?: boolean;
}

const TriStateToggle: React.FC<TriStateToggleProps> = ({ value, onChange, disabled = false }) => {
  const handleClick = () => {
    if (disabled) return;
    
    // Cycle entre les états: disabled -> linkedin -> google -> disabled
    const nextValue = 
      value === 'disabled' ? 'linkedin' : 
      value === 'linkedin' ? 'google' : 
      'disabled';
    
    onChange(nextValue);
  };

  return (
    <TooltipProvider delayDuration={300}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div 
            onClick={handleClick}
            className={cn(
              "relative h-7 w-16 rounded-full transition-colors duration-300 cursor-pointer overflow-hidden",
              disabled ? "opacity-50 cursor-not-allowed" : "",
              "border border-input",
              value === 'disabled' ? "bg-muted" : 
              value === 'linkedin' ? "bg-[#0077B5]/20" : 
              "bg-blue-500/20",
              // Ajout d'un effet de hover
              !disabled && "hover:border-primary/50"
            )}
            role="button"
            tabIndex={disabled ? -1 : 0}
            aria-disabled={disabled}
          >
            {/* Fond avec dégradé subtil */}
            <div className="absolute inset-0 w-full h-full opacity-10 bg-gradient-to-r from-[#0077B5]/40 via-transparent to-blue-500/40"></div>
            
            {/* Icônes miniatures à l'intérieur du toggle */}
            <div className="absolute top-1/2 left-2 transform -translate-y-1/2 text-[#0077B5] opacity-70">
              <Linkedin className="h-3 w-3" />
            </div>
            
            <div className="absolute top-1/2 right-2 transform -translate-y-1/2 text-blue-600 opacity-70">
              <Globe className="h-3 w-3" />
            </div>
            
            {/* Indicateur mobile avec animation plus élaborée */}
            <div 
              className={cn(
                "absolute top-1 h-5 w-5 rounded-full transform transition-all duration-300",
                // Animation plus fluide avec cubic-bezier
                "transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)]",
                value === 'disabled' ? "left-[calc(50%-10px)] bg-gray-400" :
                value === 'linkedin' ? "left-2 bg-[#0077B5]" : 
                "left-[calc(100%-26px)] bg-blue-500",
                "shadow-md flex items-center justify-center"
              )}
            >
              {/* Effet de lueur intérieure */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/30 to-transparent opacity-80"></div>
              
              {/* Cercle central uniquement visible en position centrale (désactivé) */}
              {value === 'disabled' && (
                <div className="w-2 h-2 bg-gray-200 rounded-full shadow-inner"></div>
              )}
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="text-xs">
          <p>
            {value === 'disabled' 
              ? "Recherche auto désactivée" 
              : value === 'linkedin' 
                ? "Recherche LinkedIn automatique à l'appel" 
                : "Recherche Google automatique à l'appel"}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

// Type pour les MeetingTypes et GenderTypes
type MeetingType = 'D0' | 'R0-int' | 'R0-ext' | 'PremierContact'; // AJOUTÉ 'PremierContact'
type GenderType = 'Monsieur' | 'Madame';

// Templates d'emails
const EMAIL_TEMPLATES = {
  'D0': (lastName: string, dateTime: string, gender: GenderType) => 
    `Bonjour ${gender} ${lastName}, merci pour votre temps lors de notre échange téléphonique. 
 
Suite à notre appel, je vous confirme notre entretien du ${dateTime} en visio.

Pour rappel, notre entretien durera une trentaine de minutes. Le but est de vous présenter plus en détail Arcanis Conseil, d'effectuer ensemble l'état des lieux de votre situation patrimoniale (revenus, patrimoine immobilier, épargne constituée etc.), puis de vous donner un diagnostic de votre situation. Notre métier est de vous apporter un conseil pertinent et personnalisé sur l'optimisation de votre patrimoine.

Vous pouvez également visiter notre site internet pour de plus amples renseignements : www.arcanis-conseil.fr
 
N'hésitez pas à revenir vers moi en cas de question ou d'un besoin supplémentaire d'information.

Bien cordialement,`,

  'R0-int': (lastName: string, dateTime: string, gender: GenderType) => 
    `Bonjour ${gender} ${lastName}, merci pour votre temps lors de notre échange téléphonique. 
 
Suite à notre appel, je vous confirme notre entretien du ${dateTime} dans nos locaux au 22 rue la boétie.

Pour rappel, notre entretien durera une trentaine de minutes. Le but est de vous présenter plus en détail Arcanis Conseil, d'effectuer ensemble l'état des lieux de votre situation patrimoniale (revenus, patrimoine immobilier, épargne constituée etc.), puis de vous donner un diagnostic de votre situation. Notre métier est de vous apporter un conseil pertinent et personnalisé sur l'optimisation de votre patrimoine.

Vous pouvez également visiter notre site internet pour de plus amples renseignements : www.arcanis-conseil.fr
 
N'hésitez pas à revenir vers moi en cas de question ou d'un besoin supplémentaire d'information.

Bien cordialement,`,

  'R0-ext': (lastName: string, dateTime: string, gender: GenderType) => 
    `Bonjour ${gender} ${lastName}, merci pour votre temps lors de notre échange téléphonique. 
 
Suite à notre appel, je vous confirme notre entretien du ${dateTime} à (adresse du client)

Pour rappel, notre entretien durera une trentaine de minutes. Le but est de vous présenter plus en détail Arcanis Conseil, d'effectuer ensemble l'état des lieux de votre situation patrimoniale (revenus, patrimoine immobilier, épargne constituée etc.), puis de vous donner un diagnostic de votre situation. Notre métier est de vous apporter un conseil pertinent et personnalisé sur l'optimisation de votre patrimoine.

Vous pouvez également visiter notre site internet pour de plus amples renseignements : www.arcanis-conseil.fr
 
N'hésitez pas à revenir vers moi en cas de question ou d'un besoin supplémentaire d'information.

Bien cordialement,`,
  'PremierContact': (lastName: string, gender: GenderType) => // dateTime n'est pas nécessaire ici
    `Bonjour ${gender} ${lastName},

Pour resituer mon appel, je suis gérant privé au sein du cabinet de gestion de patrimoine Arcanis Conseil. Je vous envoie l'adresse de notre site web que vous puissiez en savoir d'avantage : https://arcanis-conseil.fr

Le site est avant tout une vitrine, le mieux est de m'appeler si vous souhaitez davantage d'informations ou de prendre un créneau de 30 minutes dans mon agenda via ce lien : https://calendly.com/dimitri-morel-arcanis-conseil/audit

Bien à vous
--`
};

// Ajout du composant personnalisé pour l'icône d'infini (∞)
const InfinityIcon = (props: LucideProps) => (
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
    {...props}
  >
    <path d="M18.178 8c5.096 0 5.096 8 0 8-5.095 0-7.133-8-12.739-8-4.585 0-4.585 8 0 8 5.606 0 7.644-8 12.74-8z" />
  </svg>
);

// Ajouter ce composant pour l'animation du symbole infini quand activé
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const AnimatedInfinityIcon = (props: LucideProps & { active?: boolean }) => {
  const { active, ...rest } = props;
  
  if (!active) return <InfinityIcon {...rest} />;
  
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
      className={cn(rest.className)}
    >
      <defs>
        <linearGradient id="infinityGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ff5e62" />
          <stop offset="50%" stopColor="#ff9966" />
          <stop offset="100%" stopColor="#6a82fb" />
        </linearGradient>
      </defs>
      <path 
        d="M18.178 8c5.096 0 5.096 8 0 8-5.095 0-7.133-8-12.739-8-4.585 0-4.585 8 0 8 5.606 0 7.644-8 12.74-8z"
        stroke="url(#infinityGradient)"
        strokeDasharray="60"
        strokeDashoffset="0"
        className="animate-draw-infinity"
      />
    </svg>
  );
};

// Définition locale de QualificationData (si elle n'est pas utilisée ailleurs)
interface QualificationData {
  statutMarital: string; // Utiliser string pour plus de flexibilité si les types exacts posent problème
  situationProfessionnelle: string;
  revenusFoyer: string;
  chargesFoyer: string;
  resultat: string;
  commentaire: string;
}

export const Ribbon = React.memo(React.forwardRef<HTMLDivElement, RibbonProps>((
  { 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    selectedContactEmail,
    inputFileRef,
    handleFileSelectedForImport,
    isImportPending,
    onRequestClearAllData,
    activeContact,
    callFormAction,
    contactInCallId,
    onExportClick,
    onBookingCreated,
    onRappelDateTimeSelected,
    onUpdateContact,
    sendSmsAction,
  },
  ref
) => {
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [smsModalOpen, setSmsModalOpen] = useState(false);
  const [selectedMeetingType, setSelectedMeetingType] = useState<MeetingType>('D0');
  const [selectedGender, setSelectedGender] = useState<GenderType>('Monsieur');
  const [autoSearchMode, setAutoSearchMode] = useState<AutoSearchMode>('disabled');
  const [isQualificationDialogOpen, setIsQualificationDialogOpen] = useState(false);

  // États pour le popover de Rappel
  const [isRappelPopoverOpen, setIsRappelPopoverOpen] = useState(false);
  const [rappelDateInput, setRappelDateInput] = useState(''); // JJ/MM/AAAA
  const [rappelTimeInput, setRappelTimeInput] = useState(''); // HH:MM

  // Fonctions d'auto-formatage copiées/adaptées de EditableCell
  const autoFormatDatePopover = (value: string): string => {
    let cleanValue = value.replace(/[^\d]/g, '');
    if (cleanValue.length > 8) cleanValue = cleanValue.substring(0, 8);
    if (cleanValue.length >= 5) {
      return `${cleanValue.substring(0, 2)}/${cleanValue.substring(2, 4)}/${cleanValue.substring(4)}`;
    } else if (cleanValue.length >= 3) {
      return `${cleanValue.substring(0, 2)}/${cleanValue.substring(2)}`;
    }
    return cleanValue;
  };

  const autoFormatTimePopover = (value: string): string => {
    let cleanValue = value.replace(/[^\d]/g, '');
    if (cleanValue.length > 4) cleanValue = cleanValue.substring(0, 4);
    if (cleanValue.length >= 3) {
      return `${cleanValue.substring(0, 2)}:${cleanValue.substring(2)}`;
    }
    return cleanValue;
  };

  const handleRappelDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Gérer la suppression de / comme dans EditableCell
    if (rappelDateInput.endsWith('/') && e.target.value.length < rappelDateInput.length) {
      if ( (rappelDateInput.length === 3 && e.target.value.length ===2) || (rappelDateInput.length === 6 && e.target.value.length === 5 )){
        setRappelDateInput(e.target.value.slice(0, -1)); 
        return;
      }
    }
    setRappelDateInput(autoFormatDatePopover(e.target.value));
  };

  const handleRappelTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (rappelTimeInput.endsWith(':') && e.target.value.length < rappelTimeInput.length) {
      if (rappelTimeInput.length === 3 && e.target.value.length === 2){
        setRappelTimeInput(e.target.value.slice(0, -1));
        return;
      }
    }
    setRappelTimeInput(autoFormatTimePopover(e.target.value));
  };

  const initializeCal = async () => {
    try {
      // Initialisation AVEC le namespace pour une config globale
      const cal = await getCalApi({ namespace: CAL_NAMESPACE }); 
      // Configuration de l'UI selon l'exemple utilisateur
      cal("ui", {
        theme:"dark",
        styles:{
          branding:{
            brandColor:"#000000" // Vous pouvez aussi personnaliser cette couleur si besoin
          }
        },
        hideEventTypeDetails:false,
        layout:"month_view"
      });
    } catch (error) {
      console.error("Erreur lors de l'initialisation de Cal.com API:", error);
      toast.error("Impossible d'initialiser l'API de planification Cal.com.");
    }
  };
  
  useEffect(() => {
    initializeCal();

    // Écouteur pour l'événement de réservation réussie
    const setupCalEventListeners = async () => {
      try {
        const cal = await getCalApi({ namespace: CAL_NAMESPACE });
        cal("on", {
          action: "bookingSuccessful",
          callback: (e) => {
            console.log("[Ribbon] Cal.com bookingSuccessful event:", e);
            const { data } = e.detail as { data: CalData };
            // Traitement des données de réservation Cal.com
            const bookingDateStr = data.date; // data.date est une string ISO UTC
            
            // Tentative d'extraction du titre depuis l'objet eventType
            let bookingTitleVal: string | undefined;

            if (data.eventType && typeof data.eventType === 'object' && 'title' in data.eventType && typeof data.eventType.title === 'string') {
              bookingTitleVal = data.eventType.title;
            }

            if (bookingDateStr && onBookingCreated) { 
              const bookingDate = new Date(bookingDateStr).toLocaleDateString(undefined, {
                year: 'numeric', month: '2-digit', day: '2-digit'
              });
              const bookingTime = new Date(bookingDateStr).toLocaleTimeString(undefined, {
                hour: '2-digit', minute: '2-digit'
              });
              
              onBookingCreated({
                date: bookingDate, 
                time: bookingTime, 
              });
              toast.success(`Rendez-vous ${bookingTitleVal ? `"${bookingTitleVal}" ` : ''}confirmé pour le ${bookingDate} à ${bookingTime}.`);
            } else {
              console.warn("[Ribbon] Données de réservation Cal.com (date) incomplètes ou callback onBookingCreated manquant:", { data, bookingDateStr });
              if (onBookingCreated) { 
                onBookingCreated({
                  date: bookingDateStr ? new Date(bookingDateStr).toLocaleDateString() : 'Date inconnue',
                  time: bookingDateStr ? new Date(bookingDateStr).toLocaleTimeString() : 'Heure inconnue',
                });
              }
            }
          },
        });
      } catch (error) {
        console.error("Erreur lors de la configuration des écouteurs d'événements Cal.com:", error);
      }
    };

    setupCalEventListeners();

    // La fonction de nettoyage n'est pas explicitement documentée pour cal("on"),
    // mais il est bon de garder à l'esprit que si une méthode cal("off") existait,
    // elle serait appelée ici. Pour l'instant, on suppose que l'API gère cela.

  },[onBookingCreated]); // Ajout de onBookingCreated aux dépendances

  const performCallAction = () => {
    console.log('[Ribbon] performCallAction: autoSearchMode =', autoSearchMode);
    console.log('[Ribbon] performCallAction: activeContact =', activeContact);

    if (activeContact && activeContact.phoneNumber && activeContact.id) {
      if (activeContact.id === contactInCallId) {
        toast.info("Un appel est déjà en cours pour ce contact.");
      return;
      }
      const formData = new FormData();
      formData.append('phoneNumber', activeContact.phoneNumber);
      formData.append('contactId', activeContact.id);
      startTransition(() => {
        callFormAction(formData);
        
        console.log('[Ribbon] performCallAction: Dans startTransition, autoSearchMode =', autoSearchMode);
        // Si le mode de recherche automatique est activé, déclencher la recherche appropriée
        if (autoSearchMode === 'linkedin') {
          console.log('[Ribbon] performCallAction: Appel de handleLinkedInSearch...');
          handleLinkedInSearch();
        } else if (autoSearchMode === 'google') {
          console.log('[Ribbon] performCallAction: Appel de handleGoogleSearch...');
          handleGoogleSearch();
        }
      });
      // La logique pour définir l'appel en cours est maintenant dans page.tsx via le retour de callAction
    } else {
      toast.warn("Veuillez sélectionner un contact avec un numéro de téléphone pour appeler.");
    }
  };

  // Fonction pour formater la date et l'heure en français
  const formatDateTimeForEmail = (date: Date | undefined) => {
    if (!date || !isValid(date)) return "date et heure à déterminer";
    
    // Obtenir le jour de la semaine en français
    const weekday = date.toLocaleDateString('fr-FR', { weekday: 'long' });
    
    // Formater le jour, mois, année
    const day = date.getDate();
    const month = date.toLocaleDateString('fr-FR', { month: 'long' });
    const year = date.getFullYear();
    
    // Formater l'heure
    const hour = date.getHours();
    const minute = date.getMinutes();
    const formattedTime = `${hour}h${minute > 0 ? minute.toString().padStart(2, '0') : ''}`;
    
    return `${weekday} ${day} ${month} ${year} à ${formattedTime}`;
  };

  // Template pour le SMS
  const SMS_TEMPLATE = (lastName: string, gender: GenderType) =>
    `Bonjour ${gender} ${lastName},

Pour resituer mon appel, je suis gérant privé au sein du cabinet de gestion de patrimoine Arcanis Conseil. Je vous envoie l'adresse de notre site web que vous puissiez en savoir d'avantage : https://arcanis-conseil.fr

Le site est avant tout une vitrine, le mieux est de m'appeler si vous souhaitez davantage d'informations ou de prendre un créneau de 30 minutes dans mon agenda via ce lien : https://calendly.com/dimitri-morel-arcanis-conseil/audit

Bien à vous
--

Dimitri MOREL - Arcanis Conseil`;

  // Fonction pour gérer l'ouverture du modal SMS
  const handleSms = () => {
    if (!activeContact || !activeContact.phoneNumber) {
      toast.info(activeContact ? "Le numéro de téléphone de ce contact n'est pas renseigné." : "Veuillez sélectionner un contact pour envoyer un SMS.");
      return;
    }
    
    // Définir le genre par défaut en fonction du prénom (si disponible)
    if (activeContact.firstName) {
      const lastChar = activeContact.firstName.toLowerCase().slice(-1);
      if (['a', 'e', 'é', 'è', 'ê', 'i', 'y'].includes(lastChar)) {
        setSelectedGender('Madame');
      } else {
        setSelectedGender('Monsieur');
      }
    }
    
    // Ouvrir le modal
    setSmsModalOpen(true);
  };

  // Fonction pour générer et envoyer le SMS via ADB
  const generateAndSendSms = async () => {
    if (!activeContact || !activeContact.phoneNumber || !activeContact.lastName) {
      toast.error("Les informations du contact sont incomplètes.");
      return;
    }

    const smsContent = SMS_TEMPLATE(activeContact.lastName, selectedGender);

    try {
      // Si la fonction sendSmsAction est fournie, l'utiliser
      if (sendSmsAction) {
        await sendSmsAction(activeContact.phoneNumber, smsContent);
        toast.success("Application SMS ouverte avec le message pré-rempli.");
      } else {
        // Fallback: ouvrir un lien sms: (fonctionne sur certains navigateurs/appareils)
        const encodedSms = encodeURIComponent(smsContent);
        window.open(`sms:${activeContact.phoneNumber}?body=${encodedSms}`, '_blank');
        toast.info("Tentative d'ouverture de l'application SMS. Si cela ne fonctionne pas, veuillez configurer l'action sendSmsAction.");
      }
      
      // Fermer le modal
      setSmsModalOpen(false);
    } catch (error) {
      console.error("Erreur lors de l'envoi du SMS:", error);
      toast.error("Impossible d'ouvrir l'application SMS.");
    }
  };

  // Fonction pour générer et ouvrir l'email
  const generateAndOpenEmail = () => {
    if (!activeContact || !activeContact.email || !activeContact.lastName) {
      toast.error("Les informations du contact sont incomplètes.");
      return;
    }

    let emailSubject = "";
    let emailBody = "";

    if (selectedMeetingType === 'PremierContact') {
      emailSubject = "Arcanis Conseil - Premier Contact";
      emailBody = EMAIL_TEMPLATES['PremierContact'](
        activeContact.lastName,
        selectedGender
      );
    } else {
      // Logique existante pour les autres types de rendez-vous
      let rdvDate: Date | undefined = undefined;

      if (activeContact.dateRendezVous) {
        const dateStr = activeContact.dateRendezVous;
        const timeStr = activeContact.heureRendezVous;

        const parsedDateFromDateStr = new Date(dateStr);

        if (isValid(parsedDateFromDateStr)) {
          const isInputDateOnlyFormat = /^\d{4}-\d{2}-\d{2}$/.test(dateStr);

          if (isInputDateOnlyFormat && timeStr) {
            try {
              const [year, month, day] = dateStr.split('-').map(Number);
              const [hours, minutes] = timeStr.split(':').map(Number);
              if (!isNaN(year) && !isNaN(month) && !isNaN(day) && !isNaN(hours) && !isNaN(minutes)) {
                const combinedDate = new Date(year, month - 1, day, hours, minutes);
                if (isValid(combinedDate)) {
                  rdvDate = combinedDate;
                } else {
                   console.warn(`[Ribbon] La combinaison de la date '${dateStr}' et de l\'heure '${timeStr}' a produit une date invalide pour ${activeContact.id}`);
                }
              } else {
                console.warn(`[Ribbon] Numéros invalides dans les parties date/heure de '${dateStr}', '${timeStr}' for ${activeContact.id}`);
              }
            } catch (e) {
              console.error(`[Ribbon] Erreur en combinant la date '${dateStr}' et l\'heure '${timeStr}' pour ${activeContact.id}:`, e);
            }
          } else if (!isInputDateOnlyFormat) {
            // dateStr était probablement une chaîne ISO complète, utilisez parsedDateFromDateStr directement
            rdvDate = parsedDateFromDateStr;
          } else {
            // dateStr était YYYY-MM-DD et pas de timeStr, utilisez parsedDateFromDateStr (l'heure sera minuit UTC ou local)
            // Pour être sûr, reconstruire en tant que minuit local si c'était YYYY-MM-DD
             const [year, month, day] = dateStr.split('-').map(Number);
             if(!isNaN(year) && !isNaN(month) && !isNaN(day)) {
                 rdvDate = new Date(year, month - 1, day); // Minuit local
             } else {
                 console.warn(`[Ribbon] dateRendezVous '${dateStr}' (YYYY-MM-DD) avait des parties invalides et pas de heureRendezVous pour ${activeContact.id}`);
             }
          }
        } else {
          console.warn(`[Ribbon] dateRendezVous '${dateStr}' n\'est pas une chaîne de date valide pour ${activeContact.id}`);
        }
      } else if (activeContact.heureRendezVous) {
        console.warn(`[Ribbon] Seul heureRendezVous ('${activeContact.heureRendezVous}') est présent sans dateRendezVous pour ${activeContact.id}`);
      }

      if (!rdvDate) {
        console.warn(`[Ribbon] Impossible de déterminer une rdvDate valide pour le contact ${activeContact.id}. L\'email utilisera la valeur par défaut.`);
      }

      const formattedDateTime = formatDateTimeForEmail(rdvDate);
      emailSubject = `Confirmation rendez-vous ${selectedMeetingType === 'D0' ? 'visio' : 'présentiel'} - Arcanis Conseil`;
      emailBody = EMAIL_TEMPLATES[selectedMeetingType](
        activeContact.lastName, 
        formattedDateTime, 
        selectedGender
      );
    }
    
    // Encoder le sujet et le corps pour l'URL Gmail
    const encodedSubject = encodeURIComponent(emailSubject);
    const encodedBody = encodeURIComponent(emailBody);
    const encodedTo = encodeURIComponent(activeContact.email);
    
    // Créer l'URL Gmail pour la composition d'un nouveau message
    const gmailUrl = `https://mail.google.com/mail/u/0/?to=${encodedTo}&su=${encodedSubject}&body=${encodedBody}&tf=cm`;
    
    // Ouvrir dans un nouvel onglet
    window.open(gmailUrl, '_blank');
    
    // Fermer le modal
    setEmailModalOpen(false);
    
    toast.success("Email préparé avec succès dans Gmail !");
  };

  // Remplacer la fonction handleEmail existante
  const handleEmail = () => {
    if (!activeContact || !activeContact.email) {
      toast.info(activeContact ? "L'email de ce contact n'est pas renseigné." : "Veuillez sélectionner un contact pour envoyer un email.");
      return;
    }
    
    // // Pré-remplissage de la date et l'heure - SUPPRIMÉ
    // let initialRdvDate: Date | undefined = new Date();
    // initialRdvDate.setHours(14,0,0,0); // Heure par défaut

    // if (activeContact.dateRendezVous) {
    //   try {
    //     const [year, month, day] = activeContact.dateRendezVous.split('-').map(Number);
    //     if (year && month && day) {
    //       initialRdvDate.setFullYear(year, month - 1, day); // month est 0-indexed
    //     } else {
    //       console.warn("Format dateRendezVous invalide:", activeContact.dateRendezVous);
    //     }
    //   } catch (e) {
    //     console.warn("Erreur de parsing dateRendezVous:", activeContact.dateRendezVous, e);
    //   }
    // }
    
    // if (activeContact.heureRendezVous) {
    //   try {
    //     const [h, m] = activeContact.heureRendezVous.split(':').map(Number);
    //     if (h !== undefined && m !== undefined && !isNaN(h) && !isNaN(m)) {
    //        initialRdvDate.setHours(h, m, 0, 0);
    //     } else {
    //       console.warn("Format heureRendezVous invalide:", activeContact.heureRendezVous);
    //     }
    //   } catch (e) {
    //     console.warn("Erreur de parsing heureRendezVous:", activeContact.heureRendezVous, e);
    //   }
    // }
    // setSelectedDate(initialRdvDate); // Supprimé
    
    // Ouvrir le modal
    setEmailModalOpen(true);
    
    // Définir le genre par défaut en fonction du prénom (si disponible)
    if (activeContact.firstName) {
      // Logique simple: si le prénom se termine par 'a', 'e', ou certaines autres lettres, considérer comme féminin
      // Cette logique est simpliste et ne fonctionne pas pour tous les prénoms
      const lastChar = activeContact.firstName.toLowerCase().slice(-1);
      if (['a', 'e', 'é', 'è', 'ê', 'i', 'y'].includes(lastChar)) {
        setSelectedGender('Madame');
      } else {
        setSelectedGender('Monsieur');
      }
    }
  };

  const handleImportClick = () => {
    inputFileRef.current?.click();
  };
  
  const handleCalComRendezVous = async () => {
    if (!activeContact) {
        toast.info("Veuillez sélectionner un contact pour planifier un rendez-vous.");
      return;
    }

    try {
        // Récupération de l'API AVEC le namespace
        const cal = await getCalApi({ namespace: CAL_NAMESPACE }); 

        const prefillConfig: {
            name?: string;
            Prenom?: string;
            email?: string;
            smsReminderNumber?: string;
        } = {};

        if (activeContact) {
            if (activeContact.lastName) {
                prefillConfig.name = activeContact.lastName;
                if (activeContact.firstName) {
                    prefillConfig.Prenom = activeContact.firstName;
                }
            } else if (activeContact.firstName) {
                prefillConfig.name = activeContact.firstName;
            }
            
            if (activeContact.email) {
                prefillConfig.email = activeContact.email;
            }
            if (activeContact.phoneNumber) {
                prefillConfig.smsReminderNumber = activeContact.phoneNumber;
            }
        }
        
        cal("modal", {
            calLink: CAL_COM_EVENT_SLUG,
            config: prefillConfig
        });
        
    } catch (error) {
        console.error("Erreur lors de l'ouverture de Cal.com:", error);
        toast.error("Impossible d'ouvrir Cal.com.");
    }
  };
  
  const LINKEDIN_WINDOW_NAME = "linkedinSearchWindow";
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const GOOGLE_WINDOW_NAME = "googleSearchWindow";

  const handleLinkedInSearch = () => {
    console.log('[Ribbon] handleLinkedInSearch: autoSearchMode =', autoSearchMode);
    console.log('[Ribbon] handleLinkedInSearch: activeContact =', activeContact);
    if (activeContact && activeContact.firstName && activeContact.lastName) {
      const query = encodeURIComponent(`${activeContact.firstName} ${activeContact.lastName}`);
      console.log('[Ribbon] handleLinkedInSearch: Ouverture LinkedIn avec query =', query);
      window.open(`https://www.linkedin.com/search/results/people/?keywords=${query}`, LINKEDIN_WINDOW_NAME);
    } else {
      console.warn('[Ribbon] handleLinkedInSearch: Conditions non remplies (contact, nom, prénom).');
      toast.info("Veuillez sélectionner un contact avec un nom et prénom pour la recherche LinkedIn.");
    }
  };

  const handleGoogleSearch = () => {
    if (activeContact?.firstName || activeContact?.lastName) {
      const searchQuery = `${activeContact.firstName || ''} ${activeContact.lastName || ''}`;
      const url = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;
      
      // Ouvrir l'URL de recherche Google dans un nouvel onglet
      window.open(url, '_blank');
      
      // Mettre à jour le suivi d'automatisation
      if (autoSearchMode === 'google') {
        setAutoSearchMode('disabled');
      }
    }
  };
  
  const rappelButtonContent = (
    <div className="flex flex-col items-center justify-center h-full">
      <BellRing className="h-5 w-5 mb-1" />
      <span className="text-xs">Rappel</span>
    </div>
  );

  const handleRappelSave = () => {
    if (!activeContact) return;

    const dateParts = rappelDateInput.split('/');
    const timeParts = rappelTimeInput.split(':');

    if (dateParts.length !== 3 || timeParts.length !== 2) {
      toast.error("Format date (JJ/MM/AAAA) ou heure (HH:MM) invalide pour le rappel.");
      return;
    }

    const day = parseInt(dateParts[0], 10);
    const month = parseInt(dateParts[1], 10) - 1; // Mois est 0-indexé
    const year = parseInt(dateParts[2], 10);
    const hours = parseInt(timeParts[0], 10);
    const minutes = parseInt(timeParts[1], 10);

    if (isNaN(day) || isNaN(month) || isNaN(year) || isNaN(hours) || isNaN(minutes)) {
      toast.error("Date ou heure du rappel contient des valeurs non numériques.");
      return;
    }
    
    // Validation simple des plages (peut être affinée)
    if (year < 2000 || year > 2100 || month < 0 || month > 11 || day < 1 || day > 31 || hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
        toast.error("Valeurs de date ou d'heure du rappel hors limites.");
        return;
    }

    const rappelDateTime = new Date(year, month, day, hours, minutes);

    if (!isValid(rappelDateTime)) {
      toast.error("La date et l'heure du rappel ne sont pas valides.");
      return;
    }

    onRappelDateTimeSelected(rappelDateTime);
    setIsRappelPopoverOpen(false);
    toast.success(`Rappel programmé pour le ${format(rappelDateTime, 'dd/MM/yyyy HH:mm')}`);
  };

  // Fonction utilitaire pour le rendu de bulles d'infos
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const renderTooltip = (child: React.ReactElement, tooltipContent: string, ariaLabel: string, disabled?: boolean) => {
    let trigger = child;
    const childProps = child.props as { disabled?: boolean; [key: string]: unknown };
    const isDisabled = disabled ?? childProps?.disabled;

    if (React.isValidElement(child) && (disabled !== undefined || childProps?.disabled !== undefined)) {
        trigger = React.cloneElement(child as React.ReactElement<React.ButtonHTMLAttributes<HTMLButtonElement>>, { disabled: isDisabled });
    }

    return (
      <TooltipProvider delayDuration={300}>
        <Tooltip>
          <TooltipTrigger asChild>
            {trigger}
          </TooltipTrigger>
          <TooltipContent>
            <p>{tooltipContent}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  const handleSaveQualification = (qualificationData: QualificationData) => {
    if (activeContact && activeContact.id && onUpdateContact) {
      // Le commentaire complet généré ou édité par l'utilisateur
      const commentaireAEnregistrer = qualificationData.commentaire;
      
      // Mettre à jour le champ 'comment' du contact
      onUpdateContact(activeContact.id, { comment: commentaireAEnregistrer });
      
      toast.success("Qualification enregistrée et commentaire du contact mis à jour.");
    } else {
      toast.error("Impossible de sauvegarder la qualification. Contact non actif ou fonction de mise à jour manquante.");
    }
    setIsQualificationDialogOpen(false); // Fermer la boite de dialogue
  };

  return (
    <div ref={ref} className="flex flex-wrap sm:flex-nowrap items-stretch gap-1 md:gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
        <input 
          type="file" 
        ref={inputFileRef as React.RefObject<HTMLInputElement>} 
          onChange={handleFileSelectedForImport}
          className="hidden" 
          accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
      />

      {/* Groupe 1: Appeler uniquement (Raccrocher a été supprimé) */}
      <div className="flex items-center gap-1 p-1 border border-muted rounded-md shadow-sm mb-1 sm:mb-0 w-full sm:w-auto">
        <RibbonButton 
          label="Appeler"
          icon={Phone} 
          onClick={performCallAction}
          disabled={!activeContact || (!!contactInCallId && contactInCallId === activeContact?.id) || isImportPending}
          tooltipContent="Appeler le contact sélectionné"
          className="flex-1 sm:flex-initial"
        />
      </div>

      <RibbonSeparator />

      {/* Groupe 2: Email, SMS, Rappel, Rendez-vous, Qualification */}
      <div className="flex items-center gap-1 p-1 border border-muted rounded-md shadow-sm mb-1 sm:mb-0 w-full sm:w-auto">
        <RibbonButton 
          label="Email" 
          icon={Mail} 
          onClick={handleEmail}
          disabled={!activeContact || !activeContact.email || isImportPending}
          tooltipContent="Envoyer un email au contact sélectionné"
          className="flex-1 sm:flex-initial"
        />
        
        <RibbonButton 
          label="Sms" 
          icon={MessageSquare} 
          onClick={handleSms}
          disabled={!activeContact || !activeContact.phoneNumber || isImportPending}
          tooltipContent="Envoyer un SMS au contact sélectionné"
          className="flex-1 sm:flex-initial"
        />
        
        <Popover open={isRappelPopoverOpen} onOpenChange={setIsRappelPopoverOpen}>
          <PopoverTrigger asChild>
             <Button
                variant="ghost"
                className={cn(buttonVariants({ variant: 'ghost', size: 'lg' }), "flex-1 sm:flex-initial flex-col h-auto p-2 min-w-[70px] data-[state=open]:bg-accent data-[state=open]:text-accent-foreground")}
                disabled={!activeContact || isImportPending}
                type="button"
                aria-label="Rappel"
                onClick={() => {
                  if (activeContact?.dateRappel && activeContact?.heureRappel) {
                    try {
                      const initialDate = parseISO(activeContact.dateRappel);
                      setRappelDateInput(format(initialDate, 'dd/MM/yyyy'));
                      // heureRappel est déjà HH:MM
                      setRappelTimeInput(activeContact.heureRappel);
                    } catch (e) {
                      console.warn("Erreur parsing date/heure rappel existant:", e);
                      const now = new Date();
                      setRappelDateInput(format(now, 'dd/MM/yyyy'));
                      setRappelTimeInput(format(now, 'HH:mm'));
                    }
                  } else {
                    const now = new Date();
                    setRappelDateInput(format(now, 'dd/MM/yyyy'));
                    setRappelTimeInput(format(now, 'HH:mm'));
                  }
                  setIsRappelPopoverOpen(true);
                }}
              >
                {rappelButtonContent}
              </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-4 space-y-2" align="start">
            <p className="text-sm font-medium">Définir un rappel</p>
            <Input 
              placeholder="JJ/MM/AAAA" 
              value={rappelDateInput}
              onChange={handleRappelDateChange}
            />
            <Input 
              placeholder="HH:MM" 
              value={rappelTimeInput}
              onChange={handleRappelTimeChange}
            />
            <Button onClick={handleRappelSave} className="w-full">Enregistrer</Button>
          </PopoverContent>
        </Popover>

        <RibbonButton
          label="Rendez-vous"
          icon={CalendarDays}
          onClick={handleCalComRendezVous}
          disabled={!activeContact || isImportPending}
          tooltipContent="Prendre un rendez-vous (Cal.com)"
          className="flex-1 sm:flex-initial"
        />

        <RibbonButton 
          label="Qualification"
          icon={ServerCrash}
          onClick={() => setIsQualificationDialogOpen(true)}
          disabled={!activeContact || isImportPending}
          tooltipContent="Qualifier le contact sélectionné"
          className="flex-1 sm:flex-initial"
        />
      </div>
        
        <RibbonSeparator />

      {/* Groupe 3: LinkedIn, Google - Ajout de l'encadrement */}
      <div className="flex items-center gap-1 p-1 border border-muted rounded-md shadow-sm mb-1 sm:mb-0 w-full sm:w-auto">
        <RibbonButton 
          label="LinkedIn"
          icon={Linkedin}
          onClick={handleLinkedInSearch}
          disabled={!activeContact || !activeContact.firstName || !activeContact.lastName}
          tooltipContent="Rechercher le contact sur LinkedIn"
          className="flex-1 sm:flex-initial"
        />
        
        {/* Ajout du toggle de recherche automatique entre les deux boutons */}
        <div className="flex flex-col items-center justify-center mx-1 min-w-[60px]">
          <TriStateToggle 
            value={autoSearchMode} 
            onChange={setAutoSearchMode}
            disabled={!activeContact || !activeContact.firstName || !activeContact.lastName}
          />
          <span className="text-xs mt-1 text-muted-foreground">Recherche auto</span>
        </div>
        
        <RibbonButton
          label="Google"
          icon={Globe}
          onClick={handleGoogleSearch}
          disabled={!activeContact || !activeContact.firstName || !activeContact.lastName}
          tooltipContent="Rechercher le contact sur Google"
          className="flex-1 sm:flex-initial"
        />
        </div>

        <RibbonSeparator />

      {/* Groupe 4: Importer, Exporter, Autosave, Tout Effacer */}
      <div className="flex items-center gap-1 p-1 border border-muted rounded-md shadow-sm w-full sm:w-auto">
        <RibbonButton 
          label="Importer"
          icon={UploadCloud} 
          onClick={handleImportClick} 
          disabled={isImportPending}
          tooltipContent={isImportPending ? "Importation en cours..." : "Importer des contacts (fichier CSV/Excel)"}
          className="flex-1 sm:flex-initial"
        />
        <RibbonButton 
          label="Exporter"
          icon={DownloadCloud} 
          onClick={onExportClick}
          disabled={isImportPending}
          tooltipContent="Exporter les contacts actuels"
          className="flex-1 sm:flex-initial"
        />
        
        <RibbonButton 
          label="Tout effacer"
          icon={Trash2} 
          onClick={onRequestClearAllData} 
          variant="destructive"
          disabled={isImportPending}
          tooltipContent="Effacer tous les contacts (demande une confirmation)"
          className="flex-1 sm:flex-initial"
        />
      </div>
      
      <RibbonSeparator />

      {/* Modal pour la création d'email */}
      <Dialog open={emailModalOpen} onOpenChange={setEmailModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Création d&apos;email</DialogTitle>
            <DialogDescription className="sr-only">
              Configurez les détails de l&apos;email de confirmation de rendez-vous.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-5 py-4">
            {/* Sélecteur de type de rendez-vous */}
            <div className="space-y-3">
              <h3 className="font-medium text-sm">Type de rendez-vous</h3>
              <div className="flex gap-4 flex-wrap">
                <Button
                  variant={selectedMeetingType === 'D0' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => setSelectedMeetingType('D0')}
                >
                  D0 (Visio)
                </Button>
                <Button
                  variant={selectedMeetingType === 'R0-int' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => setSelectedMeetingType('R0-int')}
                >
                  R0 (Interne)
                </Button>
                <Button
                  variant={selectedMeetingType === 'R0-ext' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => setSelectedMeetingType('R0-ext')}
                >
                  R0 (Externe)
                </Button>
                <Button
                  variant={selectedMeetingType === 'PremierContact' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => setSelectedMeetingType('PremierContact')}
                >
                  1er Contact
                </Button>
              </div>
            </div>
            
            {/* Sélecteur de civilité */}
            <div className="space-y-3">
              <h3 className="font-medium text-sm">Civilité</h3>
              <RadioGroup 
                value={selectedGender} 
                onValueChange={(value: string) => setSelectedGender(value as GenderType)}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Monsieur" id="monsieur" />
                  <Label htmlFor="monsieur">Monsieur</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Madame" id="madame" />
                  <Label htmlFor="madame">Madame</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailModalOpen(false)}>
              Annuler
            </Button>
            <Button onClick={generateAndOpenEmail}>
              Générer l&apos;email
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal pour la création de SMS */}
      <Dialog open={smsModalOpen} onOpenChange={setSmsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Création de SMS</DialogTitle>
            <DialogDescription className="sr-only">
              Configurez les détails du SMS.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-5 py-4">
            {/* Sélecteur de civilité */}
            <div className="space-y-3">
              <h3 className="font-medium text-sm">Civilité</h3>
              <RadioGroup 
                value={selectedGender} 
                onValueChange={(value: string) => setSelectedGender(value as GenderType)}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Monsieur" id="sms-monsieur" />
                  <Label htmlFor="sms-monsieur">Monsieur</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="Madame" id="sms-madame" />
                  <Label htmlFor="sms-madame">Madame</Label>
                </div>
              </RadioGroup>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setSmsModalOpen(false)}>
              Annuler
            </Button>
            <Button onClick={generateAndSendSms}>
              Générer le SMS
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de Qualification */}
      <QualificationDialog 
        open={isQualificationDialogOpen}
        onOpenChange={setIsQualificationDialogOpen}
        onSaveQualification={handleSaveQualification}
      />
    </div>
  );
}));
Ribbon.displayName = "Ribbon"; 

export default Ribbon; 