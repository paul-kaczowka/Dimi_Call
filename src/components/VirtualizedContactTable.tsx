import React, { useMemo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Contact, ContactStatus, CallStates, Theme } from '../types';
import { 
    COLUMN_HEADERS as DEFAULT_COLUMN_HEADERS, 
    CONTACT_DATA_KEYS as DEFAULT_CONTACT_DATA_KEYS, 
    STATUS_OPTIONS, 
    STATUS_COLORS, 
    QUICK_COMMENTS, 
    IconPhone, IconUser, IconMail, IconComment, IconClock, IconStatus, IconZap, IconCalendar, IconDuration, 
    IconChevronUp, IconChevronDown, IconTrash
} from '../constants';
import { Button } from './Common';

interface VirtualizedContactTableProps {
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
  height?: number;
}

interface VirtualRowProps {
  contact: Contact;
  index: number;
  isSelected: boolean;
  callState: any;
  theme: Theme;
  visibleColumns: Record<string, boolean>;
  columnHeaders: string[];
  contactDataKeys: (keyof Contact | 'actions' | null)[];
  onSelectContact: (contact: Contact) => void;
  onUpdateContact: (contact: Partial<Contact> & { id: string }) => void;
  onDeleteContact: (contactId: string) => void;
  style: React.CSSProperties;
}

const VirtualRow: React.FC<VirtualRowProps> = ({
  contact,
  index,
  isSelected,
  callState,
  theme,
  visibleColumns,
  columnHeaders,
  contactDataKeys,
  onSelectContact,
  onUpdateContact,
  onDeleteContact,
  style,
}) => {
  // Gestion des couleurs de ligne selon l'état d'appel
  let rowBgClass = '';
  const isCallFinished = useMemo(() => {
    // La seule condition est la présence d'une durée d'appel valide.
    return contact.dureeAppel && contact.dureeAppel !== 'N/A';
  }, [contact.dureeAppel]);

  if (callState?.isCalling) {
    // Orange pendant l'appel
    rowBgClass = theme === Theme.Dark 
      ? 'bg-orange-600/40 border-orange-500/50 shadow-orange-500/20' 
      : 'bg-orange-200/60 border-orange-400/50 shadow-orange-400/20';
  } else if (isCallFinished) {
    // Vert après l'appel terminé
    rowBgClass = theme === Theme.Dark 
      ? 'bg-green-600/30 border-green-500/40 shadow-green-500/20' 
      : 'bg-green-200/50 border-green-400/40 shadow-green-400/20';
  } else if (isSelected) {
    // Couleur de sélection normale
    rowBgClass = theme === Theme.Dark 
      ? 'bg-oled-accent/30 border-oled-accent/50' 
      : 'bg-light-accent/30 border-light-accent/50';
  } else {
    // Couleur normale avec hover
    rowBgClass = theme === Theme.Dark 
      ? 'hover:bg-oled-interactive-hover border-transparent' 
      : 'hover:bg-light-interactive-hover border-transparent';
  }

  const headerIcons: Record<string, React.ReactNode> = {
    "Prénom": <IconUser />, "Nom": <IconUser />, "Téléphone": <IconPhone />, "Mail": <IconMail />, "Statut": <IconStatus />,
    "Commentaire": <IconComment />, "Date Rappel": <IconCalendar />, "Heure Rappel": <IconClock />,
    "Date RDV": <IconCalendar />, "Heure RDV": <IconClock />, "Date Appel": <IconCalendar />, "Heure Appel": <IconClock />, "Durée Appel": <IconDuration />,
    "Actions": <IconTrash className="w-3.5 h-3.5" />
  };

  return (
    <div
      style={style}
      onClick={() => onSelectContact(contact)}
      className={`
        flex items-center cursor-pointer border-b-2 transition-all duration-300 ease-in-out
        ${rowBgClass}
        ${theme === Theme.Dark ? 'text-oled-text' : 'text-light-text'}
        ${callState?.isCalling ? 'shadow-lg' : isCallFinished ? 'shadow-md' : ''}
      `}
    >
      {/* Indicateur visuel d'état d'appel */}
      {(callState?.isCalling || isCallFinished) && (
        <div className={`
          w-1 h-full absolute left-0 top-0
          ${callState?.isCalling 
            ? (theme === Theme.Dark ? 'bg-orange-500' : 'bg-orange-600') 
            : (theme === Theme.Dark ? 'bg-green-500' : 'bg-green-600')
          }
        `} />
      )}
      
      {columnHeaders.map((header, headerIndex) => {
        if (!visibleColumns[header]) return null;
        
        const key = contactDataKeys[headerIndex];
        if (!key) return <div key={`${contact.id}-${header}`} className="flex-1 px-3 py-2"></div>;

        let cellContent: React.ReactNode;

        if (key === 'actions') {
          const handleDelete = () => {
            onDeleteContact(contact.id);
          };
          
          cellContent = (
            <div onClick={(e) => e.stopPropagation()} title="Supprimer Contact">
            <Button 
                onClick={handleDelete}
              variant="ghost" 
              size="sm" 
              className="!p-1 text-red-500 hover:text-red-400"
            >
              <IconTrash className="w-4 h-4" />
            </Button>
            </div>
          );
        } else if (key === 'statut') {
          const colors = STATUS_COLORS[contact.statut] || STATUS_COLORS[ContactStatus.NonDefini];
          const currentBg = theme === Theme.Dark ? colors.darkBg : colors.bg;
          const currentText = theme === Theme.Dark ? colors.darkText : colors.text;
          
          cellContent = (
            <span className={`px-2 py-1 rounded text-xs font-medium ${currentBg} ${currentText}`}>
              {contact.statut}
            </span>
          );
        } else {
          cellContent = String(contact[key as keyof Contact] || '');
        }

        const isActionsColumn = key === 'actions';
        const isCommentColumn = key === 'commentaire';
        const isEmailColumn = key === 'email';

        return (
          <div 
            key={`${contact.id}-${header}`} 
            className={`px-3 py-2 ${
              isActionsColumn ? 'w-16 flex justify-center' : 
              isCommentColumn ? 'min-w-[200px] flex-1' : 
              isEmailColumn ? 'max-w-xs truncate flex-1' : 
              'flex-1'
            }`}
            title={isEmailColumn ? String(contact[key as keyof Contact] || '') : undefined}
          >
            {cellContent}
          </div>
        );
      })}
    </div>
  );
};

