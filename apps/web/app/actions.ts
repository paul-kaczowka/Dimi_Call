'use server';

import { z } from 'zod';
import { type ActionState } from '@/lib/actions-utils'; // Garder ActionState
import { contactSchema, Contact } from '@/lib/schemas/contact';
import { revalidatePath } from 'next/cache'; // Importer revalidatePath
import { differenceInSeconds, isValid } from 'date-fns'; // Supprimé parseDateFns et fr qui ne sont pas utilisés
import { formatPhoneNumber } from '@/lib/utils'; // Importer la fonction de formatage

// Nouveaux types pour le résultat de l'importation et les informations de mappage
interface MappingInfo {
  filePath?: string;
  originalHeaders: string[];
  unmappedHeaders: string[];
  requiredFields: string[];
}

interface ImportResultData {
  count?: number;
  message?: string;
  needsMapping?: boolean;
  mappingInfo?: MappingInfo;
  errorDetails?: Record<string, unknown>; // Remplacé 'any' par un type plus spécifique
}

// Schéma pour la validation du numéro de téléphone et de l'ID du contact
const callActionSchema = z.object({
  phoneNumber: z.preprocess(
    (val) => (val === null ? undefined : val),
    z.string().optional()
  ), 
  contactId: z.string().min(1, { message: 'L\'ID du contact est requis.' }),
}).refine(data => {
  // Au moins contactId doit être présent
  return !!data.contactId;
}, {
  message: "L'ID du contact est obligatoire.",
  path: ['contactId']
});

// Schéma pour la validation du format d'exportation
const exportFormatSchema = z.enum(['csv', 'parquet']);

const hangUpActionSchema = z.object({
  contactId: z.string().min(1, { message: 'L\'ID du contact est requis.' }),
});

/**
 * Server Action pour initier un appel via ADB.
 * @param prevState L'état précédent (non utilisé ici mais requis par useActionState).
 * @param formData Les données du formulaire.
 * @returns Un objet indiquant le succès ou l'échec de l'opération.
 */
