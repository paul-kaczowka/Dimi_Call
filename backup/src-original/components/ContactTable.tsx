
import React, { useState, useEffect, useRef, useCallback } from 'react';
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

interface StatusComboBoxProps {
  value: ContactStatus;
  onChange: (newStatus: ContactStatus) => void;
  theme: Theme;
}

const StatusComboBox: React.FC<StatusComboBoxProps> = ({ value, onChange, theme }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const colors = STATUS_COLORS[value] || STATUS_COLORS[ContactStatus.NonDefini];
  const currentBg = theme === Theme.Dark ? colors.darkBg : colors.bg;
  const currentText = theme === Theme.Dark ? colors.darkText : colors.text;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full text-left px-2 py-1 rounded text-xs font-medium min-w-[100px] ${currentBg} ${currentText} border ${theme === Theme.Dark ? 'border-oled-border' : 'border-light-border'}`}
      >
        {value}
      </button>
      {isOpen && (
        <div className={`absolute z-10 mt-1 w-full rounded-md shadow-lg ${theme === Theme.Dark ? 'bg-oled-interactive border border-oled-border' : 'bg-light-interactive border border-light-border'}`}>
          {STATUS_OPTIONS.map(status => {
            const optionColors = STATUS_COLORS[status];
            const optionBg = theme === Theme.Dark ? optionColors.darkBg : optionColors.bg;
            const optionText = theme === Theme.Dark ? optionColors.darkText : optionColors.text;
            return (
              <button
                key={status}
                onClick={() => { onChange(status); setIsOpen(false); }}
                className={`block w-full text-left px-3 py-1.5 text-xs ${optionBg} ${optionText} hover:brightness-110`}
              >
                {status}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

interface CommentWidgetProps {
  value: string;
  onChange: (newComment: string) => void;
  theme: Theme;
}

const CommentWidget: React.FC<CommentWidgetProps> = ({ value, onChange, theme }) => {
  const [comment, setComment] = useState(value);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => setComment(value), [value]); 

  const handleBlur = () => {
    if (comment !== value) {
      onChange(comment);
    }
  };
  
  const insertQuickComment = (quickComment: string) => {
    const newComment = (comment ? comment + " " : "") + quickComment;
    setComment(newComment);
    onChange(newComment); 
    setIsMenuOpen(false);
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuRef]);

  return (
    <div className="flex items-center space-x-1">
      <input
        type="text"
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        onBlur={handleBlur}
        placeholder="Commentaire..."
        className={`flex-grow px-2 py-1 text-xs rounded bg-transparent border-none focus:ring-1 ${theme === Theme.Dark ? 'text-oled-text focus:ring-oled-accent' : 'text-light-text focus:ring-light-accent'}`}
      />
      <div className="relative" ref={menuRef}>
        <Button onClick={() => setIsMenuOpen(!isMenuOpen)} variant="ghost" size="sm" className="!p-1">
          <IconZap className={`${theme === Theme.Dark ? 'text-oled-text-dim' : 'text-light-text-dim'} w-3.5 h-3.5`} />
        </Button>
        {isMenuOpen && (
          <div className={`absolute right-0 mt-1 w-36 rounded-md shadow-lg z-10 ${theme === Theme.Dark ? 'bg-oled-interactive border border-oled-border' : 'bg-light-interactive border border-light-border'}`}>
            {QUICK_COMMENTS.map(qc => (
              <button
                key={qc}
                onClick={() => insertQuickComment(qc)}
                className={`block w-full text-left px-3 py-1.5 text-xs ${theme === Theme.Dark ? 'text-oled-text hover:bg-oled-interactive-hover' : 'text-light-text hover:bg-light-interactive-hover'}`}
              >
                {qc}
              </button>
            ))}
          </div>
        )}
      </div>
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
  const inputType = type === 'date' ? 'date' : 'time';

  useEffect(() => setCurrentValue(value), [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentValue(e.target.value);
  };

  const handleBlur = () => {
    if (currentValue !== value) {
      onChange(currentValue);
    }
  };

  const Icon = type === 'date' ? IconCalendar : IconClock;

  return (
    <div className="flex items-center space-x-1">
      <Icon className={`w-3.5 h-3.5 ${theme === Theme.Dark ? 'text-oled-text-dim' : 'text-light-text-dim'}`} />
      <input
        type={inputType}
        value={currentValue}
        onChange={handleChange}
        onBlur={handleBlur}
        className={`w-full px-1.5 py-0.5 text-xs rounded bg-transparent border-none focus:ring-1 ${theme === Theme.Dark ? 'text-oled-text focus:ring-oled-accent [color-scheme:dark]' : 'text-light-text focus:ring-light-accent'}`}
      />
    </div>
  );
};


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
}

export const ContactTable: React.FC<ContactTableProps> = ({
  contacts,
  callStates,
  onSelectContact,
  selectedContactId,
  onUpdateContact,
  onDeleteContact,
  theme,
  visibleColumns,
  columnHeaders,
  contactDataKeys,
}) => {
  const [sortConfig, setSortConfig] = useState<{ key: keyof Contact | null; direction: 'ascending' | 'descending' }>({ key: null, direction: 'ascending' });
  const [editingCell, setEditingCell] = useState<{ contactId: string; columnKey: keyof Contact } | null>(null);
  const [editValue, setEditValue] = useState<string>("");
  const editInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingCell && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingCell]);

  const handleCellDoubleClick = (contactId: string, columnKey: keyof Contact, currentValue: any) => {
    const editableKeys: (keyof Contact)[] = ['prenom', 'nom', 'telephone', 'email', 'ecole'];
    if (editableKeys.includes(columnKey)) {
      setEditingCell({ contactId, columnKey });
      setEditValue(String(currentValue));
    }
  };

  const handleEditCommit = () => {
    if (editingCell) {
      onUpdateContact({ id: editingCell.contactId, [editingCell.columnKey]: editValue });
      setEditingCell(null);
    }
  };

  const handleEditKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleEditCommit();
    } else if (e.key === 'Escape') {
      setEditingCell(null);
    }
  };
  
  const sortedContacts = React.useMemo(() => {
    let sortableItems = [...contacts];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        const valA = a[sortConfig.key!];
        const valB = b[sortConfig.key!];

        if (typeof valA === 'number' && typeof valB === 'number') {
          return sortConfig.direction === 'ascending' ? valA - valB : valB - valA;
        }
        if (typeof valA === 'string' && typeof valB === 'string') {
          return sortConfig.direction === 'ascending' ? valA.localeCompare(valB) : valB.localeCompare(valA);
        }
        const strA = String(valA).toLowerCase();
        const strB = String(valB).toLowerCase();
        return sortConfig.direction === 'ascending' ? strA.localeCompare(strB) : strB.localeCompare(strA);
      });
    }
    return sortableItems;
  }, [contacts, sortConfig]);
  
  const requestSort = (key: keyof Contact) => {
    let direction: 'ascending' | 'descending' = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  const getSortIndicator = (columnKey: keyof Contact) => {
    if (sortConfig.key === columnKey) {
      return sortConfig.direction === 'ascending' ? <IconChevronUp className="w-3 h-3"/> : <IconChevronDown className="w-3 h-3"/>;
    }
    return null;
  };

  const headerIcons: Record<string, React.ReactNode> = {
    "Prénom": <IconUser />, "Nom": <IconUser />, "Téléphone": <IconPhone />, "Mail": <IconMail />, "Statut": <IconStatus />,
    "Commentaire": <IconComment />, "Date Rappel": <IconCalendar />, "Heure Rappel": <IconClock />,
    "Date RDV": <IconCalendar />, "Heure RDV": <IconClock />, "Date Appel": <IconCalendar />, "Heure Appel": <IconClock />, "Durée Appel": <IconDuration />,
    "Actions": <IconTrash className="w-3.5 h-3.5" />
  };
  
  const editableColumnKeys: (keyof Contact)[] = ['prenom', 'nom', 'telephone', 'email', 'ecole'];


  return (
    <div className={`overflow-auto h-full rounded-xl shadow-lg ${theme === Theme.Dark ? 'bg-oled-card scrollbar-thumb-oled-border scrollbar-track-transparent' : 'bg-light-card scrollbar-thumb-light-border scrollbar-track-transparent'} scrollbar-thin`}>
      <table className="min-w-full divide-y divide-oled-border dark:divide-oled-border text-xs">
        <thead className={`${theme === Theme.Dark ? 'bg-oled-bg' : 'bg-gray-100 dark:bg-oled-bg'} sticky top-0 z-10`}>
          <tr>
            {columnHeaders.map((header, index) => {
              if (!visibleColumns[header]) return null;
              
              const currentDataKey = contactDataKeys[index];
              const isSortable = currentDataKey !== null && currentDataKey !== 'actions' && typeof currentDataKey === 'string' && contacts.length > 0 && currentDataKey in contacts[0];
              const sortableKey = isSortable ? currentDataKey as keyof Contact : undefined;

              return (
              <th
                key={header}
                scope="col"
                onClick={() => {
                  if (sortableKey) {
                    requestSort(sortableKey);
                  }
                }}
                className={`px-3 py-2.5 text-left font-semibold ${isSortable ? 'cursor-pointer' : ''} ${theme === Theme.Dark ? 'text-oled-text-dim hover:text-oled-text' : 'text-light-text-dim hover:text-light-text'}`}
              >
                <div className="flex items-center space-x-1">
                  {headerIcons[header] && React.cloneElement(headerIcons[header] as React.ReactElement<{ className?: string }>, { className: "w-3.5 h-3.5"})}
                  <span>{header}</span>
                  {isSortable && sortableKey && getSortIndicator(sortableKey)}
                </div>
              </th>
            )})}
          </tr>
        </thead>
        <tbody className={`divide-y ${theme === Theme.Dark ? 'divide-oled-border bg-oled-card' : 'divide-light-border bg-light-card'}`}>
          {sortedContacts.map((contact) => {
            const isSelected = selectedContactId === contact.id;
            const callState = callStates[contact.id] || {};
            let rowBgClass = isSelected ? (theme === Theme.Dark ? 'bg-oled-accent/30' : 'bg-light-accent/30') : (theme === Theme.Dark ? 'hover:bg-oled-interactive-hover' : 'hover:bg-light-interactive-hover');
            
            if (callState.isCalling) rowBgClass = theme === Theme.Dark ? 'bg-yellow-600/50' : 'bg-yellow-300/50';
            else if (callState.hasBeenCalled) rowBgClass = theme === Theme.Dark ? 'bg-green-700/40' : 'bg-green-300/40';

            return (
              <tr
                key={contact.id}
                onClick={() => onSelectContact(contact)}
                onDoubleClick={() => {
                  // Allow double click to select, but specific cell double click will override for editing
                  onSelectContact(contact);
                }}
                className={`cursor-pointer ${rowBgClass} ${theme === Theme.Dark ? 'text-oled-text' : 'text-light-text'}`}
              >
                {columnHeaders.map((header, index) => {
                  if (!visibleColumns[header]) return null;
                  const key = contactDataKeys[index];
                  if (!key) return <td key={`${contact.id}-${header}`} className="px-3 py-1.5 whitespace-nowrap"></td>; 

                  let cellContent: React.ReactNode;
                  const isCurrentlyEditing = editingCell?.contactId === contact.id && editingCell?.columnKey === key;

                  if (key === 'actions') {
                    cellContent = (
                      <Button 
                        onClick={(e) => { e.stopPropagation(); onDeleteContact(contact.id); }} 
                        variant="ghost" 
                        size="sm" 
                        className="!p-1 text-red-500 hover:text-red-400"
                        title="Supprimer Contact"
                      >
                        <IconTrash className="w-4 h-4" />
                      </Button>
                    );
                  } else if (isCurrentlyEditing && editableColumnKeys.includes(key as keyof Contact)) {
                    cellContent = (
                      <input
                        ref={editInputRef}
                        type={key === 'email' ? 'email' : key === 'telephone' ? 'tel' : 'text'}
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={handleEditCommit}
                        onKeyDown={handleEditKeyDown}
                        onClick={(e) => e.stopPropagation()} // Prevent row selection when clicking input
                        className={`w-full px-1 py-0.5 text-xs rounded border focus:ring-1 ${theme === Theme.Dark ? 'bg-oled-interactive border-oled-accent text-oled-text focus:ring-oled-accent focus:border-oled-accent' : 'bg-white border-light-accent text-light-text focus:ring-light-accent focus:border-light-accent'}`}
                      />
                    );
                  } else {
                    switch(key) {
                      case 'statut':
                        cellContent = <StatusComboBox value={contact.statut} onChange={(newStatus) => onUpdateContact({ ...contact, statut: newStatus })} theme={theme} />;
                        break;
                      case 'commentaire':
                        cellContent = <CommentWidget value={contact.commentaire} onChange={(newComment) => onUpdateContact({ ...contact, commentaire: newComment })} theme={theme} />;
                        break;
                      case 'dateRappel':
                      case 'dateRDV':
                      case 'dateAppel':
                        cellContent = <DateTimeCell type="date" value={contact[key] as string} onChange={(val) => onUpdateContact({id: contact.id, [key]: val})} theme={theme} />;
                        break;
                      case 'heureRappel':
                      case 'heureRDV':
                      case 'heureAppel':
                        cellContent = <DateTimeCell type="time" value={contact[key] as string} onChange={(val) => onUpdateContact({id: contact.id, [key]: val})} theme={theme} />;
                        break;
                      default:
                        cellContent = contact[key as keyof Contact]; 
                    }
                  }
                  return (
                    <td 
                        key={`${contact.id}-${header}`} 
                        className={`px-3 py-1.5 ${key === 'email' ? 'truncate max-w-xs' : (key === 'actions' ? 'w-12 text-center' : 'whitespace-nowrap')} ${key === 'commentaire' ? 'min-w-[200px]' : ''}`}
                        onDoubleClick={(e) => {
                          if (key !== 'actions' && editableColumnKeys.includes(key as keyof Contact)) {
                            e.stopPropagation(); // Prevent row selection if already double-clicking to edit
                            handleCellDoubleClick(contact.id, key as keyof Contact, contact[key as keyof Contact]);
                          }
                        }}
                    >
                        {cellContent}
                    </td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