export const VirtualizedContactTable: React.FC<VirtualizedContactTableProps> = ({
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
  height = 600,
}) => {
  const parentRef = useRef<HTMLDivElement>(null);

  // Configuration du virtualizer
  const rowVirtualizer = useVirtualizer({
    count: contacts.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 50, // Hauteur estimée de chaque ligne
    overscan: 10, // Nombre de lignes à rendre en plus pour un scroll fluide
  });

  const headerIcons: Record<string, React.ReactNode> = {
    "Prénom": <IconUser />, "Nom": <IconUser />, "Téléphone": <IconPhone />, "Mail": <IconMail />, "Statut": <IconStatus />,
    "Commentaire": <IconComment />, "Date Rappel": <IconCalendar />, "Heure Rappel": <IconClock />,
    "Date RDV": <IconCalendar />, "Heure RDV": <IconClock />, "Date Appel": <IconCalendar />, "Heure Appel": <IconClock />, "Durée Appel": <IconDuration />,
    "Actions": <IconTrash className="w-3.5 h-3.5" />
  };

  return (
    <div className={`flex flex-col h-full rounded-xl shadow-lg ${theme === Theme.Dark ? 'bg-oled-card' : 'bg-light-card'}`}>
      {/* En-tête fixe */}
      <div className={`flex items-center border-b ${theme === Theme.Dark ? 'bg-oled-bg border-oled-border' : 'bg-gray-100 border-light-border'} sticky top-0 z-10`}>
        {columnHeaders.map((header, index) => {
          if (!visibleColumns[header]) return null;
          
          const isActionsColumn = contactDataKeys[index] === 'actions';
          const isCommentColumn = contactDataKeys[index] === 'commentaire';

          return (
            <div
              key={header}
              className={`px-3 py-2.5 text-left font-semibold text-xs ${
                isActionsColumn ? 'w-16 flex justify-center' : 
                isCommentColumn ? 'min-w-[200px] flex-1' : 
                'flex-1'
              } ${theme === Theme.Dark ? 'text-oled-text-dim' : 'text-light-text-dim'}`}
            >
              <div className="flex items-center space-x-1">
                {headerIcons[header] && React.cloneElement(headerIcons[header] as React.ReactElement<{ className?: string }>, { className: "w-3.5 h-3.5"})}
                <span>{header}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Zone virtualisée */}
      <div
        ref={parentRef}
        className="flex-1 overflow-auto virtual-table-container hide-scrollbar"
        style={{ 
          height,
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        } as React.CSSProperties}
      >
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualItem) => {
            const contact = contacts[virtualItem.index];
            const callState = callStates[contact.id] || {};
            const isSelected = selectedContactId === contact.id;

            return (
              <VirtualRow
                key={contact.id}
                contact={contact}
                index={virtualItem.index}
                isSelected={isSelected}
                callState={callState}
                theme={theme}
                visibleColumns={visibleColumns}
                columnHeaders={columnHeaders}
                contactDataKeys={contactDataKeys}
                onSelectContact={onSelectContact}
                onUpdateContact={onUpdateContact}
                onDeleteContact={onDeleteContact}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              />
            );
          })}
        </div>
      </div>

      {/* Indicateur de performance */}
      <div className={`px-3 py-1 text-xs border-t ${theme === Theme.Dark ? 'bg-oled-interactive border-oled-border text-oled-text-dim' : 'bg-light-interactive border-light-border text-light-text-dim'}`}>
        Affichage virtualisé: {rowVirtualizer.getVirtualItems().length} / {contacts.length} lignes rendues
      </div>
    </div>
  );
}; 