import { useState } from 'react';
import { toast } from 'react-toastify';

export function useSmsAction() {
  const [isLoading, setIsLoading] = useState(false);

  // Méthode de secours pour ouvrir un lien SMS dans le navigateur
  const handleBackupMethod = (phoneNumber: string, message: string): void => {
    try {
      // Nettoyage du numéro de téléphone
      const cleanedPhoneNumber = phoneNumber.replace(/\D/g, '');
      
      // Méthode 1: URI sms: avec le paramètre body (fonctionne sur certains navigateurs/appareils)
      const encodedMessage = encodeURIComponent(message);
      const smsUri = `sms:${cleanedPhoneNumber}?body=${encodedMessage}`;
      
      // Ouvrir dans un nouvel onglet
      window.open(smsUri, '_blank');
      
      toast.info('Tentative d\'ouverture de l\'application SMS via le navigateur.');
      
      // Afficher les commandes ADB à exécuter manuellement pour aider l'utilisateur
      console.info('Si l\'ouverture automatique ne fonctionne pas, exécutez l\'une de ces commandes dans un terminal:');
      
      // Commande ADB 1 : Intent SENDTO avec extra sms_body
      const escapedMessage = message.replace(/"/g, '\\"').replace(/'/g, "\\'");
      console.info(`Méthode 1 : adb shell am start -a android.intent.action.SENDTO -d sms:${cleanedPhoneNumber} --es sms_body "${escapedMessage}"`);
      
      // Commande ADB 2 : Intent VIEW avec paramètre body dans l'URI
      console.info(`Méthode 2 : adb shell am start -a android.intent.action.VIEW -d "sms:${cleanedPhoneNumber}?body=${encodedMessage}"`);
      
      // Commande ADB 3 : Lancer l'app puis simuler la saisie (méthode alternative)
      const spaceEscapedMessage = message.replace(/ /g, '%s');
      console.info(`Méthode 3 (alternative) :\nadb shell am start -n com.android.mms/.ui.ComposeMessageActivity\nadb shell input text "${spaceEscapedMessage}"`);
      
    } catch (backupError) {
      console.error('Erreur lors de l\'utilisation de la méthode de secours pour SMS:', backupError);
      toast.error('Impossible d\'ouvrir l\'application SMS. Utilisez l\'une des commandes ADB affichées dans la console.');
    }
  };

  const sendSmsAction = async (phoneNumber: string, message: string): Promise<void> => {
    setIsLoading(true);
    try {
      // Tentative d'utiliser l'API route d'abord
      const response = await fetch('/api/sms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phoneNumber, message }),
      });

      const data = await response.json();

      if (!response.ok) {
        console.warn('Échec de l\'API SMS, utilisation de la méthode de secours:', data);
        // Si l'API échoue, utilisez une méthode de secours
        return handleBackupMethod(phoneNumber, message);
      }

      // Succès
      console.log('SMS envoyé avec succès:', data);
      toast.success('Application SMS ouverte avec succès');
    } catch (error) {
      console.error('Erreur lors de l\'envoi du SMS via l\'API:', error);
      // En cas d'erreur avec l'API, essayez la méthode de secours
      return handleBackupMethod(phoneNumber, message);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    sendSmsAction,
    isLoading,
  };
} 