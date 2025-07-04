"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface TimePickerOnlyProps {
  date?: Date;
  onChange?: (date?: Date) => void;
  onSave?: (date?: Date) => void;
  onClosePopover?: () => void;
  hourCycle?: 12 | 24;
  disabled?: boolean;
  className?: string;
}

export function TimePickerOnly({
  date,
  onChange,
  onSave,
  onClosePopover,
}: TimePickerOnlyProps) {
  const [hours, setHours] = React.useState<string>(() => {
    if (date) {
      return date.getHours().toString().padStart(2, "0");
    }
    return "00";
  });
  
  const [minutes, setMinutes] = React.useState<string>(() => {
    if (date) {
      return date.getMinutes().toString().padStart(2, "0");
    }
    return "00";
  });

  React.useEffect(() => {
    if (date) {
      setHours(date.getHours().toString().padStart(2, "0"));
      setMinutes(date.getMinutes().toString().padStart(2, "0"));
    }
  }, [date]);

  const handleHoursChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (/^\d{0,2}$/.test(value)) {
      setHours(value);
    }
  };

  const handleMinutesChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    if (/^\d{0,2}$/.test(value)) {
      setMinutes(value);
    }
  };

  const handleSave = () => {
    const hoursNum = parseInt(hours, 10) || 0;
    const minutesNum = parseInt(minutes, 10) || 0;
    
    if (hoursNum > 23) {
      setHours("23");
    }
    
    if (minutesNum > 59) {
      setMinutes("59");
    }
    
    const newDate = new Date();
    newDate.setHours(hoursNum > 23 ? 23 : hoursNum);
    newDate.setMinutes(minutesNum > 59 ? 59 : minutesNum);
    newDate.setSeconds(0);
    newDate.setMilliseconds(0);
    
    onChange?.(newDate);
    onSave?.(newDate);
    onClosePopover?.();
  };

  const handleCancel = () => {
    onClosePopover?.();
  };

  return (
    <div className="p-4 w-auto">
      <div className="flex items-center gap-2 justify-center mb-4">
        <Input
          className="w-[50px] text-center font-mono tabular-nums"
          value={hours}
          onChange={handleHoursChange}
          placeholder="HH"
          maxLength={2}
        />
        <span className="text-lg font-medium">:</span>
        <Input
          className="w-[50px] text-center font-mono tabular-nums"
          value={minutes}
          onChange={handleMinutesChange}
          placeholder="MM"
          maxLength={2}
        />
      </div>
      
      <div className="flex justify-between gap-2">
        <Button variant="outline" onClick={handleCancel}>
          Annuler
        </Button>
        <Button onClick={handleSave}>
          Confirmer
        </Button>
      </div>
    </div>
  );
} 