export async function callAction(prevState: ActionState<Contact | null>, formData: FormData): Promise<ActionState<Contact | null>> {
  const rawFormData = {
    phoneNumber: formData.get('phoneNumber'),
    contactId: formData.get('contactId'),
  };
  console.log('[Server Action callAction] Received rawFormData:', rawFormData);

  const validationResult = callActionSchema.safeParse(rawFormData);

  if (!validationResult.success) {
    console.error('[Server Action callAction] Validation failed:', validationResult.error.flatten().fieldErrors);
    return {
      success: false,
      message: 'Données d\'appel invalides.',
      errors: validationResult.error.flatten().fieldErrors,
      data: null,
    };
  }

  const { phoneNumber: providedPhoneNumber, contactId: validatedContactId } = validationResult.data;
  console.log('[Server Action callAction] Validation successful. Provided PhoneNumber:', providedPhoneNumber, 'Validated ContactID:', validatedContactId);
  
  let phoneNumberToCall = providedPhoneNumber as string | undefined;
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  
  if (!phoneNumberToCall) {
    console.log(`[Server Action callAction] PhoneNumber not provided. Attempting to fetch from API for contact ID: ${validatedContactId}`);
    try {
      const contactResponse = await fetch(`${apiUrl}/contacts/${validatedContactId}`);
      if (!contactResponse.ok) {
        const errorText = await contactResponse.text();
        console.error(`[Server Action callAction] Failed to fetch contact. Status: ${contactResponse.status}, Response: ${errorText}`);
        return {
          success: false,
          message: `Impossible de récupérer les détails du contact (ID: ${validatedContactId})`,
          data: null,
        };
      }
      const contactData = await contactResponse.json();
      phoneNumberToCall = contactData.phoneNumber;
      console.log(`[Server Action callAction] Fetched contact data:`, contactData, `PhoneNumber to call: ${phoneNumberToCall}`);
      
      if (!phoneNumberToCall) {
        console.error(`[Server Action callAction] Contact (ID: ${validatedContactId}) has no phone number.`);
        return {
          success: false,
          message: `Ce contact (ID: ${validatedContactId}) n'a pas de numéro de téléphone enregistré.`,
          data: null,
        };
      }
    } catch (error) {
      console.error("[Server Action callAction] Error fetching contact:", error);
      return {
        success: false,
        message: "Erreur lors de la récupération des informations du contact.",
        data: null,
      };
    }
  }

  // Nettoyage final et formatage du numéro avant de l'envoyer à l'API
  if (phoneNumberToCall) {
    // Appliquer le même formatage que celui utilisé pour l'affichage dans la table
    phoneNumberToCall = formatPhoneNumber(phoneNumberToCall);
    console.log(`[Server Action callAction] Final number formatted for API: '${phoneNumberToCall}'`);
  }

  if (!phoneNumberToCall) { // Re-vérifier après nettoyage/formatage potentiel
    console.error(`[Server Action callAction] phoneNumberToCall is still null/empty after cleanup for contact ID: ${validatedContactId}`);
    return {
      success: false,
      message: `Numéro de téléphone invalide ou manquant pour le contact ${validatedContactId} après nettoyage.`,
      data: null,
    };
  }
  
  console.log(`[Server Action callAction] Attempting to call number: ${phoneNumberToCall} for contact ID: ${validatedContactId} via backend API.`);

  try {
    const apiCallResponse = await fetch(`${apiUrl}/call`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ phone_number: phoneNumberToCall }), // L'API /call attend juste phone_number
    });

    if (!apiCallResponse.ok) {
      let errorMessage = `Échec de l'appel vers ${phoneNumberToCall}.`;
      try {
        const errorData = await apiCallResponse.json();
        errorMessage = errorData.detail || `Erreur API (/call) (${apiCallResponse.status}): ${apiCallResponse.statusText}`;
      } catch {
        // LOG AJOUTÉ pour capturer le texte brut si la réponse n'est pas JSON
        const errorText = await apiCallResponse.text().catch(() => "Impossible de lire la réponse d'erreur.");
        console.error(`[Server Action callAction] API /call error response (not JSON): ${errorText}`);
        errorMessage = `Erreur API (/call) (${apiCallResponse.status}): ${apiCallResponse.statusText}. Réponse brute: ${errorText.substring(0, 100)}`;
      }
      console.error(`[Server Action] Erreur de l'API FastAPI lors de l'appel: ${errorMessage}`);
      return {
        success: false,
        message: errorMessage,
        data: null,
      };
    }

    const callResultData = await apiCallResponse.json();
    const callTimeISO = callResultData.call_time; // call_time est retourné par l'API /call en ISO UTC

    if (!callTimeISO || typeof callTimeISO !== 'string') {
        console.error("[Server Action callAction] call_time manquant ou invalide dans la réponse de l'API /call:", callResultData);
        return {
            success: false,
            message: "Réponse invalide de l'API d'appel (call_time manquant ou invalide).",
            data: null,
        };
    }
    
    console.log(`[Server Action] Appel API réussi. call_time: ${callTimeISO}. Mise à jour du contact avec date et heure de l'appel.`);

    const callTimeUTCDate = new Date(callTimeISO);
    const parisDateFormatter = new Intl.DateTimeFormat('fr-FR', {
      year: 'numeric', month: '2-digit', day: '2-digit',
      timeZone: 'Europe/Paris'
    });
    const formattedDateAppel = parisDateFormatter.format(callTimeUTCDate); // DD/MM/YYYY

    const parisTimeFormatter = new Intl.DateTimeFormat('fr-FR', {
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: false,
      timeZone: 'Europe/Paris'
    });
    const formattedHeureAppel = parisTimeFormatter.format(callTimeUTCDate); // HH:MM:SS

    // Mise à jour directe du contact via fetch, au lieu d'appeler updateContactAction
    const updateData = {
        dateAppel: formattedDateAppel,
        heureAppel: formattedHeureAppel,
        callStartTime: callTimeISO,
    };

    try {
        const updateResponse = await fetch(`${apiUrl}/contacts/${validatedContactId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(updateData),
        });

        if (!updateResponse.ok) {
            let updateErrorMessage = `Échec de la mise à jour du contact après l'appel.`;
            try {
                const errorUpdateData = await updateResponse.json();
                updateErrorMessage = errorUpdateData.detail || `Erreur API (PATCH /contacts) (${updateResponse.status}): ${updateResponse.statusText}`;
            } catch {
                const errorText = await updateResponse.text().catch(() => "Impossible de lire la réponse d'erreur de la MAJ contact.");
                console.error(`[Server Action updateContactAction] API /contacts/PATCH error response (not JSON): ${errorText}`);
                updateErrorMessage = `Erreur API (${updateResponse.status}): ${updateResponse.statusText}. La réponse n'est pas au format JSON. Réponse brute: ${errorText.substring(0,100)}`;
            }
            console.error(`[Server Action] Erreur de l'API FastAPI lors de la mise à jour du contact: ${updateErrorMessage}`);
            return {
                success: false,
                message: `Appel initié, mais échec de la mise à jour du contact: ${updateErrorMessage}`,
                data: null,
            };
        }
        const updatedContactData = await updateResponse.json();
        revalidatePath('/(contacts)');
        console.log("[Server Action] Contact mis à jour avec succès après l'appel (dans callAction).", updatedContactData);
        return {
            success: true,
            message: `Appel vers ${phoneNumberToCall} initié et contact mis à jour.`,
            data: updatedContactData,
        };

    } catch (updateError) {
        console.error("[Server Action] Erreur réseau ou autre lors de la mise à jour du contact (dans callAction):", updateError);
        let technicalUpdateErrorMessage = "Erreur technique lors de la mise à jour du contact après appel.";
        if (updateError instanceof Error) {
            technicalUpdateErrorMessage = updateError.message;
        }
        return {
            success: false,
            message: `Appel initié, mais erreur technique lors de la mise à jour: ${technicalUpdateErrorMessage}`,
            data: null,
        };
    }

  } catch (error) {
    console.error("[Server Action] Erreur réseau ou autre lors du processus d'appel et de mise à jour:", error);
    let technicalErrorMessage = "Erreur technique lors du processus d'appel.";
    if (error instanceof Error) {
        technicalErrorMessage = error.message;
    }
    return {
      success: false,
      message: `Erreur technique: ${technicalErrorMessage}`,
      data: null,
    };
  }
}

