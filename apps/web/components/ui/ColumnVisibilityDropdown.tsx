"use client";

import React, { useState, useRef, useEffect } from "react";
import { EyeIcon, EyeOffIcon, ColumnsIcon } from "lucide-react";

interface ColumnDefinition {
  id: string;
  label: string;
}

interface ColumnVisibilityDropdownProps {
  columns: ColumnDefinition[];
  visibleColumns: string[];
  setVisibleColumns: React.Dispatch<React.SetStateAction<string[]>>;
}

const ColumnVisibilityDropdown: React.FC<ColumnVisibilityDropdownProps> = ({ 
  columns, 
  visibleColumns, 
  setVisibleColumns 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Fermer le dropdown quand on clique en dehors
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleColumn = (columnId: string) => {
    setVisibleColumns((prev) => {
      if (prev.includes(columnId)) {
        return prev.filter((id) => id !== columnId);
      } else {
        return [...prev, columnId];
      }
    });
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        role="combobox"
        aria-expanded={isOpen}
        aria-autocomplete="none"
        dir="ltr"
        data-state={isOpen ? "open" : "closed"}
        data-slot="select-trigger"
        data-size="default"
        className="border-input data-[placeholder]:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 flex items-center justify-center rounded-md border bg-transparent text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 size-9"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span data-slot="select-value" style={{ pointerEvents: "none" }}>
          <div className="flex items-center gap-2">
            <ColumnsIcon className="h-4 w-4" aria-hidden="true" />
          </div>
        </span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="lucide lucide-chevron-down size-4 opacity-50"
          aria-hidden="true"
        >
          <path d="m6 9 6 6 6-6"></path>
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 right-0 w-56 bg-background rounded-md shadow-lg border border-gray-200 dark:border-gray-700">
          <div className="p-2">
            <h6 className="font-medium text-sm px-2 py-1.5 text-gray-500 dark:text-gray-400">
              Visibilité des colonnes
            </h6>
            <div className="mt-1">
              {columns.map((column) => (
                <button
                  key={column.id}
                  className="flex items-center justify-between w-full px-2 py-1.5 text-sm text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                  onClick={() => toggleColumn(column.id)}
                >
                  <span>{column.label}</span>
                  {visibleColumns.includes(column.id) ? (
                    <EyeIcon className="h-4 w-4 text-gray-500" />
                  ) : (
                    <EyeOffIcon className="h-4 w-4 text-gray-500" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ColumnVisibilityDropdown; 