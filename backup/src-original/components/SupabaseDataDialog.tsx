import React, { useState, useEffect, useMemo } from 'react';
import { Contact, Theme, ContactStatus } from '../types';
import { Modal, Button, Input } from './Common';
import { supabaseService } from '../services/supabaseService';
import { IconChevronUp, IconChevronDown } from '../constants';
import { v4 as uuidv4 } from 'uuid';

interface SupabaseDataDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (selectedContacts: Partial<Contact>[]) => void;
  theme: Theme;
}

export const SupabaseDataDialog: React.FC<SupabaseDataDialogProps> = ({ isOpen, onClose, onImport, theme }) => {
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [connectionError, setConnectionError] = useState<string>('');
  const [connectionDetails, setConnectionDetails] = useState<any>(null);
  const [contacts, setContacts] = useState<Partial<Contact>[]>([]);
  const [selectedContactIds, setSelectedContactIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: keyof Contact; direction: 'asc' | 'desc' } | null>(null);

  const pageSize = 20;

  // Test de connexion automatique à l'ouverture
  useEffect(() => {
    if (isOpen && connectionStatus === 'idle') {
      testConnection();
    }
  }, [isOpen]);

  const testConnection = async () => {
    console.log('🔄 Test de connexion Supabase...');
    setConnectionStatus('testing');
    setConnectionError('');
    setConnectionDetails(null);

    try {
      const result = await supabaseService.testConnection();
      
      if (result.success) {
        console.log('✅ Connexion réussie:', result.details);
        setConnectionStatus('success');
        setConnectionDetails(result.details);
        // Charger automatiquement les données après connexion réussie
        setTimeout(() => loadData(0), 100); // Petit délai pour s'assurer que l'état est mis à jour
      } else {
        console.log('❌ Connexion échouée:', result.error, result.details);
        setConnectionStatus('error');
        setConnectionError(result.error || 'Erreur inconnue');
        setConnectionDetails(result.details);
      }
    } catch (error: any) {
      console.error('❌ Exception test connexion:', error);
      setConnectionStatus('error');
      setConnectionError(`Exception: ${error.message}`);
      setConnectionDetails({ exception: error });
    }
  };

  const loadData = async (page: number) => {
    if (connectionStatus !== 'success') {
      console.log('⚠️ Tentative de chargement sans connexion valide');
      return;
    }

    console.log('🔄 Chargement données page:', page);
    setLoading(true);

    try {
      const result = await supabaseService.getContacts(page, 50);
      
      console.log('✅ Données chargées:', {
        count: result.data.length,
        totalCount: result.totalCount,
        hasMore: result.hasMore
      });

      // Log de débogage pour voir les données brutes
      if (result.data.length > 0) {
        console.log('🔍 Premier enregistrement brut:', result.data[0]);
        console.log('🔍 Colonnes disponibles:', Object.keys(result.data[0]));
      }

      if (page === 0) {
        setContacts(result.data);
        setSelectedContactIds(new Set());
      } else {
        setContacts(prev => [...prev, ...result.data]);
      }
      
      setCurrentPage(page);
      setTotalCount(result.totalCount);
      setHasMore(result.hasMore);
      
    } catch (error: any) {
      console.error('❌ Erreur chargement données:', error);
      setConnectionStatus('error');
      setConnectionError(`Erreur de chargement: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectContact = (contactId: string) => {
    const newSelected = new Set(selectedContactIds);
    if (newSelected.has(contactId)) {
      newSelected.delete(contactId);
    } else {
      newSelected.add(contactId);
    }
    setSelectedContactIds(newSelected);
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) {
      setSelectedContactIds(new Set(filteredContacts.map(c => c.id!)));
    } else {
      setSelectedContactIds(new Set());
    }
  };

  const handleImportSelected = () => {
    const selectedContacts = contacts.filter(c => selectedContactIds.has(c.id!));
    if (selectedContacts.length === 0) {
      alert('Veuillez sélectionner au moins un contact à importer.');
      return;
    }

    console.log(`📥 Import de ${selectedContacts.length} contacts sélectionnés`);
    onImport(selectedContacts);
    onClose();
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      loadData(currentPage + 1);
    }
  };

  const handleRetry = () => {
    console.log('🔄 Nouvelle tentative de connexion...');
    setConnectionStatus('idle');
    setContacts([]);
    setSelectedContactIds(new Set());
    testConnection();
  };

  const requestSort = (key: keyof Contact) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig?.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (columnKey: keyof Contact) => {
    if (sortConfig?.key === columnKey) {
      return sortConfig.direction === 'asc' ? <IconChevronUp className="w-3 h-3"/> : <IconChevronDown className="w-3 h-3"/>;
    }
    return null;
  };

  // Filtrage et tri des contacts
  const filteredContacts = useMemo(() => {
    let filtered = [...contacts];
    
    // Recherche
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(contact => 
        contact.prenom?.toLowerCase().includes(term) ||
        contact.nom?.toLowerCase().includes(term) ||
        contact.telephone?.toLowerCase().includes(term) ||
        contact.email?.toLowerCase().includes(term)
      );
    }
    
    // Tri
    if (sortConfig?.key) {
      filtered.sort((a, b) => {
        const aValue = a[sortConfig.key as keyof Contact] || '';
        const bValue = b[sortConfig.key as keyof Contact] || '';
        
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    
    return filtered;
  }, [contacts, searchTerm, sortConfig]);

  const isAllSelected = filteredContacts.length > 0 && filteredContacts.every(c => selectedContactIds.has(c.id!));
  const isPartiallySelected = filteredContacts.some(c => selectedContactIds.has(c.id!)) && !isAllSelected;

  // Rendu conditionnel basé sur l'état de connexion
  const renderContent = () => {
    switch (connectionStatus) {
      case 'idle':
      case 'testing':
        return (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {connectionStatus === 'idle' ? 'Initialisation...' : 'Test de connexion en cours...'}
            </p>
          </div>
        );

      case 'error':
        return (
          <div className="flex flex-col items-center justify-center py-12 space-y-6">
            <div className="text-center space-y-4">
              <div className="text-red-500 text-4xl">❌</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Échec de connexion Supabase
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 max-w-md">
                {connectionError}
              </p>
              
              {/* Détails techniques */}
              {connectionDetails && (
                <details className="mt-4 text-left">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
                    Détails techniques
                  </summary>
                  <pre className="mt-2 p-3 bg-gray-100 dark:bg-gray-800 rounded text-xs overflow-auto max-h-32">
                    {JSON.stringify(connectionDetails, null, 2)}
                  </pre>
                </details>
              )}
            </div>
            
            <Button onClick={handleRetry} variant="secondary">
              🔄 Réessayer
            </Button>
          </div>
        );

      case 'success':
        return (
          <div className="space-y-4">
            {/* Statistiques de connexion */}
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center space-x-2">
                <span className="text-green-500">✅</span>
                <span className="text-sm font-medium text-green-800 dark:text-green-200">
                  Connexion Supabase active
                </span>
              </div>
              {connectionDetails && (
                <div className="mt-2 text-xs text-green-700 dark:text-green-300">
                  📊 {connectionDetails.totalCount?.toLocaleString() || 0} enregistrements • {connectionDetails.columns?.length || 0} colonnes
                  {connectionDetails.columns && (
                    <div className="mt-1">
                      <strong>Colonnes:</strong> {connectionDetails.columns.join(', ')}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Barre de recherche et statistiques */}
            <div className="flex items-center justify-between">
              <Input
                type="text"
                placeholder="Rechercher dans les contacts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 mr-4"
              />
              <div className={`text-sm ${theme === Theme.Dark ? 'text-oled-text-dim' : 'text-light-text-dim'}`}>
                {totalCount} contact(s) • {selectedContactIds.size} sélectionné(s)
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  ref={(input) => {
                    if (input) input.indeterminate = isPartiallySelected;
                  }}
                  onChange={handleSelectAll}
                  className="form-checkbox"
                />
                <span className="text-sm">Tout sélectionner</span>
              </div>
              
              <div className="flex space-x-2">
                {hasMore && (
                  <Button 
                    onClick={handleLoadMore} 
                    variant="secondary" 
                    size="sm"
                    disabled={loading}
                  >
                    {loading ? '🔄 Chargement...' : '📄 Charger plus'}
                  </Button>
                )}
                <Button 
                  onClick={handleImportSelected} 
                  disabled={selectedContactIds.size === 0}
                >
                  📥 Importer ({selectedContactIds.size})
                </Button>
              </div>
            </div>

            {/* Tableau des contacts */}
            <div className={`border rounded-lg overflow-hidden ${theme === Theme.Dark ? 'border-oled-border' : 'border-light-border'}`}>
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className={`sticky top-0 ${theme === Theme.Dark ? 'bg-oled-bg' : 'bg-gray-50'}`}>
                    <tr>
                      <th className="w-8 p-2"></th>
                      {['prenom', 'nom', 'telephone', 'email', 'statut'].map((key) => (
                        <th 
                          key={key}
                          className={`p-2 text-left cursor-pointer hover:bg-opacity-80 ${theme === Theme.Dark ? 'text-oled-text' : 'text-light-text'}`}
                          onClick={() => requestSort(key as keyof Contact)}
                        >
                          <div className="flex items-center space-x-1">
                            <span className="capitalize">{key === 'telephone' ? 'Téléphone' : key}</span>
                            {getSortIndicator(key as keyof Contact)}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredContacts.map((contact, index) => {
                      // Log de débogage pour voir les données
                      if (index === 0) {
                        console.log('🔍 Premier contact pour débogage:', contact);
                      }
                      
                      return (
                        <tr 
                          key={contact.id}
                          className={`border-t hover:bg-opacity-50 ${
                            selectedContactIds.has(contact.id!) 
                              ? (theme === Theme.Dark ? 'bg-oled-accent/20' : 'bg-light-accent/20')
                              : (theme === Theme.Dark ? 'hover:bg-oled-interactive' : 'hover:bg-gray-50')
                          } ${theme === Theme.Dark ? 'border-oled-border' : 'border-light-border'}`}
                        >
                          <td className="p-2">
                            <input
                              type="checkbox"
                              checked={selectedContactIds.has(contact.id!)}
                              onChange={() => handleSelectContact(contact.id!)}
                              className="form-checkbox"
                            />
                          </td>
                          <td className="p-2">{contact.prenom || '-'}</td>
                          <td className="p-2">{contact.nom || '-'}</td>
                          <td className="p-2">{contact.telephone || '-'}</td>
                          <td className="p-2 truncate max-w-xs">{contact.email || '-'}</td>
                          <td className="p-2">
                            <span className={`px-2 py-1 rounded text-xs ${
                              contact.statut === ContactStatus.NonDefini 
                                ? 'bg-gray-100 text-gray-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {contact.statut || 'Non défini'}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                
                {filteredContacts.length === 0 && !loading && (
                  <div className="p-8 text-center text-gray-500">
                    {searchTerm ? 'Aucun contact trouvé pour cette recherche.' : 'Aucun contact disponible.'}
                  </div>
                )}

                {loading && (
                  <div className="p-8 text-center">
                    <div className="inline-flex items-center space-x-2">
                      <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                      <span>Chargement des contacts...</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Importer depuis Supabase" size="xl">
      <div className="space-y-4">
        {renderContent()}
        
        {/* Boutons de fermeture */}
        {connectionStatus === 'success' && (
          <div className="flex justify-end space-x-3 pt-4">
            <Button variant="secondary" onClick={onClose}>Annuler</Button>
            <Button 
              onClick={handleImportSelected}
              disabled={selectedContactIds.size === 0}
            >
              📥 Importer ({selectedContactIds.size})
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
};
