import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, RefreshCw, CheckCircle, XCircle, Settings, Smartphone } from 'lucide-react';
import { adbService } from '../services/adbService';

interface AdbUnauthorizedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deviceSerial?: string;
}

export const AdbUnauthorizedDialog: React.FC<AdbUnauthorizedDialogProps> = ({
  open,
  onOpenChange,
  deviceSerial
}) => {
  const [isFixing, setIsFixing] = useState(false);
  const [fixStep, setFixStep] = useState<string>('');
  const [fixSuccess, setFixSuccess] = useState<boolean | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} - ${message}`]);
  };

  const handleAutoFix = async () => {
    setIsFixing(true);
    setFixSuccess(null);
    setLogs([]);
    
    try {
      addLog('🔧 Début du diagnostic automatique...');
      setFixStep('Diagnostic en cours...');
      
      const success = await adbService.diagnoseAndFixUnauthorized();
      
      setFixSuccess(success);
      if (success) {
        addLog('🎉 Problème résolu automatiquement !');
        setFixStep('Problème résolu !');
        
        // Fermer la dialog après 2 secondes
        setTimeout(() => {
          onOpenChange(false);
        }, 2000);
      } else {
        addLog('⚠️ Intervention manuelle nécessaire');
        setFixStep('Intervention manuelle requise');
      }
    } catch (error) {
      addLog(`❌ Erreur: ${error instanceof Error ? error.message : String(error)}`);
      setFixSuccess(false);
      setFixStep('Erreur lors du diagnostic');
    } finally {
      setIsFixing(false);
    }
  };

  const handleCleanKeys = async () => {
    setIsFixing(true);
    setLogs([]);
    
    try {
      addLog('🧹 Nettoyage des clés d\'autorisation...');
      const success = await adbService.cleanAdbKeys();
      
      if (success) {
        addLog('✅ Clés nettoyées avec succès');
        addLog('🔄 Redémarrage du serveur ADB...');
      } else {
        addLog('❌ Erreur lors du nettoyage');
      }
    } catch (error) {
      addLog(`❌ Erreur: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsFixing(false);
    }
  };

  const handleForceReconnect = async () => {
    setIsFixing(true);
    setLogs([]);
    
    try {
      addLog('🔄 Reconnexion forcée...');
      const success = await adbService.forceReconnectUnauthorized();
      
      if (success) {
        addLog('✅ Reconnexion forcée terminée');
      } else {
        addLog('❌ Erreur lors de la reconnexion');
      }
    } catch (error) {
      addLog(`❌ Erreur: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsFixing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            Appareil Android Non Autorisé
          </DialogTitle>
          <DialogDescription>
            L'appareil Android {deviceSerial ? `(${deviceSerial})` : ''} est détecté mais n'est pas autorisé.
            Utilisez les outils ci-dessous pour diagnostiquer et résoudre le problème.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Section de diagnostic automatique */}
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Diagnostic Automatique (Recommandé)
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Cette option tente de résoudre automatiquement le problème en nettoyant les clés 
              d'autorisation et en redémarrant le serveur ADB.
            </p>
            <Button 
              onClick={handleAutoFix}
              disabled={isFixing}
              className="w-full"
            >
              {isFixing ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <CheckCircle className="w-4 h-4 mr-2" />
              )}
              {isFixing ? fixStep : 'Diagnostiquer et Corriger Automatiquement'}
            </Button>
            
            {fixSuccess !== null && (
              <div className={`mt-3 p-3 rounded-lg flex items-center gap-2 ${
                fixSuccess ? 'bg-green-50 text-green-700' : 'bg-orange-50 text-orange-700'
              }`}>
                {fixSuccess ? (
                  <CheckCircle className="w-5 h-5" />
                ) : (
                  <AlertTriangle className="w-5 h-5" />
                )}
                {fixSuccess 
                  ? 'Problème résolu ! L\'appareil devrait maintenant être autorisé.'
                  : 'Le diagnostic automatique n\'a pas pu résoudre le problème. Essayez les étapes manuelles ci-dessous.'
                }
              </div>
            )}
          </div>

          {/* Section d'actions manuelles */}
          <div className="border rounded-lg p-4">
            <h3 className="text-lg font-medium mb-3">Actions Manuelles</h3>
            <div className="space-y-3">
              <Button 
                onClick={handleCleanKeys}
                disabled={isFixing}
                variant="outline"
                className="w-full justify-start"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Nettoyer les Clés d'Autorisation
              </Button>
              
              <Button 
                onClick={handleForceReconnect}
                disabled={isFixing}
                variant="outline"
                className="w-full justify-start"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Forcer la Reconnexion
              </Button>
            </div>
          </div>

          {/* Instructions manuelles */}
          <div className="border rounded-lg p-4 bg-blue-50">
            <h3 className="text-lg font-medium mb-3 flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-blue-600" />
              Instructions sur l'Appareil Android
            </h3>
            <ol className="text-sm text-gray-700 space-y-2 list-decimal list-inside">
              <li>
                <strong>Vérifiez le débogage USB :</strong> Allez dans 
                <code className="mx-1 px-1 bg-gray-200 rounded">Paramètres → Options de développement → Débogage USB</code>
              </li>
              <li>
                <strong>Révoquez les autorisations :</strong> Dans les options de développement, 
                appuyez sur <code className="mx-1 px-1 bg-gray-200 rounded">Révoquer les autorisations de débogage USB</code>
              </li>
              <li>
                <strong>Reconnectez le câble USB :</strong> Débranchez et rebranchez le câble USB
              </li>
              <li>
                <strong>Autorisez cet ordinateur :</strong> Une popup devrait apparaître sur votre téléphone. 
                Cochez "Toujours autoriser cet ordinateur" et appuyez sur "OK"
              </li>
              <li>
                <strong>Si aucune popup n'apparaît :</strong> Essayez de changer de port USB ou de câble USB
              </li>
            </ol>
          </div>

          {/* Logs */}
          {logs.length > 0 && (
            <div className="border rounded-lg p-4">
              <h3 className="text-lg font-medium mb-3">Journal des Opérations</h3>
              <div className="bg-gray-900 text-green-400 p-3 rounded font-mono text-sm max-h-40 overflow-y-auto">
                {logs.map((log, index) => (
                  <div key={index} className="whitespace-pre-wrap">
                    {log}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Boutons de fermeture */}
          <div className="flex justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isFixing}
            >
              Fermer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 