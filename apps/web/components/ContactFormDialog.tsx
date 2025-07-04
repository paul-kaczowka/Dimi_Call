'use client';

import React, { useEffect } from 'react';
import { useForm } from '@tanstack/react-form';
import { contactSchema, Contact } from '@/lib/schemas/contact';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import { toast } from 'react-toastify';
import { createContactAction, updateContactAction } from '@/app/actions';

interface ContactFormDialogProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onFormSubmitSuccess?: (contact: Contact) => void;
  initialData?: Contact;
  mode: 'create' | 'edit';
}

export function ContactFormDialog({
  isOpen,
  onOpenChange,
  initialData,
  mode,
  onFormSubmitSuccess,
}: ContactFormDialogProps) {
  const form = useForm<Contact, 
    undefined, // TOnMount
    typeof contactSchema, // TOnChange
    undefined, // TOnChangeAsync
    undefined, // TOnBlur
    undefined, // TOnBlurAsync
    undefined, // TOnSubmit (notre onSubmit est la fonction principale, pas un validateur ici)
    undefined, // TOnSubmitAsync
    undefined, // TOnServer
    undefined  // TSubmitMeta
  >({
    defaultValues: initialData || {
      id: crypto.randomUUID(),
      firstName: '',
      lastName: '',
      email: '',
      phoneNumber: '',
    },
    onSubmit: async ({ value }) => {
      try {
        let result;
        if (mode === 'create') {
          const contactToCreate = { ...value, id: value.id || crypto.randomUUID() };
          result = await createContactAction(contactToCreate);
        } else {
          if (!initialData?.id) {
            toast.error("Erreur : ID du contact manquant pour la mise à jour.");
            console.error("ContactFormDialog: ID manquant pour updateContactAction.");
            return;
          }
          result = await updateContactAction(initialData.id, value as Partial<Contact>);
        }

        if (result.success && result.data) {
          toast.success(result.message || (mode === 'create' ? 'Contact ajouté !' : 'Contact mis à jour !'));
          onFormSubmitSuccess?.(result.data as Contact);
          onOpenChange(false);
          form.reset();
        } else {
          toast.error(result.message || "Une erreur est survenue.");
          if (result.errors) {
            console.error("Erreurs de validation du serveur:", result.errors);
          }
        }
      } catch (error) {
        toast.error("Une erreur inattendue est survenue lors de la soumission.");
        console.error("Erreur de soumission ContactFormDialog:", error);
      }
    },
    validators: {
      onChange: contactSchema, // Ceci devrait correspondre à TOnChange
    }
  });

  useEffect(() => {
    if (mode === 'edit' && initialData) {
      Object.entries(initialData).forEach(([key, val]) => {
        form.setFieldValue(key as keyof Contact, val);
      });
    } else if (mode === 'create') {
      form.reset();
      form.setFieldValue('id', initialData?.id && initialData.id !== (form.options.defaultValues as Contact).id ? initialData.id : crypto.randomUUID());
    }
  }, [initialData, mode, form]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? 'Ajouter un contact' : 'Modifier le contact'}</DialogTitle>
          <DialogDescription>
            {mode === 'create' ? "Remplissez les détails ci-dessous pour ajouter un nouveau contact." : "Modifiez les détails du contact."}
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            e.stopPropagation();
            form.handleSubmit();
          }}
          className="space-y-4 py-4"
        >
          <form.Field name="firstName">
            {(field) => (
              <div className="grid gap-2">
                <Label htmlFor={field.name}>Prénom</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Jean"
                />
                {field.state.meta.isTouched && field.state.meta.errors && field.state.meta.errors.length > 0 ? (
                  <em className="text-sm text-red-500">{field.state.meta.errors.join(', ')}</em>
                ) : null}
              </div>
            )}
          </form.Field>

          <form.Field name="lastName">
            {(field) => (
              <div className="grid gap-2">
                <Label htmlFor={field.name}>Nom</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  placeholder="Dupont"
                />
                {field.state.meta.isTouched && field.state.meta.errors && field.state.meta.errors.length > 0 ? (
                  <em className="text-sm text-red-500">{field.state.meta.errors.join(', ')}</em>
                ) : null}
              </div>
            )}
          </form.Field>

          <form.Field name="email">
            {(field) => (
              <div className="grid gap-2">
                <Label htmlFor={field.name}>Email</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  type="email"
                  placeholder="jean.dupont@example.com"
                />
                {field.state.meta.isTouched && field.state.meta.errors && field.state.meta.errors.length > 0 ? (
                  <em className="text-sm text-red-500">{field.state.meta.errors.join(', ')}</em>
                ) : null}
              </div>
            )}
          </form.Field>

          <form.Field name="phoneNumber">
            {(field) => (
              <div className="grid gap-2">
                <Label htmlFor={field.name}>Téléphone</Label>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  type="tel"
                  placeholder="0123456789"
                />
                {field.state.meta.isTouched && field.state.meta.errors && field.state.meta.errors.length > 0 ? (
                  <em className="text-sm text-red-500">{field.state.meta.errors.join(', ')}</em>
                ) : null}
              </div>
            )}
          </form.Field>
          
          <DialogFooter>
            <DialogClose asChild>
                <Button type="button" variant="outline">Annuler</Button>
            </DialogClose>
            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
            >
              {([canSubmit, isSubmitting]) => (
                <Button type="submit" disabled={!canSubmit || isSubmitting}>
                  {isSubmitting ? 'Enregistrement...' : (mode === 'create' ? 'Ajouter' : 'Sauvegarder')}
                </Button>
              )}
            </form.Subscribe>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}