// Type pour l'état retourné par les Server Actions utilisant useActionState (anciennement useFormState)
export interface ActionState<TData = unknown> {
  success: boolean;
  message: string;
  errors?: Partial<Record<string, string[]>>; // Ou un type plus spécifique si vous utilisez zodError.flatten()
  // Par exemple: errors?: z.ZodError<any>['formErrors']['fieldErrors'];
  data?: TData;
}

// État initial pour les formulaires
export const initialActionState: ActionState = {
  success: false,
  message: '',
  // errors est optionnel et peut être undefined
};

// Import du type Contact
import type { Contact } from '@/lib/schemas/contact';

/**
 * Génère une URL Google Calendar pour créer un événement de rappel
 * @param contact - Le contact pour lequel créer le rappel
 * @param date - La date du rappel (YYYY-MM-DD)
 * @param time - L'heure du rappel (HH:mm)
 * @param isRendezVous - Si true, génère un titre de rendez-vous au lieu de rappel
 * @returns L'URL Google Calendar pré-remplie
 */
export function generateGoogleCalendarUrl(contact: Contact, date: string, time: string, isRendezVous: boolean = false): string {
  // Formater la date et l'heure pour Google Calendar
  const dateTime = new Date(`${date}T${time}`);
  const endDateTime = new Date(dateTime.getTime() + 30 * 60 * 1000); // +30 minutes
  
  // Formater les dates pour Google Calendar (format ISO)
  const startDate = dateTime.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  const endDate = endDateTime.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  
  // Construire le titre de l'événement
  const eventTitle = isRendezVous 
    ? `Rendez-vous - ${contact.firstName} ${contact.lastName}`
    : `Rappeler - ${contact.firstName} ${contact.lastName}`;
  
  // Construire la description avec toutes les informations du contact
  const contactInfo: string[] = [];
  
  if (contact.phoneNumber) {
    contactInfo.push(`📞 Téléphone: ${contact.phoneNumber}`);
  }
  
  if (contact.email) {
    contactInfo.push(`📧 Email: ${contact.email}`);
  }
  
  if (contact.comment) {
    contactInfo.push(`💬 Commentaire: ${contact.comment}`);
  }
  
  const eventType = isRendezVous ? 'Rendez-vous' : 'Rappeler';
  const description = contactInfo.length > 0 
    ? `${eventType} avec ${contact.firstName} ${contact.lastName}\n\nInformations du contact:\n${contactInfo.join('\n')}`
    : `${eventType} avec ${contact.firstName} ${contact.lastName}`;
  
  // Construire l'URL Google Calendar
  const baseUrl = 'https://calendar.google.com/calendar/render';
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: eventTitle,
    dates: `${startDate}/${endDate}`,
    details: description,
    sf: 'true',
    output: 'xml'
  });
  
  return `${baseUrl}?${params.toString()}`;
} 