import React, { useEffect, useState, useCallback, useRef } from 'react';
// Nous n'aurons plus besoin de Uppy et DropTarget ici
// import Uppy from '@uppy/core';
// import DropTarget from '@uppy/drop-target';
import { toast } from 'react-toastify';
// Importer les hooks et types de React DnD
import { useDrop, ConnectDropTarget } from 'react-dnd';
import { NativeTypes } from 'react-dnd-html5-backend'; // Pour gérer les fichiers natifs
import { cn } from '@/lib/utils'; // Importer cn

// Styles modernes pour la zone de drop
// Ajuster les styles pour l'effet overlay
const styles = {
  container: `
    w-full h-full min-h-[200px] rounded-lg border-2 border-dashed
    transition-all duration-300 flex flex-col items-center justify-center p-6
    pointer-events-auto // Permet aux événements de souris de passer
  `,
  // L'état idle par défaut sera presque invisible lorsque la table n'est pas vide
  idle: `
    border-muted-foreground/30 text-muted-foreground/30
    bg-transparent opacity-0 // Invisible en mode idle (sauf si superposé à une table vide)
  `,
  // Nouvel état idle pour le mode overlay, avec une très faible opacité pour capter les events
  idleOverlay: `
    border-transparent text-transparent
    bg-transparent opacity-0.001 // Ultra faible opacité pour capter les événements sans être visible
  `,
  // L'état de glissement rend l'overlay visible et interactif
  dragging: `
    border-primary border-[3px] text-foreground
    bg-background/80 shadow-lg
    opacity-100 pointer-events-auto // Visible et interactif lors du drag
  `,
  icon: `
    w-16 h-16 mb-4
    transition-all duration-300
  `,
  text: `
    text-lg font-medium
    transition-all duration-300
  `,
  subtext: `
    text-sm text-center mt-2
    transition-all duration-300
  `
};

// Types
interface UploadDropZoneProps {
  onFileSelected: (file: File) => void;
  className?: string; // Ajouter la prop className
}

// Définir une interface pour le type d'objet déposé lors d'un NativeTypes.FILE drop
interface DroppedFileItem {
  files: FileList;
}

// Composant pour la zone de drop
function UploadDropZone({ onFileSelected, className }: UploadDropZoneProps) {
  // Utiliser useDrop pour gérer les événements de glisser-déposer
  const [{ canDrop, isOver }, dropRef]: [{ canDrop: boolean; isOver: boolean }, ConnectDropTarget] = useDrop(() => ({
    accept: [NativeTypes.FILE], // Accepter les fichiers natifs
    drop: (item: DroppedFileItem) => {
      console.log('[React DnD] Fichier/Item déposé:', item);
      if (item.files && item.files.length > 0) {
        const file = item.files[0];
        // Appliquer les restrictions de fichier manuellement
        const allowedFileTypes = [
          '.csv',
          '.xls',
          '.xlsx',
          'text/csv',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        ];
        const fileName = file.name;
        const fileExtension = "." + fileName.split('.').pop()?.toLowerCase();
        const isTypeAccepted = allowedFileTypes.some(type => {
          if (type.startsWith('.')) return fileExtension === type;
          return file.type === type;
        });

        if (isTypeAccepted) {
          onFileSelected(file);
        } else {
          toast.error(`Type de fichier non accepté. Utilisez un fichier Excel (.xlsx, .xls) ou CSV (.csv).`);
        }
      } else {
         toast.warn("Aucun fichier valide n'a été déposé.");
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(), // Vrai si un élément glissé est au-dessus de la cible de dépôt
      canDrop: monitor.canDrop(), // Vrai si l'élément glissé peut être déposé ici
    }),
  }), [onFileSelected]); // Re-créer la logique useDrop si onFileSelected change

  // Déterminer l'état de glissement basé sur isOver et canDrop
  const isActive = canDrop && isOver;

  // useEffect pour l'état de glissement local (peut ne pas être strictement nécessaire pour le style Tailwind mais bon pour le suivi)
  const [isDragging, setIsDragging] = useState(false);
   useEffect(() => {
       setIsDragging(isActive);
   }, [isActive]);

  // Utiliser une référence pour l'élément DOM et lier la référence de dépôt de React DnD
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (elementRef.current) {
      // Lier la référence de l'élément DOM à la référence de dépôt de React DnD
      dropRef(elementRef.current);
    }
  }, [dropRef]); // Re-lier si dropRef change


  return (
    <div
      id="contact-table-drop-zone"
      // Attacher notre référence locale à l'élément div
      ref={elementRef}
      // Combiner la prop className passée avec nos styles internes
      // Utiliser le style idleOverlay si la prop className suggère un mode overlay et que ce n'est pas dragging
      className={cn(
        styles.container,
        isDragging ? styles.dragging : (className?.includes('absolute') ? styles.idleOverlay : styles.idle),
        className // Appliquer la prop className passée
      )}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={styles.icon}
      >
        <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"></path>
        <path d="M12 12v9"></path>
        <path d="m16 16-4-4-4 4"></path>
      </svg>
      <p className={styles.text}>
        {isDragging ? 'Déposez votre fichier ici' : 'Glissez et déposez votre fichier Excel ou CSV ici'}
      </p>
      <p className={styles.subtext}>
        (.xlsx, .xls, .csv)
      </p>
    </div>
  );
}

export default UploadDropZone; 