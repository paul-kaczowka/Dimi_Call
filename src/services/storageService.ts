import { supabaseService } from './supabaseService';

export interface StorageFile {
  id: string;
  name: string;
  size: string;
  date: string;
  type: 'pdf' | 'doc' | 'xls' | 'img' | 'other';
  url?: string;
}

const BUCKET_NAME = 'dimicloud';

/**
 * Upload un fichier vers Supabase Storage dans le dossier de l'UID
 */
export const uploadFileToStorage = async (file: File, uid: string): Promise<{ success: boolean; message: string; data?: any }> => {
  try {
    if (!uid) {
      return { success: false, message: 'UID du contact requis' };
    }

    // Validation de la taille (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return { success: false, message: 'Le fichier ne peut pas dépasser 10MB' };
    }

    // Validation du type de fichier
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'application/zip',
      'application/x-rar-compressed'
    ];

    if (!allowedTypes.includes(file.type)) {
      return { success: false, message: 'Type de fichier non autorisé' };
    }

    // Créer un nom de fichier unique avec timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `${timestamp}_${file.name}`;
    const filePath = `clients/${uid}/${fileName}`;

    // Upload vers Supabase Storage
    const client = supabaseService.getClient();

    // S'assurer que le dossier existe en uploadant un placeholder
    const placeholderPath = `clients/${uid}/.placeholder`;
    await client.storage.from(BUCKET_NAME).upload(placeholderPath, new Blob(['']), { upsert: true });

    const { data, error } = await client.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('Erreur upload Supabase:', error);
      return { success: false, message: `Erreur lors de l'upload: ${error.message}` };
    }

    return { 
      success: true, 
      message: `Fichier "${file.name}" téléversé avec succès`,
      data: { path: data.path, fileName }
    };

  } catch (error) {
    console.error('Erreur lors de l\'upload:', error);
    return { success: false, message: 'Erreur technique lors de l\'upload' };
  }
};

/**
 * Liste tous les fichiers pour un UID donné
 */
export const listFilesForUID = async (uid: string): Promise<{ success: boolean; files: StorageFile[]; message?: string }> => {
  try {
    if (!uid) {
      return { success: false, files: [], message: 'UID requis' };
    }

    // Lister les fichiers dans le dossier de l'UID
    const client = supabaseService.getClient();
    const { data, error } = await client.storage
      .from(BUCKET_NAME)
      .list(`clients/${uid}`, {
        limit: 100,
        offset: 0
      });

    if (error) {
      console.error('Erreur listing Supabase:', error);
      return { success: false, files: [], message: `Erreur lors du listing: ${error.message}` };
    }

    // Conversion des données Supabase vers notre format
    const storageFiles: StorageFile[] = (data || [])
      .filter((file: any) => file.name && file.name !== '.placeholder') // Filtrer les dossiers et le placeholder
      .map((file: any) => ({
        id: file.id || file.name,
        name: file.name,
        size: formatFileSize(file.metadata?.size || 0),
        date: formatDate(file.created_at || file.updated_at || ''),
        type: getFileTypeFromName(file.name),
        url: undefined // Sera généré à la demande
      }));

    return { success: true, files: storageFiles };

  } catch (error) {
    console.error('Erreur lors du listing:', error);
    return { success: false, files: [], message: 'Erreur technique lors du listing' };
  }
};

/**
 * Supprime un fichier du storage
 */
export const deleteFileFromStorage = async (fileName: string, uid: string): Promise<{ success: boolean; message: string }> => {
  try {
    if (!uid || !fileName) {
      return { success: false, message: 'UID et nom de fichier requis' };
    }

    const filePath = `clients/${uid}/${fileName}`;

    const client = supabaseService.getClient();
    const { error } = await client.storage
      .from(BUCKET_NAME)
      .remove([filePath]);

    if (error) {
      console.error('Erreur suppression Supabase:', error);
      return { success: false, message: `Erreur lors de la suppression: ${error.message}` };
    }

    return { success: true, message: `Fichier "${fileName}" supprimé avec succès` };

  } catch (error) {
    console.error('Erreur lors de la suppression:', error);
    return { success: false, message: 'Erreur technique lors de la suppression' };
  }
};

/**
 * Génère une URL de téléchargement pour un fichier
 */
export const getDownloadUrl = async (fileName: string, uid: string): Promise<{ success: boolean; url?: string; message?: string }> => {
  try {
    if (!uid || !fileName) {
      return { success: false, message: 'UID et nom de fichier requis' };
    }

    const filePath = `clients/${uid}/${fileName}`;

    const client = supabaseService.getClient();
    const { data, error } = await client.storage
      .from(BUCKET_NAME)
      .createSignedUrl(filePath, 3600); // URL valide 1 heure

    if (error) {
      console.error('Erreur génération URL:', error);
      return { success: false, message: `Erreur lors de la génération de l'URL: ${error.message}` };
    }

    return { success: true, url: data.signedUrl };

  } catch (error) {
    console.error('Erreur lors de la génération d\'URL:', error);
    return { success: false, message: 'Erreur technique lors de la génération d\'URL' };
  }
};

/**
 * Utilitaires
 */
const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

const formatDate = (dateStr: string): string => {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

const getFileTypeFromName = (fileName: string): StorageFile['type'] => {
  const extension = fileName.split('.').pop()?.toLowerCase();
  switch (extension) {
    case 'pdf': return 'pdf';
    case 'doc':
    case 'docx': return 'doc';
    case 'xls':
    case 'xlsx': return 'xls';
    case 'jpg':
    case 'jpeg':
    case 'png':
    case 'gif': return 'img';
    default: return 'other';
  }
}; 