'use client';

import React, { useCallback, useEffect, useState, useRef, startTransition, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, isValid } from 'date-fns';
import { Ribbon } from '@/components/Ribbon';
import { TableSearchBar, type SearchableColumn } from '@/components/ui/TableSearchBar';
import { importContactsAction, updateContactAction, clearAllDataAction, callAction } from '@/app/actions';
import { useSmsAction } from '@/hooks/useSmsAction';
import {
  Loader2,
  User,
  Mail,
  Phone,
  Info,
  MessageSquareText,
  Waypoints,
  BellRing,
  CalendarDays,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button } from '@/components/ui/button';
import { cn, initAnimationStyles } from '@/lib/utils';
import type { Contact as ContactSchemaType } from '@/lib/schemas/contact';
import { type StatusMapping } from '@/components/ui/FunctionKeyStatusMappingGuide';
import { AdbStatusBadge } from '@/components/ui/AdbStatusBadge';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { ThemeToggleButton } from '@/components/ui/ThemeToggleButton';
import UploadDropZone from '@/components/UploadDropZone';
import ColumnVisibilityDropdown from '../../components/ui/ColumnVisibilityDropdown';
import dynamic from 'next/dynamic';

// Import dynamique pour le composant ToastContainer
// const DynamicToastContainer = dynamic(() => import('react-toastify').then(mod => mod.ToastContainer), { ssr: false });

// Import dynamique pour le composant DndProvider
const DynamicDndProvider = dynamic(() => import('react-dnd').then(mod => mod.DndProvider), { ssr: false });

// Au début du fichier, sous les imports, ajouter l'extension de Window
declare global {
  interface Window {
    _nextContactId?: string;
    _nextContactName?: string;
    _nextContactPhone?: string;
    _currentSelectedContactId?: string; // Pour suivre le contact actuellement sélectionné
  }
}

// Définition du mapping Touche Fn <-> Statut
const fnKeyMappings: StatusMapping[] = [
  { keyName: 'F2', statusName: 'Mauvais num' },
  { keyName: 'F3', statusName: 'Répondeur' },
  { keyName: 'F4', statusName: 'À rappeler' },
  { keyName: 'F5', statusName: 'Pas intéressé' },
  { keyName: 'F6', statusName: 'Argumenté' },
  { keyName: 'F7', statusName: 'D0' },
  { keyName: 'F8', statusName: 'R0' },
  { keyName: 'F9', statusName: 'Liste noire' },
  { keyName: 'F10', statusName: 'Prématuré' },
];

// Étendre le type Contact pour inclure les informations de réservation
interface ContactAppType extends ContactSchemaType {
  bookingDate?: string | null;
  bookingTime?: string | null;
  dureeAppel?: string | null;
  // bookingId?: string | null; // SUPPRIMÉ
  // bookingTitle?: string | null; // SUPPRIMÉ
  // bookingDuration?: number | null; // SUPPRIMÉ
}

// Charger dynamiquement ContactTable côté client pour désactiver le SSR et éviter les mismatches de rendu
const ContactTable = dynamic(
  () => import('@/components/ContactTable').then(mod => mod.ContactTable),
  { ssr: false }
);

// Fonctions d'appel API pour TanStack Query
// Ces fonctions doivent retourner les promesses directement
const getContactsAPI = async (): Promise<ContactAppType[]> => {
  const response = await fetch('http://localhost:8000/contacts');
  if (!response.ok) {
    throw new Error(`Erreur HTTP: ${response.status} ${response.statusText}`);
  }
  return response.json();
};

const updateContactAPI = async (formData: FormData): Promise<ContactAppType> => {
  // Simuler le comportement de updateContactAction pour l'instant
  // Dans une vraie application, cela appellerait directement votre API
  // et retournerait le contact mis à jour.
  // La action originale utilisait `updateContactAction` qui est une server action.
  // Pour l'utiliser avec useMutation, elle devrait être appelée directement.
  // Ici, on simule la structure de retour attendue.
  const result = await updateContactAction({ success: false, message: '', data: null }, formData);
  if (!result.success || !result.data) {
    throw new Error(result.message || "Erreur lors de la mise à jour du contact.");
  }
  return result.data as ContactAppType;
};

const importContactsAPI = async (formData: FormData): Promise<{ count?: number; message?: string }> => {
  const result = await importContactsAction({ success: false, message: '', data: null }, formData);
   if (!result.success) {
    throw new Error(result.message || "Erreur lors de l'importation des contacts.");
  }
  return result.data || { message: result.message };
};

const clearAllDataAPI = async (): Promise<{ message?: string }> => {
  const result = await clearAllDataAction();
  if (!result.success) {
    throw new Error(result.message || "Erreur lors de la suppression des données.");
  }
  return { message: result.message };
};

const callAPI = async (formData: FormData): Promise<ContactAppType> => {
  const result = await callAction({ success: false, message: '', data: null }, formData);
  if (!result.success || !result.data) {
    throw new Error(result.message || "Erreur lors de l'appel.");
  }
  return result.data as ContactAppType;
};

