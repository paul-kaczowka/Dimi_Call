import { z } from 'zod';

const zStringOptional = z.string().optional().nullable();

// Définition de StatutMarital
export const StatutMaritalValues = [
  "Marié",
  "Pacsé",
  "Célibataire",
  "En concubinage",
  "Veuf",
  ""
] as const;
export type StatutMarital = typeof StatutMaritalValues[number];

// Définition de SituationProfessionnelle
export const SituationProfessionnelleValues = [
  "CDD",
  "CDI",
  "Chef d'entreprise",
  "Chômeur",
  "Retraité",
  "Étudiant",
  ""
] as const;
export type SituationProfessionnelle = typeof SituationProfessionnelleValues[number];

// Définition de QualificationData
export interface QualificationData {
  statutMarital: StatutMarital;
  situationProfessionnelle: SituationProfessionnelle;
  revenusFoyer: string;
  chargesFoyer: string;
  resultat: string;
  commentaire: string;
}

export const contactSchema = z.object({
  id: z.string().uuid().optional(),
  firstName: z.string().min(1, "Le prénom est requis"),
  lastName: z.string().min(1, "Le nom de famille est requis"),
  email: z.string().email("Format d'email invalide").optional().nullable(),
  phoneNumber: z.string().optional().nullable(),
  status: z.string().optional().nullable(),
  comment: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  dateAdded: z.string().optional().default(() => new Date().toISOString()),
  lastModified: z.string().optional().default(() => new Date().toISOString()),
  
  // Champs pour le rendez-vous Cal.com
  calComEventId: z.string().optional().nullable(),
  dateRendezVous: z.string().optional().nullable(),
  heureRendezVous: z.string().optional().nullable(),

  // Champ pour la date et l'heure du rappel
  dateRappel: z.string().optional().nullable(),
  heureRappel: z.string().optional().nullable(),

  // Champs pour l'appel
  callDuration: z.number().optional().nullable(),
  callRecordingUrl: z.string().url().optional().nullable(),
  callNotes: z.string().optional().nullable(),
  callStartTime: z.string().datetime().optional().nullable(),

  // Champs de qualification optionnels (si vous voulez les stocker séparément en plus du commentaire)
  statutMarital: z.enum(StatutMaritalValues).optional().nullable(),
  situationProfessionnelle: z.enum(SituationProfessionnelleValues).optional().nullable(),
  revenusFoyer: z.string().optional().nullable(),
  chargesFoyer: z.string().optional().nullable(),
  resultatQualification: z.string().optional().nullable(),

  // Autres champs
  dateAppel: zStringOptional,
  heureAppel: zStringOptional,
  dureeAppel: zStringOptional,
  source: zStringOptional,
  avatarUrl: zStringOptional,
  societe: zStringOptional,
  role: zStringOptional,
  bookingDate: zStringOptional,
  bookingTime: zStringOptional,
}).strict();

export const contactsSchema = z.array(contactSchema);

// Exporter le type Contact inféré
export type Contact = z.infer<typeof contactSchema>;

// Optionnellement, si vous avez aussi besoin du type pour un tableau de contacts directement
// export type Contacts = z.infer<typeof contactsSchema>; 