'use client';

import React from 'react';
import {
  ColumnDef,
  // ColumnPinningState, // Commenté pour l'instant
  flexRender,
  getCoreRowModel,
  useReactTable,
  // createColumnHelper, // Supprimer l'import car columnHelper est commenté
  // Pour la virtualisation plus tard
  // getSortedRowModel, // Si tri nécessaire
  // getFilteredRowModel, // Si filtrage nécessaire
  // getPaginationRowModel, // Si pagination nécessaire
  Row, // Importer Row explicitement
  // Column, // Supprimé
  // Table as TanstackTableType, // Supprimé -> Ce commentaire fait référence à Table de @tanstack/react-table
  // CellContext, // Supprimé car non utilisé
  ColumnPinningState,
} from '@tanstack/react-table';
import { useVirtualizer } from '@tanstack/react-virtual';
// import { useVirtualizer } from '@tanstack/react-virtual'; // Sera utilisé plus tard

import { Contact } from '@/types/contact'; // Assurez-vous que ce chemin est correct
// import { Button } from '@/components/ui/button'; // Supprimé car plus utilisé
import {
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
  Table,
} from "@/components/ui/table";
// import { Input } from "@/components/ui/input"; // Supprimé car Input n'est plus utilisé ici
import { EditableCell } from './EditableCell'; // Assurez-vous que le chemin est correct
import { StatusBadge, type Status as StatusType } from '@/components/ui/StatusBadge'; // Importer StatusBadge et le type Status
import { ReadOnlyCell } from './ReadOnlyCell'; // AJOUT: Importer ReadOnlyCell
import { CommentCell } from './CommentCell'; // AJOUT: Importer CommentCell
import { DateCell } from './DateCell'; // AJOUT: Importer DateCell
import { TimeCell } from './TimeCell'; // AJOUT: Importer TimeCell
import {
  User, 
  Mail, 
  Phone, 
  Info, 
  MessageSquareText, 
  BellRing, 
  CalendarDays, 
  Waypoints, 
  Clock, 
  Hourglass, 
  PhoneOutgoing
} from 'lucide-react';
import { cn, formatPhoneNumber } from '@/lib/utils';
import { DraggableTableHead } from "@/components/ui/DraggableTableHead"; // Ajouté
import UploadDropZone from './UploadDropZone'; // Corrigé l'import
import { startTransition } from 'react';

// Définir les props pour ContactTable
interface ContactTableProps {
  data: Contact[];
  // setData: React.Dispatch<React.SetStateAction<Contact[]>>; // On le garde commenté pour l'instant
  onEditContact: (contactUpdate: Partial<Contact> & { id: string }) => void;
  // onActiveRowChange?: (activeRowId: string | null) => void; // Ancienne prop
  onActiveContactChange?: (contact: Contact | null) => void; // Nouvelle prop pour l'objet contact entier
  scrollContainerRef?: React.RefObject<HTMLDivElement | null>; // Réintroduction pour le virtualiseur
  // onScrollChange?: (percentage: number, isScrollable: boolean) => void; // Supprimé
  // scrollContainerRef?: React.RefObject<HTMLDivElement | null>; // Supprimé
  // onDeleteContact: (contactId: string) => void; // Supprimé
  contactInCallId?: string | null; // Nouvelle prop pour l'ID du contact en appel
  // callStartTime?: string | null; // PROP SUPPRIMÉE CAR NON UTILISÉE
  error?: string | null; // AJOUT: Pour afficher une erreur globale liée à la table/aux actions
  // isPanelOpen?: boolean; // SUPPRIMÉ: Prop non utilisée
  processFileForImport?: (file: File) => void; // Nouvelle prop pour gérer l'import de fichiers
  columns?: { id: string; label: string }[]; // Ajout: Définition des colonnes disponibles
  visibleColumns?: string[]; // Ajout: Colonnes actuellement visibles
  setVisibleColumns?: React.Dispatch<React.SetStateAction<string[]>>; // Ajout: Fonction pour modifier les colonnes visibles
}

// Définir le type pour les métadonnées de la table pour les actions
interface TableMeta {
  onEditContact: (contactUpdate: Partial<Contact> & { id: string }) => void;
  // onDeleteContact: (contactId: string) => void; // Supprimé
  // Potentiellement, ajouter une fonction pour mettre à jour les données localement pour une meilleure réactivité
  // updateData: (rowIndex: number, columnId: string, value: any) => void;
}

// Helper pour la définition des colonnes
// const columnHelper = createColumnHelper<Contact>(); // Commenté car non utilisé pour l'instant

