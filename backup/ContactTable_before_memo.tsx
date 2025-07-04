import React, { useState, useCallback, useMemo, useEffect, useRef, useImperativeHandle, forwardRef } from 'react';
import { Contact, ContactStatus, CallStates, Theme } from '../types';
import { cn } from '../lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';

import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Phone, User, Mail, MessageCircle, Clock, Calendar as CalendarIcon, FileText, ArrowUpDown, 
  ArrowUp, ArrowDown, Trash2, Zap, Timer, Eye, EyeOff, Settings2, GripVertical, Move, X,
  Hash, FolderOpen, Upload, FileSpreadsheet, Users, CloudUpload
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { formatPhoneNumber } from '../services/dataService';

type SortDirection = 'asc' | 'desc' | null;

// Configuration des colonnes
interface ColumnConfig {
  id: string;
  key: keyof Contact | 'actions';
  label: string;
  icon: React.ComponentType<any>;
  width?: string;
  minWidth?: string;
  canHide: boolean;
  canSort: boolean;
  defaultVisible: boolean;
}

// Configuration des colonnes avec largeurs optimisées
const DEFAULT_COLUMNS: ColumnConfig[] = [
  {
    id: 'index',
    key: 'prenom', // Pas vraiment utilisé, juste pour l'ordre
    label: '#',
    icon: Hash,
    width: '60px',
    minWidth: '60px',
    canHide: false,
    canSort: false,
    defaultVisible: true,
  },
  {
    id: 'prenom',
    key: 'prenom',
    label: 'Prénom',
    icon: User,
    width: 'auto',
    minWidth: '120px',
    canHide: false,
    canSort: true,
    defaultVisible: true,
  },
  {
    id: 'nom',
    key: 'nom',
    label: 'Nom',
    icon: User,
    width: 'auto',
    minWidth: '120px',
    canHide: false,
    canSort: true,
    defaultVisible: true,
  },
  {
    id: 'actions',
    key: 'actions',
    label: 'Actions',
    icon: Settings2,
    width: '120px',
    minWidth: '120px',
    canHide: false,
    canSort: false,
    defaultVisible: true,
  },
  {
    id: 'telephone',
    key: 'telephone',
    label: 'Téléphone',
    icon: Phone,
    width: 'auto',
    minWidth: '160px',
    canHide: true,
    canSort: true,
    defaultVisible: true,
  },
  {
    id: 'email',
    key: 'email',
    label: 'Mail',
    icon: Mail,
    width: 'auto',
    minWidth: '200px',
    canHide: true,
    canSort: true,
    defaultVisible: true,
  },
  {
    id: 'statut',
    key: 'statut',
    label: 'Statut',
    icon: FileText,
    width: 'auto',
    minWidth: '140px',
    canHide: true,
    canSort: true,
    defaultVisible: true,
  },
  {
    id: 'commentaire',
    key: 'commentaire',
    label: 'Commentaire',
    icon: MessageCircle,
    width: 'auto',
    minWidth: '320px', // Augmenté de 250px à 320px pour éviter la troncature
    canHide: true,
    canSort: true,
    defaultVisible: true,
  },
  {
    id: 'dateRappel',
    key: 'dateRappel',
    label: 'Date Rappel',
    icon: CalendarIcon,
    width: 'auto',
    minWidth: '140px',
    canHide: true,
    canSort: true,
    defaultVisible: true,
  },
  {
    id: 'heureRappel',
    key: 'heureRappel',
    label: 'Heure Rappel',
    icon: Clock,
    width: 'auto',
    minWidth: '140px',
    canHide: true,
    canSort: true,
    defaultVisible: true,
  },
  {
    id: 'dateRDV',
    key: 'dateRDV',
    label: 'Date RDV',
    icon: CalendarIcon,
    width: 'auto',
    minWidth: '140px',
    canHide: true,
    canSort: true,
    defaultVisible: true,
  },
  {
    id: 'heureRDV',
    key: 'heureRDV',
    label: 'Heure RDV',
    icon: Clock,
    width: 'auto',
    minWidth: '140px',
    canHide: true,
    canSort: true,
    defaultVisible: true,
  },
  {
    id: 'dateAppel',
    key: 'dateAppel',
    label: 'Date Appel',
    icon: CalendarIcon,
    width: 'auto',
    minWidth: '140px',
    canHide: true,
    canSort: true,
    defaultVisible: true,
  },
  {
    id: 'heureAppel',
    key: 'heureAppel',
    label: 'Heure Appel',
    icon: Clock,
    width: 'auto',
    minWidth: '140px',
    canHide: true,
    canSort: true,
    defaultVisible: true,
  },
  {
    id: 'dureeAppel',
    key: 'dureeAppel',
    label: 'Durée Appel',
    icon: Timer,
    width: 'auto',
    minWidth: '140px',
    canHide: true,
    canSort: true,
    defaultVisible: true,
  },
];

const INPUT_BASE_CLASS = "h-8 px-2 text-xs border border-border/50 rounded-md bg-background/80 focus:bg-background focus:border-primary/50 transition-colors";

interface StatusComboBoxProps {
  value: ContactStatus;
  onChange: (newStatus: ContactStatus) => void;
  theme: Theme;
}

