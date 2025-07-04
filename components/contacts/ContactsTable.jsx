"use client";

import { useState, useEffect } from "react";
import ContactsTableHeader from "./ContactsTableHeader";

// Exemple de données de contacts
const mockContacts = [
  {
    id: 1,
    firstName: "Jean",
    lastName: "Dupont",
    email: "jean.dupont@example.com",
    phone: "+33 6 12 34 56 78",
    company: "Acme Inc",
    lastCall: "2023-11-15"
  },
  {
    id: 2,
    firstName: "Marie",
    lastName: "Martin",
    email: "marie.martin@example.com",
    phone: "+33 6 98 76 54 32",
    company: "Tech Solutions",
    lastCall: "2023-11-20"
  },
  {
    id: 3,
    firstName: "Pierre",
    lastName: "Bernard",
    email: "pierre.bernard@example.com",
    phone: "+33 6 45 67 89 01",
    company: "Digital Systems",
    lastCall: "2023-11-18"
  }
];

// Colonnes disponibles
const tableColumns = [
  { id: "firstName", label: "Prénom" },
  { id: "lastName", label: "Nom" },
  { id: "email", label: "Email" },
  { id: "phone", label: "Téléphone" },
  { id: "company", label: "Entreprise" },
  { id: "lastCall", label: "Dernier appel" },
];

const ContactsTable = () => {
  const [contacts, setContacts] = useState(mockContacts);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchField, setSearchField] = useState("firstName");
  const [visibleColumns, setVisibleColumns] = useState(
    tableColumns.map(col => col.id)
  );

  // Filtrer les contacts en fonction du terme de recherche
  useEffect(() => {
    if (!searchTerm) {
      setContacts(mockContacts);
      return;
    }

    const filtered = mockContacts.filter(contact => {
      const value = contact[searchField];
      return value.toLowerCase().includes(searchTerm.toLowerCase());
    });

    setContacts(filtered);
  }, [searchTerm, searchField]);

  return (
    <div className="w-full">
      <ContactsTableHeader 
        onSearch={setSearchTerm} 
        searchField={searchField} 
        setSearchField={setSearchField}
        visibleColumns={visibleColumns}
        setVisibleColumns={setVisibleColumns}
        columns={tableColumns}
      />

      <div className="overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              {tableColumns.map(column => (
                visibleColumns.includes(column.id) && (
                  <th 
                    key={column.id}
                    scope="col" 
                    className="px-4 py-3.5 text-left text-sm font-semibold text-gray-900 dark:text-white"
                  >
                    {column.label}
                  </th>
                )
              ))}
              <th scope="col" className="relative px-4 py-3.5">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
            {contacts.map(contact => (
              <tr key={contact.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                {tableColumns.map(column => (
                  visibleColumns.includes(column.id) && (
                    <td 
                      key={`${contact.id}-${column.id}`}
                      className="whitespace-nowrap px-4 py-4 text-sm text-gray-700 dark:text-gray-300"
                    >
                      {contact[column.id]}
                    </td>
                  )
                ))}
                <td className="whitespace-nowrap px-4 py-4 text-right text-sm font-medium">
                  <button className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">
                    Éditer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ContactsTable; 