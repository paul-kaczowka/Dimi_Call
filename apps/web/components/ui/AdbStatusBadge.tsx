'use client';

import React, { useState, useEffect } from 'react';
import { Smartphone, BatteryLow, BatteryFull, BatteryMedium, AlertTriangle, XCircle, CheckCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface AdbDevice {
  id: string;
  status: string; // e.g., 'device', 'offline', 'unauthorized'
}

interface AdbStatusResponse {
  status: string; // 'success', 'no_device_detected', or error message
  devices?: AdbDevice[];
  level?: number; // Battery level, only in battery response
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const POLLING_INTERVAL = 10000; // 10 secondes

type AdbStatusBadgeProps = {
  className?: string;
};

export function AdbStatusBadge({ className }: AdbStatusBadgeProps) {
  const [adbStatus, setAdbStatus] = useState<string | null>(null); // 'connected', 'disconnected', 'unauthorized', 'error'
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tooltipMessage, setTooltipMessage] = useState<string>("Statut ADB et Batterie");

  useEffect(() => {
    const fetchAdbData = async () => {
      setIsLoading(true);
      setError(null);
      let currentAdbStatus: string | null = null;
      let currentBatteryLevel: number | null = null;
      let devicesTooltip: string[] = [];

      try {
        // 1. Fetch ADB Device Status
        const statusResponse = await fetch(`${API_URL}/adb/status`);
        if (!statusResponse.ok) {
          const errData = await statusResponse.json().catch(() => ({ detail: "Erreur de l'API /adb/status" }));
          throw new Error(errData.detail || `Erreur ${statusResponse.status} de /adb/status`);
        }
        const statusData: AdbStatusResponse = await statusResponse.json();

        if (statusData.status === 'success' && statusData.devices && statusData.devices.length > 0) {
          const mainDevice = statusData.devices[0]; // Simplification: on prend le premier
          devicesTooltip = statusData.devices.map(d => `${d.id} (${d.status})`);
          if (mainDevice.status === 'device') {
            currentAdbStatus = 'connected';
          } else if (mainDevice.status === 'unauthorized') {
            currentAdbStatus = 'unauthorized';
          } else if (mainDevice.status === 'offline') {
            currentAdbStatus = 'disconnected'; // ou 'offline'
          } else {
            currentAdbStatus = 'unknown_device_status';
          }
        } else if (statusData.status === 'no_device_detected') {
          currentAdbStatus = 'disconnected';
          devicesTooltip.push("Aucun appareil détecté");
        } else {
          // Peut-être une erreur retournée dans statusData.status lui-même
          currentAdbStatus = 'error';
          setError(statusData.status || "Statut ADB inconnu reçu.");
          devicesTooltip.push(statusData.status || "Statut ADB inconnu reçu.");
        }

        // 2. Fetch Battery Level (seulement si un appareil est potentiellement connecté et autorisé)
        if (currentAdbStatus === 'connected') {
          try {
            const batteryResponse = await fetch(`${API_URL}/adb/battery`);
            if (!batteryResponse.ok) {
              // Si /adb/battery échoue, on ne bloque pas le statut ADB mais on log l'erreur
              const battErrData = await batteryResponse.json().catch(() => null);
              console.warn("Erreur lors de la récupération de la batterie:", battErrData?.detail || batteryResponse.statusText);
              // Ne pas définir currentBatteryLevel, il restera null
              devicesTooltip.push(battErrData?.detail ? `Batterie: ${battErrData.detail}` : "Batterie: Erreur de lecture");
            } else {
              const batteryData: AdbStatusResponse = await batteryResponse.json();
              if (batteryData.status === 'success' && typeof batteryData.level === 'number') {
                currentBatteryLevel = batteryData.level;
              }
            }
          } catch (batteryError) {
            console.warn("Erreur technique lors de la récupération de la batterie:", batteryError);
            devicesTooltip.push("Batterie: Erreur tech.");
          }
        }
        
      } catch (e) {
        const errorMessage = e instanceof Error ? e.message : "Erreur de communication avec l'API ADB";
        setError(errorMessage);
        currentAdbStatus = 'error';
        devicesTooltip.push(errorMessage);
      }
      
      setAdbStatus(currentAdbStatus);
      setBatteryLevel(currentBatteryLevel);
      setTooltipMessage(devicesTooltip.join(' | '));
      setIsLoading(false);
    };

    fetchAdbData(); // Appel initial
    const intervalId = setInterval(fetchAdbData, POLLING_INTERVAL);

    return () => clearInterval(intervalId); // Nettoyage à la suppression du composant
  }, []);

  let StatusIcon = Loader2;
  let iconColor = "text-muted-foreground";
  let statusText = "Chargement...";

  if (isLoading && adbStatus === null) { // Chargement initial
    StatusIcon = Loader2;
    iconColor = "text-blue-500 animate-spin";
    statusText = "Vérification ADB...";
  } else if (error) {
    StatusIcon = AlertTriangle;
    iconColor = "text-red-500";
    statusText = "Erreur ADB";
  } else {
    switch (adbStatus) {
      case 'connected':
        StatusIcon = CheckCircle;
        iconColor = "text-green-500";
        statusText = batteryLevel !== null ? `${batteryLevel}%` : "Connecté";
        if (batteryLevel !== null) {
          if (batteryLevel <= 20) {
            StatusIcon = BatteryLow;
            iconColor = "text-orange-500";
          } else if (batteryLevel <= 60) {
            StatusIcon = BatteryMedium;
            iconColor = "text-yellow-500";
          } else {
            StatusIcon = BatteryFull;
          }
        }
        break;
      case 'unauthorized':
        StatusIcon = AlertTriangle;
        iconColor = "text-yellow-600";
        statusText = "Non Autorisé";
        break;
      case 'disconnected':
        StatusIcon = XCircle;
        iconColor = "text-red-600";
        statusText = "Déconnecté";
        break;
      case 'unknown_device_status':
        StatusIcon = Smartphone; // Ou une autre icône
        iconColor = "text-gray-500";
        statusText = "Statut App. Inconnu";
        break;
      default:
        StatusIcon = Smartphone; // Icône par défaut si état non géré
        iconColor = "text-muted-foreground";
        statusText = "ADB Inconnu";
    }
  }
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn("flex items-center space-x-2 px-3 py-1.5 text-sm font-medium rounded-md border",
            isLoading && adbStatus === null ? "border-blue-500/50" :
            error ? "border-red-500/50" :
            adbStatus === 'connected' ? (batteryLevel !== null && batteryLevel <= 20 ? "border-orange-500/50" : "border-green-500/50") :
            adbStatus === 'unauthorized' ? "border-yellow-600/50" :
            adbStatus === 'disconnected' ? "border-red-600/50" :
            "border-border",
            className
          )}>
            <StatusIcon className={cn("h-5 w-5", iconColor, "")} />
            <span className={cn(iconColor, "whitespace-nowrap")}>{statusText}</span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{isLoading && adbStatus === null ? "Chargement du statut ADB..." : tooltipMessage}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
} 