/**
 * Server Action pour exporter les contacts.
 * @param prevState L'état précédent.
 * @param formData Les données du formulaire.
 * @returns Un objet indiquant le succès ou l'échec.
 */
export async function exportContactsAction(prevState: ActionState<null>, formData: FormData): Promise<ActionState<null>> {
  const format = formData.get('format') as 'csv' | 'parquet';
  const validationResult = exportFormatSchema.safeParse(format);

  if (!validationResult.success) {
    return {
      success: false,
      message: 'Format d\'exportation invalide.',
      errors: validationResult.error.flatten().fieldErrors,
      data: null,
    };
  }

  console.log(`[Server Action] Exportation des contacts au format : ${validationResult.data}`);
  // TODO: Implémenter la logique d'appel à l'API backend (FastAPI) pour l'exportation.

  if (validationResult.data === 'csv') {
    return {
      success: true,
      message: 'Exportation CSV terminée (simulation).',
      data: null,
    };
  } else if (validationResult.data === 'parquet') {
    return {
      success: true,
      message: 'Exportation Parquet terminée (simulation).',
      data: null,
    };
  }

  return {
    success: false,
    message: 'Erreur inattendue lors de l\'exportation.',
    data: null,
  };
}

/**
 * Server Action pour importer les contacts.
 * @param prevState L'état précédent.
 * @param formData Les données du formulaire.
 * @returns Un objet indiquant le succès, l'échec, ou le besoin de mappage.
 */
