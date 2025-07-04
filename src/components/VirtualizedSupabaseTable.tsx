import React, { useMemo, useRef, useEffect, useState } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Theme, Contact, CallStates, ContactStatus } from '../types';
import { STATUS_COLORS } from '../constants';
import { useSupabaseAuth } from '../lib/auth-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
// import { Checkbox } from './ui/checkbox'; // N'existe pas encore, on utilisera input type="checkbox"
import { 
  User as IconUser, 
  Phone as IconPhone, 
  Mail as IconMail, 
  MessageSquare as IconComment,
  Calendar as IconCalendar,
  Clock as IconClock,
  Activity as IconStatus,
  Trash as IconTrash,
  Zap as IconZap,
  Timer as IconDuration,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Check,
  X,
  Edit
} from 'lucide-react';
import { supabaseService } from '../services/supabaseService';

interface VirtualizedSupabaseTableProps {
  rawData: any[];
  columns: string[];
  callStates: CallStates;
  onSelectContact: (contact: Contact | null) => void;
  selectedContactId: string | null;
  onUpdateContact: (contact: Partial<Contact> & { id: string }) => void;
  onUpdateRawData?: (id: string, fieldName: string, newValue: any) => void;
  onDeleteContact: (contactId: string) => void;
  activeCallContactId: string | null;
  theme: Theme;
  visibleColumns: Record<string, boolean>;
  height?: number;
  onSort?: (columnKey: string) => void;
  sortConfig?: { key: string | null; direction: 'asc' | 'desc' | null };
  onDragStart?: (columnId: string) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragEnter?: (columnId: string) => void;
  onDragLeave?: () => void;
  onDrop?: (columnId: string) => void;
  onDragEnd?: () => void;
  draggedColumn?: string | null;
  dragOverColumn?: string | null;
  showNotification?: (type: 'success' | 'error' | 'info', message: string, duration?: number) => void;
  // Props pour la sélection de lignes
  enableRowSelection?: boolean;
  rowSelection?: Record<string, boolean>;
  onRowSelectionChange?: (rowId: string, isSelected: boolean, event?: React.MouseEvent) => void;
  onSelectAll?: (isSelected: boolean) => void;
}

// État pour l'édition des cellules
interface EditingCell {
  rowId: string;
  column: string;
  value: string;
  originalValue: string;
}

