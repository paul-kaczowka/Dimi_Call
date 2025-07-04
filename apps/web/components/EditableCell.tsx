import React, { useState, useEffect, useRef } from 'react';
import { CellContext } from '@tanstack/react-table';
import { Contact } from '@/types/contact';
import { Input } from '@/components/ui/input';
import { format as formatDateFns, parseISO, isValid as isValidDate, parse as parseDateFns } from 'date-fns';
import { fr } from 'date-fns/locale';
import { X } from 'lucide-react';

// Helper function to parse DD/MM/YYYY to YYYY-MM-DD
const parseDisplayDateToISO = (dateString: string): string | null => {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) return null; // Basic format check
  try {
    const parsed = parseDateFns(dateString, 'dd/MM/yyyy', new Date());
    if (isValidDate(parsed)) {
      return formatDateFns(parsed, 'yyyy-MM-dd');
    }
    return null;
  } catch {
    return null;
  }
};

// Helper function to validate HH:MM
const isValidTimeFormat = (timeString: string): boolean => {
  return /^([01]\d|2[0-3]):([0-5]\d)$/.test(timeString);
};

interface EditableCellProps extends CellContext<Contact, unknown> {
  onEditContact: (contactUpdate: Partial<Contact> & { id: string }) => void;
  displayValueOverride?: React.ReactNode;
}

