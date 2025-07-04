import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { simSelectionService, SimSelectionResult } from '../../services/simSelectionService';

interface SimStatusIndicatorProps {
  className?: string;
}

export function SimStatusIndicator({ className }: SimStatusIndicatorProps) {
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [lastResult, setLastResult] = useState<SimSelectionResult | null>(null);
  const [autoMonitoring, setAutoMonitoring] = useState(true);

  useEffect(() => {
    // Vérifier l'état initial
    setIsMonitoring(simSelectionService.isCurrentlyMonitoring());

    // Mettre à jour périodiquement l'état de surveillance
    const interval = setInterval(() => {
      setIsMonitoring(simSelectionService.isCurrentlyMonitoring());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleAutoMonitoringToggle = (enabled: boolean) => {
    setAutoMonitoring(enabled);
    if (!enabled && isMonitoring) {
      simSelectionService.stopMonitoring();
      setIsMonitoring(false);
    }
  };

  const handleManualCheck = async () => {
    try {
      const result = await simSelectionService.forceCheck();
      setLastResult(result);
    } catch (error) {
      console.error('Erreur lors de la vérification manuelle:', error);
      setLastResult({
        success: false,
        message: 'Erreur lors de la vérification',
        dialogDetected: false
      });
    }
  };

  const getStatusIcon = () => {
    if (isMonitoring) {
      return <Eye className="h-4 w-4 text-green-500" />;
    }
    return <EyeOff className="h-4 w-4 text-gray-500" />;
  };

  const getStatusText = () => {
    if (isMonitoring) {
      return 'Surveillance active';
    }
    return 'Surveillance inactive';
  };

  const getResultBadge = () => {
    if (!lastResult) return null;

    if (lastResult.dialogDetected) {
      if (lastResult.success) {
        return (
          <Badge variant="default" className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            SIM Pro sélectionnée
          </Badge>
        );
      } else {
        return (
          <Badge variant="destructive">
            <AlertCircle className="h-3 w-3 mr-1" />
            Échec sélection
          </Badge>
        );
      }
    } else {
      return (
        <Badge variant="secondary">
          Aucune dialog détectée
        </Badge>
      );
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {getStatusIcon()}
          Gestion automatique SIM
        </CardTitle>
        <CardDescription>
          Détection et sélection automatique de la carte SIM Pro lors des appels
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Toggle automatique */}
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <label className="text-sm font-medium">
              Surveillance automatique
            </label>
            <p className="text-xs text-muted-foreground">
              Active la surveillance pendant les appels
            </p>
          </div>
          <Switch
            checked={autoMonitoring}
            onCheckedChange={handleAutoMonitoringToggle}
          />
        </div>

        {/* Statut actuel */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            Statut:
          </span>
          <Badge variant={isMonitoring ? "default" : "secondary"}>
            {getStatusText()}
          </Badge>
        </div>

        {/* Bouton de vérification manuelle */}
        <button
          onClick={handleManualCheck}
          className="w-full text-sm bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-md px-3 py-2 transition-colors"
        >
          Vérifier maintenant
        </button>

        {/* Dernier résultat */}
        {lastResult && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Dernier résultat:
              </span>
              {getResultBadge()}
            </div>
            
            {lastResult.message && (
              <div className="text-xs p-2 bg-gray-50 rounded-md border">
                {lastResult.message}
              </div>
            )}
          </div>
        )}

        {/* Informations supplémentaires */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p>• La surveillance se déclenche automatiquement lors des appels</p>
          <p>• Sélectionne automatiquement la carte SIM "Pro" si la dialog apparaît</p>
          <p>• Compatible avec les utilisateurs mono-SIM (ne fait rien si pas de dialog)</p>
        </div>
      </CardContent>
    </Card>
  );
} 