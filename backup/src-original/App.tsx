
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Theme, Contact, CallState, CallStates, ContactStatus, Civility, EmailType } from './types';
import { APP_NAME, COLUMN_HEADERS, CONTACT_DATA_KEYS, headerIcons, IconPhone, IconMail, IconSms, IconReminder, IconCalendar, IconQualification, IconLinkedIn, IconGoogle, IconInfinity, IconImport, IconExport, IconKeyboard, IconSupabase, IconRefresh, IconSun, IconMoon, IconTableColumns, IconCheckCircle, IconXCircle, IconTrash, IconFilter } from './constants';
import { ContactTable } from './components/ContactTable';
import { EmailDialog, RappelDialog, CalendarDialog, QualificationDialog, GenericInfoDialog } from './components/Dialogs';
import { ClientFilesPanel } from './components/ClientFilesPanel';
import { Button, Input, Select, ProgressDonut, DropZoneOverlay, Modal } from './components/Common';
import { SupabaseDataDialog } from './components/SupabaseDataDialog';
import { loadContacts, saveContacts, importContactsFromFile, exportContactsToFile, loadCallStates, saveCallStates, formatPhoneNumber } from './services/dataService';
import { searchLinkedIn, searchGoogle } from './lib/utils';
import { v4 as uuidv4 } from 'uuid';


