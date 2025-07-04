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