const IconHeader = ({ icon: IconComponent, text }: { icon: React.ElementType, text: string }) => (
  <div className="flex items-center gap-2">
    <IconComponent size={16} aria-hidden="true" />
    {text}
  </div>
);

// Composant optimisé pour la cellule avec la durée d'appel
const DureeAppelCell = React.memo(({ contactId, value }: { contactId: string, value: string | null | undefined }) => {
  console.log(`[ContactTable dureeAppel cell] Contact ID: ${contactId}, Value from info.getValue(): ${value || ''}`);
  
  return (
    <ReadOnlyCell 
      value={value} 
      emptyPlaceholder="Non appelé" 
    />
  );
});
DureeAppelCell.displayName = 'DureeAppelCell';

// Envelopper le composant avec React.memo
export const ContactTable = React.memo(function ContactTableComponent({ 
  data, 
  onEditContact, 
  onActiveContactChange, 
  scrollContainerRef, 
  contactInCallId,
  error,
  processFileForImport,
  visibleColumns,
  setVisibleColumns
}: ContactTableProps) {
  const [columnPinning, setColumnPinning] = React.useState<ColumnPinningState>({});
  const [activeRowId, setActiveRowId] = React.useState<string | null>(null);
  const [isScrollContainerReady, setIsScrollContainerReady] = React.useState(false);

  // AJOUT: État pour l'ordre des colonnes
  // Initialiser l'état avec un tableau vide au départ
  const [columnOrder, setColumnOrder] = React.useState<string[]>([]);

  // Optimiser la fonction de clic sur une ligne - POSITIONNER AVANT D'AUTRES HOOKS
  const handleRowClick = React.useCallback((row: Row<Contact>) => {
    console.log(`[ContactTable] Row clicked, ID: ${row.original.id}`);
    setActiveRowId(row.original.id || null);
  }, []);

  // Utilisation de la prop error (exemple simple)
  React.useEffect(() => {
    if (error) {
      console.warn("[ContactTable] Erreur reçue:", error);
      // Idéalement, afficher cela dans l'UI de la table ou via un toast spécifique à la table.
      // Pour l'instant, un simple log.
    }
  }, [error]);

  // Effet pour notifier le parent du changement de la ligne active - RÉAJOUTÉ
  React.useEffect(() => {
    // DÉCOMMENTÉ: Logique pour notifier le parent du contact actif
    if (onActiveContactChange && activeRowId) {
      const activeContact = data.find(contact => contact.id === activeRowId);
      onActiveContactChange(activeContact || null);
    } else if (onActiveContactChange && !activeRowId) {
      onActiveContactChange(null);
    }
  }, [activeRowId, data, onActiveContactChange]);

  const internalTableWrapperRef = React.useRef<HTMLDivElement>(null); // Renommé pour éviter confusion

  // Réduire la fréquence des rendus en vérifiant l'état du container une seule fois
  React.useEffect(() => {
    if (scrollContainerRef?.current) {
      setIsScrollContainerReady(true);
      console.log("[ContactTable] Scroll container IS READY:", scrollContainerRef.current);
    }
  }, [scrollContainerRef]);

  // Optimisation: mémoriser les colonnes pour éviter les recréations non nécessaires
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const columns = React.useMemo<ColumnDef<Contact, any>[]>(() => [
    {
      id: 'rowNumber',
      header: () => '#',
      cell: (info) => <div className="w-full text-center font-medium text-muted-foreground">{info.row.index + 1}</div>,
      size: 60,
      enableResizing: false,
      meta: { isPinned: true }, // Épinglée à gauche
    },
    {
      id: 'firstName', // Assurez-vous que chaque colonne a un ID unique
      accessorKey: 'firstName',
      header: () => <IconHeader icon={User} text="Prénom" />,
      cell: (info) => {
        const { onEditContact: metaOnEditContact } = (info.table.options.meta as TableMeta);
        return <EditableCell {...info} onEditContact={metaOnEditContact} />;
      },
      size: 150,
      meta: { isPinned: true },
    },
    {
      id: 'lastName', // Assurez-vous que chaque colonne a un ID unique
      accessorKey: 'lastName',
      header: () => <IconHeader icon={User} text="Nom" />,
      cell: (info) => {
        const { onEditContact: metaOnEditContact } = (info.table.options.meta as TableMeta);
        return <EditableCell {...info} onEditContact={metaOnEditContact} />;
      },
      size: 150,
      meta: { isPinned: true },
    },
    {
      id: 'email', // Assurez-vous que chaque colonne a un ID unique
      accessorKey: 'email',
      header: () => <IconHeader icon={Mail} text="Email" />,
      cell: (info) => {
        const { onEditContact: metaOnEditContact } = (info.table.options.meta as TableMeta);
        return <EditableCell {...info} onEditContact={metaOnEditContact} />;
      },
      size: 250,
    },
    {
      id: 'phoneNumber', // Assurez-vous que chaque colonne a un ID unique
      accessorKey: 'phoneNumber',
      header: () => <IconHeader icon={Phone} text="Téléphone" />,
      cell: (info) => {
        const { onEditContact: metaOnEditContact } = (info.table.options.meta as TableMeta);
        const originalValue = info.getValue() as string | null | undefined;
        const formattedValueNode = <span>{formatPhoneNumber(originalValue)}</span>; 
        return <EditableCell {...info} displayValueOverride={formattedValueNode} onEditContact={metaOnEditContact} />;
      },
      size: 180,
    },
    {
      id: 'status', // Assurez-vous que chaque colonne a un ID unique
      accessorKey: 'status',
      header: () => <IconHeader icon={Info} text="Statut" />,
      cell: ({ row, table }) => {
        const currentStatus = row.getValue("status") as StatusType;
        const { onEditContact } = (table.options.meta as TableMeta);

        const handleStatusChange = (newStatus: StatusType) => {
          // Appeler onEditContact pour mettre à jour le statut
          // L'ID de la ligne est accessible via row.original.id (si votre type Contact a un champ id)
          if (row.original.id) {
            onEditContact({ id: row.original.id, status: newStatus });
          } else {
            console.error("L'ID du contact est manquant, impossible de mettre à jour le statut.");
          }
        };

        return (
          <StatusBadge
            currentStatus={currentStatus}
            onChangeStatus={handleStatusChange}
          />
        );
      },
      size: 120, // Vous pouvez ajuster la taille si nécessaire pour le badge/dropdown
    },
    {
      id: 'comment', // Assurez-vous que chaque colonne a un ID unique
      accessorKey: 'comment',
      header: () => <IconHeader icon={MessageSquareText} text="Commentaire" />,
      cell: (info) => {
        const { onEditContact: metaOnEditContact } = (info.table.options.meta as TableMeta);
        return <CommentCell {...info} onEditContact={metaOnEditContact} />;
      },
      size: 300,
    },
    {
      id: 'dateRappel', // Assurez-vous que chaque colonne a un ID unique
      accessorKey: 'dateRappel',
      header: () => <IconHeader icon={BellRing} text="Date Rappel" />,
      cell: (info) => {
        const { onEditContact: metaOnEditContact } = (info.table.options.meta as TableMeta);
        return <DateCell {...info} onEditContact={metaOnEditContact} placeholder="Date de rappel" />;
      },
      size: 180, // Ajusté pour accommoder le bouton datepicker
      meta: { cellType: 'date' },
    },
    {
      id: 'heureRappel', // Assurez-vous que chaque colonne a un ID unique
      accessorKey: 'heureRappel',
      header: () => <IconHeader icon={Clock} text="Heure Rappel" />,
      cell: (info) => {
        const { onEditContact: metaOnEditContact } = (info.table.options.meta as TableMeta);
        return <TimeCell {...info} onEditContact={metaOnEditContact} />;
      },
      size: 180, // Ajuster la taille si nécessaire pour les deux sélecteurs et le bouton
      meta: { cellType: 'time' },
    },
    {
      id: 'dateRendezVous', // Assurez-vous que chaque colonne a un ID unique
      accessorKey: 'dateRendezVous',
      header: () => <IconHeader icon={CalendarDays} text="Date RDV" />,
      cell: (info) => {
        const { onEditContact: metaOnEditContact } = (info.table.options.meta as TableMeta);
        return <DateCell {...info} onEditContact={metaOnEditContact} placeholder="Date de RDV" />;
      },
      size: 180, // Ajusté
      meta: { cellType: 'date' },
    },
    {
      id: 'heureRendezVous', // Assurez-vous que chaque colonne a un ID unique
      accessorKey: 'heureRendezVous',
      header: () => <IconHeader icon={Clock} text="Heure RDV" />,
      cell: (info) => {
        const { onEditContact: metaOnEditContact } = (info.table.options.meta as TableMeta);
        return <TimeCell {...info} onEditContact={metaOnEditContact} />;
      },
      size: 180, // Ajuster la taille si nécessaire
      meta: { cellType: 'time' },
    },
    {
      id: 'dateAppel', // Assurez-vous que chaque colonne a un ID unique
      accessorKey: 'dateAppel',
      header: () => <IconHeader icon={PhoneOutgoing} text="Date Appel" />,
      cell: (info) => {
        return <ReadOnlyCell {...info} value={info.getValue() as string | null} />;
      },
      size: 180, // Ajusté
      meta: { cellType: 'date' },
    },
    {
      id: 'heureAppel', // Assurez-vous que cet ID correspond à votre modèle de données
      accessorKey: 'heureAppel', // Et que cet accesseur est correct
      header: () => <IconHeader icon={Clock} text="Heure Appel" />, // Utiliser l'icône Clock
      cell: (info) => {
        return <ReadOnlyCell {...info} value={info.getValue() as string | null} />;
      },
      size: 180, // Ajuster la taille si nécessaire
    },
    {
      id: 'dureeAppel', // Assurez-vous que chaque colonne a un ID unique
      accessorKey: 'dureeAppel',
      header: () => <IconHeader icon={Hourglass} text="Durée Appel" />,
      cell: (info) => {
        const contactId = info.row.original.id;
        // Rendre la cellule uniquement si contactId est défini pour DureeAppelCell
        return contactId ? <DureeAppelCell contactId={contactId} value={info.getValue()} /> : null;
      },
      size: 120,
    },
    {
      id: 'source', // Assurez-vous que chaque colonne a un ID unique
      accessorKey: 'source',
      header: () => <IconHeader icon={Waypoints} text="Source" />,
      cell: (info) => {
        const { onEditContact: metaOnEditContact } = (info.table.options.meta as TableMeta);
        return <EditableCell {...info} onEditContact={metaOnEditContact} />;
      },
      size: 150,
    },
    /* // COLONNE Heure RDV (Cal) SUPPRIMÉE
    {
      accessorKey: 'bookingTime',
      header: () => <IconHeader icon={Clock} text="Heure RDV (Cal)" />,
      cell: (info) => <ReadOnlyCell {...info} value={info.getValue() as string | null} />,
      size: 150,
    },
    */
    /* // COLONNE SUPPRIMÉE
    {
      accessorKey: 'bookingTitle',
      header: () => <IconHeader icon={Info} text="Titre RDV (Cal)" />,
      cell: (info) => <ReadOnlyCell {...info} value={info.getValue() as string | null} />,
      size: 200,
    },
    */
    /* // COLONNE SUPPRIMÉE
    {
      accessorKey: 'bookingDuration',
      header: () => <IconHeader icon={Hourglass} text="Durée RDV (Cal)" />,
      cell: (info) => {
        const duration = info.getValue() as number | null;
        return <ReadOnlyCell {...info} value={duration ? `${duration} min` : ''} />;
      },
      size: 150,
    },
    */
  // eslint-disable-next-line react-hooks/exhaustive-deps
  ], []);

  // AJOUT: Initialiser columnOrder basé sur les colonnes initiales
  // Réactiver et ajuster le useEffect pour initialiser columnOrder après que `columns` soit défini
  React.useEffect(() => {
    if (columns && columns.length > 0) {
      // S'assurer que rowNumber est toujours le premier si elle existe
      const initialOrder = columns.map(c => c.id!);
      const rowNumberIndex = initialOrder.indexOf('rowNumber');
      if (rowNumberIndex > 0) { // Si rowNumber existe et n'est pas premier
        const rowNumId = initialOrder.splice(rowNumberIndex, 1)[0];
        initialOrder.unshift(rowNumId);
      }
      setColumnOrder(initialOrder);
    }
  }, [columns]); // Dépendance à columns

  const table = useReactTable<Contact>({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    columnResizeMode: 'onChange', 
    state: {
      columnVisibility: visibleColumns ? 
        columns.reduce((acc, column) => {
          // La colonne rowNumber est toujours visible par défaut
          if (column.id === 'rowNumber') {
            acc[column.id!] = true;
          } else {
            acc[column.id!] = visibleColumns.includes(column.id!);
          }
          return acc;
        }, {} as Record<string, boolean>) 
        : { rowNumber: true }, // Assurer que rowNumber est visible même si visibleColumns est undefined initialement
      columnPinning,
      columnOrder,
    },
    onColumnOrderChange: setColumnOrder,
    onColumnPinningChange: setColumnPinning,
    onColumnVisibilityChange: (updater) => {
      if (setVisibleColumns) {
        const nextVisibility = typeof updater === 'function' ? updater(table.getState().columnVisibility) : updater;
        const currentlyVisible = Object.entries(nextVisibility)
          .filter(([, isVisible]) => isVisible)
          .map(([columnId]) => columnId);
        // S'assurer que rowNumber n'est pas accidentellement masquée par l'utilisateur via le dropdown de visibilité
        // Bien que, idéalement, elle ne devrait pas être une option dans ce dropdown si elle est fixe.
        // Pour l'instant, on la force visible ici si elle a été décochée.
        // if (!currentlyVisible.includes('rowNumber')) {
        //   currentlyVisible.unshift('rowNumber'); 
        //   nextVisibility['rowNumber'] = true; 
        // }
        // La logique ci-dessus peut être problématique si l'utilisateur a un moyen de la cacher.
        // Pour l'instant, on se fie à ce que visibleColumns propage correctement l'état.
        setVisibleColumns(currentlyVisible);
      }
    },
    getRowId: (originalRow) => originalRow.id || '',
    meta: {
      onEditContact,
    } as TableMeta
  });

  // AJOUTER CE LOG
  console.log('[ContactTable] Initial table state columnVisibility:', table.getState().columnVisibility);

  // AJOUT: Fonction pour déplacer les colonnes
  const moveColumn = (dragIndex: number, hoverIndex: number) => {
    const newColumnOrder = [...columnOrder];
    const draggedColumnId = newColumnOrder.splice(dragIndex, 1)[0];
    newColumnOrder.splice(hoverIndex, 0, draggedColumnId);
    setColumnOrder(newColumnOrder);
  };

  const { rows } = table.getRowModel();

  // Log pour débogage
  console.log(`[ContactTable] Render. rows.length: ${rows.length}, scrollContainerRef.current:`, scrollContainerRef?.current, `isScrollContainerReady: ${isScrollContainerReady}`);

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    estimateSize: () => 48, 
    getScrollElement: () => scrollContainerRef?.current || null, // Utilisation de la prop pour le virtualiseur
    overscan: 10, 
    enabled: isScrollContainerReady && !!scrollContainerRef?.current, // Activer seulement lorsque le conteneur est prêt
  });

  // Log après initialisation
  console.log(`[ContactTable] Virtualizer instance. virtualItems.length: ${rowVirtualizer.getVirtualItems().length}, getTotalSize: ${rowVirtualizer.getTotalSize()}, enabled: ${isScrollContainerReady && !!scrollContainerRef?.current}`);

  // Ajouter un gestionnaire pour UploadDropZone
  const handleFileSelected = React.useCallback((file: File) => {
    console.log('[ContactTable] Fichier sélectionné via UploadDropZone:', file);
    if (processFileForImport) {
      processFileForImport(file);
    } else {
      console.warn('[ContactTable] processFileForImport non défini, impossible de traiter le fichier.');
    }
  }, [processFileForImport]);

  // Si les données sont là mais le conteneur de défilement n'est pas encore prêt
  if (data.length > 0 && !isScrollContainerReady) {
    return (
       <div className="p-4 text-center">
           Attente du conteneur de défilement pour initialiser la virtualisation...
       </div>
    );
  }

  return (
    <div className="relative w-full h-full flex flex-col">
      {/* <p className="mb-2">Tableau des contacts (Base)</p> */}
      <div className="border rounded-md">
        <Table
          ref={internalTableWrapperRef} // Le ref du composant Table de ui/table (div externe)
          style={{
            display: 'grid',
            minWidth: table.getTotalSize(),
            minHeight: `${rowVirtualizer.getTotalSize()}px` // Ajout de minHeight
          }}
          className="min-w-full"
        >
          <TableHeader
            style={{
              display: 'grid',
              position: 'sticky',
              top: 0,
              zIndex: 25,
            }}
            className="[&_tr]:border-b bg-background"
          >
            {table.getHeaderGroups().map(headerGroup => (
              <TableRow
                key={headerGroup.id}
                style={{ display: 'flex', width: '100%' }}
              >
                {headerGroup.headers.map((header) => {
                  const columnId = header.column.id;
                  return (
                    <DraggableTableHead
                    key={header.id}
                      id={columnId}
                      index={columnOrder.indexOf(columnId)}
                      header={header}
                      moveColumn={moveColumn}
                    style={{
                      width: header.getSize(),
                      position: header.column.getIsPinned() ? 'sticky' : 'relative',
                      left: header.column.getIsPinned() === 'left' ? `${header.column.getStart('left')}px` : undefined,
                      right: header.column.getIsPinned() === 'right' ? `${header.column.getAfter('right')}px` : undefined,
                      zIndex: header.column.getIsPinned() ? 5 : 0,
                    }}
                    className="whitespace-nowrap bg-background"
                    />
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody
            style={{
              display: 'grid',
              height: `${rowVirtualizer.getTotalSize()}px`,
              position: 'relative',
              contain: 'paint',
            }}
          >
            {/* Affichage conditionnel des messages de chargement/état */}
            {data.length > 0 && rows.length === 0 && (
              <TableRow style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100px' }}>
                  <TableCell colSpan={columns.length} className="text-center">
                      Préparation des données de la table... (Contacts: {data.length}, Lignes de table: 0)
                  </TableCell>
              </TableRow>
            )}
            {isScrollContainerReady && rows.length > 0 && rowVirtualizer.getVirtualItems().length === 0 && rowVirtualizer.getTotalSize() > 0 && (
                <TableRow style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100px' }}>
                    <TableCell colSpan={columns.length} className="text-center">
                        Calcul des lignes visibles... (Virt: 0, Lignes: {rows.length}, Taille Totale Virt: {rowVirtualizer.getTotalSize()}px)
                    </TableCell>
                </TableRow>
            )}
            {isScrollContainerReady && rowVirtualizer.getTotalSize() > 0 && rowVirtualizer.getVirtualItems().map(virtualRow => {
              const row = rows[virtualRow.index] as Row<Contact>;
              const isSelected = row.id === activeRowId;
              const callEnded = !!row.original.dateAppel && row.original.dateAppel.trim() !== "";

              return (
                <TableRow
                  key={row.id}
                  data-index={virtualRow.index}
                  onClick={() => startTransition(() => handleRowClick(row))}
                  data-state={isSelected ? "selected" : "none"}
                  className={cn(
                    "flex absolute w-full",
                    // Gérer le style de survol uniquement si la ligne n'est pas en appel
                    (!(contactInCallId && contactInCallId === row.original.id) && !isSelected) && "hover:bg-muted/50",
                    
                    // Style quand la ligne est sélectionnée (et pas en appel)
                    (isSelected && !(contactInCallId && contactInCallId === row.original.id)) && "border-l-4 border-primary bg-muted",
                    
                    // Style quand un appel est terminé pour cette ligne (non sélectionnée)
                    (callEnded && !isSelected && !(contactInCallId && contactInCallId === row.original.id)) && "bg-emerald-600 text-white hover:bg-emerald-600/90",
                    // Style quand un appel est terminé ET la ligne est sélectionnée (et pas en appel en cours)
                    (callEnded && isSelected && !(contactInCallId && contactInCallId === row.original.id)) && "bg-emerald-700 text-white border-emerald-800 hover:bg-emerald-700/90",
                    
                    // Style spécifique pour la ligne en appel actif
                    contactInCallId && contactInCallId === row.original.id && 
                      "border-l-4 border-emerald-500 bg-emerald-700/30 text-white", // Pas d'opacity, pas de pointer-events-none

                    // Fallback pour la ligne active si aucune des conditions ci-dessus n'est remplie (devrait être rare)
                    // Si isSelected est vrai mais qu'une autre condition l'a déjà stylé, ce ne sera pas appliqué à cause de l'ordre.
                    isSelected && !callEnded && !(contactInCallId && contactInCallId === row.original.id) && "bg-muted"
                  )}
                  style={{
                    height: `48px`,
                    transform: `translateY(${virtualRow.start}px)`,
                  }}
                >
                  {row.getVisibleCells().map(cell => (
                    <TableCell 
                      key={cell.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        width: cell.column.getSize(),
                        position: cell.column.getIsPinned() ? 'sticky' : 'relative',
                        left: cell.column.getIsPinned() === 'left' ? `${cell.column.getStart('left')}px` : undefined,
                        right: cell.column.getIsPinned() === 'right' ? `${cell.column.getAfter('right')}px` : undefined,
                        zIndex: cell.column.getIsPinned() ? 1 : 0,
                        backgroundColor: cell.column.getIsPinned() ? 'hsl(var(--background))' : 'inherit',
                      }}
                      className={cell.column.getIsPinned() ? "bg-background" : ""}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
      {data.length === 0 && (
        <div className="p-4">
          <UploadDropZone onFileSelected={handleFileSelected} />
        </div>
      )}
    </div>
  );
});

ContactTable.displayName = 'ContactTable'; 