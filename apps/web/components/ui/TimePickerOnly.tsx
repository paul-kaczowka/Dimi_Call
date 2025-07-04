"use client";

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import * as React from 'react';
import { ScrollArea } from "@/components/ui/scroll-area";
import { isValid } from 'date-fns';
import { X } from 'lucide-react';

// ---------- utils start ----------
/**
 * regular expression to check for valid hour format (01-23)
 */
function isValidHour(value: string) {
  return /^(0[0-9]|1[0-9]|2[0-3])$/.test(value);
}

/**
 * regular expression to check for valid minute format (00-59)
 */
function isValidMinuteOrSecond(value: string) {
  return /^[0-5][0-9]$/.test(value);
}

type GetValidNumberConfig = { max: number; min?: number; loop?: boolean };

function getValidNumber(value: string, { max, min = 0, loop = false }: GetValidNumberConfig) {
  let numericValue = parseInt(value, 10);

  if (!Number.isNaN(numericValue)) {
    if (!loop) {
      if (numericValue > max) numericValue = max;
      if (numericValue < min) numericValue = min;
    } else {
      if (numericValue > max) numericValue = min;
      if (numericValue < min) numericValue = max;
    }
    return numericValue.toString().padStart(2, '0');
  }

  return '00';
}

function getValidHour(value: string) {
  if (isValidHour(value)) return value;
  return getValidNumber(value, { max: 23 });
}

function getValidMinuteOrSecond(value: string) {
  if (isValidMinuteOrSecond(value)) return value;
  return getValidNumber(value, { max: 59 });
}

export type TimePickerType = 'minutes' | 'seconds' | 'hours' | '12hours';
type Period = 'AM' | 'PM';

function convert12HourTo24Hour(hour: number, period: Period) {
  if (period === 'PM') {
    if (hour >= 1 && hour <= 11) { // 1 PM to 11 PM
      return hour + 12;
    }
    return hour; // 12 PM is 12
  }
  if (period === 'AM') {
    if (hour === 12) return 0; // 12 AM is 00
    return hour; // 1 AM to 11 AM
  }
  return hour;
}

function display12HourValue(hours: number): number {
  if (hours === 0) return 12; // 00 hours is 12 AM
  if (hours > 12) return hours - 12; // 13-23 to 1-11 PM
  return hours; // 1-12 hours
}
// ---------- utils end ----------

export interface TimePickerOnlyProps {
  date?: Date;
  onChange?: (date?: Date) => void;
  onSave?: (date?: Date) => void;
  onClosePopover?: () => void;
  hourCycle?: 12 | 24;
  className?: string;
}

