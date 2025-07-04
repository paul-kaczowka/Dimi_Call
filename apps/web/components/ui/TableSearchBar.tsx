'use client';

import * as React from 'react';
import { useMemo, useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export interface SearchableColumn {
  value: string;
  label: string;
  icon: React.ReactElement<{ className?: string }>;
}

interface TableSearchBarProps {
  columns: SearchableColumn[];
  initialSelectedColumnValue?: string;
  initialSearchTerm?: string;
  onSearchChange: (searchTerm: string, selectedColumn: string) => void;
  className?: string;
}

export function TableSearchBar({
  columns,
  initialSelectedColumnValue = '',
  initialSearchTerm = '',
  onSearchChange,
  className
}: TableSearchBarProps) {
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [selectedColumn, setSelectedColumn] = useState(initialSelectedColumnValue);
  
  const validColumns = useMemo(() => columns.filter(col => col.value && col.value.trim() !== ''), [columns]);

  useEffect(() => {
    if (initialSelectedColumnValue !== selectedColumn && 
        validColumns.find(col => col.value === initialSelectedColumnValue)) {
      setSelectedColumn(initialSelectedColumnValue);
    }
  }, [initialSelectedColumnValue, selectedColumn, validColumns]);

  useEffect(() => {
    if (initialSearchTerm !== searchTerm) {
      setSearchTerm(initialSearchTerm);
    }
  }, [initialSearchTerm, searchTerm]);

  const handleSearchTermChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const newTerm = event.target.value;
    setSearchTerm(newTerm);
    requestAnimationFrame(() => {
      onSearchChange(newTerm, selectedColumn);
    });
  }, [onSearchChange, selectedColumn]);

  const handleSelectedColumnChange = useCallback((value: string) => {
    setSelectedColumn(value);
    requestAnimationFrame(() => {
      onSearchChange(searchTerm, value);
    });
  }, [onSearchChange, searchTerm]);

  const selectedColumnObj = useMemo(() => 
    validColumns.find(col => col.value === selectedColumn) || validColumns[0], 
    [selectedColumn, validColumns]
  );

  return (
    <div className={cn("flex items-end gap-2", className)}>
      <div className="flex-1">
        <Input
          type="text"
          value={searchTerm}
          onChange={handleSearchTermChange}
          placeholder={`Rechercher par ${selectedColumnObj?.label || 'valeur'}...`}
          className="flex-1"
        />
      </div>
      <Select value={selectedColumn} onValueChange={handleSelectedColumnChange}>
        <SelectTrigger className="w-[180px]">
          <SelectValue>
            <div className="flex items-center gap-2">
              {selectedColumnObj?.icon && React.cloneElement(selectedColumnObj.icon, { className: "h-4 w-4" })}
              <span>{selectedColumnObj?.label || 'Sélectionnez une colonne'}</span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {validColumns.map((column) => (
            <SelectItem key={column.value} value={column.value}>
              <div className="flex items-center gap-2">
                {column.icon && React.cloneElement(column.icon, { className: "h-4 w-4" })}
                <span>{column.label}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// Exemple d'icônes Lucide pour référence (à adapter par le composant parent lors de la définition des colonnes)
// export const iconMap = {
//   user: <User />,
//   mail: <Mail />,
//   phone: <Phone />,
//   info: <Info />,
//   messageSquareText: <MessageSquareText />,
//   bellRing: <BellRing />,
//   clock: <Clock />,
//   calendarDays: <CalendarDays />,
//   phoneOutgoing: <PhoneOutgoing />,
//   hourglass: <Hourglass />,
//   waypoints: <Waypoints />,
// }; 