export async function importContactsAction(
  prevState: ActionState<ImportResultData | null>,
  formData: FormData
): Promise<ActionState<ImportResultData | null>> {
  try {
    const file = formData.get('file') as File;

    if (!file || file.size === 0) {
      return { 
        success: false, 
        message: 'Aucun fichier sélectionné ou fichier vide.', 
        data: { needsMapping: false } 
      };
    }

    const allowedTypes = ['text/csv', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'];
    if (!allowedTypes.includes(file.type)) {
      return {
        success: false,
        message: `Type de fichier non supporté: ${file.type}. Veuillez utiliser CSV ou XLSX.`,
        data: { needsMapping: false },
      };
    }

    console.log(`[Server Action] Tentative d'import du fichier : ${file.name}, Type: ${file.type}, Taille: ${file.size} bytes`);

    // Vérifier d'abord si l'API est accessible
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    
    try {
      // Test de connectivité à l'API pour donner des erreurs plus claires
      // Utiliser /contacts au lieu de /health car ce point d'accès existe déjà
      const pingResponse = await fetch(`${apiUrl}/contacts`, { 
        method: 'GET',
        // Timeout court pour éviter de bloquer trop longtemps
        signal: AbortSignal.timeout(3000)
      }).catch(error => {
        console.error(`[Server Action] Échec du ping de l'API:`, error);
        throw new Error(`Impossible de se connecter à l'API (${apiUrl}). Veuillez vérifier que le backend FastAPI est en cours d'exécution.`);
      });
      
      if (!pingResponse.ok) {
        return {
          success: false,
          message: `L'API est accessible mais renvoie une erreur: ${pingResponse.status} ${pingResponse.statusText}`,
          data: { needsMapping: false }
        };
      }
    } catch (error) {
      // Ici on capture spécifiquement les erreurs de connectivité
      console.error(`[Server Action] API inaccessible:`, error);
      return {
        success: false,
        message: error instanceof Error 
          ? error.message 
          : "Impossible de contacter le serveur API. Veuillez vérifier que le backend FastAPI est en cours d'exécution.",
        data: { needsMapping: false }
      };
    }

    const apiFormData = new FormData();
    apiFormData.append('file', file);

    const response = await fetch(`${apiUrl}/contacts/import`, {
      method: 'POST',
      body: apiFormData,
    });

    // Gérer le cas où le backend demande un mappage (ex: statut 422)
    if (response.status === 422) {
      const mappingData = await response.json();
      console.log("[Server Action] L'API demande un mappage de colonnes:", mappingData);
      return {
        success: false,
        message: mappingData.message || "Un mappage des colonnes est nécessaire.",
        data: {
          needsMapping: true,
          mappingInfo: mappingData.details as MappingInfo,
        }
      };
    }

    if (!response.ok) {
      let errorDetail = "Erreur inconnue lors de l'import via l'API.";
      let parsedErrorData = null;
      try {
        parsedErrorData = await response.json();
        errorDetail = parsedErrorData.detail || JSON.stringify(parsedErrorData);
      } catch {
        // Si la réponse n'est pas un JSON
        try {
          const errorText = await response.text();
          errorDetail = `Réponse non-JSON de l'API: ${errorText.substring(0, 500)}`;
        } catch {
          // Si impossible de lire le texte
          errorDetail = "Impossible de lire la réponse d'erreur de l'API.";
        }
      }
      console.error(`[Server Action] Erreur de l'API FastAPI lors de l'import (status ${response.status}):`, errorDetail);
      return { 
        success: false, 
        message: `Erreur de l'API (${response.status}): ${errorDetail}`, 
        data: { needsMapping: false, errorDetails: parsedErrorData as Record<string, unknown> } 
      };
    }

    const result = await response.json();
    console.log("[Server Action] Réponse de l'API FastAPI import:", result);
    
    revalidatePath('/(contacts)');
    
    return { 
      success: true, 
      message: result.message || `Fichier ${file.name} importé avec succès (via API).`, 
      data: { count: result.count, needsMapping: false }
    };

  } catch (error) {
    console.error("[Server Action] Erreur lors de l'appel à l'API FastAPI pour l'import:", error);
    let errorMessage = "Erreur interne du serveur lors de la tentative d'import.";
    if (error instanceof Error) {
      if (error.message.toLowerCase().includes('failed to fetch')) {
        errorMessage = "La connexion au serveur d'importation a échoué. Veuillez vérifier que le service backend est en cours d'exécution et accessible.";
      } else {
        errorMessage = error.message;
      }
    }
    return { 
      success: false, 
      message: `Erreur technique lors de l'import: ${errorMessage}`, 
      data: { needsMapping: false } 
    };
  }
}

/**
 * Server Action pour créer un nouveau contact.
 * IMPORTANT: Pour être utilisée directement avec useActionState sans formData,
 * la fonction doit correspondre à la signature attendue ou être encapsulée.
 * Ici, nous supposons qu'elle sera appelée avec des données directes,
 * donc elle ne prend pas prevState et formData.
 * Si vous l'utilisez avec un formulaire et useActionState, vous devrez l'adapter
 * ou créer une action spécifique pour le formulaire.
 * @param data Les données du contact à créer.
 * @returns Un objet avec le résultat.
 */
export async function createContactAction(
  data: Omit<Contact, 'id'> // On s'attend à des données de contact sans ID pour la création
): Promise<ActionState<Contact | null>> {
  const validationResult = contactSchema.omit({ id: true }).safeParse(data);

  if (!validationResult.success) {
    console.error("[Server Action] Erreur de validation pour createContactAction:", validationResult.error.flatten());
    return {
      success: false,
      errors: validationResult.error.flatten().fieldErrors,
      message: "Données du contact invalides.",
      data: null,
    };
  }

  const newContactData = validationResult.data;
  console.log("[Server Action] Création du contact avec données:", newContactData);

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    
    const response = await fetch(`${apiUrl}/contacts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newContactData), // Envoyer les données validées sans ID
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: "Erreur inconnue lors de la création API." }));
      console.error("[Server Action] Erreur de l'API FastAPI lors de la création:", errorData.detail);
      return { 
        success: false, 
        message: `Erreur API: ${errorData.detail || response.statusText}`,
        data: null,
      };
    }

    const createdContact: Contact = await response.json();
    console.log("[Server Action] Contact créé avec succès via API:", createdContact);
    return { success: true, data: createdContact, message: "Contact créé avec succès." };

  } catch (error) {
    console.error("[Server Action] Erreur lors de l'appel à l'API FastAPI pour la création:", error);
    let errorMessage = "Erreur interne du serveur lors de la tentative de création.";
    if (error instanceof Error) {
        errorMessage = error.message;
    }
    return { success: false, message: `Erreur technique: ${errorMessage}`, data: null };
  }
}

/**
 * Server Action pour mettre à jour un contact existant.
 * Voir la note pour createContactAction concernant la signature.
 * @param prevState L'état précédent.
 * @param formData Les données du formulaire.
 * @returns Un objet avec le résultat.
 */
export async function updateContactAction(
  prevState: ActionState<Contact | null>,
  formData: FormData
): Promise<ActionState<Contact | null>> {
  const contactId = formData.get('contactId') as string;
  const dataToUpdate: Record<string, string | null> = {};

  // Extraire les champs du contact à partir de formData
  // et les ajouter à dataToUpdate, en excluant 'contactId'
  // et en s'assurant que les types sont corrects si nécessaire.

  // Traiter tous les champs possibles du formData
  for (const [key, value] of formData.entries()) {
    if (key !== 'contactId') {
      // Une chaîne vide dans le formData représente une valeur null
      dataToUpdate[key] = value === '' ? null : value as string;
    }
  }

  if (!contactId) {
    console.error("[Server Action] updateContactAction: contactId est manquant dans FormData.");
    return {
      success: false,
      message: "ID du contact manquant pour la mise à jour.",
      errors: { contactId: ["ID du contact est requis."] },
      data: null,
    };
  }

  if (Object.keys(dataToUpdate).length === 0) {
    console.warn("[Server Action] updateContactAction: Aucune donnée à mettre à jour pour le contact ID:", contactId);
    // On pourrait retourner un succès avec un message indiquant qu'aucune modification n'a été faite
    // ou chercher le contact existant et le retourner.
    // Pour l'instant, on retourne un message spécifique.
    // Il est préférable de récupérer le contact actuel et de le renvoyer pour éviter toute désynchronisation côté client.
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await fetch(`${apiUrl}/contacts/${contactId}`);
      if (!response.ok) {
        return { success: false, message: `Contact ID ${contactId} non trouvé.`, data: null };
      }
      const existingContact = await response.json();
      return { 
        success: true, 
        message: "Aucune donnée fournie pour la mise à jour. Statut actuel du contact retourné.", 
        data: existingContact 
      };
    } catch (fetchError) {
      console.error(`[Server Action] Erreur en récupérant le contact ${contactId} existant:`, fetchError);
      return { success: false, message: "Erreur en récupérant les données actuelles du contact.", data: null };
    }
  }
  
  console.log(`[Server Action] Tentative de mise à jour du contact ID: ${contactId} avec les données:`, dataToUpdate);

  // Validation partielle avec Zod si nécessaire (les champs sont optionnels pour la mise à jour)
  // const partialContactSchemaForUpdate = contactSchema.partial().omit({ id: true }); // id n'est pas dans dataToUpdate
  // const validationResult = partialContactSchemaForUpdate.safeParse(dataToUpdate);

  // if (!validationResult.success) {
  //   console.error("[Server Action] Erreurs de validation Zod pour la mise à jour:", validationResult.error.flatten().fieldErrors);
  //   return {
  //     success: false,
  //     message: "Données de mise à jour invalides.",
  //     errors: validationResult.error.flatten().fieldErrors,
  //     data: null,
  //   };
  // }

  // const validatedData = validationResult.data; // Utiliser validatedData si la validation Zod est active
  const validatedData = dataToUpdate; // Utiliser directement si pas de validation Zod pour les partiels

  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const response = await fetch(`${apiUrl}/contacts/${contactId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(validatedData),
    });

    if (!response.ok) {
      let errorMessage = `Échec de la mise à jour du contact ID: ${contactId}.`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || `Erreur API (${response.status}): ${response.statusText}`;
      } catch {
        // La réponse n'est pas du JSON ou une autre erreur s'est produite
        errorMessage = `Erreur API (${response.status}): ${response.statusText}. La réponse n'est pas au format JSON.`;
      }
      console.error(`[Server Action] Erreur de l'API FastAPI lors de la mise à jour du contact: ${errorMessage}`);
      return {
        success: false,
        message: errorMessage,
        data: null,
      };
    }

    const updatedContact = await response.json();
    console.log("[Server Action] Contact mis à jour avec succès via l'API FastAPI:", updatedContact);
    
    revalidatePath('/(contacts)'); // Invalider le cache pour la page des contacts
    // revalidatePath('/'); // Décommenter si vous avez une page d'accueil qui affiche aussi des contacts

    return {
      success: true,
      message: `Contact ${updatedContact.firstName || contactId} mis à jour avec succès.`,
      data: updatedContact,
    };

  } catch (error) {
    console.error("[Server Action] Erreur réseau ou autre lors de la mise à jour du contact:", error);
    let technicalErrorMessage = "Erreur technique lors de la mise à jour du contact.";
    if (error instanceof Error) {
        technicalErrorMessage = error.message;
    }
    return {
      success: false,
      message: `Erreur technique: ${technicalErrorMessage}`,
      data: null,
    };
  }
}

