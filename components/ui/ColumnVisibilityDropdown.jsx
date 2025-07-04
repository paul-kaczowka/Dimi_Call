"use client";

import { useState, useRef, useEffect } from "react";
import { EyeIcon, EyeOffIcon, ColumnsIcon } from "lucide-react";

const ColumnVisibilityDropdown = ({ columns, visibleColumns, setVisibleColumns }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    // Fermer le dropdown quand on clique en dehors
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleColumn = (columnId) => {
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
        className="border-input data-[placeholder]:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 flex items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-9 data-[size=sm]:h-8 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 w-[180px]"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span data-slot="select-value" style={{ pointerEvents: "none" }}>
          <div className="flex items-center gap-2">
            <ColumnsIcon className="h-4 w-4" aria-hidden="true" />
            <span>Colonnes</span>
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
        <div className="absolute z-10 mt-1 right-0 w-56 bg-white dark:bg-gray-800 rounded-md shadow-lg border border-gray-200 dark:border-gray-700">
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