const App: React.FC = () => {
  // State declarations
  const [theme, setTheme] = useState<Theme>(Theme.Dark);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [callStates, setCallStates] = useState<CallStates>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [searchColumn, setSearchColumn] = useState<keyof Contact | 'all'>('all');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [activeCallContactId, setActiveCallContactId] = useState<string | null>(null);
  const [callStartTime, setCallStartTime] = useState<Date | null>(null);
  
  const [isEmailDialogOpen, setIsEmailDialogOpen] = useState(false);
  const [isRappelDialogOpen, setIsRappelDialogOpen] = useState(false);
  const [isCalendarDialogOpen, setIsCalendarDialogOpen] = useState(false);
  const [isQualificationDialogOpen, setIsQualificationDialogOpen] = useState(false);
  const [isFnKeysInfoOpen, setIsFnKeysInfoOpen] = useState(false);
  const [isSupabaseDataDialogOpen, setIsSupabaseDataDialogOpen] = useState(false);

  const [notifications, setNotifications] = useState<{ id: string; type: 'success' | 'error' | 'info', message: string }[]>([]);
  const [importProgress, setImportProgress] = useState<{ message: string; percentage: number | null } | null>(null);
  
  const [autoSearchMode, setAutoSearchMode] = useState<'linkedin' | 'google' | ''>('');
  const [splitPanelOpen, setSplitPanelOpen] = useState(true);

  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(
    COLUMN_HEADERS.reduce((acc, header) => ({ ...acc, [header]: true }), {})
  );
  const [isColumnsDropdownOpen, setIsColumnsDropdownOpen] = useState(false);
  const columnsDropdownRef = useRef<HTMLDivElement>(null);

  // Stable helper functions (no complex dependencies within App component)
  const showNotification = useCallback((type: 'success' | 'error' | 'info', message: string, duration: number = 3000) => {
    const id = uuidv4();
    setNotifications(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, duration);
  }, []); // Empty dependency array as setNotifications is stable

  // Callbacks dependent only on state setters (which are stable)
  const updateContact = useCallback((updatedFields: Partial<Contact> & { id: string }) => {
    setContacts(prevContacts =>
      prevContacts.map(c => {
        if (c.id === updatedFields.id) {
          const newContactData = { ...c, ...updatedFields };
          if (updatedFields.telephone !== undefined) {
            newContactData.telephone = formatPhoneNumber(updatedFields.telephone);
          }
          return newContactData;
        }
        return c;
      })
    );
  }, [setContacts]); // setContacts is stable

  const updateCallState = useCallback((contactId: string, newState: Partial<CallState>) => {
    setCallStates(prev => ({ ...prev, [contactId]: { ...(prev[contactId] || {}), ...newState } }));
  }, [setCallStates]); // setCallStates is stable
  
  const refreshData = useCallback(() => {
    const loadedContacts = loadContacts();
    setContacts(loadedContacts.map((c, idx) => ({ ...c, id: c.id || uuidv4(), numeroLigne: idx + 1 })));
    setCallStates(loadCallStates());
  }, [setContacts, setCallStates]);

  const handleRowSelection = useCallback((contact: Contact | null) => {
    setSelectedContact(contact);
  }, [setSelectedContact]);

  const handleDeleteContact = useCallback((contactId: string) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce contact ?")) {
      setContacts(prev => prev.filter(c => c.id !== contactId).map((c, idx) => ({...c, numeroLigne: idx + 1})));
      setCallStates(prev => {
        const newStates = {...prev};
        delete newStates[contactId];
        return newStates;
      });
      if (selectedContact?.id === contactId) {
        setSelectedContact(null);
      }
      if (activeCallContactId === contactId) {
        setActiveCallContactId(null);
        setCallStartTime(null);
      }
      showNotification('info', "Contact supprimé.");
    }
  }, [selectedContact, activeCallContactId, setContacts, setCallStates, setSelectedContact, setActiveCallContactId, setCallStartTime, showNotification]);


  // `endActiveCall` definition - uses stable setters and `showNotification`
  const endActiveCall = useCallback((markAsError = false, contactIdToEnd?: string) => {
    const idToProcess = contactIdToEnd || activeCallContactId;
    if (idToProcess && callStates[idToProcess]?.isCalling) {
      updateCallState(idToProcess, { isCalling: false, hasBeenCalled: !markAsError });
      if (callStartTime && !markAsError) {
        const durationMs = new Date().getTime() - callStartTime.getTime();
        const seconds = Math.floor((durationMs / 1000) % 60);
        const minutes = Math.floor((durationMs / (1000 * 60)) % 60);
        const durationStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        updateContact({id: idToProcess, dureeAppel: durationStr });
      } else if (markAsError) {
        updateContact({id: idToProcess, dureeAppel: "Erreur" });
      }
      if (activeCallContactId === idToProcess) {
        setActiveCallContactId(null);
        setCallStartTime(null);
      }
      showNotification('info', "Appel terminé (simulé).");
    }
  }, [activeCallContactId, callStates, callStartTime, updateCallState, updateContact, showNotification, setActiveCallContactId, setCallStartTime]);

  // Search handlers
  const handleLinkedInSearch = useCallback((contact?: Contact) => {
    const target = contact || selectedContact;
    if (!target) {
      showNotification('info', "Sélectionnez un contact pour la recherche LinkedIn.");
      return;
    }
    searchLinkedIn(target.prenom, target.nom);
  }, [selectedContact, showNotification]);

  const handleGoogleSearch = useCallback((contact?: Contact) => {
    const target = contact || selectedContact;
    if (!target) {
      showNotification('info', "Sélectionnez un contact pour la recherche Google.");
      return;
    }
    searchGoogle(target.prenom, target.nom);
  }, [selectedContact, showNotification]);

  const handleSms = useCallback((contact?: Contact) => {
    const target = contact || selectedContact;
    if (!target) {
        showNotification('info', "Sélectionnez un contact pour envoyer un SMS.");
        return;
    }
    if (!target.telephone) {
        showNotification('error', `Aucun numéro de téléphone pour ${target.prenom} ${target.nom}.`);
        return;
    }
    // Basic cleaning of phone number for SMS URI: remove spaces, +, etc.
    // This is a very simplified cleaning, a robust solution would be more complex.
    const smsNumber = target.telephone.replace(/[^0-9]/g, ''); 
    window.open(`sms:${smsNumber}`, '_blank');
  }, [selectedContact, showNotification]);

  // `makePhoneCall` definition - depends on `endActiveCall` and others defined above
  const makePhoneCall = useCallback((contactToCall?: Contact) => {
    const targetContact = contactToCall || selectedContact;

    if (!targetContact) {
      showNotification('error', "Sélectionnez un contact pour appeler.");
      return;
    }
    if (activeCallContactId && activeCallContactId !== targetContact.id) {
      if (!window.confirm("Un appel est déjà en cours. Le terminer et lancer celui-ci?")) {
        return;
      }
      endActiveCall(false, activeCallContactId); 
    }

    showNotification('info', `Appel (simulé) vers ${targetContact.prenom} ${targetContact.nom} au ${targetContact.telephone}`);
    updateCallState(targetContact.id, { isCalling: true, hasBeenCalled: false });
    setActiveCallContactId(targetContact.id);
    setCallStartTime(new Date());
    const now = new Date();
    updateContact({
      id: targetContact.id,
      dateAppel: now.toISOString().split('T')[0],
      heureAppel: now.toTimeString().substring(0,5),
      dureeAppel: "00:00" 
    });
    setSelectedContact(targetContact);

    if (autoSearchMode === 'linkedin') handleLinkedInSearch(targetContact);
    if (autoSearchMode === 'google') handleGoogleSearch(targetContact);
  }, [selectedContact, activeCallContactId, endActiveCall, updateCallState, updateContact, autoSearchMode, showNotification, handleLinkedInSearch, handleGoogleSearch, setActiveCallContactId, setCallStartTime, setSelectedContact]);

  // useEffects - should be defined after all callbacks they use
  useEffect(() => {
    if (theme === Theme.Dark) {
      document.documentElement.classList.add('dark');
      document.documentElement.style.backgroundColor = '#000000';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.style.backgroundColor = '#F0F2F5';
    }
  }, [theme]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  useEffect(() => {
    saveContacts(contacts);
  }, [contacts]);

  useEffect(() => {
    saveCallStates(callStates);
  }, [callStates]);
  
  const filteredContacts = useMemo(() => {
    if (!searchTerm) return contacts;
    const lowerSearchTerm = searchTerm.toLowerCase();
    return contacts.filter(contact => {
      if (searchColumn === 'all') {
        return Object.values(contact).some(value =>
          String(value).toLowerCase().includes(lowerSearchTerm)
        );
      }
      const contactValue = contact[searchColumn as keyof Contact];
      return String(contactValue).toLowerCase().includes(lowerSearchTerm);
    });
  }, [contacts, searchTerm, searchColumn]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key.startsWith('F') && parseInt(event.key.substring(1)) >= 2 && parseInt(event.key.substring(1)) <= 10) {
        if (!selectedContact) return;
        event.preventDefault();
        
        if (activeCallContactId === selectedContact.id) {
          endActiveCall(false, selectedContact.id); // Call the correctly scoped endActiveCall
        }
        
        const statusIndex = parseInt(event.key.substring(1)) - 2;
        const statuses = Object.values(ContactStatus);
        if (statusIndex < statuses.length) {
          const newStatus = statuses[statusIndex];
          updateContact({ id: selectedContact.id, statut: newStatus }); // Spread selectedContact to ensure all fields are passed
          showNotification('info', `Statut de ${selectedContact.prenom} changé en "${newStatus}".`);
          
          const currentIndex = filteredContacts.findIndex(c => c.id === selectedContact.id);
          if (currentIndex !== -1 && currentIndex < filteredContacts.length - 1) {
            const nextContact = filteredContacts[currentIndex + 1];
            // setSelectedContact is handled by makePhoneCall
            setTimeout(() => makePhoneCall(nextContact), 250); 
          } else {
            showNotification('info', "Fin de la liste atteinte ou aucun contact suivant.");
          }
        }
      } else if ((event.key === 'Enter') && selectedContact && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA' && !document.querySelector('.fixed.inset-0.z-50')) { 
        event.preventDefault();
        makePhoneCall(); // Call the correctly scoped makePhoneCall
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedContact, filteredContacts, activeCallContactId, makePhoneCall, endActiveCall, updateContact, showNotification]); // Added all deps

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (columnsDropdownRef.current && !columnsDropdownRef.current.contains(event.target as Node)) {
        setIsColumnsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Other handlers
  const handleImportFile = async (droppedFiles: FileList) => {
    if (droppedFiles && droppedFiles[0]) {
      setImportProgress({ message: `Importation de "${droppedFiles[0].name}" en cours...`, percentage: 0 });
      try {
        await new Promise(res => setTimeout(res, 500));
        setImportProgress({ message: `Lecture du fichier...`, percentage: 30 });
        await new Promise(res => setTimeout(res, 800)); 
        setImportProgress({ message: `Traitement des données...`, percentage: 70 });
        
        const newContacts = await importContactsFromFile(droppedFiles[0]);
        const updatedContacts = newContacts.map((c, idx) => ({ ...c, numeroLigne: idx + 1, id: c.id || uuidv4() }));
        setContacts(updatedContacts);
        setCallStates({});
        setImportProgress({ message: `Finalisation...`, percentage: 100 });
        await new Promise(res => setTimeout(res, 300)); 
        setImportProgress(null);
        showNotification('success', `${updatedContacts.length} contacts importés avec succès.`);
      } catch (error) {
        console.error("Import error:", error);
        setImportProgress(null);
        showNotification('error', `Erreur d'importation: ${error instanceof Error ? error.message : "Inconnue"}`);
      }
    }
  };
  
  const handleSupabaseImport = (selectedSupabaseContacts: Partial<Contact>[]) => {
     setImportProgress({ message: "Traitement de l'import Supabase...", percentage: null });
    const newContactsFromSupabase: Contact[] = selectedSupabaseContacts.map((importedContact) => {
      const tel = importedContact?.telephone || (importedContact as any)?.numero || (importedContact as any)?.Téléphone || '';
      const mail = importedContact?.email || (importedContact as any)?.mail || (importedContact as any)?.Mail || '';
      const src = importedContact?.ecole || (importedContact as any)?.source || (importedContact as any)?.Source || '';
      const status = importedContact?.statut || (importedContact as any)?.['Statut Final'] || ContactStatus.NonDefini;
      const comment = importedContact?.commentaire || (importedContact as any)?.['Commentaires Appel 1'] || '';

      return {
        id: importedContact?.id || uuidv4(),
        numeroLigne: 0,
        prenom: String(importedContact?.prenom || (importedContact as any)?.['Prénom'] || ''),
        nom: String(importedContact?.nom || (importedContact as any)?.['Nom'] || ''),
        telephone: formatPhoneNumber(String(tel)),
        email: String(mail),
        ecole: String(src),
        statut: Object.values(ContactStatus).includes(status as ContactStatus) ? status as ContactStatus : ContactStatus.NonDefini,
        commentaire: String(comment),
        dateRappel: String(importedContact?.dateRappel || ''),
        heureRappel: String(importedContact?.heureRappel || ''),
        dateRDV: String(importedContact?.dateRDV || ''),
        heureRDV: String(importedContact?.heureRDV || ''),
        dateAppel: String(importedContact?.dateAppel || ''),
        heureAppel: String(importedContact?.heureAppel || ''),
        dureeAppel: String(importedContact?.dureeAppel || 'N/A'),
        uid_supabase: String(importedContact?.uid_supabase || (importedContact as any)?.UID || ''),
      };
    });
    setContacts(newContactsFromSupabase.map((c,idx) => ({...c, numeroLigne: idx + 1})));
    setCallStates({}); 
    setImportProgress(null);
    showNotification('success', `${newContactsFromSupabase.length} contacts importés depuis Supabase (simulation).`);
    setIsSupabaseDataDialogOpen(false);
  };

  const handleExport = (format: 'csv' | 'xlsx') => {
    if (contacts.length === 0) {
      showNotification('info', "Aucun contact à exporter.");
      return;
    }
    exportContactsToFile(contacts, format);
    showNotification('success', `Contacts exportés au format ${format.toUpperCase()}.`);
  };

  const toggleTheme = () => {
    setTheme(prevTheme => (prevTheme === Theme.Light ? Theme.Dark : Theme.Light));
  };
  
  const toggleColumnVisibility = (header: string) => {
    if (header === "#" || header === "Prénom" || header === "Nom" || header === "Actions") return;
    setVisibleColumns(prev => ({ ...prev, [header]: !prev[header] }));
  };

  const handleRefresh = () => {
    showNotification('info', 'Rafraîchissement des données...');
    refreshData();
  };

  // Derived state & constants for rendering
  const searchColumnsOptions = useMemo(() => [
    { value: 'all', label: 'Toutes les colonnes', icon: undefined },
    ...COLUMN_HEADERS.slice(1, COLUMN_HEADERS.length -1) 
      .map((header, idx) => {
        const dataKeyIndex = idx + 1; 
        const dataKey = CONTACT_DATA_KEYS[dataKeyIndex] as keyof Contact | null;
        return {
          value: dataKey || 'all',
          label: header,
          icon: headerIcons[header] || undefined
        };
      })
  ], []); // Empty dependency array as COLUMN_HEADERS, CONTACT_DATA_KEYS, headerIcons are constants

  const totalContacts = contacts.length;
  const processedContacts = contacts.filter(c => c.statut !== ContactStatus.NonDefini).length;
  const progressPercentage = totalContacts > 0 ? Math.round((processedContacts / totalContacts) * 100) : 0;
  const fnKeyMapping = Object.values(ContactStatus).slice(0, 9).map((status, index) => `F${index+2}: ${status}`).join('\n');

  const RibbonButton: React.FC<{onClick?: () => void; icon: React.ReactNode; label: string; disabled?: boolean; title?: string; size?: 'sm' | 'md'; className?: string}> = 
  ({onClick, icon, label, disabled, title, size = 'md', className=""}) => (
    <Button
      onClick={onClick}
      variant="secondary"
      size={size}
      disabled={disabled}
      title={title || label}
      className={`flex flex-col items-center !p-1 min-w-[60px] max-w-[70px] h-[50px] justify-center text-center ${className}`}
    >
      <div className="w-5 h-5 mb-0.5">{icon}</div>
      <span className="text-[10px] leading-tight block truncate w-full">{label}</span>
    </Button>
  );

  // JSX Return
  return (
    <div className={`flex flex-col h-screen font-sans ${theme === Theme.Dark ? 'dark bg-oled-bg text-oled-text' : 'bg-light-bg text-light-text'}`}>
      {/* ... Notifications, Modals, Header ... */}
      <DropZoneOverlay onDrop={handleImportFile} />
      
      <div className="fixed top-5 right-5 z-[60] space-y-2">
        {notifications.map(notif => (
          <div key={notif.id} className={`p-3 pr-8 rounded-md shadow-lg text-white text-sm relative
            ${notif.type === 'success' ? 'bg-green-500' : ''}
            ${notif.type === 'error' ? 'bg-red-500' : ''}
            ${notif.type === 'info' ? 'bg-blue-500' : ''}
          `}>
            {notif.message}
            <button 
              onClick={() => setNotifications(prev => prev.filter(n => n.id !== notif.id))} 
              className="absolute top-1 right-1 text-lg font-bold opacity-70 hover:opacity-100 leading-none p-1"
              aria-label="Close notification"
            >
              &times;
            </button>
          </div>
        ))}
      </div>

      {importProgress && (
        <Modal isOpen={true} onClose={() => setImportProgress(null)} title="Importation en Cours" size="sm">
          <div className="flex flex-col items-center space-y-3 p-4">
            <div className="w-12 h-12 border-4 border-oled-accent border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm text-oled-text-dim">{importProgress.message}</p>
            {importProgress.percentage !== null && (
               <div className="w-full bg-oled-interactive rounded-full h-2.5 mt-2">
                <div className="bg-oled-accent h-2.5 rounded-full" style={{ width: `${importProgress.percentage}%` }}></div>
              </div>
            )}
          </div>
        </Modal>
      )}

      <header className="h-8 bg-oled-interactive dark:bg-oled-interactive border-b border-oled-border dark:border-oled-border flex items-center justify-between px-3 sticky top-0 z-40 select-none">
        <div className="text-xs font-semibold text-oled-text dark:text-oled-text">{APP_NAME}</div>
        <div className="flex space-x-1.5">
          <div className="w-2.5 h-2.5 bg-yellow-400 rounded-full cursor-pointer hover:bg-yellow-300" title="Minimize (simulated)"></div>
          <div className="w-2.5 h-2.5 bg-green-400 rounded-full cursor-pointer hover:bg-green-300" title="Maximize (simulated)"></div>
          <div className="w-2.5 h-2.5 bg-red-500 rounded-full cursor-pointer hover:bg-red-400" title="Close (simulated)" onClick={() => showNotification('info', 'Close button clicked (simulation).')}></div>
        </div>
      </header>
      
      <main className="flex-grow flex flex-col p-3 space-y-3 overflow-y-auto">
      <div className={`p-2 rounded-lg shadow-md flex flex-wrap items-stretch justify-start gap-x-1 gap-y-1 ${theme === Theme.Dark ? 'bg-oled-card' : 'bg-light-card'}`}>
          <div className={`flex flex-wrap gap-1 p-1 border-r ${theme === Theme.Dark ? 'border-oled-border/50' : 'border-light-border'} pr-1.5 mr-1`}>
            <RibbonButton onClick={() => makePhoneCall()} icon={<IconPhone />} label="Appeler" disabled={!selectedContact} />
            <RibbonButton onClick={() => selectedContact && setIsEmailDialogOpen(true)} icon={<IconMail />} label="Email" disabled={!selectedContact} />
            <RibbonButton onClick={() => handleSms()} icon={<IconSms />} label="SMS" disabled={!selectedContact} />
            <RibbonButton onClick={() => selectedContact && setIsRappelDialogOpen(true)} icon={<IconReminder />} label="Rappel" disabled={!selectedContact} />
            <RibbonButton onClick={() => setIsCalendarDialogOpen(true)} icon={<IconCalendar />} label="Cal.com" />
            <RibbonButton onClick={() => selectedContact && setIsQualificationDialogOpen(true)} icon={<IconQualification />} label="Qualif." disabled={!selectedContact} />
          </div>
          <div className={`flex flex-wrap gap-1 p-1 border-r ${theme === Theme.Dark ? 'border-oled-border/50' : 'border-light-border'} pr-1.5 mr-1`}>
            <RibbonButton onClick={() => handleLinkedInSearch()} icon={<IconLinkedIn />} label="LinkedIn" disabled={!selectedContact} />
            <RibbonButton onClick={() => handleGoogleSearch()} icon={<IconGoogle />} label="Google" disabled={!selectedContact} />
            <div className="flex flex-col items-center justify-center min-w-[60px] max-w-[70px] h-[50px]">
                 <IconInfinity className={`w-5 h-5 mb-0.5 ${theme === Theme.Dark ? 'text-oled-text-dim' : 'text-light-text-dim'}`} />
                <Select
                    title="Mode de recherche automatique"
                    options={[{value: "", label: "Auto"}, {value: "linkedin", label: "LinkedIn"}, {value: "google", label: "Google"}]}
                    value={autoSearchMode}
                    onChange={(e) => setAutoSearchMode(e.target.value as ('linkedin' | 'google' | ''))}
                    className={`w-full !text-[10px] !py-0.5 !px-1 leading-tight ${theme === Theme.Dark ? '!bg-oled-interactive !border-oled-border' : '!bg-light-interactive !border-light-border'}`}
                />
            </div>
          </div>
          <div className={`flex flex-wrap gap-1 p-1 border-r ${theme === Theme.Dark ? 'border-oled-border/50' : 'border-light-border'} pr-1.5 mr-1`}>
            <RibbonButton onClick={() => document.getElementById('fileImporter')?.click()} icon={<IconImport />} label="Importer"/>
            <input type="file" id="fileImporter" accept=".csv, .xlsx, .xls" className="hidden" onChange={(e) => e.target.files && handleImportFile(e.target.files)} />
             <div className="flex flex-col items-center justify-center min-w-[60px] max-w-[70px] h-[50px]">
                <IconExport className={`w-5 h-5 mb-0.5 ${theme === Theme.Dark ? 'text-oled-text-dim' : 'text-light-text-dim'}`} />
                <Select
                title="Exporter les données"
                options={[{value: "", label: "Exporter"},{value: "csv", label: "CSV"}, {value: "xlsx", label: "Excel"}]}
                onChange={(e) => e.target.value && handleExport(e.target.value as 'csv'|'xlsx')}
                value=""
                className={`w-full !text-[10px] !py-0.5 !px-1 leading-tight ${theme === Theme.Dark ? '!bg-oled-interactive !border-oled-border' : '!bg-light-interactive !border-light-border'}`}
                />
            </div>
            <RibbonButton onClick={() => setIsFnKeysInfoOpen(true)} icon={<IconKeyboard />} label="Fn Keys" title={fnKeyMapping}/>
          </div>
          <div className="flex flex-wrap gap-1 p-1">
            <RibbonButton onClick={() => setIsSupabaseDataDialogOpen(true)} icon={<IconSupabase />} label="Supabase"/>
            <div className="flex items-center justify-center pl-1" title="Statut Supabase (Simulation - Toujours connecté)">
              <IconCheckCircle className="w-4 h-4 text-green-500" />
            </div>
            <RibbonButton onClick={handleRefresh} icon={<IconRefresh />} label="Refresh"/>
          </div>
          <div className="flex-grow flex justify-end items-center p-1">
            <Button onClick={toggleTheme} variant="ghost" size="sm" className="!p-1.5">
                {theme === Theme.Dark ? <IconSun className="w-4 h-4" /> : <IconMoon className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        <div className="flex gap-2 items-center">
          <Select
            options={searchColumnsOptions}
            value={searchColumn}
            onChange={(e) => setSearchColumn(e.target.value as keyof Contact | 'all')}
            className={`w-40 text-xs ${theme === Theme.Dark ? '!bg-oled-interactive !border-oled-border' : '!bg-light-interactive !border-light-border'}`}
          />
          <Input
            type="text"
            placeholder={`Rechercher...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-grow !py-1.5 text-xs"
          />
          <div className="relative" ref={columnsDropdownRef}>
            <Button onClick={() => setIsColumnsDropdownOpen(prev => !prev)} leftIcon={<IconTableColumns className="w-4 h-4"/>} variant="secondary" size="sm" className="!py-1.5 text-xs">Colonnes</Button>
            {isColumnsDropdownOpen && (
              <div className={`absolute right-0 mt-1 w-48 rounded-md shadow-lg z-20 ${theme === Theme.Dark ? 'bg-oled-interactive border-oled-border' : 'bg-light-card border-light-border'} border`}>
                <div className={`py-1 max-h-60 overflow-y-auto scrollbar-thin ${theme === Theme.Dark ? 'scrollbar-thumb-oled-border scrollbar-track-transparent' : 'scrollbar-thumb-light-border scrollbar-track-transparent'}`}>
                  {COLUMN_HEADERS.map((header) => (
                    <label key={header} className={`flex items-center px-2.5 py-1 text-xs cursor-pointer ${theme === Theme.Dark ? 'hover:bg-oled-interactive-hover text-oled-text' : 'hover:bg-light-interactive-hover text-light-text'}`}>
                      <input
                        type="checkbox"
                        className={`form-checkbox h-3 w-3 rounded focus:ring-offset-0
                          ${theme === Theme.Dark ? 'text-oled-accent focus:ring-oled-accent bg-oled-card border-oled-border' : 'text-light-accent focus:ring-light-accent bg-light-card border-light-border'}`}
                        checked={visibleColumns[header]}
                        onChange={() => toggleColumnVisibility(header)}
                        disabled={header === "#" || header === "Prénom" || header === "Nom" || header === "Actions"}
                      />
                      <span className="ml-2">{header}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex-grow flex gap-3 min-h-[300px] overflow-hidden">
          <div className={`transition-all duration-300 ease-in-out ${splitPanelOpen ? 'w-2/3 xl:w-3/4' : 'w-full'} flex flex-col`}>
            <ContactTable
              contacts={filteredContacts}
              callStates={callStates}
              onSelectContact={handleRowSelection}
              selectedContactId={selectedContact?.id || null}
              onUpdateContact={updateContact}
              onDeleteContact={handleDeleteContact}
              activeCallContactId={activeCallContactId}
              theme={theme}
              visibleColumns={visibleColumns}
              columnHeaders={COLUMN_HEADERS}
              contactDataKeys={CONTACT_DATA_KEYS as (keyof Contact | 'actions' | null)[]}
            />
          </div>
          <div className={`transition-all duration-300 ease-in-out overflow-hidden ${splitPanelOpen ? 'w-1/3 xl:w-1/4 min-w-[300px] xl:min-w-[350px]' : 'w-0'} ${theme === Theme.Dark ? 'bg-oled-card' : 'bg-light-card'} rounded-xl`}>
            {splitPanelOpen && <ClientFilesPanel contact={selectedContact} theme={theme} showNotification={showNotification} />}
          </div>
        </div>
      </main>

      <footer className={`h-10 border-t flex items-center justify-between px-3 text-xs shrink-0 ${theme === Theme.Dark ? 'bg-oled-card border-oled-border text-oled-text-dim' : 'bg-light-card border-light-border text-light-text-dim'}`}>
        <div className="flex items-center space-x-1.5">
          <span>{filteredContacts.length} sur {contacts.length} contacts</span>
          <span className={`${theme === Theme.Dark ? 'text-oled-border/50' : 'text-light-border'}`}>|</span>
          <ProgressDonut progress={progressPercentage} size={24} strokeWidth={3} />
        </div>
        <div className="flex items-center space-x-2">
            {activeCallContactId && (
                <Button onClick={() => endActiveCall()} size="sm" variant="danger" className="!text-xs !py-0.5 !px-1.5">Terminer Appel</Button>
            )}
            <span>Batterie: (Web - N/A)</span>
            <Button onClick={() => setSplitPanelOpen(!splitPanelOpen)} variant="ghost" size="sm" className="!text-xs !py-0.5 !px-1.5">
                {splitPanelOpen ? 'Cacher Volet' : 'Afficher Volet'}
            </Button>
        </div>
      </footer>

      {selectedContact && isEmailDialogOpen && (
        <EmailDialog
          isOpen={isEmailDialogOpen}
          onClose={() => setIsEmailDialogOpen(false)}
          contactName={`${selectedContact.prenom} ${selectedContact.nom}`}
          contactEmail={selectedContact.email}
          showNotification={showNotification}
        />
      )}
      {selectedContact && isRappelDialogOpen && (
        <RappelDialog
          isOpen={isRappelDialogOpen}
          onClose={() => setIsRappelDialogOpen(false)}
          contact={selectedContact}
          onSave={(date, time) => {
            updateContact({ id: selectedContact.id, dateRappel: date, heureRappel: time });
            showNotification('success', `Rappel défini pour ${selectedContact.prenom} le ${date} à ${time}.`);
            setIsRappelDialogOpen(false);
          }}
        />
      )}
      {isCalendarDialogOpen && (
        <CalendarDialog
          isOpen={isCalendarDialogOpen}
          onClose={() => setIsCalendarDialogOpen(false)}
          contactInfo={selectedContact ? { nom: selectedContact.nom, prenom: selectedContact.prenom, email: selectedContact.email, telephone: selectedContact.telephone } : undefined}
        />
      )}
       {selectedContact && isQualificationDialogOpen && (
        <QualificationDialog
          isOpen={isQualificationDialogOpen}
          onClose={() => setIsQualificationDialogOpen(false)}
          onSave={(comment) => {
            updateContact({ id: selectedContact.id, commentaire: comment });
            showNotification('success', `Qualification enregistrée pour ${selectedContact.prenom}.`);
            setIsQualificationDialogOpen(false);
          }}
          theme={theme}
        />
      )}
      {isFnKeysInfoOpen && (
        <GenericInfoDialog
          isOpen={isFnKeysInfoOpen}
          onClose={() => setIsFnKeysInfoOpen(false)}
          title="Raccourcis Clavier (Touches Fn)"
          content={
            <div className={`text-sm space-y-1 ${theme === Theme.Dark ? 'text-oled-text' : 'text-light-text'}`}>
              <p>Les touches F2 à F10 permettent de changer rapidement le statut du contact sélectionné:</p>
              <ul className="list-disc list-inside pl-4 space-y-0.5">
                {Object.values(ContactStatus).slice(0, 9).map((status, index) => (
                  <li key={status}><strong>F{index+2}:</strong> {status}</li>
                ))}
              </ul>
              <p className="mt-2 pt-1 border-t border-dashed">Appuyer sur <strong>Entrée</strong> pour appeler le contact sélectionné (si aucun champ de texte n'est actif).</p>
               <p className="mt-1">Après avoir utilisé une touche F pour changer le statut, l'application sélectionnera automatiquement le contact suivant et simulera un appel.</p>
            </div>
          }
          theme={theme}
        />
      )}
      {isSupabaseDataDialogOpen && (
        <SupabaseDataDialog
            isOpen={isSupabaseDataDialogOpen}
            onClose={() => setIsSupabaseDataDialogOpen(false)}
            onImport={handleSupabaseImport}
            theme={theme}
        />
      )}
    </div>
  );
};

export default App;