import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSupabaseAuth } from '../lib/auth-client';
import { Eye, EyeOff, Lock, Mail, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const { signInWithPassword } = useSupabaseAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('[AuthModal] Début de la soumission du formulaire.');
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError('Veuillez saisir votre email et votre mot de passe.');
      console.log('[AuthModal] Validation échouée: email ou mot de passe vide.');
      return;
    }
    
    setIsLoading(true);
    console.log(`[AuthModal] Tentative de connexion pour : ${email}`);

    const finalEmail = email.trim();
    const finalPassword = password.trim();

    try {
      const { error: signInError } = await signInWithPassword(finalEmail, finalPassword);
      
      if (signInError) {
        console.error('[AuthModal] Erreur de connexion Supabase (inspectez l\'objet complet):', signInError);
        
        let errorMessage = 'Une erreur est survenue.';
        if (signInError && 'code' in signInError && (signInError as any).code) {
          // Cas où on a un code d'erreur spécifique
          errorMessage = `Erreur: ${signInError.message} (Code: ${(signInError as any).code})`;
        } else if (signInError.message === 'Invalid login credentials') {
          // Cas générique, on suggère la cause la plus probable
          errorMessage = 'Email ou mot de passe incorrect. Avez-vous bien confirmé votre adresse email ?';
        } else {
          // Autres erreurs
          errorMessage = signInError.message || 'Erreur de connexion inconnue.';
        }
        setError(errorMessage);
      } else {
        console.log('[AuthModal] Connexion réussie, le changement de statut devrait fermer la modale.');
        // La modale se fermera automatiquement via l'useEffect dans App.tsx
      }
    } catch (err) {
      console.error('[AuthModal] Erreur inattendue:', err);
      setError('Une erreur inattendue s\'est produite.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Empêcher la fermeture via Escape
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    
    if (e.key === 'Enter' && !isLoading) {
      handleSubmit(e as any);
    }
  };

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={() => {}} // Empêche la fermeture par clic extérieur
    >
      <DialogContent 
        className="sm:max-w-[400px] border-0 bg-gray-900/95 backdrop-blur-xl shadow-2xl"
        showCloseButton={false} // Supprime le bouton de fermeture (croix)
        onEscapeKeyDown={(e) => e.preventDefault()} // Empêche la fermeture via Escape
        onPointerDownOutside={(e) => e.preventDefault()} // Empêche la fermeture par clic extérieur
        onInteractOutside={(e) => e.preventDefault()} // Empêche toute interaction extérieure
      >
        <DialogHeader className="space-y-4 text-center pb-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
            <Lock className="w-8 h-8 text-white" />
          </div>
          <DialogTitle className="text-2xl font-semibold text-white tracking-tight">
            Connexion
          </DialogTitle>
          <p className="text-sm text-gray-300 font-medium">
            Accédez à votre espace DimiCall
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-200">
                Adresse email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className={cn(
                    "pl-10 h-12 bg-gray-800/60 border-gray-600 rounded-xl text-white",
                    "focus:bg-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500",
                    "transition-all duration-200",
                    "placeholder:text-gray-500"
                  )}
                  placeholder="nom@exemple.com"
                  disabled={isLoading}
                  autoFocus
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-200">
                Mot de passe
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className={cn(
                    "pl-10 pr-10 h-12 bg-gray-800/60 border-gray-600 rounded-xl text-white",
                    "focus:bg-gray-800 focus:border-blue-500 focus:ring-1 focus:ring-blue-500",
                    "transition-all duration-200",
                    "placeholder:text-gray-500"
                  )}
                  placeholder="••••••••"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-lg bg-red-900/40 border border-red-700/50">
              <p className="text-sm text-red-300 font-medium">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isLoading || !email.trim() || !password.trim()}
            className={cn(
              "w-full h-12 rounded-xl font-semibold text-base text-white",
              "bg-gradient-to-r from-blue-500 to-purple-600",
              "hover:from-blue-600 hover:to-purple-700",
              "disabled:from-gray-600 disabled:to-gray-700 disabled:text-gray-400",
              "transition-all duration-200",
              "shadow-lg hover:shadow-xl",
              "focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900"
            )}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Connexion en cours...
              </>
            ) : (
              'Se connecter'
            )}
          </Button>
        </form>

        {/* Footer */}
        <div className="pt-4 border-t border-gray-700">
          <p className="text-xs text-center text-gray-400">
            Session sécurisée • Un seul appareil autorisé • Authentification obligatoire
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 