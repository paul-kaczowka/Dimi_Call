"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "./dialog"; // Assurez-vous que le chemin est correct
import { Button } from "./button"; // Assurez-vous que le chemin est correct
import { Label } from "./label"; // Assurez-vous que le chemin est correct
import { Input } from "./input"; // Assurez-vous que le chemin est correct
import { Textarea } from "./textarea"; // Ajout de l\'import pour Textarea
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select"; // Assurez-vous que le chemin est correct

interface QualificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaveQualification: (qualificationData: {
    statutMarital: StatutMarital;
    situationProfessionnelle: SituationProfessionnelle;
    revenusFoyer: string;
    chargesFoyer: string;
    resultat: string;
    commentaire: string;
  }) => void; // Callback pour sauvegarder les données
}

type StatutMarital =
  | "Marié"
  | "Pacsé"
  | "Célibataire"
  | "En concubinage"
  | "Veuf"
  | "";
type SituationProfessionnelle =
  | "CDD"
  | "CDI"
  | "Chef d'entreprise"
  | "Chômeur"
  | "Retraité"
  | "Étudiant"
  | "";

export function QualificationDialog({
  open,
  onOpenChange,
  onSaveQualification, // Ajout de la nouvelle prop
}: QualificationDialogProps) {
  const [statutMarital, setStatutMarital] = useState<StatutMarital>("");
  const [situationProfessionnelle, setSituationProfessionnelle] =
    useState<SituationProfessionnelle>("");
  const [revenusFoyer, setRevenusFoyer] = useState<string>("");
  const [chargesFoyer, setChargesFoyer] = useState<string>("");
  const [resultat, setResultat] = useState<string>("");
  const [commentaire, setCommentaire] = useState<string>(""); // État pour le commentaire

  useEffect(() => {
    if (!open) {
      // Réinitialiser les champs lorsque la boîte de dialogue est fermée
      setStatutMarital("");
      setSituationProfessionnelle("");
      setRevenusFoyer("");
      setChargesFoyer("");
      setResultat("");
      setCommentaire(""); // Réinitialiser le commentaire
    }
  }, [open]);

  useEffect(() => {
    const revenus = parseFloat(revenusFoyer);
    const charges = parseFloat(chargesFoyer);

    if (isNaN(revenus) || isNaN(charges) || revenus === 0) {
      setResultat(""); // Pas de calcul si les entrées ne sont pas valides ou si les revenus sont nuls
      // Ne pas générer de commentaire si les données de base ne sont pas valides
      if (commentaire === generateCommentaire()) setCommentaire(""); 
      return;
    }

    let calcul = 0;
    if (situationProfessionnelle === "Chef d'entreprise") {
      calcul = charges / revenus;
    } else if (situationProfessionnelle !== "") {
      calcul = charges / (revenus * 0.77);
    } else {
      setResultat(""); // Pas de calcul si la situation professionnelle n'est pas définie
      // Ne pas générer de commentaire si la situation pro n\'est pas définie
      if (commentaire === generateCommentaire()) setCommentaire("");
      return;
    }
    const nouveauResultat = calcul.toFixed(2);
    setResultat(nouveauResultat);
    
    // Mettre à jour le commentaire seulement si le commentaire actuel est vide ou était l\'ancien commentaire auto-généré
    // Ou si un des champs impactant le commentaire a changé
    if (commentaire === "" || commentaire === generateCommentaire(undefined, undefined, undefined, undefined, nouveauResultat)) {
        setCommentaire(generateCommentaire(statutMarital, situationProfessionnelle, revenusFoyer, chargesFoyer, nouveauResultat));
    }

  }, [revenusFoyer, chargesFoyer, situationProfessionnelle, statutMarital]); // Ajout de statutMarital pour la génération du commentaire

  // Fonction pour générer le commentaire pré-rempli
  const generateCommentaire = (
    currentStatut = statutMarital,
    currentSituation = situationProfessionnelle,
    currentRevenus = revenusFoyer,
    currentCharges = chargesFoyer,
    currentResultat = resultat
  ) => {
    if (!currentSituation || !currentStatut || !currentRevenus || !currentCharges || !currentResultat) {
      return "";
    }
    return `Qualification: Statut marital: ${currentStatut}, Situation pro.: ${currentSituation}. Revenus foyer: ${currentRevenus}€, Charges foyer: ${currentCharges}€. Résultat calculé: ${currentResultat}.`;
  };
  
  // Mise à jour du commentaire lorsque les champs changent, si l\'utilisateur n\'a pas déjà modifié le commentaire manuellement.
  useEffect(() => {
    // Génère le commentaire basé sur les valeurs actuelles
    const newGeneratedComment = generateCommentaire();
    // Vérifie si le commentaire actuel est vide ou s\'il correspond à une version précédente du commentaire généré.
    // Cette condition est un peu simplifiée, elle suppose que si le commentaire actuel commence par "Qualification:",
    // il a été auto-généré. Une vérification plus robuste pourrait être nécessaire.
    if (commentaire === "" || commentaire.startsWith("Qualification: Statut marital:")) {
      setCommentaire(newGeneratedComment);
    }
  }, [statutMarital, situationProfessionnelle, revenusFoyer, chargesFoyer, resultat]);

  const handleSave = () => {
    onSaveQualification({
      statutMarital,
      situationProfessionnelle,
      revenusFoyer,
      chargesFoyer,
      resultat,
      commentaire, // Sauvegarder le commentaire (édité ou non)
    });
    onOpenChange(false); // Fermer la boîte de dialogue après la sauvegarde
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg"> {/* Augmentation de la largeur pour le textarea */}
        <DialogHeader>
          <DialogTitle>Qualification</DialogTitle>
          <DialogDescription>
            Renseignez les informations de qualification.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto pr-2"> {/* Ajout de scroll si contenu trop long */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="statut-marital">Statut marital</Label>
              <Select
                value={statutMarital}
                onValueChange={(value) => setStatutMarital(value as StatutMarital)}
              >
                <SelectTrigger id="statut-marital">
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Marié">Marié</SelectItem>
                  <SelectItem value="Pacsé">Pacsé</SelectItem>
                  <SelectItem value="Célibataire">Célibataire</SelectItem>
                  <SelectItem value="En concubinage">En concubinage</SelectItem>
                  <SelectItem value="Veuf">Veuf</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="situation-professionnelle">
                Situation professionnelle
              </Label>
              <Select
                value={situationProfessionnelle}
                onValueChange={(value) =>
                  setSituationProfessionnelle(value as SituationProfessionnelle)
                }
              >
                <SelectTrigger id="situation-professionnelle">
                  <SelectValue placeholder="Sélectionner..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CDD">CDD</SelectItem>
                  <SelectItem value="CDI">CDI</SelectItem>
                  <SelectItem value="Chef d'entreprise">
                    Chef d&apos;entreprise
                  </SelectItem>
                  <SelectItem value="Chômeur">Chômeur</SelectItem>
                  <SelectItem value="Retraité">Retraité</SelectItem>
                  <SelectItem value="Étudiant">Étudiant</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="revenus-foyer">Revenus du foyer</Label>
            <Input
              id="revenus-foyer"
              type="number"
              placeholder="Ex: 3000"
              value={revenusFoyer}
              onChange={(e) => setRevenusFoyer(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="charges-foyer">Charges du foyer</Label>
            <Input
              id="charges-foyer"
              type="number"
              placeholder="Ex: 1000"
              value={chargesFoyer}
              onChange={(e) => setChargesFoyer(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="resultat-calcul">Résultat</Label>
            <Input
              id="resultat-calcul"
              type="text"
              value={resultat}
              readOnly
              className="bg-muted"
            />
          </div>

          {/* Champ Commentaire */}
          <div className="space-y-2">
            <Label htmlFor="commentaire-qualification">Commentaire</Label>
            <Textarea
              id="commentaire-qualification"
              placeholder="Ajoutez un commentaire..."
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
              rows={4} // Ajuster le nombre de lignes si besoin
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSave}>Enregistrer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
} 