export const EditableCell: React.FC<EditableCellProps> = React.memo(({
  getValue,
  row,
  column,
  onEditContact,
  displayValueOverride,
}) => {
  const initialValue = getValue() as string | null | undefined;
  const [currentValue, setCurrentValue] = useState(initialValue); // Pour l'input texte
  const [isEditingText, setIsEditingText] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const cellType = (column.columnDef.meta as { cellType?: string })?.cellType || 'text';

  // Effet pour synchroniser les valeurs lorsque les données externes changent
  useEffect(() => {
    setCurrentValue(initialValue);
  }, [initialValue]);

  // Fonction pour auto-formater la date JJ/MM/AAAA
  const autoFormatDateInput = (value: string): string => {
    let cleanValue = value.replace(/[^\d]/g, ''); // Garder uniquement les chiffres
    if (cleanValue.length > 8) cleanValue = cleanValue.substring(0, 8);

    if (cleanValue.length >= 5) {
      return `${cleanValue.substring(0, 2)}/${cleanValue.substring(2, 4)}/${cleanValue.substring(4)}`;
    } else if (cleanValue.length >= 3) {
      return `${cleanValue.substring(0, 2)}/${cleanValue.substring(2)}`;
    }
    return cleanValue;
  };

  // Fonction pour auto-formater l'heure HH:MM
  const autoFormatTimeInput = (value: string): string => {
    let cleanValue = value.replace(/[^\d]/g, '');
    if (cleanValue.length > 4) cleanValue = cleanValue.substring(0, 4);

    if (cleanValue.length >= 3) {
      return `${cleanValue.substring(0, 2)}:${cleanValue.substring(2)}`;
    }
    return cleanValue;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    if (cellType === 'date') {
      // Permettre la suppression des slashs
      if (currentValue && currentValue.endsWith('/') && inputValue.length < currentValue.length) {
        // Si l'utilisateur supprime un slash, supprimer aussi le chiffre avant pour éviter 22//
        if ( (currentValue.length === 3 && inputValue.length ===2) || (currentValue.length === 6 && inputValue.length === 5 )){
             setCurrentValue(inputValue.slice(0, -1)); 
             return;
        }
      } else {
          setCurrentValue(autoFormatDateInput(inputValue));
      }
    } else if (cellType === 'time') {
       if (currentValue && currentValue.endsWith(':') && inputValue.length < currentValue.length) {
         if (currentValue.length === 3 && inputValue.length === 2){
            setCurrentValue(inputValue.slice(0, -1));
            return;
         }
       } else {
        setCurrentValue(autoFormatTimeInput(inputValue));
       }
    } else {
      setCurrentValue(inputValue);
    }
  };

  useEffect(() => {
    setCurrentValue(initialValue);
    if (isEditingText && inputRef.current) {
      inputRef.current.focus();
      // Si c'est une date ou une heure, formater pour l'édition
      if (cellType === 'date' && initialValue) {
        try {
          const parsed = parseISO(initialValue); // Assume YYYY-MM-DD or full ISO
          if (isValidDate(parsed)) {
            setCurrentValue(formatDateFns(parsed, 'dd/MM/yyyy'));
          } else {
            setCurrentValue(''); // ou initialValue si on veut garder l'erreur
          }
        } catch { setCurrentValue(''); }
      } else if (cellType === 'time' && initialValue) {
        // Heure est déjà en HH:MM, ou devrait l'être
         if (isValidTimeFormat(initialValue)) {
            setCurrentValue(initialValue);
         } else {
            // tenter de parser si c'est une date ISO avec heure
            try {
                const parsed = parseISO(initialValue);
                if(isValidDate(parsed)){
                    setCurrentValue(formatDateFns(parsed, 'HH:mm'));
                } else {
                    setCurrentValue('');
                }
            } catch { setCurrentValue('');}
         }
      }
    }
  }, [initialValue, isEditingText, cellType]);

  const handleSave = (valueToSave: string | null) => {
    // Si la cellule n'est plus en mode édition (par exemple, à cause d'un re-rendu parent),
    // ne pas procéder à la sauvegarde pour éviter des appels non intentionnels.
    if (!isEditingText) {
      return;
    }

    let finalValue: string | null = valueToSave;

    if (cellType === 'date' && valueToSave) {
      const isoDate = parseDisplayDateToISO(valueToSave);
      if (isoDate) {
        finalValue = isoDate;
      } else {
        // toast.error("Format de date invalide. Utilisez JJ/MM/AAAA."); // Optionnel: feedback utilisateur
        console.warn(`[EditableCell] Date invalide pour sauvegarde: ${valueToSave}, attendu JJ/MM/AAAA`);
        setIsEditingText(false); // Quitter le mode édition sans sauvegarder
        setCurrentValue(initialValue); // Revenir à la valeur initiale affichée
        return;
      }
    } else if (cellType === 'time' && valueToSave) {
      if (!isValidTimeFormat(valueToSave)) {
        // toast.error("Format d'heure invalide. Utilisez HH:MM."); // Optionnel
        console.warn(`[EditableCell] Heure invalide pour sauvegarde: ${valueToSave}, attendu HH:MM`);
        setIsEditingText(false);
        setCurrentValue(initialValue);
        return;
      }
      // finalValue est déjà au bon format HH:MM
    }

    if (finalValue !== initialValue) {
      console.log(`[EditableCell] Attempting to save. Column ID: ${column.id}, Original Value: ${initialValue}, New Value (finalValue): ${finalValue}`);
      // Mettre à jour la valeur locale avant d'envoyer au serveur pour une UI réactive
      setCurrentValue(finalValue);
      onEditContact({
        id: row.original.id,
        [column.id]: finalValue,
      });
    }
    setIsEditingText(false);
  };

  const handleCancelTextEdit = () => {
    setCurrentValue(initialValue); // Revenir à la valeur brute d'origine
    setIsEditingText(false);
  };

  const handleTextKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleSave(event.currentTarget.value);
    } else if (event.key === 'Escape') {
      handleCancelTextEdit();
    }
  };

  const handleClearValue = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleSave(null);
  };
  
  const handleCellClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (cellType === 'text' || cellType === 'date' || cellType === 'time' || cellType === 'datetime') { // Étendre aux types date/time
        setIsEditingText(true);
    }
    // Pour d'autres types de cellules qui pourraient utiliser des popovers,
    // la logique d'ouverture de popover serait ici, mais nous l'avons retirée pour date/time.
  };


  // AFFICHAGE DE LA CELLULE
  let displayContent: React.ReactNode;

  if (isEditingText) {
    let placeholder = '';
    if (cellType === 'date') placeholder = 'JJ/MM/AAAA';
    if (cellType === 'time') placeholder = 'HH:MM';

    return (
      <Input
        ref={inputRef}
        type="text"
        value={currentValue ?? ''}
        placeholder={placeholder}
        onChange={handleInputChange}
        onBlur={(e) => handleSave(e.target.value)}
        onKeyDown={handleTextKeyDown}
        // autoFocus // Géré par useEffect et inputRef.current.focus()
        className="h-full py-1 px-2 text-sm border-muted focus:ring-1 focus:ring-ring focus:ring-offset-0 bg-background rounded-sm min-w-[50px] w-full"
      />
    );
  }

  // Logique d'affichage non-édition
  if (displayValueOverride) {
    displayContent = displayValueOverride;
  } else if (currentValue) {
    if (cellType === 'date') {
      try {
        // Tenter d'abord de parser comme ISO (YYYY-MM-DD)
        let parsed = parseISO(currentValue as string);

        if (!isValidDate(parsed)) {
          // Si ISO échoue, tenter de parser comme JJ/MM/AAAA
          parsed = parseDateFns(currentValue as string, 'dd/MM/yyyy', new Date());
        }

        displayContent = isValidDate(parsed) ? formatDateFns(parsed, 'dd/MM/yyyy', { locale: fr }) : <span className="text-destructive italic">{`Inv: ${currentValue}`}</span>;
      } catch {
        displayContent = <span className="text-destructive italic">{`Err: ${currentValue}`}</span>;
      }
    } else if (cellType === 'time') {
       // Tenter de valider HH:MM ou HH:MM:SS
       if (isValidTimeFormat(currentValue as string)) {
           displayContent = currentValue; // Déjà en HH:MM
       } else if (/^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/.test(currentValue as string)) {
            displayContent = (currentValue as string).substring(0, 5); // HH:MM à partir de HH:MM:SS
       } else {
            // Tenter de parser comme une date ISO et extraire l'heure (fallback)
            try {
                const parsed = parseISO(currentValue as string);
                if(isValidDate(parsed)){
                    displayContent = formatDateFns(parsed, 'HH:mm', { locale: fr });
                } else {
                    displayContent = <span className="text-destructive italic">{`Inv: ${currentValue}`}</span>;
                }
            } catch {
                 displayContent = <span className="text-destructive italic">{`ErrH: ${currentValue}`}</span>;
            }
       }
    } else {
      displayContent = String(currentValue);
    }
  } else {
    displayContent = <span className="text-muted-foreground italic">Vide</span>;
  }

  return (
    <div 
      className="p-2 h-full min-h-[30px] flex items-center cursor-pointer w-full relative"
      onClick={handleCellClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {displayContent}
      {isHovered && currentValue && (
        <button
          onClick={handleClearValue}
          className="absolute right-1 top-1/2 transform -translate-y-1/2 p-0.5 bg-background/50 hover:bg-destructive/20 rounded-full z-10"
          aria-label="Effacer la valeur"
        >
          <X className="h-3 w-3 text-muted-foreground hover:text-destructive-foreground" />
        </button>
      )}
    </div>
  );
});
EditableCell.displayName = 'EditableCell'; 