/**
 * Server Action pour supprimer un contact.
 * @param contactId L'ID du contact à supprimer.
 * @returns Un objet indiquant le succès ou l'échec.
 */
// export async function deleteContactAction(
//   // prevState: ActionState, // Si utilisé avec useActionState et un formulaire simple avec juste un ID
//   payload: { contactId: string } // Ou juste contactId: string si appelée directement sans useActionState
// ): Promise<ActionState> {
//   const { contactId } = payload;

//   if (!contactId) {
//     return {
//       success: false,
//       message: "ID du contact manquant pour la suppression.",
//     };
//   }

//   console.log(`[Server Action] Suppression du contact ID: ${contactId}`);

//   try {
//     const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
//     const response = await fetch(`${apiUrl}/contacts/${contactId}`, {
//       method: 'DELETE',
//     });

//     if (response.status === 204) { // Succès sans contenu
//       return { success: true, message: `Contact ${contactId} supprimé avec succès.` };
//     }

//     if (!response.ok) {
//       const errorData = await response.json().catch(() => ({ detail: "Erreur inconnue lors de la suppression API." }));
//       console.error("[Server Action] Erreur de l'API FastAPI lors de la suppression:", errorData.detail);
//       return { success: false, message: `Erreur de l'API lors de la suppression: ${errorData.detail || response.statusText}` };
//     }
    
