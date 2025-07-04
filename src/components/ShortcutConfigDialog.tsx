import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { X, RotateCcw, Save, Settings } from 'lucide-react';
import { ContactStatus } from '../types';
import { shortcutService, ShortcutConfig } from '../services/shortcutService';
import { Theme } from '../types';

interface ShortcutConfigDialogProps {
  isOpen: boolean;
  onClose: () => void;
  theme: Theme;
  onSave?: () => void;
}

export const ShortcutConfigDialog: React.FC<ShortcutConfigDialogProps> = ({
  isOpen,
  onClose,
  theme,
  onSave
}) => {
  const [shortcuts, setShortcuts] = useState<ShortcutConfig[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  // Charger les raccourcis lors de l'ouverture
  useEffect(() => {
    if (isOpen) {
      setShortcuts(shortcutService.getShortcuts());
      setHasChanges(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Obtenir tous les statuts disponibles
  const availableStatuses = Object.values(ContactStatus);

  // Gérer le changement de statut pour une touche
  const handleStatusChange = (key: string, newStatus: ContactStatus) => {
    setShortcuts(prev => 
      prev.map(shortcut => 
        shortcut.key === key 
          ? { ...shortcut, status: newStatus, label: getStatusLabel(newStatus) }
          : shortcut
      )
    );
    setHasChanges(true);
  };

  // Obtenir le libellé d'un statut
  const getStatusLabel = (status: ContactStatus): string => {
    const labelMap: Record<ContactStatus, string> = {
      [ContactStatus.NonDefini]: 'Non défini',
      [ContactStatus.Premature]: 'Prématuré',
      [ContactStatus.MauvaisNum]: 'Mauvais num',
      [ContactStatus.Repondeur]: 'Répondeur',
      [ContactStatus.ARappeler]: 'À rappeler',
      [ContactStatus.PasInteresse]: 'Pas intéressé',
      [ContactStatus.Argumente]: 'Argumenté',
      [ContactStatus.DO]: 'DO',
      [ContactStatus.RO]: 'RO',
      [ContactStatus.ListeNoire]: 'Liste noire'
    };
    return labelMap[status] || status;
  };

  // Sauvegarder les modifications
  const handleSave = () => {
    try {
      shortcutService.updateAllShortcuts(shortcuts);
      setHasChanges(false);
      onSave?.();
      onClose();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde:', error);
      // Ici on pourrait afficher une notification d'erreur
    }
  };

  // Remettre les valeurs par défaut
  const handleReset = () => {
    shortcutService.resetToDefaults();
    setShortcuts(shortcutService.getShortcuts());
    setHasChanges(true);
  };

  // Annuler les modifications
  const handleCancel = () => {
    if (hasChanges) {
      // Recharger les raccourcis depuis le service
      setShortcuts(shortcutService.getShortcuts());
      setHasChanges(false);
    }
    onClose();
  };

  // Obtenir la couleur d'un statut
  const getStatusColor = (status: ContactStatus) => {
    const colors: Record<ContactStatus, string> = {
      [ContactStatus.NonDefini]: 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-800 dark:text-gray-200',
      [ContactStatus.Premature]: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-200',
      [ContactStatus.MauvaisNum]: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-200',
      [ContactStatus.Repondeur]: 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-200',
      [ContactStatus.ARappeler]: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-200',
      [ContactStatus.PasInteresse]: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-200',
      [ContactStatus.Argumente]: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-200',
      [ContactStatus.DO]: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-200',
      [ContactStatus.RO]: 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-200',
      [ContactStatus.ListeNoire]: 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-slate-900/30 dark:text-slate-200'
    };
    return colors[status] || colors[ContactStatus.NonDefini];
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50">
      <Card className={`
        w-full max-w-2xl max-h-[90vh] overflow-y-auto mx-4
        animate-in zoom-in-95 duration-200 
        ${theme === Theme.Dark ? 'bg-slate-900 border-slate-700' : 'bg-white'}
      `}>
        {/* Header */}
        <div className={`
          flex items-center justify-between p-6 border-b sticky top-0 z-[10000]
          ${theme === Theme.Dark ? 'bg-slate-900 border-slate-700' : 'bg-white border-gray-200'}
        `}>
          <div className="flex items-center gap-3">
            <Settings className="w-5 h-5" />
            <h2 className={`text-lg font-semibold ${theme === Theme.Dark ? 'text-white' : 'text-slate-900'}`}>
              Configuration des Raccourcis Clavier
            </h2>
            {hasChanges && (
              <Badge variant="outline" className="text-xs text-amber-600 border-amber-300">
                Modifié
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            className="h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Description */}
          <div className="space-y-2">
            <p className={`text-sm ${theme === Theme.Dark ? 'text-slate-300' : 'text-gray-600'}`}>
              Personnalisez les raccourcis clavier pour changer rapidement le statut du contact sélectionné.
            </p>
            <p className={`text-xs ${theme === Theme.Dark ? 'text-slate-400' : 'text-gray-500'}`}>
              Les modifications seront automatiquement sauvegardées et disponibles immédiatement.
            </p>
          </div>

          <Separator />

          {/* Configuration des raccourcis */}
          <div className="space-y-3">
            <h3 className={`text-md font-medium ${theme === Theme.Dark ? 'text-white' : 'text-slate-900'}`}>
              Association Touches → Statuts
            </h3>
            
            <div className="grid grid-cols-1 gap-3">
              {shortcuts.map((shortcut) => (
                <div
                  key={shortcut.key}
                  className={`
                    flex items-center gap-4 p-3 rounded-lg border
                    ${theme === Theme.Dark 
                      ? 'bg-slate-800/50 border-slate-700' 
                      : 'bg-gray-50 border-gray-200'
                    }
                  `}
                >
                  {/* Touche */}
                  <Badge 
                    variant="outline" 
                    className="font-mono text-xs min-w-[50px] justify-center"
                  >
                    {shortcut.key}
                  </Badge>

                  {/* Flèche */}
                  <span className={`text-sm ${theme === Theme.Dark ? 'text-slate-400' : 'text-gray-500'}`}>
                    →
                  </span>

                  {/* Sélecteur de statut */}
                  <div className="flex-1">
                    <Select
                      value={shortcut.status}
                      onValueChange={(value) => handleStatusChange(shortcut.key, value as ContactStatus)}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue>
                          <div className="flex items-center gap-2">
                            <span className={`
                              px-2 py-1 rounded text-xs font-medium
                              ${getStatusColor(shortcut.status)}
                            `}>
                              {shortcut.label}
                            </span>
                          </div>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent>
                        {availableStatuses.map((status) => (
                          <SelectItem key={status} value={status}>
                            <div className="flex items-center gap-2">
                              <span className={`
                                px-2 py-1 rounded text-xs font-medium
                                ${getStatusColor(status)}
                              `}>
                                {getStatusLabel(status)}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          {/* Actions */}
          <div className="flex items-center justify-between pt-4">
            <Button
              variant="outline"
              onClick={handleReset}
              className="flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Valeurs par défaut
            </Button>

            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                onClick={handleCancel}
              >
                Annuler
              </Button>
              <Button
                onClick={handleSave}
                disabled={!hasChanges}
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Sauvegarder
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}; 