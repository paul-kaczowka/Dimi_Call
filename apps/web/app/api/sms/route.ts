import { NextRequest, NextResponse } from 'next/server';
import { promisify } from 'util';
import { exec } from 'child_process';

const execPromise = promisify(exec);

interface SmsRequestBody {
  phoneNumber: string;
  message: string;
}

interface ExecError extends Error {
  stderr?: string;
  stdout?: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    console.log('[SMS API] Début du traitement de la requête SMS');
    
    let data: SmsRequestBody;
    try {
      data = await request.json() as SmsRequestBody;
      console.log('[SMS API] Données reçues:', { 
        phoneNumber: data.phoneNumber, 
        messageLength: data.message?.length || 0 
      });
    } catch (parseError) {
      console.error('[SMS API] Erreur lors du parsing de la requête JSON:', parseError);
      return NextResponse.json(
        { error: 'Requête JSON invalide' },
        { status: 400 }
      );
    }
    
    const { phoneNumber, message } = data;

    if (!phoneNumber || !message) {
      console.warn('[SMS API] Données manquantes:', { phoneNumber: !!phoneNumber, message: !!message });
      return NextResponse.json(
        { error: 'Le numéro de téléphone et le message sont requis' },
        { status: 400 }
      );
    }

    // Nettoyage du numéro de téléphone pour ne garder que les chiffres
    const cleanedPhoneNumber = phoneNumber.replace(/\D/g, '');
    console.log('[SMS API] Numéro de téléphone nettoyé:', cleanedPhoneNumber);

    // Échapper les guillemets et autres caractères spéciaux dans le message
    const escapedMessage = message.replace(/"/g, '\\"').replace(/'/g, "\\'");
    
    // Utiliser la commande ADB recommandée pour ouvrir l'application Messages avec un message pré-rempli
    // Méthode 1 - Utilisation de l'intent SENDTO avec l'extra sms_body
    const adbCommand = `adb shell am start -a android.intent.action.SENDTO -d sms:${cleanedPhoneNumber} --es sms_body "${escapedMessage}"`;

    console.log('[SMS API] Tentative d\'exécution de la commande ADB:', adbCommand);

    try {
      const { stdout, stderr } = await execPromise(adbCommand);
      
      console.log('[SMS API] Résultat de la commande ADB (stdout):', stdout);
      if (stderr) {
        console.warn('[SMS API] Avertissement de la commande ADB (stderr):', stderr);
      }

      // En cas d'échec silencieux, essayer la méthode alternative avec le paramètre ?body= dans l'URI
      if (stdout.includes('Error') || stderr.includes('Error')) {
        console.log('[SMS API] Première méthode échouée, tentative avec la méthode alternative');
        
        // Méthode 2 - Utilisation de l'intent VIEW avec le paramètre body dans l'URI
        const encodedMessage = encodeURIComponent(message);
        const alternativeCommand = `adb shell am start -a android.intent.action.VIEW -d "sms:${cleanedPhoneNumber}?body=${encodedMessage}"`;
        
        console.log('[SMS API] Tentative d\'exécution de la commande ADB alternative:', alternativeCommand);
        const altResult = await execPromise(alternativeCommand);
        
        console.log('[SMS API] Résultat de la commande ADB alternative (stdout):', altResult.stdout);
        if (altResult.stderr) {
          console.warn('[SMS API] Avertissement de la commande ADB alternative (stderr):', altResult.stderr);
        }
      }

      return NextResponse.json({ 
        success: true, 
        message: 'Application SMS ouverte avec succès',
        details: { stdout, stderr: stderr || null }
      });
    } catch (execError) {
      const error = execError as ExecError;
      console.error('[SMS API] Erreur lors de l\'exécution de la commande ADB:', error);
      console.error('[SMS API] Message d\'erreur:', error.message);
      if (error.stderr) console.error('[SMS API] Erreur standard:', error.stderr);
      if (error.stdout) console.error('[SMS API] Sortie standard:', error.stdout);
      
      // Tenter la méthode alternative en cas d'échec
      try {
        console.log('[SMS API] Première méthode échouée, tentative avec la méthode alternative');
        
        // Méthode 2 - Utilisation de l'intent VIEW avec le paramètre body dans l'URI
        const encodedMessage = encodeURIComponent(message);
        const alternativeCommand = `adb shell am start -a android.intent.action.VIEW -d "sms:${cleanedPhoneNumber}?body=${encodedMessage}"`;
        
        console.log('[SMS API] Tentative d\'exécution de la commande ADB alternative:', alternativeCommand);
        const { stdout, stderr } = await execPromise(alternativeCommand);
        
        console.log('[SMS API] Résultat de la commande ADB alternative (stdout):', stdout);
        if (stderr) {
          console.warn('[SMS API] Avertissement de la commande ADB alternative (stderr):', stderr);
        }
        
        return NextResponse.json({ 
          success: true, 
          message: 'Application SMS ouverte avec succès (méthode alternative)',
          details: { stdout, stderr: stderr || null }
        });
      } catch (altError) {
        const alternativeError = altError as ExecError;
        console.error('[SMS API] Erreur lors de l\'exécution de la commande ADB alternative:', alternativeError);
        
        // Vérifier si c'est une erreur de commande non trouvée
        if (error.message && error.message.includes('command not found')) {
          return NextResponse.json(
            { 
              error: 'ADB n\'est pas installé ou n\'est pas dans le PATH',
              details: error.message
            },
            { status: 500 }
          );
        }
        
        // Vérifier si c'est une erreur d'appareil non connecté
        if (error.stderr && error.stderr.includes('no devices/emulators found')) {
          return NextResponse.json(
            { 
              error: 'Aucun appareil Android n\'est connecté',
              details: error.stderr
            },
            { status: 500 }
          );
        }
        
        return NextResponse.json(
          { 
            error: 'Erreur lors de l\'ouverture de l\'application SMS', 
            details: error.message || String(error),
            alternativeError: alternativeError.message || String(alternativeError)
          },
          { status: 500 }
        );
      }
    }
  } catch (generalError) {
    const error = generalError as Error;
    console.error('[SMS API] Erreur générale lors du traitement de la requête:', error);
    console.error('[SMS API] Stack trace:', error.stack);
    
    return NextResponse.json(
      { 
        error: 'Erreur lors du traitement de la requête',
        details: error.message || String(error)
      },
      { status: 500 }
    );
  }
} 