export default function ContactsPage() {
  // Initialiser les styles d'animation
  useEffect(() => {
    initAnimationStyles();
  }, []);

  const [isClientMounted, setIsClientMounted] = useState(false);
  useEffect(() => {
    setIsClientMounted(true);
  }, []);

  // Client TanStack Query
  const queryClient = useQueryClient();

  // Charger les contacts depuis le localStorage si présents
  const storedContacts = typeof window !== 'undefined'
    ? JSON.parse(localStorage.getItem('dimicall_contacts') || '[]')
    : [];

  // Récupérer les contacts depuis l'API avec données initiales depuis localStorage
  const { data: contacts = storedContacts, isLoading, error: contactsError } =
    useQuery<ContactAppType[], Error>({
      queryKey: ['contacts'],
      queryFn: getContactsAPI,
      initialData: storedContacts,
    });

  useEffect(() => {
    if (contactsError) {
      // Importer et utiliser toast dynamiquement en cas d'erreur
      // import('react-toastify').then(mod => {
      //   mod.toast.error(`Impossible de charger les contacts: ${contactsError.message}`);
      // });
    }
  }, [contactsError]);

  // Sauvegarder les contacts dans localStorage à chaque mise à jour
  useEffect(() => {
    if (!isLoading) {
      try {
        localStorage.setItem('dimicall_contacts', JSON.stringify(contacts));
      } catch (error) {
        console.error("Échec de la sauvegarde des contacts dans localStorage", error);
      }
    }
  }, [contacts, isLoading]);

  const [activeContact, setActiveContactState] = useState<ContactAppType | null>(null);
  const [contactInCallId, setContactInCallId] = useState<string | null>(null);
  const [isExportFormatDialogOpen, setIsExportFormatDialogOpen] = useState(false);
  const [isPollingActive, setIsPollingActive] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSearchColumn, setSelectedSearchColumn] = useState('firstName');

  const searchableColumns = useMemo((): SearchableColumn[] => [
    { value: 'firstName', label: 'Prénom', icon: <User className="h-4 w-4" /> },
    { value: 'lastName', label: 'Nom', icon: <User className="h-4 w-4" /> },
    { value: 'email', label: 'Email', icon: <Mail className="h-4 w-4" /> },
    { value: 'phoneNumber', label: 'Téléphone', icon: <Phone className="h-4 w-4" /> },
    { value: 'status', label: 'Statut', icon: <Info className="h-4 w-4" /> },
    { value: 'comment', label: 'Commentaire', icon: <MessageSquareText className="h-4 w-4" /> },
    { value: 'source', label: 'Source', icon: <Waypoints className="h-4 w-4" /> },
    { value: 'dateAppel', label: 'Date Appel', icon: <Phone className="h-4 w-4" /> },
    { value: 'dateRappel', label: 'Date Rappel', icon: <BellRing className="h-4 w-4" /> },
    { value: 'dateRendezVous', label: 'Date RDV', icon: <CalendarDays className="h-4 w-4" /> },
  ], []);

  const handleSearchChange = useCallback((newSearchTerm: string, newSelectedColumn: string) => {
    setSearchTerm(newSearchTerm);
    setSelectedSearchColumn(newSelectedColumn);
  }, []);

  // Définir filteredContacts tôt dans le composant pour éviter l'erreur "Cannot access before initialization"
  const filteredContacts = useMemo<ContactAppType[]>(() => {
    if (!searchTerm) return contacts;
    return contacts.filter((contact: ContactAppType) => {
      const searchableValue = contact[selectedSearchColumn as keyof ContactAppType];
      if (searchableValue && typeof searchableValue === 'string') {
        return searchableValue.toLowerCase().includes(searchTerm.toLowerCase());
      }
      return false;
    });
  }, [contacts, searchTerm, selectedSearchColumn]);

  // Remplacer useActionState par useMutation pour chaque action
  const importMutation = useMutation<
    { count?: number; message?: string },
    Error,
    FormData,
    unknown
  >({
    mutationKey: ['contacts', 'import'],
    mutationFn: importContactsAPI,
    onSuccess: (/* data */) => { // data n'est plus utilisé
        // Les lignes de toast ont été supprimées
        if (inputFileRef.current) inputFileRef.current.value = "";
        queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
    onError: (/* error: Error */) => { // error n'est plus utilisé
        // Les lignes de toast ont été supprimées
    },
  });

  const updateContactMutation = useMutation<
    ContactAppType,
    Error,
    FormData,
    unknown
  >({
    mutationKey: ['contacts', 'update'],
    mutationFn: updateContactAPI,
    onSuccess: (updatedContact) => {
      // Les lignes de toast ont été supprimées
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      if (activeContact && activeContact.id === updatedContact.id) {
        setActiveContactState(updatedContact);
      }
    },
    onError: (/* error: Error */) => { // error n'est plus utilisé
      // Les lignes de toast ont été supprimées
    },
  });

  const callMutation = useMutation<
    ContactAppType,
    Error,
    FormData,
    unknown
  >({
    mutationKey: ['contacts', 'call'],
    mutationFn: callAPI,
    onSuccess: (updatedContact) => {
      // Les lignes de toast ont été supprimées
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      if (activeContact && activeContact.id === updatedContact.id) {
        setActiveContactState(updatedContact);
        setContactInCallId(updatedContact.id ?? null);
      }
    },
    onError: (/* error: Error */) => { // error n'est plus utilisé
      // Les lignes de toast ont été supprimées
    },
  });

  const clearAllDataMutation = useMutation<
    { message?: string },
    Error,
    void,
    unknown
  >({
    mutationKey: ['contacts', 'clearAll'],
    mutationFn: clearAllDataAPI,
    onSuccess: (/* data */) => { // data n'est plus utilisé
      // Les lignes de toast ont été supprimées
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      setActiveContact(null);
    },
    onError: (/* error: Error */) => { // error n'est plus utilisé
      // Les lignes de toast ont été supprimées
    },
  });

  // Fonctions wrappers sécurisées pour les appels d'action -> Remplacées par .mutate()
  const safeUpdateContactAction = useCallback((formData: FormData) => {
    updateContactMutation.mutate(formData);
  }, [updateContactMutation]);

  const safeCallAction = useCallback((formData: FormData) => {
    callMutation.mutate(formData);
  }, [callMutation]);

  const inputFileRef = useRef<HTMLInputElement>(null);
  const ribbonRef = useRef<HTMLDivElement>(null);
  const tableViewportRef = useRef<HTMLDivElement>(null);
  const mainPageRef = useRef<HTMLDivElement>(null);

  // État pour la confirmation de suppression de toutes données
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);

  const setActiveContact = useCallback((contact: ContactAppType | null) => {
    setActiveContactState(contact);
  }, []);

  const handleRequestClearAllData = () => {
    setIsClearConfirmOpen(true);
  };

  const confirmClearAllData = useCallback(() => {
    setIsClearConfirmOpen(false);
    clearAllDataMutation.mutate();
  }, [clearAllDataMutation]);

  // Référence pour suivre les séquences d'actions en cours
  const inActionSequence = React.useRef(false);

  // Remplacer complètement la fonction mainFnKeyActionLogic par une implémentation plus robuste
  const handleFunctionKey = useCallback((event: KeyboardEvent) => {
    const relevantKeys = ['F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10'];

    // Si la touche n'est pas une touche de fonction que nous gérons, ne rien faire.
    if (!relevantKeys.includes(event.key)) {
      return;
    }

    // Si c'est une touche de fonction que nous voulons gérer, alors on prévient le comportement par défaut.
    event.preventDefault();

    // Vérifier si on a un contact actif
    if (!activeContact || !activeContact.id) {
      // Les lignes de toast ont été supprimées
      return;
    }

    // Vérifier l'état actuel
    if (updateContactMutation.isPending || callMutation.isPending) {
      console.log("[TouchesFn] Action en cours, veuillez patienter");
      return;
    }

    if (inActionSequence.current) {
      console.log("[TouchesFn] Séquence d'actions déjà en cours, veuillez patienter");
      return;
    }

    const mapping = fnKeyMappings.find(m => m.keyName === event.key);
    if (!mapping) {
      return;
    }

    const contactId = activeContact.id;
    const newStatus = mapping.statusName;
    const isInCall = contactInCallId === contactId;

    // Les lignes de toast ont été supprimées

    startTransition(async () => {
      try {
        inActionSequence.current = true;

        if (isInCall) {
          console.log(`[TouchesFn] Raccrochage de l'appel en cours (ID: ${contactId})`);
          const hangUpFormData = new FormData();
          hangUpFormData.append('contactId', contactId);
          await callMutation.mutateAsync(hangUpFormData);
        }

        console.log(`[TouchesFn] Mise à jour du statut: ${newStatus} (ID: ${contactId})`);
        const statusFormData = new FormData();
        statusFormData.append('contactId', contactId);
        statusFormData.append('status', newStatus);
        await updateContactMutation.mutateAsync(statusFormData);

        const currentIndex = filteredContacts.findIndex((c: ContactAppType) => c.id === contactId);
        const hasNextContact = currentIndex !== -1 && currentIndex < filteredContacts.length - 1;

        if (hasNextContact) {
          const nextContact = filteredContacts[currentIndex + 1];
          if (nextContact && nextContact.id) {
            console.log(`[TouchesFn] Passage au contact suivant: ${nextContact.firstName || 'Contact'} (ID: ${nextContact.id})`);
            setActiveContact(nextContact);
            if (nextContact.phoneNumber) {
              console.log(`[TouchesFn] Appel du contact suivant (ID: ${nextContact.id}, Tél: ${nextContact.phoneNumber})`);
              const callFormData = new FormData();
              callFormData.append('contactId', nextContact.id);
              callFormData.append('phoneNumber', nextContact.phoneNumber);
              callMutation.mutate(callFormData);
            }
          }
        }

        inActionSequence.current = false;

      } catch (error) {
        console.error("[TouchesFn] Erreur pendant la séquence d'actions:", error);
        inActionSequence.current = false;
      }
    });
  }, [
    activeContact,
    contactInCallId,
    filteredContacts,
    updateContactMutation,
    callMutation,
    setActiveContact,
  ]);

  // Utilisation d'une référence stable pour l'écouteur d'événements
  const stableHandleFunctionKey = useCallback((event: KeyboardEvent) => {
    handleFunctionKey(event);
  }, [handleFunctionKey]);

  useEffect(() => {
    // Utiliser la référence stable pour éviter les installations/suppressions inutiles
    window.addEventListener('keydown', stableHandleFunctionKey, { capture: true });

    console.log("[TouchesFn] Écouteur d'événements installé pour les touches fonction");

    return () => {
      window.removeEventListener('keydown', stableHandleFunctionKey, { capture: true });
      console.log("[TouchesFn] Écouteur d'événements supprimé pour les touches fonction");
    };
  }, [stableHandleFunctionKey]);

  useEffect(() => {
    const container = tableViewportRef.current;
    if (!container) return;

    const handleScroll = () => {
      // On supprime le code qui mettait à jour statusCompletionPercentage
    };

    container.addEventListener('scroll', handleScroll);
    handleScroll();

    const resizeObserver = new ResizeObserver(handleScroll);
    resizeObserver.observe(container);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      resizeObserver.disconnect();
    };
  }, [filteredContacts]);

  const handleRequestManualExport = () => {
    if (filteredContacts.length === 0) {
      // Importer et utiliser toast dynamiquement
      // import('react-toastify').then(mod => {
      //   mod.toast.warn("Aucun contact à exporter.");
      // });
      return;
    }
    setIsExportFormatDialogOpen(true);
  };

  const exportToXLSX = async (contactsToExport: ContactAppType[]) => {
    if (contactsToExport.length === 0) {
      // Importer et utiliser toast dynamiquement
      // import('react-toastify').then(mod => {
      //   mod.toast.warn("Aucun contact à exporter.");
      // });
      return;
    }
    // Lazy-load des librairies XLSX et file-saver
    const XLSX = (await import('xlsx')).default;
    const { saveAs } = await import('file-saver');

    const now = new Date();
    const timestamp = format(now, 'yyyy_MM_dd_HH_mm_ss');
    const filename = `DimiCall_${timestamp}.xlsx`;

    const worksheet = XLSX.utils.json_to_sheet(contactsToExport.map(c => ({
      ID: c.id,
      Prénom: c.firstName,
      Nom: c.lastName,
      Email: c.email,
      Téléphone: c.phoneNumber,
      Statut: c.status,
      Source: c.source,
      Commentaire: c.comment,
      "Date d'appel": c.dateAppel,
      "Heure d'appel": c.heureAppel,
      "Durée d'appel": c.dureeAppel,
      "Date de rappel": c.dateRappel,
      "Heure de rappel": c.heureRappel,
      "Date de rendez-vous": c.dateRendezVous,
      "Heure de rendez-vous": c.heureRendezVous,
    })));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Contacts");
    const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    const data = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8" });
    saveAs(data, filename);
    // Importer et utiliser toast dynamiquement en cas de succès
    // import('react-toastify').then(mod => {
    //   mod.toast.success("Contacts exportés en XLSX !");
    // });
    setIsExportFormatDialogOpen(false);
  };

  const exportToCSV = async (contactsToExport: ContactAppType[]) => {
    if (contactsToExport.length === 0) {
      // Importer et utiliser toast dynamiquement
      // import('react-toastify').then(mod => {
      //   mod.toast.warn("Aucun contact à exporter.");
      // });
      return;
    }
    // Lazy-load des librairies XLSX et file-saver
    const XLSX = (await import('xlsx')).default;
    const { saveAs } = await import('file-saver');
    const now = new Date();
    const timestamp = format(now, 'yyyy_MM_dd_HH_mm_ss');
    const filename = `DimiCall_${timestamp}.csv`;

    const csvData = contactsToExport.map(c => ({
      ID: c.id,
      Prénom: c.firstName,
      Nom: c.lastName,
      Email: c.email,
      Téléphone: c.phoneNumber,
      Statut: c.status,
      Source: c.source,
      Commentaire: c.comment,
      "Date d'appel": c.dateAppel,
      "Heure d'appel": c.heureAppel,
      "Durée d'appel": c.dureeAppel,
      "Date de rappel": c.dateRappel,
      "Heure de rappel": c.heureRappel,
      "Date de rendez-vous": c.dateRendezVous,
      "Heure de rendez-vous": c.heureRendezVous,
    }));
    const worksheet = XLSX.utils.json_to_sheet(csvData);
    const csvString = XLSX.utils.sheet_to_csv(worksheet);
    const data = new Blob(["\uFEFF" + csvString], { type: "text/csv;charset=utf-8;" });
    saveAs(data, filename);
    // Importer et utiliser toast dynamiquement en cas de succès
    // import('react-toastify').then(mod => {
    //   mod.toast.success("Contacts exportés en CSV !");
    // });
    setIsExportFormatDialogOpen(false);
  };

  const handleBookingCreated = useCallback(async (bookingInfo: { date: string; time: string; }) => {
    if (!activeContact || !activeContact.id) {
      // Importer et utiliser toast dynamiquement
      // import('react-toastify').then(mod => {
      //   mod.toast.warn("Aucun contact actif pour associer le rendez-vous. Veuillez sélectionner un contact.");
      // });
      return;
    }
    console.log("[ContactsPage] handleBookingCreated - bookingInfo:", bookingInfo, "activeContactId:", activeContact.id);

    const formData = new FormData();
    formData.append('contactId', activeContact.id);
    formData.append('bookingDate', bookingInfo.date);
    formData.append('bookingTime', bookingInfo.time);

    console.log("[ContactsPage] handleBookingCreated - Données envoyées à updateContactFormAction:", Object.fromEntries(formData.entries()));

    safeUpdateContactAction(formData);
  }, [activeContact, safeUpdateContactAction]);

  const handleRappelDateTimeSelected = useCallback(async (dateTime: Date) => {
    if (!activeContact || !activeContact.id) {
      // Importer et utiliser toast dynamiquement
      // import('react-toastify').then(mod => {
      //   mod.toast.warn("Aucun contact actif pour programmer un rappel. Veuillez sélectionner un contact.");
      // });
      return;
    }

    if (!isValid(dateTime)) {
      // Importer et utiliser toast dynamiquement
      // import('react-toastify').then(mod => {
      //   mod.toast.error("La date sélectionnée n'est pas valide.");
      // });
      return;
    }

    const dateRappel = format(dateTime, 'yyyy-MM-dd');
    const heureRappel = format(dateTime, 'HH:mm');

    console.log(`[ContactsPage] Rappel programmé pour ${activeContact.firstName} ${activeContact.lastName} (ID: ${activeContact.id}) le ${dateRappel} à ${heureRappel}`);

    // const formattedDisplayDate = safeFormat(dateTime, 'dd/MM/yyyy', { locale: fr }); // formattedDisplayDate n'est plus utilisé
    // Les lignes de toast ont été supprimées

    const formData = new FormData();
    formData.append('contactId', activeContact.id);
    formData.append('dateRappel', dateRappel);
    formData.append('heureRappel', heureRappel);

    safeUpdateContactAction(formData);
  }, [activeContact, safeUpdateContactAction]);

  const [droppedFile, setDroppedFile] = useState<File | null>(null);
  const [isFileDropConfirmOpen, setIsFileDropConfirmOpen] = useState(false);
  // Nouvel état pour suivre si un drag est en cours au-dessus de la zone du tableau
  const [isDragOverTable, setIsDragOverTable] = useState(false);

  const processFileForImport = useCallback(async (fileToProcess: File) => {
    if (!fileToProcess) {
        // Les lignes de toast ont été supprimées
        return;
    }

    // Les lignes de toast ont été supprimées

    clearAllDataMutation.mutate(undefined, {
      onSuccess: () => {
        // Les lignes de toast ont été supprimées
        const formData = new FormData();
        formData.append('file', fileToProcess);
        const acceptedTypes = [".csv", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-excel"];
        const fileName = fileToProcess.name;
        const fileExtension = "." + fileName.split('.').pop()?.toLowerCase();
        const isTypeAccepted = acceptedTypes.some(type => {
          if (type.startsWith('.')) return fileExtension === type;
          return fileToProcess.type === type;
        });

        if (!isTypeAccepted) {
          // Les lignes de toast ont été supprimées
          if (inputFileRef.current) inputFileRef.current.value = "";
          return;
        }
        // Les lignes de toast ont été supprimées
        importMutation.mutate(formData);
      },
      onError: (/* error */) => { // error n'est plus utilisé
         // Les lignes de toast ont été supprimées
      }
    });
  }, [importMutation, clearAllDataMutation]);

  const handleFileSelectedForDropZone = useCallback(async (file: File) => {
    console.log('[ContactsPage] Fichier sélectionné via UploadDropZone:', file);
    if (contacts.length > 0) {
      setDroppedFile(file);
      setIsFileDropConfirmOpen(true);
    } else {
      processFileForImport(file);
    }
  }, [processFileForImport, contacts.length]);

   // Nouvelle fonction pour gérer la sélection de fichier via l'input (utilisée dans Ribbon)
  const handleFileInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      processFileForImport(file);
    } else {
      // Importer et utiliser toast dynamiquement
      // import('react-toastify').then(mod => {
      //   mod.toast.warn("Aucun fichier sélectionné pour l'importation.");
      // });
    }
  }, [processFileForImport]);

  const handleEditContactInline = useCallback(async (updatedField: Partial<ContactAppType>): Promise<ContactAppType | null> => {
    if (!updatedField.id) {
      // Les lignes de toast ont été supprimées
      console.error("[ContactsPage] Tentative de mise à jour sans ID de contact.", updatedField);
      return null;
    }

    const { id: contactId, ...dataToUpdate } = updatedField;

    if (Object.keys(dataToUpdate).length === 0) {
      return null;
    }

    const formData = new FormData();
    formData.append('contactId', contactId as string);
    Object.entries(dataToUpdate).forEach(([key, value]) => {
      if (value !== undefined) {
        formData.append(key, value === null ? '' : String(value));
      }
    });

    console.log("[ContactsPage] handleEditContactInline - Données envoyées à updateContactFormAction:", Object.fromEntries(formData.entries()));

    safeUpdateContactAction(formData);

    const currentContact = contacts.find((c: ContactAppType) => c.id === contactId);
    if (currentContact) {
      return { ...currentContact, ...dataToUpdate };
    }
    return null;
  }, [contacts, safeUpdateContactAction]);

  // Wrapper pour handleEditContactInline à passer à Ribbon
  const handleUpdateContactFromRibbon = useCallback(async (contactId: string, dataToUpdate: Partial<ContactAppType>) => {
    // `handleEditContactInline` attend un objet avec `id` au premier niveau
    await handleEditContactInline({ id: contactId, ...dataToUpdate });
  }, [handleEditContactInline]);

  // Ajout de la référence pour stocker les contacts
  const contactsRef = useRef<ContactAppType[]>([]);
  
  // Mettre à jour la référence lorsque contacts change
  useEffect(() => {
    contactsRef.current = contacts;
  }, [contacts]);

  // Ajouter cette fonction pour vérifier l'état de l'appel périodiquement
  const checkCallStatus = useCallback(async () => {
    if (!contactInCallId) {
      setIsPollingActive(false);
      return;
    }

    try {
      const response = await fetch('/api/call/status');
      // Vérifier si la réponse est OK avant de parser le JSON
      if (!response.ok) {
        // Tenter de lire le corps de l'erreur pour plus de détails
        let errorDetail = "Erreur HTTP non OK";
        try {
          const errorData = await response.json();
          errorDetail = errorData.detail || JSON.stringify(errorData);
        } catch {
          // Si le corps de l'erreur n'est pas JSON, utiliser le texte brut
          try {
            errorDetail = await response.text();
          } catch {
            // Si tout échoue, utiliser le statut HTTP
            errorDetail = `${response.status} ${response.statusText}`;
          }
        }
        
        console.error(`[CallStatusPolling] Erreur HTTP: ${errorDetail}`);
        return;
      }

      const data = await response.json();
      
      // Vérifier que data contient les propriétés attendues
      if (!data || typeof data.call_in_progress !== 'boolean') {
        console.error(`[CallStatusPolling] Réponse du statut d'appel invalide ou manquante. Data:`, data);
        return;
      }

      // Afficher les informations des pollers pour le débogage
      const telephonyActive = data.telephony_registry_active === true;
      const telecomActive = data.telecom_dump_active === true;
      
      console.log(`[CallStatusPolling] Statut d'appel global: ${data.call_in_progress ? 'EN COURS' : 'TERMINÉ'}`);
      console.log(`[CallStatusPolling] TelephonyRegistry: ${telephonyActive ? 'APPEL ACTIF' : 'PAS D\'APPEL'}, mCallState=${data.mCallState}`);
      console.log(`[CallStatusPolling] TelecomDump: ${telecomActive ? 'APPEL ACTIF' : 'PAS D\'APPEL'}`);
      
      if (data.telecom_dump_calls && data.telecom_dump_calls.length > 0) {
        console.log(`[CallStatusPolling] Appels actifs dans TelecomDump: ${data.telecom_dump_calls.length}`);
        data.telecom_dump_calls.forEach((call: string, index: number) => {
          console.log(`[CallStatusPolling] Call[${index}]: ${call}`);
        });
      }
      
      if (data.detection_method) {
        console.log(`[CallStatusPolling] Méthode de décision finale: ${data.detection_method}`);
      }
      
      if (data.detection_conflict) {
        console.log(`[CallStatusPolling] CONFLIT DE DÉTECTION: ${data.detection_method}`);
      }

      // Si mCallState=0 (pas d'appel), c'est l'indicateur le plus fiable
      if (data.mCallState === 0) {
        console.log(`[CallStatusPolling] TelephonyRegistry mCallState=0 indique fin d'appel - indicateur fiable`);
        
        // Si un contact a été mis à jour suite au raccrochage
        if (data.updated_contact_after_hangup) {
          console.log(`[CallStatusPolling] Contact mis à jour après raccrochage: ${data.updated_contact_after_hangup.id}`);
          
          // Mettre à jour l'interface après raccrochage
          if (contactsRef.current) {
            // Mise à jour effectuée par invalidation de requête
            queryClient.invalidateQueries({ queryKey: ['contacts'] });
          }
          
          // Réinitialiser l'état d'appel
          setContactInCallId(null);
          setIsPollingActive(false);
          return;
        }
      }

      // Si l'appel n'est plus en cours selon l'API
      if (!data.call_in_progress && contactInCallId) {
        // Appel détecté comme terminé - agir immédiatement sans double vérification
        console.log(`[CallStatusPolling] L'appel est terminé pour le contact ${contactInCallId} - mise à jour immédiate`);
        
        // Vérifier si le backend a déjà géré la mise à jour du contact
        if (data.updated_contact_after_hangup) {
          console.log(`[CallStatusPolling] Le contact ${contactInCallId} a déjà été mis à jour par le backend`);
        }
        
        // Mettre à jour l'interface immédiatement
        if (contactsRef.current) {
          // Mise à jour effectuée par invalidation de requête
          queryClient.invalidateQueries({ queryKey: ['contacts'] });
        }
        
        // Réinitialiser l'état d'appel
        setContactInCallId(null);
        setIsPollingActive(false);
      }
    } catch (error) {
      console.error(`[CallStatusPolling] Erreur lors de la vérification du statut d'appel:`, error);
    }
  }, [contactInCallId, contactsRef, queryClient]);

  // Mettre à jour la fréquence de polling pour une détection plus rapide
  useEffect(() => {
    // Si nous avons un contact en cours d'appel, démarrer le polling
    if (contactInCallId && !isPollingActive) {
      console.log(`[CallStatusPolling] Démarrage du polling pour le contact ID: ${contactInCallId}`);
      setIsPollingActive(true);
      
      // Vérifier immédiatement l'état de l'appel
      checkCallStatus();
      
      // Puis créer un intervalle pour les vérifications régulières
      // Polling rapide à 500ms pour une détection quasi-instantanée
      const safetyCheckInterval = setInterval(() => {
        if (contactInCallId) {
          console.log("[CallStatusPolling] Vérification de sécurité du statut d'appel");
          checkCallStatus();
        } else {
          clearInterval(safetyCheckInterval);
        }
      }, 500); // Réduit de 1000ms à 500ms pour une détection plus rapide
      
      return () => {
        clearInterval(safetyCheckInterval);
        console.log("[CallStatusPolling] Nettoyage de l'intervalle de vérification");
      };
    }
  }, [contactInCallId, isPollingActive, checkCallStatus]);

  // Gestionnaires d'événements pour le drag and drop sur la zone du tableau
  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault(); // Permet le drop
    // Ne pas mettre à jour l'état ici, useDrop dans UploadDropZone s'en charge
  }, []);

  const handleDragEnter = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    console.log('[ContactsPage] handleDragEnter sur tableViewportRef');
    // Activer l'état de drag over uniquement si des contacts sont présents
    if (filteredContacts.length > 0) {
      setIsDragOverTable(true);
    }
  }, [filteredContacts.length]);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    // Vérifier si le drag leave est vraiment en dehors de l'élément ou juste d'un enfant
    if (!tableViewportRef.current?.contains(event.relatedTarget as Node)) {
      console.log('[ContactsPage] handleDragLeave hors de tableViewportRef');
      setIsDragOverTable(false);
    }
  }, []);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    console.log('[ContactsPage] handleDrop sur tableViewportRef');
    setIsDragOverTable(false); // Désactiver l'état de drag over après le drop
    // La logique de traitement du fichier est gérée par UploadDropZone grâce à react-dnd
    // Ne pas appeler processFileForImport ou handleFileSelectedForDropZone ici directement
  }, []);

  // Ajout des états pour gérer les colonnes visibles
  const tableColumns = useMemo(() => [
    { id: 'id', label: 'ID' },
    { id: 'firstName', label: 'Prénom' },
    { id: 'lastName', label: 'Nom' },
    { id: 'email', label: 'Email' },
    { id: 'phoneNumber', label: 'Téléphone' },
    { id: 'status', label: 'Statut' },
    { id: 'source', label: 'Source' },
    { id: 'dateAppel', label: 'Date Appel' },
    { id: 'heureAppel', label: 'Heure Appel' },
    { id: 'dureeAppel', label: 'Durée Appel' },
    { id: 'dateRappel', label: 'Date Rappel' },
    { id: 'heureRappel', label: 'Heure Rappel' },
    { id: 'dateRendezVous', label: 'Date RDV' },
    { id: 'heureRendezVous', label: 'Heure RDV' },
    { id: 'comment', label: 'Commentaire' }
  ], []);

  const [visibleColumns, setVisibleColumns] = useState<string[]>(() => {
    // Initialiser avec tous les IDs de colonnes pour rendre toutes les colonnes visibles par défaut
    // S'assurer que 'dureeAppel' est toujours inclus si présent dans tableColumns
    const initialVisible = tableColumns.map(col => col.id);
    if (!initialVisible.includes('dureeAppel')) {
      // S'assurer que dureeAppel est ajouté seulement s'il fait partie des colonnes possibles
      if (tableColumns.find(col => col.id === 'dureeAppel')) {
        initialVisible.push('dureeAppel');
      }
    }
    return initialVisible;
  });

  // Ajouter le hook SMS
  const { sendSmsAction } = useSmsAction();

  if (isLoading && contacts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-background text-foreground">
        <Loader2 className="h-16 w-16 animate-spin text-primary mb-6" />
        <p className="text-xl font-medium text-muted-foreground">Chargement des contacts...</p>
      </div>
    );
  }

  return (
    <div
      ref={mainPageRef}
      className={cn(
        "flex flex-col h-screen bg-background text-foreground relative overflow-hidden"
      )}
    >
      <header className="shrink-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
        <div className="px-2 md:px-6 py-2 md:py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 md:gap-4">
          <div className="mb-2 sm:mb-0">
            <h1 className="text-2xl font-bold tracking-tight text-gray-200">DimiCall</h1>
          </div>
          <div className="flex-grow w-full p-2 border rounded-lg border-border overflow-hidden">
            <Ribbon
              ref={ribbonRef}
              selectedContactEmail={activeContact?.email}
              inputFileRef={inputFileRef as React.RefObject<HTMLInputElement>}
              // Utiliser la nouvelle fonction pour gérer le changement de l'input file
              handleFileSelectedForImport={handleFileInputChange}
              isImportPending={importMutation.isPending}
              onRequestClearAllData={handleRequestClearAllData}
              activeContact={activeContact}
              callFormAction={safeCallAction}
              // hangUpFormAction a été supprimé car le bouton Raccrocher a été retiré du Ribbon
              contactInCallId={contactInCallId}
              onExportClick={handleRequestManualExport}
              onBookingCreated={handleBookingCreated}
              onRappelDateTimeSelected={handleRappelDateTimeSelected}
              onUpdateContact={handleUpdateContactFromRibbon}
              sendSmsAction={sendSmsAction}
            />
          </div>
          <ThemeToggleButton />
          <ColumnVisibilityDropdown 
            columns={tableColumns}
            visibleColumns={visibleColumns}
            setVisibleColumns={setVisibleColumns}
          />
        </div>
      </header>

      {/* Envelopper la zone principale avec DndProvider */}
      {isClientMounted ? (
        <DynamicDndProvider backend={HTML5Backend}>
          <div className="flex flex-1 overflow-hidden min-h-0 relative">
            <main className={cn(
              "flex-1 flex flex-col overflow-y-auto transition-all duration-300 ease-in-out p-2 sm:p-4 md:p-6 pt-0",
              "min-w-0"
            )}
            >
              <div className='flex-grow'>
                <div className="mb-2 sm:mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4">
                  <div className="w-full sm:w-auto">
                    <TableSearchBar
                      columns={searchableColumns}
                      initialSelectedColumnValue={selectedSearchColumn}
                      initialSearchTerm={searchTerm}
                      onSearchChange={handleSearchChange}
                      className="w-full"
                    />
                  </div>
                </div>
                <div
                  ref={tableViewportRef}
                  className="overflow-auto contain-paint will-change-transform relative"
                  style={{ maxHeight: 'calc(100vh - 300px)' }}
                  onDragOver={handleDragOver}
                  onDragEnter={handleDragEnter}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                    {isLoading ? (
                      <div className="flex items-center justify-center h-[300px]">
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                       </div>
                     ) : (
                      <>
                        {/* Afficher ContactTable si des contacts sont présents ET que le client est monté*/}
                        {isClientMounted && filteredContacts.length > 0 && (
                      <ContactTable
                        data={filteredContacts}
                        onEditContact={handleEditContactInline}
                        onActiveContactChange={setActiveContact}
                        scrollContainerRef={tableViewportRef}
                        contactInCallId={contactInCallId}
                        error={updateContactMutation.error ? (updateContactMutation.error instanceof Error ? updateContactMutation.error.message : String(updateContactMutation.error)) : null}
                        columns={tableColumns}
                        visibleColumns={visibleColumns}
                        setVisibleColumns={setVisibleColumns}
                      />
                        )}

                        {/* UploadDropZone est toujours rendu, positionné absolument pour recouvrir si nécessaire */}
                        {/* Le composant interne gère son style en fonction de l'état de drag */}
                        {/* Appliquer des styles pour le positionner en overlay */}
                        {/* La visibilité en mode overlay est maintenant contrôlée par isDragOverTable */}
                        <UploadDropZone
                          onFileSelected={handleFileSelectedForDropZone}
                          className={cn(
                            // Applique le positionnement absolu uniquement si des contacts sont présents ET client monté
                            (isClientMounted && filteredContacts.length > 0) ? "absolute inset-0 z-10" : "p-4",
                            // Contrôle la visibilité de l'overlay basé sur isDragOverTable si des contacts sont présents ET client monté
                            (isClientMounted && filteredContacts.length > 0 && !isDragOverTable) ? "opacity-0 pointer-events-none" : "",
                            // Ajoutez ici d'autres classes spécifiques si nécessaire, par exemple pour le fond en mode vide
                          )}
                        />
                      </>
                    )}
                </div>
              </div>

              <footer className="shrink-0 mt-auto pt-4 pb-2 text-xs text-muted-foreground flex items-center justify-between">
                <div>
                  {/* Indicateur autosave supprimé */}
                </div>
                <div className="font-medium text-center mx-auto">
                  {isClientMounted ? (
                    <span className="text-sm">{filteredContacts.length} contact{filteredContacts.length === 1 ? '' : 's'}</span>
                  ) : (
                    <span className="text-sm">0 contacts</span>
                  )}
                </div>
                <div>
                  <AdbStatusBadge />
                </div>
              </footer>
            </main>
          </div>
        </DynamicDndProvider>
      ) : (
        // Optionnellement, rendre un indicateur de chargement ou null en attendant
        null
      )}

      {isExportFormatDialogOpen && (
        <AlertDialog open={isExportFormatDialogOpen} onOpenChange={setIsExportFormatDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Choisir le format d&apos;exportation</AlertDialogTitle>
              <AlertDialogDescription>
                Sélectionnez le format dans lequel vous souhaitez exporter les contacts.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="flex flex-col sm:flex-row gap-2 justify-end">
              <Button
                onClick={() => exportToXLSX(filteredContacts)}
                className="w-full sm:w-auto"
              >
                Exporter en XLSX (Excel)
              </Button>
              <Button
                onClick={() => exportToCSV(filteredContacts)}
                className="w-full sm:w-auto"
                variant="outline"
              >
                Exporter en CSV
              </Button>
              <AlertDialogCancel
                onClick={() => setIsExportFormatDialogOpen(false)}
                className="w-full sm:w-auto mt-2 sm:mt-0"
              >
                Annuler
              </AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {isClearConfirmOpen && (
        <AlertDialog open={isClearConfirmOpen} onOpenChange={setIsClearConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Êtes-vous sûr?</AlertDialogTitle>
              <AlertDialogDescription>
                Cette action est irréversible et supprimera définitivement toutes les données des contacts.
                Voulez-vous vraiment continuer ?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setIsClearConfirmOpen(false)}>Annuler</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmClearAllData}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Tout effacer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}

      {isFileDropConfirmOpen && (
        <AlertDialog open={isFileDropConfirmOpen} onOpenChange={setIsFileDropConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Importer de nouveaux contacts ?</AlertDialogTitle>
              <AlertDialogDescription>
                L&apos;importation d&apos;un nouveau fichier remplacera toutes les données de contacts actuellement affichées.
                Voulez-vous continuer et effacer les contacts existants ?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => {
                setIsFileDropConfirmOpen(false);
                setDroppedFile(null);
              }}>Annuler</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  setIsFileDropConfirmOpen(false);
                  if (droppedFile) {
                    processFileForImport(droppedFile);
                    setDroppedFile(null);
                  }
                }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Effacer et importer
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
} 