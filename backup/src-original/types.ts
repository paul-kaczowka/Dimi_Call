
export enum Theme {
  Light = 'light',
  Dark = 'dark',
}

export enum ContactStatus {
  NonDefini = "Non défini",
  MauvaisNum = "Mauvais num",
  Repondeur = "Répondeur",
  ARappeler = "À rappeler",
  PasInteresse = "Pas intéressé",
  Argumente = "Argumenté",
  DO = "DO",
  RO = "RO",
  ListeNoire = "Liste noire",
  Premature = "Prématuré",
}

export interface Contact {
  id: string; // Unique ID, e.g., generated or from data source
  numeroLigne: number;
  prenom: string;
  nom: string;
  telephone: string;
  email: string;
  ecole: string; // 'source' in Python app
  statut: ContactStatus;
  commentaire: string;
  dateRappel: string; // YYYY-MM-DD
  heureRappel: string; // HH:mm
  dateRDV: string; // YYYY-MM-DD
  heureRDV: string; // HH:mm
  dateAppel: string; // YYYY-MM-DD
  heureAppel: string; // HH:mm
  dureeAppel: string; // mm:ss
  uid_supabase?: string; // For potential future Supabase integration mapping
}

export interface CallState {
  isCalling?: boolean;
  hasBeenCalled?: boolean;
}

export type CallStates = Record<string, CallState>; // Contact ID to CallState

export interface ClientFile {
  id: string;
  name: string;
  size: string; // e.g., "1.2 MB"
  date: string; // e.g., "12/07/2024"
  type: 'pdf' | 'doc' | 'xls' | 'img' | 'other';
}

// For Gemini
export enum EmailType {
  D0Visio = "d0_visio",
  R0Interne = "r0_interne",
  R0Externe = "r0_externe",
  PremierContact = "premier_contact",
}

export enum Civility {
  Monsieur = "monsieur",
  Madame = "madame",
}

export enum QualificationStatutMarital {
    Marie = "Marié",
    Pacse = "Pacsé",
    Celibataire = "Célibataire",
    Concubinage = "En concubinage",
    Veuf = "Veuf",
}

export enum QualificationSituationPro {
    CDD = "CDD",
    CDI = "CDI",
    ChefEntreprise = "Chef d'entreprise",
    Chomeur = "Chômeur",
    Retraite = "Retraité",
    Etudiant = "Étudiant",
}