//     // Normalement, une suppression réussie avec 204 ne renverra pas de JSON.
//     // S'il y a une réponse JSON pour un statut OK autre que 204, c'est inattendu ici.
//     // Mais on la logue au cas où.
//     const result = await response.json().catch(() => null);
//     console.log("[Server Action] Réponse inattendue de l'API FastAPI pour delete (devrait être 204):", result);
//     return { success: true, message: `Contact ${contactId} traité pour suppression (réponse inattendue).` };

//   } catch (error) {
//     console.error("[Server Action] Erreur lors de l'appel à l'API FastAPI pour la suppression:", error);
//     let errorMessage = "Erreur interne du serveur lors de la tentative de suppression.";
//     if (error instanceof Error) {
//         errorMessage = error.message;
//     }
//     return { success: false, message: `Erreur technique: ${errorMessage}` };
//   }
// }

export async function clearAllDataAction(): Promise<ActionState<null>> {
  try {
    const response = await fetch('http://localhost:8000/contacts/all', {
      method: 'DELETE',
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Erreur inconnue lors du nettoyage des données côté serveur.' }));
      console.error("[clearAllDataAction] Erreur API:", response.status, errorData);
      return {
        success: false,
        message: typeof errorData.detail === 'string' ? errorData.detail : 'Erreur lors du nettoyage des données serveur.',
        data: null,
      };
    }

    return {
      success: true,
      message: 'Toutes les données ont été réinitialisées avec succès.',
      data: null,
    };
  } catch (error) {
    console.error("[clearAllDataAction] Erreur inattendue:", error);
    const errorMessage = error instanceof Error ? error.message : 'Une erreur de communication est survenue.';
    return {
      success: false,
      message: errorMessage,
      data: null,
    };
  }
}

export async function hangUpCallAction(prevState: ActionState<Contact | null>, formData: FormData): Promise<ActionState<Contact | null>> {
  const rawFormData = {
    contactId: formData.get('contactId'),
  };
  const validationResult = hangUpActionSchema.safeParse(rawFormData);

  if (!validationResult.success) {
    return {
      success: false,
      message: 'Données pour raccrocher invalides.',
      errors: validationResult.error.flatten().fieldErrors,
      data: null,
    };
  }

  const { contactId } = validationResult.data;
  console.log(`[Server Action hangUpCallAction] INIT: Tentative de raccrocher l'appel pour contact ID: ${contactId}`);

  // S'assurer que API_BASE_URL est défini
  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
  console.log(`[Server Action hangUpCallAction] Utilisation de l'URL API: ${apiUrl}`);

  // Vérifier d'abord l'état de l'appel (s'il est toujours en cours)
  let callWasActive = true; // On suppose qu'il était actif par défaut
  
  try {
    const callStatusResponse = await fetch(`${apiUrl}/call/status`);
    const callStatusData = await callStatusResponse.json();
    callWasActive = callStatusData.call_in_progress;
    
    console.log(`[Server Action hangUpCallAction] Vérification de l'état de l'appel: ${callWasActive ? "Actif" : "Inactif"}`);
  } catch (error) {
    console.error(`[Server Action hangUpCallAction] Erreur lors de la vérification de l'état d'appel:`, error);
    // On continue même en cas d'erreur de vérification
  }

  // L'heure de fin d'appel UTC est MAINTENANT, quelle que soit la méthode de raccrochage utilisée
  const callEndTimeUTC = new Date();
  console.log(`[Server Action hangUpCallAction] STEP 1: Heure de fin d'appel (UTC): ${callEndTimeUTC.toISOString()}`);

  try {
    // Si l'appel est toujours actif, envoyer la commande de raccrochage via l'API
    if (callWasActive) {
      console.log(`[Server Action hangUpCallAction] STEP 2: L'appel est actif, envoi de la commande de raccrochage via l'API`);
      const hangUpResponse = await fetch(`${apiUrl}/adb/hangup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ contact_id: contactId })
      });

      if (!hangUpResponse.ok) {
        const errorData = await hangUpResponse.json().catch(() => ({}));
        console.error(`[Server Action hangUpCallAction] ERREUR: Échec de l'API /adb/hangup. Status: ${hangUpResponse.status}. Détails: ${JSON.stringify(errorData)}`);
        return {
          success: false,
          message: "Impossible de raccrocher l'appel. Veuillez vérifier le téléphone.",
          errors: {},
          data: null,
        };
      }

      // Il est important de laisser un délai pour permettre à la commande de raccrochage d'être exécutée
      await new Promise(resolve => setTimeout(resolve, 1000));
    } else {
      console.log(`[Server Action hangUpCallAction] STEP 2: L'appel n'est plus actif, probablement déjà raccroché sur le téléphone`);
    }

    // Trouver le contact dans la base de données pour obtenir ses informations complètes
    const contactResponse = await fetch(`${apiUrl}/contacts/${contactId}`);
    
    if (!contactResponse.ok) {
      console.error(`[Server Action hangUpCallAction] STEP 3: Échec de la récupération du contact. Status: ${contactResponse.status}`);
      return {
        success: false,
        message: "Impossible de trouver les informations du contact.",
        errors: {},
        data: null,
      };
    }

    const contactData = await contactResponse.json();
    console.log(`[Server Action hangUpCallAction] STEP 3: Contact récupéré: ${contactData.firstName} ${contactData.lastName}`);

    // Calcul de la durée d'appel
    let dureeSecondes = 0;

    // VÉRIFIER contactData et callStartTime avant de l'utiliser
    if (contactData && contactData.callStartTime && typeof contactData.callStartTime === 'string') { // Utiliser l'heure de début UTC précise si disponible
      const callStartTimeUTC = new Date(contactData.callStartTime);
      console.log(`[Server Action hangUpCallAction] STEP 4: Calcul de la durée avec callStartTime UTC: ${callStartTimeUTC.toISOString()} et callEndTime UTC: ${callEndTimeUTC.toISOString()}`);
      
      if (isValid(callStartTimeUTC) && isValid(callEndTimeUTC)) {
        dureeSecondes = differenceInSeconds(callEndTimeUTC, callStartTimeUTC);
        if (dureeSecondes < 0) {
          console.warn(`[Server Action hangUpCallAction] STEP 4: Durée négative (${dureeSecondes}s) avec callStartTime. Peut indiquer un problème de synchronisation ou de données. Mise à 0.`);
          dureeSecondes = 0;
        }
        
        console.log(`[Server Action hangUpCallAction] STEP 4: Durée calculée: ${dureeSecondes} secondes`);
      } else {
        console.warn(`[Server Action hangUpCallAction] STEP 4: callStartTime (${callStartTimeUTC}) ou callEndTime (${callEndTimeUTC}) invalide.`);
        // Fallback vers dateAppel/heureAppel si disponible
        if (contactData.dateAppel && typeof contactData.dateAppel === 'string' && 
            contactData.heureAppel && typeof contactData.heureAppel === 'string') {
          
          try {
            // Utiliser l'heure locale du serveur pour le calcul car dateAppel/heureAppel sont locaux
            const dateParts = contactData.dateAppel.split('/');
            if (dateParts.length === 3) {
              // Format attendu: DD/MM/YYYY
              const day = parseInt(dateParts[0]);
              const month = parseInt(dateParts[1]) - 1; // Les mois sont 0-indexés en JS
              const year = parseInt(dateParts[2]);
              
              // Format attendu pour heureAppel: HH:MM:SS
              const timeParts = contactData.heureAppel.split(':');
              let hours = 0, minutes = 0, seconds = 0;
              if (timeParts.length >= 2) {
                hours = parseInt(timeParts[0]);
                minutes = parseInt(timeParts[1]);
                seconds = timeParts.length > 2 ? parseInt(timeParts[2]) : 0;
              }
              
              const callStartLocalDate = new Date(year, month, day, hours, minutes, seconds);
              if (isValid(callStartLocalDate)) {
                dureeSecondes = differenceInSeconds(callEndTimeUTC, callStartLocalDate);
                if (dureeSecondes < 0) {
                  console.warn(`[Server Action hangUpCallAction] STEP 4B: Durée négative (${dureeSecondes}s) avec dateAppel/heureAppel. Mise à 0.`);
                  dureeSecondes = 0;
                }
                console.log(`[Server Action hangUpCallAction] STEP 4B: Durée calculée avec dateAppel/heureAppel: ${dureeSecondes} secondes`);
              } else {
                console.warn(`[Server Action hangUpCallAction] STEP 4B: Date de début d'appel invalide après parsing dateAppel/heureAppel: ${callStartLocalDate}`);
              }
            }
          } catch (e) {
            console.error(`[Server Action hangUpCallAction] STEP 4B: Erreur lors du parsing de dateAppel/heureAppel: ${e}`);
          }
        } else {
          console.warn(`[Server Action hangUpCallAction] STEP 4B: Impossible de calculer la durée, dateAppel ou heureAppel manquant/invalide.`);
        }
      }
    } else {
      console.warn(`[Server Action hangUpCallAction] STEP 4: callStartTime non disponible. Tentative avec dateAppel/heureAppel...`);
      // Le reste du code pour dateAppel/heureAppel comme ci-dessus
      // ...
    }

    // Formatage de la durée
    const formattedDureeAppel = format_duration(dureeSecondes);
    console.log(`[Server Action hangUpCallAction] STEP 5: Durée formatée: ${formattedDureeAppel}`);

    // Mise à jour du contact avec la durée d'appel
    const updateResponse = await fetch(`${apiUrl}/contacts/${contactId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        dureeAppel: formattedDureeAppel
      })
    });

    if (!updateResponse.ok) {
      console.error(`[Server Action hangUpCallAction] STEP 6: Échec de la mise à jour du contact. Status: ${updateResponse.status}`);
      return {
        success: false,
        message: "L'appel a été raccroché, mais impossible de mettre à jour la durée.",
        errors: {},
        data: null,
      };
    }

    const updatedContact = await updateResponse.json();
    console.log(`[Server Action hangUpCallAction] STEP 6: Contact mis à jour avec succès, durée: ${formattedDureeAppel}`);

    revalidatePath('/');
    return {
      success: true,
      message: `Appel terminé avec ${updatedContact.firstName} ${updatedContact.lastName}. Durée: ${formattedDureeAppel}`,
      errors: {},
      data: updatedContact,
    };
  } catch (error) {
    console.error(`[Server Action hangUpCallAction] ERREUR GLOBALE:`, error);
    return {
      success: false,
      message: "Erreur lors du raccrochage de l'appel.",
      errors: {},
      data: null,
    };
  }
}

// Fonction utilitaire pour formater la durée
function format_duration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${remainingMinutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  } else {
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
}