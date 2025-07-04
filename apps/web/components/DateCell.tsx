'use client';

import React, { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Contact } from '@/types/contact';
import { CellContext } from '@tanstack/react-table';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface DateCellProps extends CellContext<Contact, unknown> {
  onEditContact: (contactUpdate: Partial<Contact> & { id: string }) => void;
  placeholder?: string;
}

export const DateCell: React.FC<DateCellProps> = ({ 
  getValue, 
  row, 
  column, 
  onEditContact, 
  placeholder = "Choisir une date"
}) => {
  const initialValue = getValue() as string | Date | undefined;
  const [date, setDate] = useState<Date | undefined>(() => {
    if (!initialValue) return undefined;
    if (typeof initialValue === 'string') {
      // Les chaînes YYYY-MM-DD sont interprétées comme UTC par new Date(), 
      // ce qui peut causer un décalage. parseISO de date-fns est plus robuste.
      // Ou, pour être sûr de la localité, on peut splitter et construire :
      // const [year, month, day] = initialValue.split('-').map(Number);
      // return new Date(year, month - 1, day);
      return parseISO(initialValue); // date-fns parseISO
    } 
    return new Date(initialValue); // Si c'est déjà un objet Date
  });
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  useEffect(() => {
    const val = getValue() as string | Date | undefined;
    if (!val) {
      setDate(undefined);
    } else if (typeof val === 'string') {
      // setDate(new Date(val.split('-')[0], val.split('-')[1]-1, val.split('-')[2]));
      setDate(parseISO(val));
    } else {
      setDate(new Date(val));
    }
  }, [getValue]);

  const handleDateSelect = (selectedDate: Date | undefined) => {
    setDate(selectedDate);
    // Utiliser format de date-fns pour obtenir YYYY-MM-DD à partir des composantes locales de la date
    const valueToSave = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null;

    // Vérifier si l'ID du contact est défini avant d'appeler onEditContact
    if (row.original.id) {
      onEditContact({
        id: row.original.id,
        [column.id]: valueToSave,
      });
    } else {
      console.error("Impossible de mettre à jour le contact: ID manquant.");
      // Optionally show a user-facing error message
      // toast.error("Erreur: Impossible de sauvegarder la modification (ID contact manquant).");
    }
    setIsPopoverOpen(false); // Fermer le popover après la sélection
  };

  const handleClearDate = () => {
    setDate(undefined);
    // Vérifier si l'ID du contact est défini avant d'appeler onEditContact
    if (row.original.id) {
      onEditContact({
        id: row.original.id,
        [column.id]: null, // Envoyer null pour effacer la date
      });
    } else {
      console.error("Impossible de mettre à jour le contact: ID manquant pour effacer la date.");
      // Optionally show a user-facing error message
      // toast.error("Erreur: Impossible d'effacer la date (ID contact manquant).");
    }
    setIsPopoverOpen(false); // S'assurer que le popover est fermé
  };

  return (
    <div className={cn("p-1 h-full flex items-center w-full space-x-1")}>
      <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
        <PopoverTrigger asChild>
          <Button
            variant={"outline"}
            className={cn(
              "justify-start text-left font-normal h-auto min-h-[30px] py-1 px-2",
              !date && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date ? format(date, "dd/MM/yyyy") : <span>{placeholder}</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleDateSelect}
            initialFocus
            weekStartsOn={1} // 0 pour Dimanche, 1 pour Lundi
          />
        </PopoverContent>
      </Popover>
      {date && (
        <Button 
          variant="ghost" 
          size="icon"
          className="h-7 w-7 p-0 ml-1 text-muted-foreground hover:text-destructive"
          onClick={handleClearDate}
          aria-label="Effacer la date"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </Button>
      )}
    </div>
  );
}; 