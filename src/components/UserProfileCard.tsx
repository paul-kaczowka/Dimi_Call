import React from 'react';
import { motion } from 'framer-motion';
import { User, LogOut, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useSupabaseAuth } from '../lib/auth-client';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface UserProfileCardProps {
  className?: string;
}

export const UserProfileCard: React.FC<UserProfileCardProps> = ({ className = '' }) => {
  const auth = useSupabaseAuth();
  
  if (!auth.isAuthenticated || !auth.user) {
    return null;
  }

  const handleSignOut = async () => {
    const result = await auth.signOut();
    if (!result.error) {
      window.location.reload(); // Recharger la page après déconnexion
    }
  };

  const formatLicenseExpiry = (expiryDate: string) => {
    const date = new Date(expiryDate);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`${className}`}
      >
        <Card className="border-0 shadow-lg bg-gradient-to-br from-white/90 to-gray-50/90 dark:from-gray-800/90 dark:to-gray-900/90 backdrop-blur-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              {/* Informations utilisateur */}
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                      {auth.user.email}
                    </h3>
                    <Badge variant="secondary" className="text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border-green-200 dark:border-green-700">
                      <Mail className="w-3 h-3 mr-1" />
                      Autorisé
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Licence expire le : {auth.user.user_metadata?.license_expires_at ? formatLicenseExpiry(auth.user.user_metadata.license_expires_at) : 'N/A'}
                  </p>
                </div>
              </div>

              {/* Bouton de déconnexion */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSignOut}
                    className="text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Se déconnecter</p>
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Indicateur de statut */}
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-gray-600 dark:text-gray-400">Connecté</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </TooltipProvider>
  );
}; 