export const VirtualizedSupabaseTable: React.FC<VirtualizedSupabaseTableProps> = ({
  rawData,
  columns,
  callStates,
  onSelectContact,
  selectedContactId,
  onUpdateContact,
  onUpdateRawData,
  onDeleteContact,
  activeCallContactId,
  theme,
  visibleColumns,
  height = 600,
  onSort,
  sortConfig,
  onDragStart,
  onDragOver,
  onDragEnter,
  onDragLeave,
  onDrop,
  onDragEnd,
  draggedColumn,
  dragOverColumn,
  showNotification,
  // Props de sélection
  enableRowSelection = false,
  rowSelection = {},
  onRowSelectionChange,
  onSelectAll,
}) => {
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  
  // Hook d'authentification pour récupérer l'utilisateur connecté
  const auth = useSupabaseAuth();
  
  // État pour l'édition des cellules
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);



  // Synchroniser le scroll horizontal entre l'en-tête et le contenu
  useEffect(() => {
    const tableContainer = tableContainerRef.current;
    const header = headerRef.current;

    if (!tableContainer || !header) return;

    const handleScroll = () => {
      header.scrollLeft = tableContainer.scrollLeft;
    };

    tableContainer.addEventListener('scroll', handleScroll);
    return () => tableContainer.removeEventListener('scroll', handleScroll);
  }, []);

  // Fonction pour démarrer l'édition d'une cellule
  const startEditing = (rowId: string, column: string, currentValue: any) => {
    // Ne pas éditer certaines colonnes
    if (column === 'UID' || column === 'Actions') return;
    
    const stringValue = String(currentValue || '');
    setEditingCell({
      rowId,
      column,
      value: stringValue,
      originalValue: stringValue
    });
  };

  // Fonction pour sauvegarder les changements
  const saveEdit = async () => {
    if (!editingCell) return;

    const { rowId, column, value, originalValue } = editingCell;
    
    // Si la valeur n'a pas changé, on annule l'édition
    if (value === originalValue) {
      setEditingCell(null);
      return;
    }

    setIsUpdating(true);
    
    try {
      // Mettre à jour via Supabase en utilisant la méthode pour champs bruts
      await supabaseService.updateRawField(rowId, column, value);
      
      // Mettre à jour l'affichage local immédiatement
      if (onUpdateRawData) {
        onUpdateRawData(rowId, column, value);
      } else {
        // Fallback vers la méthode classique si onUpdateRawData n'est pas disponible
        onUpdateContact({ id: rowId, [column]: value });
      }
      
      // Afficher une notification de succès
      showNotification?.('success', `✅ ${column}: "${value}" sauvegardé`, 2000);
      

    } catch (error) {
      console.error('❌ Erreur lors de la mise à jour:', error);
      
      // Afficher une notification d'erreur
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      showNotification?.('error', `❌ Erreur: ${errorMessage}`, 4000);
      
      // En cas d'erreur, remettre la valeur originale
      setEditingCell(prev => prev ? { ...prev, value: originalValue } : null);
    } finally {
      setIsUpdating(false);
      setEditingCell(null);
    }
  };

  // Fonction pour annuler l'édition
  const cancelEdit = () => {
    setEditingCell(null);
  };

  // Fonction pour gérer les touches du clavier pendant l'édition
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      saveEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEdit();
    }
  };

  // Déterminer si une colonne est éditable
  const isColumnEditable = (column: string): boolean => {
    // Liste des colonnes non éditables
    const nonEditableColumns = ['UID', 'Actions', 'created_at', 'updated_at', 'Utilisateur', 'utilisateur'];
    return !nonEditableColumns.includes(column);
  };

  // Ordre prioritaire des colonnes
  const priorityColumnOrder = [
    'UID',
    'prenom', 
    'nom',
    'Utilisateur',
    'utilisateur',
    'numero',
    'mail',
    'statut_final',
    'source',
    'type',
    'date_rappel',
    'heure_rappel',
    'sexe',
    'don',
    'qualite',
    'date_appel_1',
    'statut_appel_1', 
    'commentaires_appel_1',
    'date_appel_2',
    'statut_appel_2',
    'commentaires_appel_2',
    'date_appel_3',
    'statut_appel_3',
    'commentaires_appel_3',
    'date_appel_4',
    'statut_appel_4',
    'commentaires_appel_4',
    'date_r0_1',
    'type_r0_1',
    'statut_r0_1',
    'commentaires_r0_1',
    'date_r0_2',
    'type_r0_2',
    'statut_r0_2',
    'commentaires_r0_2',
    'date_r0_3',
    'type_r0_3',
    'statut_r0_3',
    'commentaires_r0_3',
    'date_r1_1',
    'type_r1_1',
    'statut_r1_1',
    'commentaires_r1_1',
    'date_r1_2',
    'type_r1_2',
    'statut_r1_2',
    'commentaires_r1_2',
    'date_r1_3',
    'type_r1_3',
    'statut_r1_3',
    'commentaires_r1_3',
    'date_r2_1',
    'type_r2_1',
    'statut_r2_1',
    'commentaires_r2_1',
    'date_r2_2',
    'type_r2_2',
    'statut_r2_2',
    'commentaires_r2_2',
    'date_r2_3',
    'type_r2_3',
    'statut_r2_3',
    'commentaires_r2_3',
    'Nu'
  ];

  // Colonnes visibles et ordonnées selon la priorité définie
  const visibleDataColumns = useMemo(() => {
    // D'abord, récupérer toutes les colonnes visibles
    const visibleCols = columns.filter(col => visibleColumns[col]);
    
    // Ensuite, les trier selon l'ordre de priorité
    const sortedColumns = [...visibleCols].sort((a, b) => {
      const indexA = priorityColumnOrder.indexOf(a);
      const indexB = priorityColumnOrder.indexOf(b);
      
      // Si les deux colonnes sont dans la liste de priorité, utiliser cet ordre
      if (indexA !== -1 && indexB !== -1) {
        return indexA - indexB;
      }
      
      // Si seulement A est dans la liste de priorité, A vient en premier
      if (indexA !== -1) return -1;
      
      // Si seulement B est dans la liste de priorité, B vient en premier
      if (indexB !== -1) return 1;
      
      // Si aucune des deux n'est dans la liste, garder l'ordre original
      return visibleCols.indexOf(a) - visibleCols.indexOf(b);
    });
    
    return sortedColumns;
  }, [columns, visibleColumns]);

  // Toutes les colonnes incluant la colonne de sélection si activée
  const allColumns = useMemo(() => {
    const cols = [...visibleDataColumns];
    if (enableRowSelection) {
      cols.unshift('__SELECT__'); // Ajouter la colonne de sélection en première position
    }
    return cols;
  }, [visibleDataColumns, enableRowSelection]);

  // Configuration du virtualizer
  const rowVirtualizer = useVirtualizer({
    count: rawData.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 50,
    overscan: 10,
  });

  // Conversion d'un contact raw en Contact
  const convertToContact = (rawContact: any, index: number): Contact => {
    // Récupérer l'utilisateur connecté
        const nomUtilisateur = auth.user?.email || 'Utilisateur inconnu';

    return {
      id: rawContact.UID || rawContact.id || `temp-${index}`,
      numeroLigne: index + 1,
      prenom: rawContact.prenom || '',
      nom: rawContact.nom || '',
      telephone: rawContact.numero || rawContact.telephone || '',
      email: rawContact.mail || rawContact.email || '',
      statut: rawContact.statut_final || rawContact.statut || ContactStatus.NonDefini,
      commentaire: rawContact.commentaires_appel_1 || rawContact.commentaire || '',
      dateRappel: rawContact.date_rappel || '',
      heureRappel: rawContact.heure_rappel || '',
      dateRDV: rawContact.date_rdv || '',
      heureRDV: rawContact.heure_rdv || '',
      dateAppel: rawContact.date_appel_1 || rawContact.date_appel || '',
      heureAppel: rawContact.heure_appel || '',
      dureeAppel: rawContact.duree_appel || '',
      sexe: rawContact.sexe || '',
      source: rawContact.source || '',
      type: rawContact.type || '',
      don: rawContact.don || '',
      qualite: rawContact.qualite || '',
      uid: rawContact.UID || rawContact.uid || '',
      uid_supabase: rawContact.id?.toString() || '',
      utilisateur: nomUtilisateur // Ajouter l'utilisateur connecté
    };
  };

  // Icône pour les colonnes
  const getColumnIcon = (columnName: string): React.ReactNode => {
    const iconMap: Record<string, React.ReactNode> = {
      prenom: <IconUser className="w-3.5 h-3.5" />,
      nom: <IconUser className="w-3.5 h-3.5" />,
      numero: <IconPhone className="w-3.5 h-3.5" />,
      telephone: <IconPhone className="w-3.5 h-3.5" />,
      mail: <IconMail className="w-3.5 h-3.5" />,
      email: <IconMail className="w-3.5 h-3.5" />,
      statut: <IconStatus className="w-3.5 h-3.5" />,
      statut_final: <IconStatus className="w-3.5 h-3.5" />,
      commentaire: <IconComment className="w-3.5 h-3.5" />,
      commentaires_appel_1: <IconComment className="w-3.5 h-3.5" />,
      utilisateur: <IconUser className="w-3.5 h-3.5" />,
      Utilisateur: <IconUser className="w-3.5 h-3.5" />,

    };
    return iconMap[columnName] || <IconZap className="w-3.5 h-3.5" />;
  };

  // Auto-sizing des colonnes basé sur le contenu
  const getOptimalColumnWidth = useMemo(() => {
    const columnWidths: Record<string, number> = {};
    
    // Largeurs minimales et maximales par type de colonne
    const columnSpecs: Record<string, { min: number; max: number; base: number }> = {
      // Colonnes de noms/identité
      prenom: { min: 100, max: 200, base: 120 },
      nom: { min: 100, max: 200, base: 120 },
      utilisateur: { min: 120, max: 220, base: 150 },
      Utilisateur: { min: 120, max: 220, base: 150 },
      
      // Colonnes de contact
      numero: { min: 120, max: 180, base: 140 },
      telephone: { min: 120, max: 180, base: 140 },
      mail: { min: 150, max: 300, base: 200 },
      email: { min: 150, max: 300, base: 200 },
      
      // Colonnes de dates
      date_rappel: { min: 100, max: 150, base: 120 },
      heure_rappel: { min: 80, max: 120, base: 100 },
      date_appel_1: { min: 100, max: 150, base: 120 },
      date_appel_2: { min: 100, max: 150, base: 120 },
      date_appel_3: { min: 100, max: 150, base: 120 },
      date_appel_4: { min: 100, max: 150, base: 120 },
      date_r0_1: { min: 100, max: 150, base: 120 },
      date_r0_2: { min: 100, max: 150, base: 120 },
      date_r0_3: { min: 100, max: 150, base: 120 },
      date_r1_1: { min: 100, max: 150, base: 120 },
      date_r1_2: { min: 100, max: 150, base: 120 },
      date_r1_3: { min: 100, max: 150, base: 120 },
      date_r2_1: { min: 100, max: 150, base: 120 },
      date_r2_2: { min: 100, max: 150, base: 120 },
      date_r2_3: { min: 100, max: 150, base: 120 },
      
      // Colonnes de statuts (plus courtes)
      statut: { min: 90, max: 140, base: 110 },
      statut_final: { min: 90, max: 140, base: 110 },
      statut_appel_1: { min: 90, max: 140, base: 110 },
      statut_appel_2: { min: 90, max: 140, base: 110 },
      statut_appel_3: { min: 90, max: 140, base: 110 },
      statut_appel_4: { min: 90, max: 140, base: 110 },
      statut_r0_1: { min: 90, max: 140, base: 110 },
      statut_r0_2: { min: 90, max: 140, base: 110 },
      statut_r0_3: { min: 90, max: 140, base: 110 },
      statut_r1_1: { min: 90, max: 140, base: 110 },
      statut_r1_2: { min: 90, max: 140, base: 110 },
      statut_r1_3: { min: 90, max: 140, base: 110 },
      statut_r2_1: { min: 90, max: 140, base: 110 },
      statut_r2_2: { min: 90, max: 140, base: 110 },
      statut_r2_3: { min: 90, max: 140, base: 110 },
      
      // Colonnes de commentaires (plus larges)
      commentaires_appel_1: { min: 200, max: 400, base: 250 },
      commentaires_appel_2: { min: 200, max: 400, base: 250 },
      commentaires_appel_3: { min: 200, max: 400, base: 250 },
      commentaires_appel_4: { min: 200, max: 400, base: 250 },
      commentaires_r0_1: { min: 200, max: 400, base: 250 },
      commentaires_r0_2: { min: 200, max: 400, base: 250 },
      commentaires_r0_3: { min: 200, max: 400, base: 250 },
      commentaires_r1_1: { min: 200, max: 400, base: 250 },
      commentaires_r1_2: { min: 200, max: 400, base: 250 },
      commentaires_r1_3: { min: 200, max: 400, base: 250 },
      commentaires_r2_1: { min: 200, max: 400, base: 250 },
      commentaires_r2_2: { min: 200, max: 400, base: 250 },
      commentaires_r2_3: { min: 200, max: 400, base: 250 },
      
      // Colonnes courtes
      sexe: { min: 60, max: 90, base: 75 },
      source: { min: 80, max: 120, base: 100 },
      type: { min: 80, max: 120, base: 100 },
      don: { min: 60, max: 100, base: 80 },
      qualite: { min: 80, max: 120, base: 100 },
      
      // Colonnes IDs
      Nu: { min: 60, max: 100, base: 80 },
      UID: { min: 80, max: 120, base: 100 },
      
      // Types
      type_r0_1: { min: 80, max: 120, base: 100 },
      type_r0_2: { min: 80, max: 120, base: 100 },
      type_r0_3: { min: 80, max: 120, base: 100 },
      type_r1_1: { min: 80, max: 120, base: 100 },
      type_r1_2: { min: 80, max: 120, base: 100 },
      type_r1_3: { min: 80, max: 120, base: 100 },
      type_r2_1: { min: 80, max: 120, base: 100 },
      type_r2_2: { min: 80, max: 120, base: 100 },
      type_r2_3: { min: 80, max: 120, base: 100 },
    };

    // Calculer la largeur optimale pour chaque colonne visible
    visibleDataColumns.forEach(column => {
      const spec = columnSpecs[column] || { min: 120, max: 200, base: 150 };
      
      if (rawData.length > 0) {
        // Analyser les 50 premières lignes pour estimer la largeur
        const sampleSize = Math.min(50, rawData.length);
        let maxLength = column.length; // Commencer par la largeur du header
        
        for (let i = 0; i < sampleSize; i++) {
          const value = String(rawData[i][column] || '');
          maxLength = Math.max(maxLength, value.length);
        }
        
        // Convertir la longueur de caractères en pixels (approximation)
        // ~8px par caractère + padding + icônes
        const estimatedWidth = Math.max(
          spec.min,
          Math.min(spec.max, maxLength * 8 + 60)
        );
        
        columnWidths[column] = estimatedWidth;
      } else {
        columnWidths[column] = spec.base;
      }
    });

    return columnWidths;
  }, [visibleDataColumns, rawData]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* En-têtes de colonnes */}
      <div 
        ref={headerRef}
        className={`
          flex border-b-2 font-medium text-sm min-h-[50px] flex-shrink-0 overflow-hidden
          ${theme === Theme.Dark 
            ? 'bg-oled-surface border-oled-border text-oled-text' 
            : 'bg-light-surface border-light-border text-light-text'
          }
        `}
      >
        {allColumns.map((column) => {
          // Gestion spéciale pour la colonne de sélection
          if (column === '__SELECT__') {
            const allSelected = rawData.length > 0 && rawData.every(item => {
              const itemId = String(item.id || item.UID);
              return rowSelection[itemId];
            });
            const someSelected = rawData.some(item => {
              const itemId = String(item.id || item.UID);
              return rowSelection[itemId];
            });
            
            return (
              <div 
                key={`header-select`}
                style={{ width: '50px' }}
                className={`
                  px-3 py-3 flex items-center justify-center border-r flex-shrink-0
                  ${theme === Theme.Dark ? 'border-oled-border' : 'border-light-border'}
                `}
              >
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = someSelected && !allSelected;
                  }}
                  onChange={(e) => onSelectAll?.(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
              </div>
            );
          }
          
          // Gestion normale pour les autres colonnes
          const isBeingDragged = draggedColumn === column;
          const isDraggedOver = dragOverColumn === column;
          const currentSortDirection = sortConfig?.key === column ? sortConfig.direction : null;
          
          return (
            <div 
              key={`header-${column}`}
              draggable={!!onDragStart}
              onDragStart={() => onDragStart?.(column)}
              onDragOver={onDragOver}
              onDragEnter={() => onDragEnter?.(column)}
              onDragLeave={onDragLeave}
              onDrop={() => onDrop?.(column)}
              onDragEnd={onDragEnd}
              onClick={() => onSort?.(column)}
              style={{ width: `${getOptimalColumnWidth[column] || 120}px` }}
              className={`
                px-3 py-3 flex items-center gap-2 cursor-pointer border-r flex-shrink-0
                transition-all duration-200
                ${isBeingDragged ? 'opacity-50 bg-blue-100 dark:bg-blue-900/30' : ''}
                ${isDraggedOver ? 'bg-blue-200 dark:bg-blue-800/50 border-l-2 border-blue-500' : ''}
                ${onSort ? 'hover:bg-gray-100 dark:hover:bg-gray-800/50' : ''}
                ${theme === Theme.Dark ? 'border-oled-border' : 'border-light-border'}
              `}
            >
              {getColumnIcon(column)}
              <span className="truncate font-medium">{column}</span>
              {onSort && (
                <div className="ml-auto">
                  {currentSortDirection === 'asc' && <ArrowUp className="w-3 h-3" />}
                  {currentSortDirection === 'desc' && <ArrowDown className="w-3 h-3" />}
                  {!currentSortDirection && <ArrowUpDown className="w-3 h-3 opacity-40" />}
                </div>
              )}
            </div>
          );
        })}

      </div>

      {/* Corps de la table avec virtualisation */}
      <div 
        ref={tableContainerRef}
        className="flex-1 overflow-auto"
        style={{ height }}
      >
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualItem) => {
            const rawContact = rawData[virtualItem.index];
            if (!rawContact) return null;
            
            const contact = convertToContact(rawContact, virtualItem.index);
            const isSelected = selectedContactId === contact.id;
            const callState = callStates[contact.id];



            // Style de ligne selon l'état
            let rowBgClass = '';
            if (callState?.isCalling) {
              rowBgClass = theme === Theme.Dark 
                ? 'bg-orange-600/40 border-orange-500/50' 
                : 'bg-orange-200/60 border-orange-400/50';
            } else if (callState?.hasBeenCalled) {
              rowBgClass = theme === Theme.Dark 
                ? 'bg-green-600/30 border-green-500/40' 
                : 'bg-green-200/50 border-green-400/40';
            } else if (isSelected) {
              rowBgClass = theme === Theme.Dark 
                ? 'bg-oled-accent/30 border-oled-accent/50' 
                : 'bg-light-accent/30 border-light-accent/50';
            } else {
              rowBgClass = theme === Theme.Dark 
                ? 'hover:bg-oled-interactive-hover border-transparent' 
                : 'hover:bg-light-interactive-hover border-transparent';
            }

            return (
              <div
                key={`virtual-row-${contact.id}-${virtualItem.index}`}
                onClick={() => onSelectContact(contact)}
                className={`
                  absolute top-0 left-0 w-full flex border-b cursor-pointer
                  transition-all duration-200 min-h-[50px] items-center
                  ${rowBgClass}
                  ${theme === Theme.Dark ? 'text-oled-text border-oled-border' : 'text-light-text border-light-border'}
                `}
                style={{
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                {/* Données des colonnes */}
                {allColumns.map((column) => {
                  // Gestion spéciale pour la colonne de sélection
                  if (column === '__SELECT__') {
                    const itemId = String(rawContact.id || rawContact.UID);
                    const isRowSelected = rowSelection[itemId] || false;
                    
                    return (
                      <div 
                        key={`select-${contact.id}`}
                        style={{ width: '50px' }}
                        className={`
                          px-3 py-2 flex items-center justify-center border-r flex-shrink-0
                          ${theme === Theme.Dark ? 'border-oled-border' : 'border-light-border'}
                        `}
                        onClick={(e) => {
                          e.stopPropagation();
                          onRowSelectionChange?.(itemId, !isRowSelected, e);
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isRowSelected}
                          onChange={(e) => {
                            e.stopPropagation();
                            onRowSelectionChange?.(itemId, e.target.checked, e as any);
                          }}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        />
                      </div>
                    );
                  }
                  
                  // Gestion spéciale pour la colonne Utilisateur
                  if (column === 'Utilisateur' || column === 'utilisateur') {
                    return (
                      <div 
                        key={`cell-${contact.id}-${column}`}
                        style={{ width: `${getOptimalColumnWidth[column] || 150}px` }}
                        className={`
                          px-3 py-2 flex items-center border-r flex-shrink-0
                          ${theme === Theme.Dark ? 'border-oled-border' : 'border-light-border'}
                        `}
                        title={contact.utilisateur || 'Utilisateur inconnu'}
                      >
                        <span className="truncate text-sm font-medium text-blue-600 dark:text-blue-400">
                          {contact.utilisateur || 'Utilisateur inconnu'}
                        </span>
                      </div>
                    );
                  }
                  
                  // Gestion normale pour les autres colonnes
                  const cellValue = rawContact[column];
                  const isCurrentlyEditing = editingCell?.rowId === contact.id && editingCell?.column === column;
                  const isEditable = isColumnEditable(column);

                  return (
                    <div 
                      key={`cell-${contact.id}-${column}`}
                      style={{ width: `${getOptimalColumnWidth[column] || 120}px` }}
                      className={`
                        px-3 py-2 flex items-center border-r flex-shrink-0 relative group
                        ${theme === Theme.Dark ? 'border-oled-border' : 'border-light-border'}
                        ${isEditable ? 'cursor-pointer hover:bg-muted/20' : ''}
                      `}
                      title={String(cellValue || '')}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isEditable && !isCurrentlyEditing) {
                          startEditing(contact.id, column, cellValue);
                        }
                      }}
                    >
                      {isCurrentlyEditing ? (
                        // Mode édition
                        <div className="flex items-center w-full gap-1">
                          {column === 'statut' || column === 'statut_final' ? (
                            // Select pour les colonnes de statut
                            <Select
                              value={editingCell.value}
                              onValueChange={(value) => setEditingCell(prev => prev ? { ...prev, value } : null)}
                            >
                              <SelectTrigger className="h-6 text-xs w-full">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {Object.values(ContactStatus).map(status => (
                                  <SelectItem key={status} value={status}>
                                    {status}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : (
                            // Input pour les autres colonnes
                            <Input
                              value={editingCell.value}
                              onChange={(e) => setEditingCell(prev => prev ? { ...prev, value: e.target.value } : null)}
                              onKeyDown={handleKeyDown}
                              onBlur={saveEdit}
                              className="h-6 text-xs px-1 w-full"
                              autoFocus
                              disabled={isUpdating}
                            />
                          )}
                          
                          {/* Boutons de validation/annulation */}
                          <div className="flex gap-1 ml-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-5 w-5 p-0 text-green-600 hover:text-green-700"
                              onClick={(e) => {
                                e.stopPropagation();
                                saveEdit();
                              }}
                              disabled={isUpdating}
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-5 w-5 p-0 text-red-600 hover:text-red-700"
                              onClick={(e) => {
                                e.stopPropagation();
                                cancelEdit();
                              }}
                              disabled={isUpdating}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      ) : (
                        // Mode affichage normal
                        <div className="flex items-center w-full justify-between">
                          <span className="truncate">
                            {column === 'statut' || column === 'statut_final' ? (
                              (() => {
                                const statutValue = cellValue as ContactStatus || ContactStatus.NonDefini;
                                const colors = STATUS_COLORS[statutValue] || STATUS_COLORS[ContactStatus.NonDefini];
                                const currentBg = theme === Theme.Dark ? colors.darkBg : colors.bg;
                                const currentText = theme === Theme.Dark ? colors.darkText : colors.text;
                                
                                return (
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${currentBg} ${currentText}`}>
                                    {statutValue}
                                  </span>
                                );
                              })()
                            ) : (
                              String(cellValue || '')
                            )}
                          </span>
                          
                          {/* Icône d'édition visible au hover */}
                          {isEditable && (
                            <Edit className={`
                              h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity ml-1 flex-shrink-0
                              ${theme === Theme.Dark ? 'text-gray-400' : 'text-gray-500'}
                            `} />
                          )}
                        </div>
                      )}
                      
                      {/* Indicateur de mise à jour */}
                      {isUpdating && isCurrentlyEditing && (
                        <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
                          <div className="animate-spin rounded-full h-3 w-3 border-2 border-blue-500 border-t-transparent"></div>
                        </div>
                      )}
                    </div>
                  );
                })}
                
                {/* Colonne Actions */}
                {visibleColumns['Actions'] && (
                  <div 
                    style={{ width: '100px' }}
                    className={`
                      px-3 py-2 flex items-center justify-center flex-shrink-0
                      ${theme === Theme.Dark ? 'border-oled-border' : 'border-light-border'}
                    `}
                  >
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button 
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteContact(contact.id);
                            }}
                            variant="ghost" 
                            size="sm" 
                            className="!p-1 text-red-500 hover:text-red-400"
                          >
                            <IconTrash className="w-4 h-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Supprimer Contact</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}; 