export function TimePickerOnly({ 
  date: initialDate, 
  onChange, 
  onSave,
  onClosePopover,
  hourCycle = 24, 
  className
}: TimePickerOnlyProps) {
  const [currentDate, setCurrentDate] = React.useState<Date | undefined>(initialDate);
  const [period, setPeriod] = React.useState<Period>(initialDate && initialDate.getHours() >= 12 ? 'PM' : 'AM');

  React.useEffect(() => {
    setCurrentDate(initialDate);
    if (initialDate) {
        setPeriod(initialDate.getHours() >= 12 ? 'PM' : 'AM');
    }
  }, [initialDate]);

  const handleDateChange = (newDate: Date, isMinuteSelection?: boolean) => {
    if (!isValid(newDate)) {
      console.error("Tentative de mise à jour avec une date invalide:", newDate);
      return;
    }
    
    setCurrentDate(newDate);
    onChange?.(newDate);

    if (isMinuteSelection && onSave && onClosePopover) {
      onSave(newDate);
      onClosePopover();
    }
  };
  
  const getSafeDate = () => {
    const date = currentDate ?? new Date(new Date().setHours(0,0,0,0));
    return isValid(date) ? date : new Date();
  };
  
  const handleClearTime = () => {
    setCurrentDate(undefined);
    onChange?.(undefined);
    if (onSave && onClosePopover) {
      onSave(undefined);
      onClosePopover();
    }
  };

  const selectedHour = currentDate ? (hourCycle === 12 ? display12HourValue(currentDate.getHours()) : currentDate.getHours()) : null;
  const selectedMinute = currentDate ? currentDate.getMinutes() : null;

  const hoursArray = hourCycle === 24 
    ? Array.from({ length: 24 }, (_, i) => i) 
    : Array.from({ length: 12 }, (_, i) => i + 1);
  
  const minutesArray = Array.from({ length: 60 / 5 }, (_, i) => i * 5); // Intervalles de 5 minutes comme dans l'exemple
  // Ou pour chaque minute: const minutesArray = Array.from({ length: 60 }, (_, i) => i);

  return (
    <div className={cn("flex items-stretch relative", className)}>
      {/* Bouton de suppression de l'heure */}
      {currentDate && (
        <div className="absolute top-2 right-2 z-10">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 rounded-full p-0 hover:bg-muted"
            onClick={handleClearTime}
            type="button"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      )}

      <ScrollArea className="h-60 w-20 border-r">
        <div className="flex flex-col p-1 items-center">
          {hoursArray.map((hour) => (
            <Button
              key={`hour-${hour}`}
              variant={selectedHour === hour ? "default" : "ghost"}
              className="w-full my-0.5 text-sm h-8"
              onClick={() => {
                const newDate = getSafeDate();
                handleDateChange(setHours(newDate, hour, hourCycle === 12 ? period : undefined));
              }}
            >
              {hourCycle === 24 ? String(hour).padStart(2, '0') : hour}
            </Button>
          ))}
        </div>
      </ScrollArea>

      <ScrollArea className="h-60 w-20">
        <div className="flex flex-col p-1 items-center">
          {minutesArray.map((minute) => (
            <Button
              key={`minute-${minute}`}
              variant={selectedMinute === minute ? "default" : "ghost"}
              className="w-full my-0.5 text-sm h-8"
              onClick={() => {
                const newDate = getSafeDate();
                handleDateChange(setMinutes(newDate, minute), true);
              }}
            >
              {String(minute).padStart(2, '0')}
            </Button>
          ))}
        </div>
      </ScrollArea>

      {hourCycle === 12 && (
        <div className="flex flex-col justify-center items-center pl-2 border-l ml-1">
          <Button
            variant={period === 'AM' ? 'default' : 'outline'}
            className="h-10 w-12 text-xs mb-1"
            onClick={() => {
              if (period === 'PM') {
                setPeriod('AM');
                const dateToUpdate = getSafeDate();
                if (dateToUpdate.getHours() >= 12) {
                  handleDateChange(new Date(dateToUpdate.setHours(dateToUpdate.getHours() - 12)));
                }
              }
            }}
          >
            AM
          </Button>
          <Button
            variant={period === 'PM' ? 'default' : 'outline'}
            className="h-10 w-12 text-xs mt-1"
            onClick={() => {
              if (period === 'AM') {
                setPeriod('PM');
                const dateToUpdate = getSafeDate();
                if (dateToUpdate.getHours() < 12) {
                  handleDateChange(new Date(dateToUpdate.setHours(dateToUpdate.getHours() + 12)));
                }
              }
            }}
          >
            PM
          </Button>
        </div>
      )}
    </div>
  );
}

TimePickerOnly.displayName = 'TimePickerOnly';

function setMinutes(date: Date, value: string | number) {
  const minutes = getValidMinuteOrSecond(String(value));
  date.setMinutes(parseInt(minutes, 10));
  return new Date(date);
}

function setHours(date: Date, value: string | number, period?: Period) {
  const hours = getValidHour(String(value));
  date.setHours(convert12HourTo24Hour(parseInt(hours, 10), period || 'AM'));
  return new Date(date);
} 