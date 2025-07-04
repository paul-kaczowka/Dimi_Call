'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { 
  Mail, 
  Phone, 
  User,
  Info, 
  BellRing, 
  CalendarDays, 
  Waypoints,
  PhoneOutgoing,
  XCircle,
  Edit3,
  Check,
  X, 
  ChevronDown,
  Loader2,
  Clock
} from 'lucide-react';
import type { Contact } from '@/lib/schemas/contact';
import { StatusBadge, type Status as StatusType, STATUS_OPTIONS } from '@/components/ui/StatusBadge';
import { cn } from '@/lib/utils';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format, parseISO, isValid } from 'date-fns';
import { fr } from 'date-fns/locale';
import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';

// --- Nouveau EditableField --- 
interface ModernEditableFieldProps {
  fieldName: keyof Contact;
  label: string;
  value: string | null | undefined;
  onSave: (fieldName: keyof Contact, newValue: string) => void;
  IconComponent?: React.ElementType;
  isTextarea?: boolean; // Gardé pour une future extensibilité, mais non utilisé dans cette version
  placeholder?: string;
  // isNameTitle n'est plus nécessaire, le style sera géré par le contexte
  inputClassName?: string; // Pour customiser la classe de l'input si besoin
  textSizeClassName?: string; // Pour la taille du texte affiché
}

