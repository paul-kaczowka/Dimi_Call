import React, { useState } from 'react';
import { User, LogOut, Mail, Calendar } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useSupabaseAuth } from '../lib/auth-client';

interface UserProfileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
  userStatus?: 'online' | 'offline' | 'away';
}

export const UserProfileDialog: React.FC<UserProfileDialogProps> = ({
  isOpen,
  onClose,
  userName,
  userStatus = 'online'
}) => {
  const auth = useSupabaseAuth();

  const handleSignOut = async () => {
    const result = await auth.signOut();
    if (!result.error) {
      onClose();
      window.location.reload();
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'bg-green-500';
      case 'away': return 'bg-yellow-500';
      case 'offline': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'online': return 'En ligne';
      case 'away': return 'Absent';
      case 'offline': return 'Hors ligne';
      default: return 'Inconnu';
    }
  };

  if (!auth.user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Profil utilisateur
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informations utilisateur */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${getStatusColor(userStatus)}`} />
                </div>
                <div className="flex-1">
                  <CardTitle className="text-lg">
                    {auth.user.email}
                  </CardTitle>
                  <CardDescription className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${getStatusColor(userStatus)}`} />
                    {getStatusLabel(userStatus)}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Statut d'accès</span>
                  <Badge variant="secondary" className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                    <Mail className="w-3 h-3 mr-1" />
                    Autorisé
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Licence</span>
                  <div className="text-sm">
                    {auth.user.user_metadata?.license_expires_at ? (
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatLicenseExpiry(auth.user.user_metadata.license_expires_at)}
                      </div>
                    ) : (
                      'N/A'
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              onClick={handleSignOut}
              className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Se déconnecter
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 