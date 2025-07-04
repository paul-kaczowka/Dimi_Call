"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
// import type { VariantProps } from "class-variance-authority"; // Supprimé car non utilisé
// import { badgeVariants } from "@/components/ui/badge"; // Supprimé car non utilisé
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils"; // Assurez-vous que ce chemin est correct

// Définissez les nouveaux statuts possibles
const STATUS_OPTIONS = [
  "Mauvais num",
  "Répondeur",
  "À rappeler",
  "Pas intéressé",
  "Argumenté",
  "D0",
  "R0",
  "Liste noire",
  "Prématuré",
] as const;

export type Status = typeof STATUS_OPTIONS[number]; // Exporter le type Status
export { STATUS_OPTIONS }; // Exporter STATUS_OPTIONS

interface StatusBadgeProps {
  currentStatus: Status;
  onChangeStatus?: (newStatus: Status) => void; // Rendre optionnel pour le mode readOnly
  className?: string; // Pour la personnalisation
  isSmallBadge?: boolean; // Pour une version plus petite
  readOnly?: boolean; // Pour un affichage non interactif
}

// Fonction pour déterminer les classes de couleur du badge en fonction du statut
const getStatusColorClasses = (status: Status): string => {
  switch (status) {
    case "Mauvais num":
      return "bg-slate-500 text-slate-50 hover:bg-slate-500/90";
    case "Répondeur":
      return "bg-sky-500 text-sky-50 hover:bg-sky-500/90";
    case "À rappeler": // Accent conservé
      return "bg-amber-500 text-amber-50 hover:bg-amber-500/90";
    case "Pas intéressé":
      return "bg-red-500 text-red-50 hover:bg-red-500/90";
    case "Argumenté":
      return "bg-green-500 text-green-50 hover:bg-green-500/90";
    case "D0":
      return "bg-purple-500 text-purple-50 hover:bg-purple-500/90";
    case "R0":
      return "bg-indigo-500 text-indigo-50 hover:bg-indigo-500/90";
    case "Liste noire":
      return "bg-neutral-800 text-neutral-200 hover:bg-neutral-800/90";
    case "Prématuré":
      return "bg-cyan-500 text-cyan-50 hover:bg-cyan-500/90";
    default: // Au cas où, bien que tous les cas soient couverts par le type Status
      return "bg-gray-500 text-gray-50 hover:bg-gray-500/90";
  }
};

// Optionnel: Définir des couleurs plus spécifiques si votre thème le permet ou avec des classes Tailwind directes
/*
const getStatusColorClasses = (status: Status): string => {
  switch (status) {
    case "Répondeur":
      return "bg-blue-100 text-blue-800 border-blue-300"; // Exemple
    case "R0":
      return "bg-yellow-100 text-yellow-800 border-yellow-300"; // Exemple
    case "D0":
      return "bg-red-100 text-red-800 border-red-300"; // Exemple
    case "Futur exploitable":
      return "bg-green-100 text-green-800 border-green-300"; // Exemple
    default:
      return "bg-gray-100 text-gray-800 border-gray-300";
  }
};
*/

export function StatusBadge({ currentStatus, onChangeStatus, className, isSmallBadge, readOnly }: StatusBadgeProps) {
  // État local pour suivre le statut actuel
  const [status, setStatus] = React.useState<Status>(currentStatus);

  // Synchroniser l'état local avec les props externes
  React.useEffect(() => {
    setStatus(currentStatus);
  }, [currentStatus]);

  const handleStatusChange = (newStatus: Status) => {
    if (onChangeStatus) {
      // Mettre à jour l'état local avant d'envoyer au parent pour une UI réactive
      setStatus(newStatus);
      onChangeStatus(newStatus);
    }
  };

  const badgeContent = (
    <Badge 
      className={cn(
        getStatusColorClasses(status), // Utiliser l'état local pour la couleur
        isSmallBadge ? "text-xs px-1.5 py-0.5" : "text-sm px-2.5 py-1", // Ajuster padding/text size
        !readOnly && "cursor-pointer hover:opacity-100 transition-opacity",
        className
      )}
    >
      {status} {/* Utiliser l'état local pour le texte */}
    </Badge>
  );

  if (readOnly || !onChangeStatus) { // Si readOnly ou pas de handler, afficher juste le badge
    return badgeContent;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {badgeContent}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[180px]">
        {STATUS_OPTIONS.map((statusOption) => (
          <DropdownMenuItem
            key={statusOption}
            onClick={() => handleStatusChange(statusOption)}
            className={cn(
              "cursor-pointer"
              // Si vous voulez mettre en évidence l'option actuellement sélectionnée dans le menu déroulant :
              // status === statusOption && "bg-accent font-semibold" 
            )}
          >
            {statusOption}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
} 