const ModernEditableField: React.FC<ModernEditableFieldProps> = ({
  fieldName, 
  label, 
  value,
  onSave,
  IconComponent,
  placeholder = "Non renseigné",
  inputClassName = "",
  textSizeClassName = "text-sm"
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [currentValue, setCurrentValue] = useState(value || '');
  const inputRef = useRef<HTMLInputElement>(null);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  useEffect(() => {
    setCurrentValue(value || '');
    setSaveStatus('idle'); // Reset status si la valeur prop change
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = async () => {
    if (value !== currentValue) {
      setSaveStatus('saving');
      try {
        // Simuler un appel async pour onSave si ce n'est pas déjà le cas
        // Dans une vraie app, onSave pourrait retourner une promesse
        await Promise.resolve(onSave(fieldName, currentValue)); 
        setSaveStatus('success');
        setTimeout(() => setSaveStatus('idle'), 1500); // Revient à idle après 1.5s
      } catch (err) {
        console.error("Erreur lors de la sauvegarde:", fieldName, err);
        setSaveStatus('error');
        // Optionnel: setTimeout(() => setSaveStatus('idle'), 2000);
      }
    } else {
      setSaveStatus('idle'); // Pas de changement, revient à idle
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setCurrentValue(value || '');
    setIsEditing(false);
    setSaveStatus('idle');
  };

  if (isEditing) {
    return (
      <div className="py-1 space-y-1">
        <p className={cn("text-xs font-medium text-muted-foreground", IconComponent ? "pl-8" : "")}>{label}</p>
        <div className="flex items-center space-x-1.5"> {/* Espace réduit pour les boutons */}
          {/* IconComponent n'est pas affiché en mode édition ici, il reste avec le label au-dessus */}
          <Input 
            ref={inputRef}
            type="text"
            value={currentValue}
            onChange={(e) => setCurrentValue(e.target.value)}
            onBlurCapture={(e) => {
              // Ne pas sauvegarder si le blur est causé par un clic sur les boutons de sauvegarde/annulation
              if (!e.relatedTarget || !(e.relatedTarget as HTMLElement).closest('.edit-action-button')) {
                handleSave();
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); handleSave(); }
              if (e.key === 'Escape') { e.preventDefault(); handleCancel(); }
            }}
            className={cn("h-9 text-sm flex-grow", inputClassName, saveStatus === 'error' && "border-destructive ring-destructive")}
            disabled={saveStatus === 'saving'}
          />
          <Button variant="ghost" size="icon" onClick={handleSave} className="h-8 w-8 shrink-0 edit-action-button" disabled={saveStatus === 'saving'}>
            {saveStatus === 'saving' ? <Loader2 className="h-4 w-4 animate-spin" /> :
             saveStatus === 'success' ? <Check className="h-4 w-4 text-green-500" /> :
             saveStatus === 'error' ? <XCircle className="h-4 w-4 text-destructive" /> :
             <Check className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="icon" onClick={handleCancel} className="h-8 w-8 shrink-0 edit-action-button" disabled={saveStatus === 'saving'}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-1 group relative">
      <div className="flex items-start space-x-3">
        {IconComponent && <IconComponent className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />}
        <div className="flex-1">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p 
            className={cn(
              "font-medium min-h-[28px] flex items-center transition-colors duration-150 ease-in-out", 
              textSizeClassName, 
              !currentValue && "italic text-muted-foreground/70",
              "hover:bg-muted/30 rounded-md -m-px p-px cursor-text" // Style de survol amélioré
            )}
            onClick={() => setIsEditing(true)}
          >
            {currentValue || placeholder}
          </p>
        </div>
      </div>
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={() => setIsEditing(true)} 
        className="absolute top-1/2 -translate-y-1/2 right-0 h-7 w-7 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-150 ease-in-out"
        aria-label={`Modifier ${label}`}
      >
        <Edit3 className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
      </Button>
    </div>
  );
};

// --- Nouveau ModernEditableDateTimeField --- 
interface ModernEditableDateTimeFieldProps {
  fieldName: keyof Contact; // S'assurer que cela correspond aux champs date de Contact
  label: string;
  value: string | null | undefined; // Valeur attendue: string ISO 8601 ou null/undefined
  onSave: (fieldName: keyof Contact, newValue: string | null) => void;
  IconComponent?: React.ElementType;
  placeholder?: string;
  textSizeClassName?: string;
}

const ModernEditableDateTimeField: React.FC<ModernEditableDateTimeFieldProps> = ({
  fieldName,
  label,
  value,
  onSave,
  IconComponent,
  placeholder = "Non renseigné",
  textSizeClassName = "text-sm",
}) => {
  const [isEditing, setIsEditing] = useState(false);
  // Stocke la date comme objet Date pour le picker, ou null
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(
    value && isValid(parseISO(value)) ? parseISO(value) : undefined
  );
  const [inputDisplayValue, setInputDisplayValue] = useState<string>(
    value && isValid(parseISO(value)) ? format(parseISO(value), 'PPP', { locale: fr }) : ''
  );
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');

  useEffect(() => {
    const dateVal = value && isValid(parseISO(value)) ? parseISO(value) : undefined;
    setSelectedDate(dateVal);
    setInputDisplayValue(dateVal ? format(dateVal, 'PPP', { locale: fr }) : '');
    setSaveStatus('idle');
  }, [value]);

  const handleSave = async () => {
    setSaveStatus('saving');
    // Si selectedDate est undefined (champ vidé) ou différent de la valeur initiale
    const originalDate = value && isValid(parseISO(value)) ? parseISO(value) : null;
    const newDateToSave = selectedDate ? selectedDate.toISOString().split('T')[0] : null; // Sauvegarde YYYY-MM-DD
    const originalDateToCompare = originalDate ? originalDate.toISOString().split('T')[0] : null;

    if (newDateToSave !== originalDateToCompare) {
      try {
        await Promise.resolve(onSave(fieldName, newDateToSave));
        setSaveStatus('success');
        setTimeout(() => setSaveStatus('idle'), 1500);
      } catch (err) {
        console.error("Erreur lors de la sauvegarde de la date:", fieldName, err);
        setSaveStatus('error');
      }
    } else {
      setSaveStatus('idle');
    }
    setIsEditing(false);
    setPopoverOpen(false);
  };

  const handleCancel = () => {
    const dateVal = value && isValid(parseISO(value)) ? parseISO(value) : undefined;
    setSelectedDate(dateVal);
    setInputDisplayValue(dateVal ? format(dateVal, 'PPP', { locale: fr }) : '');
    setIsEditing(false);
    setPopoverOpen(false);
    setSaveStatus('idle');
  };

  const handleDaySelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setInputDisplayValue(date ? format(date, 'PPP', { locale: fr }) : '');
    // Optionnel: fermer le popover après sélection et sauvegarder directement ou attendre clic sur save
    // Pour l'instant, on garde le popover ouvert et on attend un clic sur "Enregistrer"
    // setPopoverOpen(false);
    // handleSave(); // Ou attendre une action explicite
  };

  if (isEditing) {
    return (
      <div className="py-1 space-y-1">
        <p className={cn("text-xs font-medium text-muted-foreground", IconComponent ? "pl-8" : "")}>{label}</p>
        <div className="flex items-center space-x-1.5">
          <Popover open={popoverOpen} onOpenChange={(open) => {setPopoverOpen(open); if(!open) {setIsEditing(false); handleCancel(); /* Optionnel: annuler si fermeture sans save */} }}>
            <PopoverTrigger asChild>
              <Input
                type="text"
                value={inputDisplayValue}
                onFocus={() => { setPopoverOpen(true); }}
                readOnly // L'input est juste pour afficher/déclencher, la sélection se fait dans DayPicker
                className={cn("h-9 text-sm flex-grow cursor-pointer", saveStatus === 'error' && "border-destructive")}
                placeholder={placeholder}
                disabled={saveStatus === 'saving'}
              />
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <DayPicker
                mode="single"
                selected={selectedDate}
                onSelect={handleDaySelect}
                locale={fr}
                initialFocus
                captionLayout="dropdown" 
                fromYear={1900}
                toYear={new Date().getFullYear() + 5}
              />
              <div className="p-2 border-t flex justify-end space-x-2">
                 <Button variant="ghost" size="sm" onClick={() => {setSelectedDate(undefined); setInputDisplayValue(''); /* Garder popover ouvert pour potentielle nouvelle sélection ou pour save */}} className="text-xs">Effacer</Button>
                <Button variant="ghost" size="sm" onClick={handleCancel} className="text-xs">Annuler</Button>
                <Button size="sm" onClick={handleSave} className="text-xs">
                  {saveStatus === 'saving' ? <Loader2 className="h-3 w-3 animate-spin" /> :
                   saveStatus === 'success' ? <Check className="h-3 w-3 text-green-500" /> :
                   saveStatus === 'error' ? <XCircle className="h-3 w-3 text-destructive" /> :
                   <Check className="h-3 w-3" />}
                  Enregistrer
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    );
  }

  const displayFormattedDate = value && isValid(parseISO(value)) 
    ? format(parseISO(value), 'PPP', { locale: fr }) 
    : placeholder;

  return (
    <div className="py-1 group relative" onClick={() => { if(!isEditing) {setIsEditing(true); setPopoverOpen(true);} }}>
      <div className="flex items-start space-x-3">
        {IconComponent && <IconComponent className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />}
        <div className="flex-1">
          <p className="text-xs font-medium text-muted-foreground">{label}</p>
          <p
            className={cn(
              "font-medium min-h-[28px] flex items-center transition-colors duration-150 ease-in-out",
              textSizeClassName,
              (!value || !isValid(parseISO(value))) && "italic text-muted-foreground/70",
              "hover:bg-muted/30 rounded-md -m-px p-px cursor-text"
            )}
          >
            {displayFormattedDate}
          </p>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={(e) => { e.stopPropagation(); setIsEditing(true); setPopoverOpen(true); }}
        className="absolute top-1/2 -translate-y-1/2 right-0 h-7 w-7 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity duration-150 ease-in-out"
        aria-label={`Modifier ${label}`}
      >
        <Edit3 className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
      </Button>
    </div>
  );
};

interface ContactProfileCardProps {
  contact: Contact | null;
  onUpdateContact: (updatedField: Partial<Contact> & { id: string }) => void; // Gardé pour l'instant, mais onUpdate est plus générique
  onUpdate?: (updatedData: Partial<Contact>) => void; // Nouvelle prop pour les mises à jour via les champs éditables
  className?: string;
  isUpdating?: boolean; // AJOUT : Pour l'indicateur de chargement global
  onClose?: () => void; // AJOUT : Pour fermer le panneau
}

export function ContactProfileCard({ 
  contact, 
  onUpdateContact, // Gardé pour compatibilité, à évaluer si on le fusionne avec onUpdate
  onUpdate,
  className,
  isUpdating,
  onClose
}: ContactProfileCardProps) {
  const [localContact, setLocalContact] = useState<Contact | null>(contact);
  const [editedComment, setEditedComment] = useState<string | null | undefined>(contact?.comment);
  const [editingComment, setEditingComment] = useState(false);
  const commentTextareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setLocalContact(contact);
    setEditedComment(contact?.comment);
  }, [contact]);

  const handleFieldSave = (fieldName: keyof Contact, newValue: string | null) => {
    if (!localContact || !localContact.id) return;
    
    const updatedContactPart = { [fieldName]: newValue === null || newValue.trim() === '' ? undefined : newValue };
    setLocalContact(prev => prev ? { ...prev, ...updatedContactPart } : null);

    onUpdateContact({ id: localContact.id, ...updatedContactPart });
  };

  const handleCommentChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditedComment(event.target.value);
  };

  const handleSaveComment = () => {
    if (!localContact || !localContact.id) return;
    handleFieldSave('comment', editedComment || null);
    setEditingComment(false);
  };

  const handleCancelComment = () => {
    setEditedComment(localContact?.comment);
    setEditingComment(false);
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    const first = firstName?.[0] || '';
    const last = lastName?.[0] || '';
    return `${first}${last}`.toUpperCase() || 'N/A';
  };

  const handleStatusChange = (newStatusValue: string | null) => {
    if (localContact && localContact.id) {
      // Vérifier si newStatusValue est une StatusType valide ou null
      const isValidStatus = newStatusValue === null || STATUS_OPTIONS.some(opt => opt === newStatusValue);
      if (isValidStatus) {
        handleFieldSave('status', newStatusValue as StatusType | null);
      } else {
        console.warn("Tentative de définir un statut invalide:", newStatusValue);
      }
    }
  };

  if (!localContact) {
    return (
      <div className={cn("flex flex-col items-center justify-center h-full bg-card text-card-foreground p-6", className)}>
        <User className="h-16 w-16 text-muted-foreground mb-4" />
        <p className="text-lg font-medium text-muted-foreground">Aucun contact sélectionné</p>
        <p className="text-sm text-muted-foreground">Veuillez sélectionner un contact pour voir ses détails.</p>
      </div>
    );
  }

  const { 
    id, 
    firstName, 
    lastName, 
    email, 
    phoneNumber, 
    status,
    source,
    comment,
    dateAppel,      // Corrigé
    heureAppel,     // Corrigé
    dateRappel,     // Corrigé
    heureRappel,    // Corrigé
    dateRendezVous, // Corrigé
    heureRendezVous // Corrigé
  } = localContact;

  const currentStatusValue = status as StatusType | undefined;

  return (
    <div className={cn("p-0 flex flex-col h-full", className)}> {/* Ajustement du padding ici ou sur le parent */}
      {isUpdating && (
        <div className="absolute inset-0 bg-background/50 flex items-center justify-center z-50">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      )}
      {contact ? (
        <>
          <div className="flex items-center justify-between p-4 bg-card sticky top-0 z-10 border-b">
            <h2 className="text-xl font-semibold truncate">
              {contact.firstName || "Nouveau"} {contact.lastName || "Contact"}
            </h2>
            {onClose && (
              <Button variant="ghost" size="icon" onClick={onClose} aria-label="Fermer le panneau">
                <X className="h-5 w-5" />
              </Button>
            )}
          </div>

          <div className="flex-grow p-4 space-y-3 overflow-y-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
            <div className="flex flex-col items-center mb-4">
              <Avatar className="h-16 w-16 text-2xl flex-shrink-0">
                <AvatarImage src={undefined} alt={`${firstName} ${lastName}`} />
                <AvatarFallback>{getInitials(firstName, lastName)}</AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-semibold mt-2">
                {firstName || "Nouveau"} {lastName || "Contact"}
              </h2>
              <p className="text-sm text-muted-foreground">ID: {id}</p>
            </div>

            <div className="md:grid md:grid-cols-2 md:gap-x-6">
              <div className="space-y-3">
                <section>
                  <h3 className="text-xs font-semibold text-primary mb-1.5">Coordonnées</h3>
                  <div className="space-y-1.5">
                    <ModernEditableField
                      fieldName="email"
                      label="E-mail"
                      value={email}
                      onSave={handleFieldSave}
                      IconComponent={Mail}
                      placeholder="email@example.com"
                    />
                    <ModernEditableField
                      fieldName="phoneNumber"
                      label="Téléphone Mobile"
                      value={phoneNumber}
                      onSave={handleFieldSave}
                      IconComponent={Phone}
                      placeholder="+33 6 00 00 00 00"
                    />
                  </div>
                </section>

                <Separator className="my-2" />

                <section>
                  <h3 className="text-xs font-semibold text-primary mb-1.5">Statut & Source</h3>
                  <div className="space-y-1.5">
                    <div className="py-1 group relative">
                      <div className="flex items-start space-x-3">
                        <Info className="h-5 w-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-xs font-medium text-muted-foreground">Statut</p>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                className="gap-2 whitespace-nowrap transition-all h-auto p-0 font-medium text-sm flex items-center justify-start w-full hover:bg-muted/30 focus-visible:ring-0 focus-visible:ring-offset-0 min-h-[28px] -m-px px-px"
                              >
                                {currentStatusValue ? (
                                  <StatusBadge currentStatus={currentStatusValue} className="text-sm px-2 py-0.5 cursor-pointer hover:opacity-100 transition-opacity" />
                                ) : (
                                  <span className="text-sm text-muted-foreground italic px-px">Aucun statut</span>
                                )}
                                <ChevronDown className="h-4 w-4 text-muted-foreground ml-auto group-hover:text-primary transition-colors" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                              {STATUS_OPTIONS.map(option => (
                                <DropdownMenuItem 
                                  key={option}
                                  onSelect={() => handleStatusChange(option as StatusType)}
                                  className="cursor-pointer"
                                >
                                  <StatusBadge currentStatus={option as StatusType} className="mr-2 text-xs" />
                                  {option}
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                    <ModernEditableField
                      fieldName="source"
                      label="Source"
                      value={source}
                      onSave={handleFieldSave}
                      IconComponent={Waypoints}
                      placeholder="Source du contact"
                    />
                  </div>
                </section>
              </div>

              <div className="space-y-3 mt-3 md:mt-0">
                <section>
                  <h3 className="text-xs font-semibold text-primary mb-1.5">Dates Importantes</h3>
                  <div className="space-y-1.5">
                    <ModernEditableDateTimeField
                      fieldName="dateAppel"
                      label="Date du dernier appel"
                      value={dateAppel}
                      onSave={handleFieldSave}
                      IconComponent={PhoneOutgoing}
                    />
                    <ModernEditableDateTimeField
                      fieldName="heureAppel"
                      label="Heure du dernier appel"
                      value={heureAppel}
                      onSave={handleFieldSave}
                      IconComponent={Clock}
                      placeholder="HH:MM"
                    />
                    <ModernEditableDateTimeField
                      fieldName="dateRappel"
                      label="Date de rappel programmée"
                      value={dateRappel}
                      onSave={handleFieldSave}
                      IconComponent={BellRing}
                    />
                    <ModernEditableDateTimeField
                      fieldName="heureRappel"
                      label="Heure de rappel"
                      value={heureRappel}
                      onSave={handleFieldSave}
                      IconComponent={Clock}
                      placeholder="HH:MM"
                    />
                    <ModernEditableDateTimeField
                      fieldName="dateRendezVous"
                      label="Date de rendez-vous"
                      value={dateRendezVous}
                      onSave={handleFieldSave}
                      IconComponent={CalendarDays}
                    />
                    <ModernEditableDateTimeField
                      fieldName="heureRendezVous"
                      label="Heure de rendez-vous"
                      value={heureRendezVous}
                      onSave={handleFieldSave}
                      IconComponent={Clock}
                      placeholder="HH:MM"
                    />
                  </div>
                </section>
              </div>
            </div>
            
            <Separator className="my-2" />

            <section className="md:col-span-2">
              <div className="flex justify-between items-center mb-1.5">
                <h3 className="text-xs font-semibold text-primary">Commentaire</h3>
                {!editingComment && (
                  <Button variant="ghost" size="icon" onClick={() => setEditingComment(true)} className="h-7 w-7">
                    <Edit3 className="h-4 w-4 text-muted-foreground hover:text-primary" />
                  </Button>
                )}
              </div>
              {editingComment ? (
                <div className="space-y-2">
                  <Textarea
                    ref={commentTextareaRef}
                    value={editedComment || ''}
                    onChange={handleCommentChange}
                    className="min-h-[100px] text-sm"
                    placeholder="Ajoutez un commentaire..."
                    autoFocus
                  />
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm" onClick={handleCancelComment}>
                      <XCircle className="mr-1 h-4 w-4" />
                      Annuler
                    </Button>
                    <Button variant="default" size="sm" onClick={handleSaveComment}>
                      <Check className="mr-1 h-4 w-4" />
                      Enregistrer
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  className="text-sm whitespace-pre-wrap min-h-[60px] p-3 rounded-md border border-dashed border-transparent hover:border-muted hover:bg-muted/50 cursor-pointer transition-colors"
                  role="button"
                  tabIndex={0}
                  onClick={() => setEditingComment(true)}
                  onKeyDown={(e) => e.key === 'Enter' && setEditingComment(true)}
                >
                  {editedComment ? (
                    editedComment
                  ) : (
                    <span className="italic text-muted-foreground">
                      Aucun commentaire. Cliquez ou appuyez sur Entrée pour ajouter.
                    </span>
                  )}
                </div>
              )}
            </section>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center h-full bg-card text-card-foreground p-6">
          <User className="h-16 w-16 text-muted-foreground mb-4" />
          <p className="text-lg font-medium text-muted-foreground">Aucun contact sélectionné</p>
          <p className="text-sm text-muted-foreground">Veuillez sélectionner un contact pour voir ses détails.</p>
        </div>
      )}
    </div>
  );
} 