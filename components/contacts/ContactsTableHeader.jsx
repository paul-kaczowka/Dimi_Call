"use client";

import { useState } from "react";
import { UserIcon } from "lucide-react";
import ColumnVisibilityDropdown from "../ui/ColumnVisibilityDropdown";

const ContactsTableHeader = ({ 
  onSearch, 
  searchField, 
  setSearchField,
  columns,
  visibleColumns,
  setVisibleColumns
}) => {
  return (
    <div className="mb-2 sm:mb-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4">
      <div className="w-full sm:w-auto">
        <div className="flex items-end gap-2 w-full">
          <div className="flex-1">
            <input
              data-slot="input"
              className="file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs transition-[color,box-shadow] outline-none file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive flex-1"
              placeholder="Rechercher par Prénom..."
              type="text"
              value={onSearch || ""}
              onChange={(e) => onSearch && onSearch(e.target.value)}
            />
          </div>
          <button
            type="button"
            role="combobox"
            aria-expanded="false"
            aria-autocomplete="none"
            dir="ltr"
            data-state="closed"
            data-slot="select-trigger"
            data-size="default"
            className="border-input data-[placeholder]:text-muted-foreground [&_svg:not([class*='text-'])]:text-muted-foreground focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:bg-input/30 dark:hover:bg-input/50 flex items-center justify-between gap-2 rounded-md border bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50 data-[size=default]:h-9 data-[size=sm]:h-8 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 w-[180px]"
            onClick={() => {/* Logique pour ouvrir le dropdown de champs de recherche */}}
          >
            <span data-slot="select-value" style={{ pointerEvents: "none" }}>
              <div className="flex items-center gap-2">
                <UserIcon className="h-4 w-4" />
                <span>Prénom</span>
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
        </div>
      </div>
      
      {/* Bouton de visibilité des colonnes */}
      <div className="flex items-center">
        <ColumnVisibilityDropdown 
          columns={columns}
          visibleColumns={visibleColumns}
          setVisibleColumns={setVisibleColumns}
        />
      </div>
    </div>
  );
};

export default ContactsTableHeader; 