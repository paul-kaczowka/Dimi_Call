import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import type { Contact } from '@/lib/schemas/contact';
import { updateContactAction } from '@/app/actions';

// Type pour les paramètres de mutation avec optimistic updates
type ContactMutationParams = {
  contactId: string;
  field: keyof Contact;
  value: string | number | boolean | null;
  previousValue?: string | number | boolean | null;
};

/**
 * Hook pour gérer les mutations optimisées de contacts
 */
export function useContactMutations() {
  const queryClient = useQueryClient();

  // Fonction utilitaire pour créer un FormData à partir des paramètres
  const createFormData = (params: ContactMutationParams): FormData => {
    const formData = new FormData();
    formData.append('contactId', params.contactId);
    formData.append('field', params.field);
    formData.append('value', String(params.value ?? ''));
    return formData;
  };

  // Mutation pour mettre à jour un contact avec mise à jour optimiste
  const updateContactMutation = useMutation({
    mutationFn: async (params: ContactMutationParams) => {
      const formData = createFormData(params);
      const result = await updateContactAction({ success: false, message: '', data: null }, formData);
      
      if (!result.success || !result.data) {
        throw new Error(result.message || "Erreur lors de la mise à jour du contact.");
      }
      
      return result.data as Contact;
    },
    
    // Mise à jour optimiste: mettre à jour le cache avant confirmation du serveur
    onMutate: async (params: ContactMutationParams) => {
      // Annuler les requêtes en cours pour éviter des écrasements
      await queryClient.cancelQueries({ queryKey: ['contacts'] });
      
      // Sauvegarder l'état précédent
      const previousContacts = queryClient.getQueryData<Contact[]>(['contacts']);
      
      // Mise à jour optimiste du cache
      queryClient.setQueryData<Contact[]>(['contacts'], (old = []) => {
        return old.map(contact => {
          if (contact.id === params.contactId) {
            return { ...contact, [params.field]: params.value };
          }
          return contact;
        });
      });
      
      // Retourner le contexte avec l'état précédent pour rollback en cas d'erreur
      return { previousContacts };
    },
    
    // En cas d'erreur, restaurer l'état précédent
    onError: (err, params, context) => {
      toast.error(`Erreur lors de la mise à jour: ${err.message}`);
      if (context?.previousContacts) {
        queryClient.setQueryData(['contacts'], context.previousContacts);
      }
    },
    
    // Toujours invalider la requête après une mutation, réussie ou non
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });

  // Mutation pour les statuts avec mise à jour optimiste
  const updateStatusMutation = useMutation({
    mutationFn: async (params: ContactMutationParams) => {
      const formData = createFormData(params);
      const result = await updateContactAction({ success: false, message: '', data: null }, formData);
      
      if (!result.success || !result.data) {
        throw new Error(result.message || "Erreur lors de la mise à jour du statut.");
      }
      
      return result.data as Contact;
    },
    
    // Optimistic update spécifique pour les statuts
    onMutate: async (params: ContactMutationParams) => {
      await queryClient.cancelQueries({ queryKey: ['contacts'] });
      
      const previousContacts = queryClient.getQueryData<Contact[]>(['contacts']);
      
      queryClient.setQueryData<Contact[]>(['contacts'], (old = []) => {
        return old.map(contact => {
          if (contact.id === params.contactId) {
            const updatedContact = { 
              ...contact, 
              [params.field]: params.value,
              lastModified: new Date().toISOString() // Mise à jour auto de lastModified
            };
            return updatedContact;
          }
          return contact;
        });
      });
      
      return { previousContacts };
    },
    
    onError: (err, params, context) => {
      toast.error(`Erreur lors de la mise à jour du statut: ${err.message}`);
      if (context?.previousContacts) {
        queryClient.setQueryData(['contacts'], context.previousContacts);
      }
    },
    
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });

  // Mutation pour les commentaires avec mise à jour optimiste
  const updateCommentMutation = useMutation({
    mutationFn: async (params: ContactMutationParams) => {
      const formData = createFormData(params);
      const result = await updateContactAction({ success: false, message: '', data: null }, formData);
      
      if (!result.success || !result.data) {
        throw new Error(result.message || "Erreur lors de la mise à jour du commentaire.");
      }
      
      return result.data as Contact;
    },
    
    // Optimistic update spécifique pour les commentaires
    onMutate: async (params: ContactMutationParams) => {
      await queryClient.cancelQueries({ queryKey: ['contacts'] });
      
      const previousContacts = queryClient.getQueryData<Contact[]>(['contacts']);
      
      queryClient.setQueryData<Contact[]>(['contacts'], (old = []) => {
        return old.map(contact => {
          if (contact.id === params.contactId) {
            return { 
              ...contact, 
              [params.field]: params.value,
              lastModified: new Date().toISOString() // Mise à jour auto de lastModified
            };
          }
          return contact;
        });
      });
      
      return { previousContacts };
    },
    
    onError: (err, params, context) => {
      toast.error(`Erreur lors de la mise à jour du commentaire: ${err.message}`);
      if (context?.previousContacts) {
        queryClient.setQueryData(['contacts'], context.previousContacts);
      }
    },
    
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });

  return {
    updateContact: updateContactMutation.mutate,
    updateStatus: updateStatusMutation.mutate,
    updateComment: updateCommentMutation.mutate,
    isLoading: updateContactMutation.isPending || 
               updateStatusMutation.isPending || 
               updateCommentMutation.isPending
  };
} 