'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Contact } from '@/types/contact';
import { CellContext } from '@tanstack/react-table';
import {
  // Select, // Supprimé
  // SelectContent, // Supprimé
  // SelectItem, // Supprimé
  // SelectTrigger, // Supprimé
  // SelectValue, // Supprimé
} from "@/components/ui/select";
import { Input } from "@/components/ui/input"; // On pourrait potentiellement utiliser Textarea à la place d'Input pour les commentaires
// import { Textarea } from "@/components/ui/textarea"; // Supprimer l'import pour Textarea
import { Button } from "@/components/ui/button"; // Ajout de l'import pour Button
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"; // Ajout de l'import pour Popover
import { Zap } from 'lucide-react'; // Icône pour le bouton de suggestion, ChevronDown supprimé
import { cn } from "@/lib/utils";

interface CommentCellProps extends CellContext<Contact, unknown> {
  onEditContact: (contactUpdate: Partial<Contact> & { id: string }) => void;
}

const PREDEFINED_COMMENTS = [
  'Accompagné',
  'Du métier',
  'Prospection',
  'Non exploitable',
  'Bloqué ?',
];

// Nous n'aurons plus besoin de CUSTOM_COMMENT_OPTION et NO_COMMENT_OPTION dans cette approche
// const CUSTOM_COMMENT_OPTION = 'Personnalisé';
// const NO_COMMENT_OPTION = 'Aucun';

export const CommentCell: React.FC<CommentCellProps> = ({ getValue, row, column, onEditContact }) => {
  // Forcer la valeur en string lors de l'initialisation
  const [currentComment, setCurrentComment] = useState<string>(String(getValue() || '')); 
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false); // État pour contrôler la popover
  // const textareaRef = useRef<HTMLTextAreaElement>(null); // Supprimer la réf pour Textarea
  const inputRef = useRef<HTMLInputElement>(null); // Ajouter une réf pour Input

  // Ajout de cet useEffect pour synchroniser l'état interne avec les props
  useEffect(() => {
    const externalValue = String(getValue() || '');
    // Toujours mettre à jour si la valeur externe est différente,
    // ou si l'état actuel est vide et que la valeur externe pourrait l'être aussi (pour forcer une synchro initiale).
    if (externalValue !== currentComment) {
      setCurrentComment(externalValue);
    }
  }, [getValue]); // Simplification des dépendances pour tester. currentComment sera enlevé.

  // Nous n'avons toujours pas besoin de l'useEffect d'initialisation ici

  // Logique pour gérer les changements dans l'input
  const handleCommentChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentComment(event.target.value);
  };

  // Logique pour sauvegarder le commentaire lorsque le focus est perdu (debounce peut être ajouté plus tard)
  const handleCommentBlur = () => {
    if (row.original.id && column.id) {
      onEditContact({ id: row.original.id, [column.id as keyof Contact]: currentComment });
    }
  };

  // Logique pour insérer une suggestion dans le commentaire (SI ON GARDE LES SUGGESTIONS)
  // Si on supprime les suggestions, cette fonction peut être supprimée.
  const handleInsertSuggestion = (suggestion: string) => {
    const current = inputRef.current; 
    if (current) {
      const newValue = currentComment ? `${currentComment} ${suggestion}` : suggestion;
      setCurrentComment(newValue);
      if (row.original.id && column.id) { 
        onEditContact({ id: row.original.id, [column.id as keyof Contact]: newValue }); 
      }
      // Mettre le focus sur l'input après l'insertion pour une meilleure UX
      current.focus();
    }
    setIsSuggestionsOpen(false); 
  };

  // Nous n'avons plus besoin des anciens useEffect basés sur isCustomInputVisible

  return (
    <div className={cn("p-1 h-full min-h-[30px] flex items-center w-full space-x-1")}> {/* Suppression de relative ici pour l'instant */}
      <Input
        ref={inputRef}
        type="text"
        value={currentComment}
        onChange={handleCommentChange}
        onBlur={handleCommentBlur}
        placeholder="Ajouter un commentaire..."
        className="flex-grow min-h-[30px] text-sm"
      />
      <Popover open={isSuggestionsOpen} onOpenChange={setIsSuggestionsOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 p-1.5" // Ajustement de la taille et padding pour l'icône éclair
            aria-label="Suggestions de commentaires"
          >
            <Zap className="h-full w-full" /> {/* Utilisation de l'icône Zap */}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="end"> {/* align="end" pour positionner à droite */}
          <div className="flex flex-col">
            {PREDEFINED_COMMENTS.map((suggestionText) => ( // Renommé suggestion en suggestionText pour éviter conflit
              <Button 
                key={suggestionText} 
                variant="ghost" 
                className="justify-start h-8 text-xs px-2 py-1" // Taille et padding ajustés pour les items
                onClick={() => handleInsertSuggestion(suggestionText)}
              >
                {suggestionText}
              </Button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}; 