const StatusComboBox: React.FC<StatusComboBoxProps> = ({ value, onChange, theme }) => {
  const [localValue, setLocalValue] = useState(value);
  
  // Synchroniser la valeur locale avec la prop quand elle change
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const getStatusConfig = (status: ContactStatus) => {
    switch (status) {
      case ContactStatus.NonDefini: 
        return { 
          color: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-200', 
          dot: 'bg-gray-400' 
        };
      case ContactStatus.MauvaisNum: 
        return { 
          color: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-200', 
          dot: 'bg-red-500' 
        };
      case ContactStatus.Repondeur: 
        return { 
          color: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-200', 
          dot: 'bg-orange-500' 
        };
      case ContactStatus.ARappeler: 
        return { 
          color: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-200', 
          dot: 'bg-yellow-500' 
        };
      case ContactStatus.PasInteresse: 
        return { 
          color: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-200', 
          dot: 'bg-red-500' 
        };
      case ContactStatus.Argumente: 
        return { 
          color: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-200', 
          dot: 'bg-blue-500' 
        };
      case ContactStatus.DO: 
        return { 
          color: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200', 
          dot: 'bg-emerald-500' 
        };
      case ContactStatus.RO: 
        return { 
          color: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-200', 
          dot: 'bg-green-500' 
        };
      case ContactStatus.ListeNoire: 
        return { 
          color: 'bg-gray-800 text-gray-100 border-gray-600 dark:bg-gray-700 dark:text-gray-100', 
          dot: 'bg-gray-600' 
        };
      case ContactStatus.Premature: 
        return { 
          color: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-200', 
          dot: 'bg-purple-500' 
        };
      default: 
        return { 
          color: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-200', 
          dot: 'bg-gray-400' 
        };
    }
  };

  const handleStatusChange = (newStatus: ContactStatus) => {
    setLocalValue(newStatus);
    onChange(newStatus);
  };

  const config = getStatusConfig(localValue);

  return (
    <Select 
      value={localValue} 
      onValueChange={(newValue) => handleStatusChange(newValue as ContactStatus)}
      key={`status-${localValue}`} // Force re-render quand la valeur change
    >
      <SelectTrigger className="border-none bg-transparent p-0 h-auto">
        <div className={cn(
          "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors",
          config.color
        )}>
          <div className={cn("w-1.5 h-1.5 rounded-full", config.dot)} />
          {localValue}
        </div>
      </SelectTrigger>
      <SelectContent className="bg-popover border shadow-lg">
        {Object.values(ContactStatus).map(status => {
          const statusConfig = getStatusConfig(status);
          return (
            <SelectItem key={status} value={status}>
              <div className={cn(
                "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border transition-colors",
                statusConfig.color
              )}>
                <div className={cn("w-1.5 h-1.5 rounded-full", statusConfig.dot)} />
                {status}
              </div>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
};

interface CommentWidgetProps {
  value: string;
  onChange: (newComment: string) => void;
  theme: Theme;
}

const CommentWidget: React.FC<CommentWidgetProps> = ({ value, onChange, theme }) => {
  const [comment, setComment] = useState(value);

  // Synchroniser l'état local avec la prop value quand elle change (ex: qualification)
  useEffect(() => {
    setComment(value);
  }, [value]);

  const handleBlur = () => {
    if (comment !== value) {
      onChange(comment);
    }
  };

  const insertQuickComment = (quickComment: string) => {
    const newComment = (comment ? comment + " " : "") + quickComment;
    setComment(newComment);
    onChange(newComment);
  };

  const quickComments = [
    "Accompagné", "Intéressé", "Non disponible", "Rappeler plus tard", "Numéro incorrect",
    "Pas de réponse", "Occupé", "RDV fixé", "Déjà client"
  ];

  return (
    <div className="flex items-center space-x-1 w-full">
      <Input
        type="text"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        onBlur={handleBlur}
        placeholder="Commentaire..."
        className={`${INPUT_BASE_CLASS} flex-1 min-w-0`}
      />
      <Select onValueChange={insertQuickComment}>
        <SelectTrigger className="h-6 w-6 p-0 border-none bg-transparent hover:bg-muted/50 rounded-sm flex-shrink-0">
          <Zap className="h-3 w-3 text-muted-foreground hover:text-primary transition-colors" />
        </SelectTrigger>
        <SelectContent className="bg-popover border shadow-lg">
          {quickComments.map(qc => (
            <SelectItem key={qc} value={qc} className="text-xs">
              {qc}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
};

interface DateTimeCellProps {
  value: string; 
  type: 'date' | 'time';
  onChange: (newValue: string) => void;
  theme: Theme;
}

const DateTimeCell: React.FC<DateTimeCellProps> = ({ value, type, onChange, theme }) => {
  const [currentValue, setCurrentValue] = useState(value);
  const [showInput, setShowInput] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [isTimeOpen, setIsTimeOpen] = useState(false);
  const inputType = type === 'date' ? 'date' : 'time';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentValue(e.target.value);
  };

  const handleBlur = () => {
    if (currentValue !== value) {
      onChange(currentValue);
    }
    setShowInput(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleBlur();
    }
    if (e.key === 'Escape') {
      setCurrentValue(value);
      setShowInput(false);
    }
  };

  const handleClear = () => {
    setCurrentValue('');
    onChange('');
    setIsCalendarOpen(false);
    setIsTimeOpen(false);
  };

  useEffect(() => {
    setCurrentValue(value);
  }, [value]);

  if (type === 'date') {
    const handleDateSelect = (date: Date | undefined) => {
      if (date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const formattedDate = `${year}-${month}-${day}`;
        onChange(formattedDate);
        setSelectedDate(date);
      }
      setIsCalendarOpen(false);
    };

    const displayValue = value ? new Date(value).toLocaleDateString('fr-FR') : '';

    return (
      <div className="flex items-center gap-1">
        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "h-8 px-2 text-xs justify-start text-left font-normal flex-1",
                !value && "text-muted-foreground",
                INPUT_BASE_CLASS
              )}
            >
              <CalendarIcon className="mr-2 h-3 w-3" />
              {displayValue || "Sélectionner"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate || (value ? new Date(value) : undefined)}
              onSelect={handleDateSelect}
              initialFocus
            />
          </PopoverContent>
        </Popover>
        {value && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
            onClick={handleClear}
            title="Supprimer la date"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    );
  }

  if (type === 'time') {
    
    const handleTimeSelect = (type: 'hour' | 'minute', timeValue: number) => {
      const parts = currentValue.split(':');
      const hours = type === 'hour' ? timeValue.toString().padStart(2, '0') : (parts[0] || '00');
      const minutes = type === 'minute' ? timeValue.toString().padStart(2, '0') : (parts[1] || '00');
      const newTime = `${hours}:${minutes}`;
      setCurrentValue(newTime);
      onChange(newTime);
    };

    const hours = Array.from({ length: 24 }, (_, i) => i);
    const minutes = Array.from({ length: 60 }, (_, i) => i);

    return (
      <div className="flex items-center gap-1">
        <Popover open={isTimeOpen} onOpenChange={setIsTimeOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "h-8 px-2 text-xs justify-start text-left font-normal flex-1",
                !value && "text-muted-foreground",
                INPUT_BASE_CLASS
              )}
            >
              <Clock className="mr-2 h-3 w-3" />
              {currentValue || "Heure"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-4" align="start">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium mb-2">Heures</div>
                <ScrollArea className="h-40">
                  <div className="grid gap-1">
                    {hours.map(hour => (
                      <Button
                        key={hour}
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs justify-start"
                        onClick={() => handleTimeSelect('hour', hour)}
                      >
                        {hour.toString().padStart(2, '0')}
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
              </div>
              <div>
                <div className="text-sm font-medium mb-2">Minutes</div>
                <ScrollArea className="h-40">
                  <div className="grid gap-1">
                    {minutes.filter((_, i) => i % 5 === 0).map(minute => (
                      <Button
                        key={minute}
                        variant="ghost"
                        size="sm"
                        className="h-8 text-xs justify-start"
                        onClick={() => handleTimeSelect('minute', minute)}
                      >
                        {minute.toString().padStart(2, '0')}
                      </Button>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            </div>
          </PopoverContent>
        </Popover>
        {value && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
            onClick={handleClear}
            title="Supprimer l'heure"
          >
            <X className="h-3 w-3" />
          </Button>
        )}
      </div>
    );
  }

  return (
    <Input
      type={inputType}
      value={currentValue}
      onChange={handleChange}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className={INPUT_BASE_CLASS}
    />
  );
};

// Composant d'en-tête sortable
interface SortableHeaderProps {
  id: string;
  column: ColumnConfig;
  sortConfig: { key: keyof Contact | null; direction: SortDirection };
  onSort: (key: keyof Contact) => void;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

const SortableHeader: React.FC<SortableHeaderProps> = ({
  id,
  column,
  sortConfig,
  onSort,
  children,
  style,
}) => {
  const getSortIndicator = () => {
    if (sortConfig.key === column.key && column.canSort) {
      if (sortConfig.direction === 'asc') {
        return <ArrowUp className="w-3 h-3 text-primary" />;
      } else if (sortConfig.direction === 'desc') {
        return <ArrowDown className="w-3 h-3 text-primary" />;
      }
    }
    return column.canSort ? <ArrowUpDown className="w-3 h-3 text-muted-foreground/50" /> : null;
  };

  // CRITICAL: Styles inline pour sticky headers (basé sur React Table docs)
  const getStickyHeaderStyles = (): React.CSSProperties => {
    return {
      position: 'sticky',
      top: 0,
      zIndex: 101,
      backgroundColor: 'hsl(var(--background))',
      backdropFilter: 'blur(8px)',
      WebkitBackdropFilter: 'blur(8px)',
      boxShadow: '0 2px 8px 0 rgb(0 0 0 / 0.1), 0 1px 4px -1px rgb(0 0 0 / 0.1)',
      borderBottom: '1px solid hsl(var(--border))'
    };
  };

  const handleClick = () => {
    if (column.canSort && column.key !== 'actions') {
      onSort(column.key as keyof Contact);
    }
  };

  return (
    <TableHead
      style={{
        ...getStickyHeaderStyles(), // IMPORTANT: Apply sticky styles inline!
      }}
      className={cn(
        "text-foreground h-10 align-middle whitespace-nowrap [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px] px-2 py-1.5 text-left font-medium text-xs select-none",
        column.canSort ? "cursor-pointer hover:bg-muted transition-colors" : "",
      )}
      
      onClick={handleClick}
    >
      <div className="flex items-center gap-1">
        <span className="truncate">{children}</span>
        {getSortIndicator()}
      </div>
    </TableHead>
  );
};

// Composant principal de la table
// Interface pour les méthodes exposées via ref
export interface ContactTableRef {
  scrollToContact: (contactId: string) => void;
}

interface ContactTableProps {
  contacts: Contact[];
  callStates: CallStates;
  onSelectContact: (contact: Contact | null) => void;
  selectedContactId: string | null;
  onUpdateContact: (contact: Partial<Contact> & { id: string }) => void;
  onDeleteContact: (contactId: string) => void;
  activeCallContactId: string | null;
  theme: Theme;
  visibleColumns: Record<string, boolean>;
  columnHeaders: string[];
  contactDataKeys: (keyof Contact | 'actions' | null)[];
  onToggleColumnVisibility: (header: string) => void;
  availableColumns?: string[];
  onFileImport?: (file: File) => Promise<void>;
}

export const ContactTable = forwardRef<ContactTableRef, ContactTableProps>(({
  contacts,
  callStates,
  onSelectContact,
  selectedContactId,
  onUpdateContact,
  onDeleteContact,
  activeCallContactId,
  theme,
  visibleColumns,
  columnHeaders,
  contactDataKeys,
  onToggleColumnVisibility,
  availableColumns = [],
  onFileImport,
}, ref) => {
  const [editingCell, setEditingCell] = useState<{ contactId: string; field: keyof Contact } | null>(null);
  const [editValue, setEditValue] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof Contact | null; direction: SortDirection }>({
    key: null,
    direction: null,
  });

  // Utiliser les colonnes transmises par le parent au lieu du système interne
  const [columnOrder, setColumnOrder] = useState<string[]>([]);
  
  // Créer des configurations de colonnes dynamiques basées sur les props
  const dynamicColumns = useMemo((): ColumnConfig[] => {
    return columnHeaders.map((header, index) => {
      const dataKey = contactDataKeys[index];
      const headerToIdMap: Record<string, string> = {
        '#': 'numeroLigne',
        'Prénom': 'prenom',
        'Nom': 'nom',
        'Téléphone': 'telephone',
        'Mail': 'email',
        'Source': 'source',
        'Statut': 'statut',
        'Commentaire': 'commentaire',
        'Date Rappel': 'dateRappel',
        'Heure Rappel': 'heureRappel',
        'Date RDV': 'dateRDV',
        'Heure RDV': 'heureRDV',
        'Date Appel': 'dateAppel',
        'Heure Appel': 'heureAppel',
        'Durée Appel': 'dureeAppel',
        'Sexe': 'sexe',
        'Don': 'don',
        'Qualité': 'qualite',
        'Type': 'type',
        'Date': 'date',
        'UID': 'uid',
        'Actions': 'actions'
      };

      const iconMap: Record<string, React.ComponentType<any>> = {
        '#': Hash,
        'Prénom': User,
        'Nom': User,
        'Téléphone': Phone,
        'Mail': Mail,
        'Source': FolderOpen,
        'Statut': FileText,
        'Commentaire': MessageCircle,
        'Date Rappel': CalendarIcon,
        'Heure Rappel': Clock,
        'Date RDV': CalendarIcon,
        'Heure RDV': Clock,
        'Date Appel': CalendarIcon,
        'Heure Appel': Clock,
        'Durée Appel': Timer,
        'Sexe': User,
        'Don': User,
        'Qualité': User,
        'Type': User,
        'Date': CalendarIcon,
        'UID': User,
        'Actions': Settings2
      };

      return {
        id: headerToIdMap[header] || header.toLowerCase(),
        key: (dataKey || 'actions') as keyof Contact | 'actions',
        label: header,
        icon: iconMap[header] || FileText,
        width: header === 'Actions' ? '80px' : 'auto',
        minWidth: header === 'Actions' ? '80px' : header === '#' ? '60px' : header.includes('Téléphone') || header.includes('Mail') ? '150px' : '100px',
        canHide: !['#', 'Prénom', 'Nom', 'Actions'].includes(header),
        canSort: header !== 'Actions',
        defaultVisible: true,
      };
    });
  }, [columnHeaders, contactDataKeys]);

  // Initialiser l'ordre des colonnes quand dynamicColumns change
  useEffect(() => {
    if (dynamicColumns.length > 0) {
      setColumnOrder(dynamicColumns.map(col => col.id));
    }
  }, [dynamicColumns]);

  // État pour le drag & drop
  const [draggedColumn, setDraggedColumn] = useState<string | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null);

  // Ref pour le conteneur de scroll
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // États pour le drag & drop
  const [isDragOver, setIsDragOver] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const dropzoneRef = useRef<HTMLDivElement>(null);

  // Gestion du tri
  const handleSort = useCallback((key: keyof Contact) => {
    setSortConfig(current => {
      if (current.key === key) {
        const direction = current.direction === 'asc' ? 'desc' : current.direction === 'desc' ? null : 'asc';
        return { key: direction ? key : null, direction };
      } else {
        return { key, direction: 'asc' };
      }
    });
  }, []);

  // Tri des contacts
  const sortedContacts = useMemo(() => {
    if (!sortConfig.key || !sortConfig.direction) return contacts;

    return [...contacts].sort((a, b) => {
      const aVal = a[sortConfig.key!];
      const bVal = b[sortConfig.key!];

      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;

      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortConfig.direction === 'asc' 
          ? aVal.localeCompare(bVal, 'fr-FR')
          : bVal.localeCompare(aVal, 'fr-FR');
      }

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [contacts, sortConfig]);

  // Fonction de scroll automatique vers un contact
  const scrollToContact = useCallback((contactId: string) => {
    if (!scrollContainerRef.current) return;

    // Essayer d'abord de trouver l'élément DOM directement par l'attribut data-contact-id
    const contactRow = scrollContainerRef.current.querySelector(`[data-contact-id="${contactId}"]`);
    
    if (contactRow) {
      // Utiliser scrollIntoView pour un scroll plus précis
      contactRow.scrollIntoView({
        behavior: 'smooth',
        block: 'center', // Centre la ligne dans la vue
        inline: 'nearest'
      });
    } else {
      // Fallback: utiliser l'ancienne méthode basée sur l'index
      const contactIndex = sortedContacts.findIndex(contact => contact.id === contactId);
      if (contactIndex === -1) return;

      // Calculer la position de la ligne (hauteur estimée par ligne: ~40px)
      const rowHeight = 40;
      const targetPosition = contactIndex * rowHeight;
      
      // Obtenir les dimensions du conteneur
      const container = scrollContainerRef.current;
      const containerHeight = container.clientHeight;
      const scrollTop = container.scrollTop;
      
      // Vérifier si le contact est déjà visible
      const isVisible = targetPosition >= scrollTop && 
                       targetPosition <= scrollTop + containerHeight - rowHeight;
      
      if (!isVisible) {
        // Scroll vers le contact avec un peu de marge pour qu'il soit bien visible
        const margin = 80;
        const scrollPosition = Math.max(0, targetPosition - margin);
        
        container.scrollTo({
          top: scrollPosition,
          behavior: 'smooth'
        });
      }
    }
  }, [sortedContacts]);

  // Exposer la fonction de scroll via ref
  useImperativeHandle(ref, () => ({
    scrollToContact
  }), [scrollToContact]);

  // Scroll automatique quand le contact sélectionné change
  useEffect(() => {
    if (selectedContactId) {
      // Délai pour laisser le temps au DOM de se mettre à jour
      const timeoutId = setTimeout(() => {
        scrollToContact(selectedContactId);
      }, 100);
      
      return () => clearTimeout(timeoutId);
    }
  }, [selectedContactId, scrollToContact]);

  // Gestion de l'édition
  const handleCellDoubleClick = (contactId: string, columnKey: keyof Contact, currentValue: any) => {
    if (columnKey === 'statut') return; // Géré par le select
    setEditingCell({ contactId, field: columnKey });
    setEditValue(currentValue || '');
  };

  const handleEditCommit = () => {
    if (editingCell) {
      onUpdateContact({
        id: editingCell.contactId,
        [editingCell.field]: editValue,
      });
      setEditingCell(null);
      setEditValue('');
    }
  };

  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleEditCommit();
    } else if (e.key === 'Escape') {
      setEditingCell(null);
      setEditValue('');
    }
  };

  // Toggle visibilité des colonnes - maintenant délégué au parent
  const handleToggleColumnVisibility = (columnId: string, visible: boolean) => {
    // Trouver le header correspondant à ce columnId
    const column = dynamicColumns.find(col => col.id === columnId);
    if (column) {
      onToggleColumnVisibility(column.label);
    }
  };

  // Rendu du contenu des cellules
  const renderCellContent = (contact: Contact, column: ColumnConfig) => {
    const columnKey = column.key as keyof Contact;
    
    // Gestion spéciale pour les colonnes virtuelles
    if (column.id === 'index') {
      const index = contacts.findIndex(c => c.id === contact.id) + 1;
      return (
        <span className="cursor-pointer hover:text-primary transition-colors font-medium text-center block">
          {index}
        </span>
      );
    }
    
    if (column.id === 'actions') {
      return (
        <span className="cursor-pointer hover:text-primary transition-colors text-center block">
          {contact.telephone ? formatPhoneNumber(contact.telephone) : 'N/A'}
        </span>
      );
    }

    const value = contact[columnKey];

    switch (columnKey) {
      case 'prenom':
      case 'nom':
        return (
          <span className="cursor-pointer hover:text-primary transition-colors font-medium">
            {value || 'N/A'}
          </span>
        );
        
      case 'telephone':
        return (
          <span className="cursor-pointer hover:text-primary transition-colors font-mono">
            {value ? formatPhoneNumber(value as string) : 'N/A'}
          </span>
        );

      case 'email':
        return (
          <span 
            className="cursor-pointer hover:text-primary transition-colors truncate" 
            title={value as string}
          >
            {value || 'N/A'}
          </span>
        );

      case 'source':
        return (
          <span className="cursor-pointer hover:text-primary transition-colors">
            {value || 'N/A'}
          </span>
        );

      case 'statut':
        const currentStatus = (value as ContactStatus) || 'Non défini';
        return (
          <StatusComboBox
            value={currentStatus}
            onChange={(newStatus) => {
              onUpdateContact({
                id: contact.id,
                statut: newStatus
              });
            }}
            theme={theme}
          />
        );

      case 'commentaire':
        return (
          <CommentWidget
            value={(value as string) || ''}
            onChange={(newComment) => {
              onUpdateContact({
                id: contact.id,
                commentaire: newComment
              });
            }}
            theme={theme}
          />
        );

      case 'dateRappel':
      case 'dateRDV':
      case 'dateAppel':
        return (
          <DateTimeCell
            value={(value as string) || ''}
            type="date"
            onChange={(newDate) => {
              onUpdateContact({
                id: contact.id,
                [columnKey]: newDate
              });
            }}
            theme={theme}
          />
        );

      case 'heureRappel':
      case 'heureRDV':
      case 'heureAppel':
        return (
          <DateTimeCell
            value={(value as string) || ''}
            type="time"
            onChange={(newTime) => {
              onUpdateContact({
                id: contact.id,
                [columnKey]: newTime
              });
            }}
            theme={theme}
          />
        );

      case 'dureeAppel':
        return (
          <span className="cursor-pointer hover:text-primary transition-colors text-center block">
            {value || 'N/A'}
          </span>
        );

      default:
        return (
          <span className="cursor-pointer hover:text-primary transition-colors">
            {value || 'N/A'}
          </span>
        );
    }
  };

  // Colonnes visibles basées sur les props du parent
  const visibleOrderedColumns = useMemo(() => {
    const result = columnOrder
      .map(id => dynamicColumns.find(col => col.id === id))
      .filter((col): col is ColumnConfig => {
        if (!col) return false;
        // Utiliser visibleColumns depuis les props pour déterminer la visibilité
        return visibleColumns[col.label] !== false;
      });
    
    // Debug temporaire
    if (result.length !== columnOrder.length) {
      console.log('🔧 Colonnes filtrées:', {
        'Toutes colonnes': dynamicColumns.map(c => c.label),
        'Visibilité': visibleColumns,
        'Colonnes affichées': result.map(c => c.label)
      });
    }
    
    return result;
  }, [columnOrder, dynamicColumns, visibleColumns]);
  
  const visibleColumnsCount = visibleOrderedColumns.length;

  // Gestionnaires drag & drop
  const handleDragStart = (e: React.DragEvent, columnId: string) => {
    setDraggedColumn(columnId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', columnId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnter = (e: React.DragEvent, columnId: string) => {
    e.preventDefault();
    setDragOverColumn(columnId);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Ne reset que si on quitte vraiment l'élément (pas ses enfants)
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragOverColumn(null);
    }
  };

  const handleDrop = (e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault();
    
    if (!draggedColumn || draggedColumn === targetColumnId) {
      setDraggedColumn(null);
      setDragOverColumn(null);
      return;
    }

    const newOrder = [...columnOrder];
    const draggedIndex = newOrder.indexOf(draggedColumn);
    const targetIndex = newOrder.indexOf(targetColumnId);

    // Retirer l'élément de sa position actuelle
    newOrder.splice(draggedIndex, 1);
    // L'insérer à la nouvelle position
    newOrder.splice(targetIndex, 0, draggedColumn);

    setColumnOrder(newOrder);
    setDraggedColumn(null);
    setDragOverColumn(null);
  };

  const handleDragEnd = () => {
    setDraggedColumn(null);
    setDragOverColumn(null);
  };

  // Gestionnaires drag & drop pour les fichiers
  const handleFileDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.types.includes('Files')) {
      setIsDragActive(true);
      setIsDragOver(true);
    }
  }, []);

  const handleFileDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Ne réinitialiser que si on quitte vraiment la zone de drop
    if (!dropzoneRef.current?.contains(e.relatedTarget as Node)) {
      setIsDragOver(false);
      if (!isProcessing) {
        setIsDragActive(false);
      }
    }
  }, [isProcessing]);

  const handleFileDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer.types.includes('Files')) {
      e.dataTransfer.dropEffect = 'copy';
      setIsDragOver(true);
    }
  }, []);

  const handleFileDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsDragOver(false);
    setIsDragActive(false);
    
    if (!onFileImport) return;
    
    const files = Array.from(e.dataTransfer.files);
    const validFiles = files.filter(file => {
      const extension = file.name.split('.').pop()?.toLowerCase();
      return ['csv', 'xlsx', 'xls', 'tsv'].includes(extension || '');
    });
    
    if (validFiles.length === 0) {
      // Notification d'erreur pour format invalide
      return;
    }
    
    const file = validFiles[0]; // Prendre le premier fichier valide
    
    try {
      setIsProcessing(true);
      await onFileImport(file);
    } catch (error) {
      console.error('Erreur lors de l\'import:', error);
    } finally {
      setIsProcessing(false);
      setIsDragActive(false);
    }
  }, [onFileImport]);

  // Composant d'état vide moderne avec Framer Motion
  const EmptyState = () => (
    <div className="absolute inset-0 flex items-center justify-center">
      <motion.div 
        className="text-center space-y-6 p-8 max-w-md mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        {/* Animation de l'icône principale avec glow effect */}
        <div className="relative">
          <motion.div 
            className="absolute inset-0 w-24 h-24 mx-auto rounded-full bg-gradient-to-r from-blue-500/20 to-purple-600/20"
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.3, 0.6, 0.3] 
            }}
            transition={{ 
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut" 
            }}
          />
          <motion.div 
            className="relative w-24 h-24 mx-auto rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center shadow-lg"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <motion.div
              animate={{ rotate: [0, 5, 0, -5, 0] }}
              transition={{ 
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut" 
              }}
            >
              <Users className="w-12 h-12 text-white" />
            </motion.div>
          </motion.div>
        </div>
        
        {/* Titre avec gradient et animation */}
        <motion.div 
          className="space-y-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <motion.h3 
            className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent"
            initial={{ y: 10 }}
            animate={{ y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
          >
            Aucun contact pour le moment
          </motion.h3>
          <motion.p 
            className="text-muted-foreground text-lg"
            initial={{ y: 10 }}
            animate={{ y: 0 }}
            transition={{ delay: 0.4, duration: 0.4 }}
          >
            Commencez par importer vos contacts
          </motion.p>
        </motion.div>
        
        {/* Instructions avec icônes animées */}
        <motion.div 
          className="space-y-4 text-sm text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <motion.div 
            className="flex items-center justify-center gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <motion.div
              animate={{ y: [0, -3, 0] }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut" 
              }}
            >
              <CloudUpload className="w-5 h-5 text-blue-500" />
            </motion.div>
            <span>Glissez-déposez vos fichiers ici</span>
          </motion.div>
          
          <div className="grid grid-cols-2 gap-3">
            <motion.div 
              className="flex items-center gap-2 p-2 rounded bg-green-500/10 text-green-700 dark:text-green-400"
              whileHover={{ scale: 1.02 }}
              initial={{ x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.3 }}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span className="text-xs">Excel (.xlsx)</span>
            </motion.div>
            <motion.div 
              className="flex items-center gap-2 p-2 rounded bg-blue-500/10 text-blue-700 dark:text-blue-400"
              whileHover={{ scale: 1.02 }}
              initial={{ x: 10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.7, duration: 0.3 }}
            >
              <FileText className="w-4 h-4" />
              <span className="text-xs">CSV / TSV</span>
            </motion.div>
          </div>
        </motion.div>
        
        {/* Éléments décoratifs modernes et sobres */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
          {/* Cercles flottants sobres */}
          <motion.div 
            className="absolute top-10 left-10 w-2 h-2 bg-blue-400/40 rounded-full"
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.4, 0.8, 0.4] 
            }}
            transition={{ 
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0 
            }}
          />
          <motion.div 
            className="absolute top-20 right-20 w-1 h-1 bg-purple-400/50 rounded-full"
            animate={{ 
              scale: [1, 1.5, 1],
              opacity: [0.3, 0.7, 0.3] 
            }}
            transition={{ 
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.5 
            }}
          />
          <motion.div 
            className="absolute bottom-20 left-16 w-1.5 h-1.5 bg-indigo-400/40 rounded-full"
            animate={{ 
              scale: [1, 1.3, 1],
              opacity: [0.5, 0.9, 0.5] 
            }}
            transition={{ 
              duration: 3.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1 
            }}
          />
          
          {/* Lignes subtiles animées */}
          <motion.div 
            className="absolute bottom-32 right-12 w-8 h-0.5 bg-gradient-to-r from-transparent via-cyan-400/30 to-transparent"
            animate={{ 
              scaleX: [0, 1, 0],
              opacity: [0, 0.6, 0] 
            }}
            transition={{ 
              duration: 4,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1.5 
            }}
          />
          
          <motion.div 
            className="absolute top-32 right-32 w-0.5 h-6 bg-gradient-to-b from-transparent via-violet-400/30 to-transparent"
            animate={{ 
              scaleY: [0, 1, 0],
              opacity: [0, 0.5, 0] 
            }}
            transition={{ 
              duration: 3.8,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2 
            }}
          />
        </div>
      </motion.div>
    </div>
  );

  // Overlay de drag & drop amélioré avec Framer Motion
  const DragOverlay = ({ isDragOver }: { isDragOver: boolean }) => (
    <AnimatePresence>
      {isDragOver && (
        <motion.div 
          className="absolute inset-0 z-50 flex items-center justify-center"
          style={{
            background: "rgba(59, 130, 246, 0.05)",
            backdropFilter: "blur(8px)",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <motion.div 
            className="text-center space-y-6 p-8"
            initial={{ scale: 0.8, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: -20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            {/* Animation de drop zone fluide */}
            <div className="relative">
              <motion.div 
                className="absolute inset-0 w-32 h-32 mx-auto rounded-full border-4 border-blue-500/30"
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: [0, 180, 360] 
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "linear" 
                }}
              />
              <motion.div 
                className="relative w-32 h-32 mx-auto rounded-full border-4 border-dashed border-blue-500 bg-blue-500/10 flex items-center justify-center"
                animate={{ scale: [0.9, 1.1, 0.9] }}
                transition={{ 
                  duration: 1.5,
                  repeat: Infinity,
                  ease: "easeInOut" 
                }}
              >
                <motion.div
                  animate={{ y: [0, -8, 0] }}
                  transition={{ 
                    duration: 1.2,
                    repeat: Infinity,
                    ease: "easeInOut" 
                  }}
                >
                  <Upload className="w-16 h-16 text-blue-500" />
                </motion.div>
              </motion.div>
            </div>
            
            <motion.div 
              className="space-y-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <motion.h3 
                className="text-3xl font-bold text-blue-600"
                animate={{ scale: [1, 1.02, 1] }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  ease: "easeInOut" 
                }}
              >
                Relâchez pour importer
              </motion.h3>
              <motion.p 
                className="text-xl text-blue-500/80"
                initial={{ y: 5 }}
                animate={{ y: 0 }}
                transition={{ delay: 0.2 }}
              >
                Vos contacts seront ajoutés automatiquement
              </motion.p>
            </motion.div>
            
            {/* Particules modernes et sobres */}
            <div className="absolute inset-0 pointer-events-none">
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-1 h-1 bg-blue-400/60 rounded-full"
                  style={{
                    left: `${20 + (i * 12)}%`,
                    top: `${15 + (i % 3) * 25}%`,
                  }}
                  animate={{
                    scale: [0, 1, 0],
                    opacity: [0, 0.8, 0],
                    y: [0, -20, 0]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    delay: i * 0.3,
                    ease: "easeInOut"
                  }}
                />
              ))}
              
              {/* Lignes géométriques animées */}
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={`line-${i}`}
                  className="absolute w-6 h-0.5 bg-blue-400/40"
                  style={{
                    left: `${15 + (i * 25)}%`,
                    top: `${20 + (i * 20)}%`,
                    transformOrigin: 'center'
                  }}
                  animate={{
                    scaleX: [0, 1, 0],
                    opacity: [0, 0.6, 0],
                    rotate: [0, 90, 0]
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    delay: i * 0.5,
                    ease: "easeInOut"
                  }}
                />
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="contact-table-container space-y-4">
      {/* Table unique avec en-tête sticky pour alignement correct */}
      <div className="border rounded-lg overflow-hidden relative">
        <motion.div
          ref={dropzoneRef}
          className={cn(
            "h-[800px] overflow-auto scrollbar-hidden relative bg-background transition-all duration-300",
            isDragActive && "ring-2 ring-blue-500 ring-offset-2"
          )}
          onDragEnter={handleFileDragEnter}
          onDragLeave={handleFileDragLeave}
          onDragOver={handleFileDragOver}
          onDrop={handleFileDrop}
          animate={{
            scale: isDragActive ? 1.02 : 1
          }}
          transition={{ 
            type: "spring", 
            stiffness: 300, 
            damping: 30 
          }}
        >
          {/* État vide ou table */}
          <AnimatePresence mode="wait">
            {contacts.length === 0 ? (
              <EmptyState key="empty" />
            ) : (
              <motion.div
                key="table"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Table className="relative w-full table-auto" style={{ borderCollapse: 'separate', borderSpacing: 0 }}>
                  {/* En-tête sticky */}
                  <TableHeader className="sticky top-0 z-[101] bg-background">
                    <TableRow className="hover:bg-transparent border-b">
                       {visibleOrderedColumns.map((column, index) => (
                          <TableHead
                            key={column.id}
                            draggable
                            onDragStart={(e) => handleDragStart(e, column.id)}
                            onDragOver={handleDragOver}
                            onDragEnter={(e) => handleDragEnter(e, column.id)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, column.id)}
                            onDragEnd={handleDragEnd}
                            className={cn(
                              "text-foreground h-10 align-middle whitespace-nowrap px-2 py-1.5 text-center font-medium text-xs select-none transition-all duration-200",
                              column.canSort ? "cursor-pointer hover:bg-muted" : "",
                              draggedColumn === column.id && "opacity-50 scale-95",
                              dragOverColumn === column.id && "border-l-4 border-l-primary bg-primary/10",
                              "cursor-grab active:cursor-grabbing"
                            )}
                            style={{ 
                              width: column.width,
                              minWidth: column.minWidth,
                              background: 'hsl(var(--background))',
                              backdropFilter: 'blur(8px)',
                              boxShadow: 'rgba(0, 0, 0, 0.1) 0px 2px 8px 0px, rgba(0, 0, 0, 0.1) 0px 1px 4px -1px',
                              borderBottom: '1px solid hsl(var(--border))'
                            }}
                            onClick={(e) => {
                              // Empêcher le tri si on est en train de drag
                              if (!draggedColumn && column.canSort) {
                                handleSort(column.key as keyof Contact);
                              }
                            }}
                          >
                            <div className="flex items-center justify-center gap-1">
                              <GripVertical className="w-3 h-3 text-muted-foreground/50 hover:text-muted-foreground transition-colors" />
                              <span className="truncate flex-1 text-center">{column.label}</span>
                              {column.canSort && sortConfig.key === column.key && (
                                <>
                                  {sortConfig.direction === 'asc' && <ArrowUp className="w-3 h-3 text-muted-foreground/50" />}
                                  {sortConfig.direction === 'desc' && <ArrowDown className="w-3 h-3 text-muted-foreground/50" />}
                                  {!sortConfig.direction && <ArrowUpDown className="w-3 h-3 text-muted-foreground/50" />}
                                </>
                              )}
                              {column.canSort && sortConfig.key !== column.key && (
                                <ArrowUpDown className="w-3 h-3 text-muted-foreground/50" />
                              )}
                            </div>
                          </TableHead>
                       ))}
                      </TableRow>
                  </TableHeader>
                  
                  {/* Corps du tableau */}
                  <TableBody>
                    {sortedContacts.map((contact, contactIndex) => {
                      const isSelected = selectedContactId === contact.id;
                      const callState = callStates[contact.id];
                      const isActiveCall = activeCallContactId === contact.id;

                      return (
                        <motion.tr
                          key={contact.id}
                          data-contact-id={contact.id}
                          className={cn(
                            "hover:bg-muted/50 cursor-pointer transition-none",
                            isSelected && "bg-blue-100 dark:bg-blue-900/50 hover:bg-blue-200 dark:hover:bg-blue-900/60",
                            isActiveCall && "bg-green-100 dark:bg-green-900/20 hover:bg-green-200 dark:hover:bg-green-900/30"
                          )}
                          onClick={() => onSelectContact(contact)}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ 
                            duration: 0.2,
                            delay: contactIndex * 0.01 // Stagger effect
                          }}
                          whileHover={{ 
                            backgroundColor: isSelected 
                              ? "rgba(59, 130, 246, 0.2)" 
                              : "rgba(0, 0, 0, 0.05)"
                          }}
                        >
                         {visibleOrderedColumns.map(column => (
                            <TableCell
                              key={column.id}
                              className={cn(
                                "px-2 py-1.5 text-xs text-center align-middle",
                                column.minWidth && `min-w-[${column.minWidth}]`
                              )}
                              style={{ 
                                width: column.width,
                                minWidth: column.minWidth
                              }}
                            >
                              <div className="flex items-center justify-center min-h-[32px]">
                                {renderCellContent(contact, column)}
                              </div>
                            </TableCell>
                         ))}
                        </motion.tr>
                      );
                    })}
                  </TableBody>
                </Table>
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Overlay de drag & drop */}
          <DragOverlay isDragOver={isDragOver} />
        </motion.div>
      </div>
    </div>
  );
});

ContactTable.displayName = 'ContactTable';

