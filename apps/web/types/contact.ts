import { z } from 'zod';
import { contactSchema, contactsSchema } from '@/lib/schemas/contact';

// Le type Contact est maintenant inféré du schéma Zod
export type Contact = z.infer<typeof contactSchema>;

// Le type Contacts (pour un tableau de contacts) est également inféré
export type Contacts = z.infer<typeof contactsSchema>;

// Si vous aviez des types spécifiques pour la création ou la mise à jour sans l'ID,
// vous pourriez les définir aussi, bien que souvent le type Contact partiel soit utilisé.
// Exemple:
// export type ContactCreate = Omit<Contact, 'id'>; 