'use client';

import React, { useState, useEffect } from 'react';
import { Contact } from '@/types/contact';
import { CellContext } from '@tanstack/react-table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface TimeCellProps extends CellContext<Contact, unknown> {
  onEditContact: (contactUpdate: Partial<Contact> & { id: string }) => void;
}

const generateHours = () => {
  const hours = [];
  for (let i = 8; i <= 20; i++) {
    hours.push(i.toString().padStart(2, '0'));
  }
  return hours;
};

const generateMinutes = () => {
  const minutes = [];
  for (let i = 0; i < 60; i += 5) {
    minutes.push(i.toString().padStart(2, '0'));
  }
  return minutes;
};

const HOURS_OPTIONS = generateHours();
const MINUTES_OPTIONS = generateMinutes();
const NO_TIME_VALUE = '--:--';

export const TimeCell: React.FC<TimeCellProps> = ({ 
  getValue, 
  row, 
  column, 
  onEditContact, 
}) => {
  const initialValueFromGetValue = getValue() as string | undefined | null;
  // console.log(`[TimeCell Init ${row.original.id} ${column.id}] initialValueFromGetValue:`, initialValueFromGetValue);

  const getHourMinuteParts = (value: string | undefined | null): [string | undefined, string | undefined] => {
    if (value && typeof value === 'string' && value.includes(':')) {
      const parts = value.split(':');
      if (parts.length === 2) {
        return [parts[0], parts[1]];
      }
    }
    return [undefined, undefined];
  };

  const [initialHour, initialMinute] = getHourMinuteParts(initialValueFromGetValue);

  const [selectedHour, setSelectedHour] = useState<string | undefined>(initialHour);
  const [selectedMinute, setSelectedMinute] = useState<string | undefined>(initialMinute);

  // console.log(`[TimeCell Init Render ${row.original.id} ${column.id}] Initial state: selectedHour=${selectedHour}, selectedMinute=${selectedMinute}. From value: ${initialValueFromGetValue}`);

  useEffect(() => {
    const currentValue = getValue() as string | undefined | null;
    // console.log(`[TimeCell Effect ${row.original.id} ${column.id}] executing. Current getValue():`, currentValue, `Current state H:${selectedHour} M:${selectedMinute}`);
    const [hourFromEffect, minuteFromEffect] = getHourMinuteParts(currentValue);

    if (hourFromEffect !== selectedHour || minuteFromEffect !== selectedMinute) {
    //   console.log(`[TimeCell Effect ${row.original.id} ${column.id}] Updating state from effect. New H=${hourFromEffect}, M=${minuteFromEffect}`);
      setSelectedHour(hourFromEffect);
      setSelectedMinute(minuteFromEffect);
    // } else {
    //   console.log(`[TimeCell Effect ${row.original.id} ${column.id}] No state change needed from effect.`);
    }
  }, [getValue()]); // Dépendance correcte pour réagir au changement de la valeur retournée par getValue()

  const updateContact = (hourToSave?: string, minuteToSave?: string) => {
    const currentId = column.id;
    let finalTimeValue: string | null = null;

    const isValidHour = hourToSave && hourToSave !== NO_TIME_VALUE.split(':')[0];
    const isValidMinute = minuteToSave && minuteToSave !== NO_TIME_VALUE.split(':')[1];

    if (isValidHour && isValidMinute) {
      finalTimeValue = `${hourToSave}:${minuteToSave}`;
    } else {
      finalTimeValue = null;
      // Ne pas appeler setSelectedHour(undefined) / setSelectedMinute(undefined) ici,
      // car cela effacerait une sélection partielle en cours.
      // L'état local selectedHour/selectedMinute reflète déjà le choix de l'utilisateur (ou son effacement partiel).
    }
    
    // console.log(`[TimeCell updateContact ${row.original.id} ${column.id}] Calling onEditContact with id: ${row.original.id}, field: ${currentId}, value: ${finalTimeValue}`);
    onEditContact({
      id: row.original.id,
      [currentId]: finalTimeValue,
    });
  };

  const handleHourChange = (hour: string) => {
    const newHour = hour === NO_TIME_VALUE.split(':')[0] ? undefined : hour;
    // console.log(`[TimeCell handleHourChange ${row.original.id} ${column.id}] newHour=${newHour}, currentSelectedMinute=${selectedMinute}`);
    setSelectedHour(newHour);
    updateContact(newHour, selectedMinute);
  };

  const handleMinuteChange = (minute: string) => {
    const newMinute = minute === NO_TIME_VALUE.split(':')[1] ? undefined : minute;
    // console.log(`[TimeCell handleMinuteChange ${row.original.id} ${column.id}] newMinute=${newMinute}, currentSelectedHour=${selectedHour}`);
    setSelectedMinute(newMinute);
    updateContact(selectedHour, newMinute);
  };
  
  // console.log(`[TimeCell Render ${row.original.id} ${column.id}] Rendering with H=${selectedHour}, M=${selectedMinute}`);

  return (
    <div className={cn("p-1 h-full flex items-center w-full space-x-1")}>
      <Select value={selectedHour ?? NO_TIME_VALUE.split(':')[0]} onValueChange={handleHourChange}>
        <SelectTrigger className={cn("w-[70px] min-h-[30px] py-1 px-2 h-auto", !selectedHour && "text-muted-foreground")}>
          <SelectValue placeholder="HH" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NO_TIME_VALUE.split(':')[0]}>--</SelectItem>
          {HOURS_OPTIONS.map((hourOpt) => (
            <SelectItem key={hourOpt} value={hourOpt}>
              {hourOpt}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <span>:</span>
      <Select value={selectedMinute ?? NO_TIME_VALUE.split(':')[1]} onValueChange={handleMinuteChange}>
        <SelectTrigger className={cn("w-[70px] min-h-[30px] py-1 px-2 h-auto", !selectedMinute && "text-muted-foreground")}>
          <SelectValue placeholder="MM" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NO_TIME_VALUE.split(':')[1]}>--</SelectItem>
          {MINUTES_OPTIONS.map((minuteOpt) => (
            <SelectItem key={minuteOpt} value={minuteOpt}>
              {minuteOpt}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {(selectedHour || selectedMinute) && (
        <Button 
          variant="ghost" 
          size="icon"
          className="h-7 w-7 p-0 ml-1 text-muted-foreground hover:text-destructive"
          onClick={() => {
            // console.log(`[TimeCell ClearButton ${row.original.id} ${column.id}] Clearing time.`);
            setSelectedHour(undefined);
            setSelectedMinute(undefined);
            updateContact(undefined, undefined);
          }}
          aria-label="Effacer l'heure"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </Button>
      )}
    </div>
  );
}; 