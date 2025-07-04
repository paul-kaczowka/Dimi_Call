import React, { useState, useRef, useEffect } from 'react';
import { Contact, ClientFile, Theme } from '../types';
import { IconFolder, IconDocument, IconFilePdf, IconFileDoc, IconFileXls, IconFileImg, IconFileOther, IconArrowDownTray, IconTrash, IconUpload } from '../constants';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { User, Phone, Mail, FileText, MessageCircle, Calendar, Clock, Timer, MapPin, Building2, Zap, Loader2 } from 'lucide-react';
import { uploadFileToStorage, listFilesForUID, deleteFileFromStorage, getDownloadUrl, StorageFile } from '../services/storageService';

interface ContactInfoCardProps {
  contact: any | null; // Accepte les données brutes de Supabase qui contiennent tous les champs
  theme: Theme;
  activeCallContactId: string | null;
  callStartTime: Date | null;
}

const ContactInfoCard: React.FC<ContactInfoCardProps> = ({ contact, theme, activeCallContactId, callStartTime }) => {
  const [currentCallDuration, setCurrentCallDuration] = useState('00:00');
  
  // 🔄 Timer pour l'appel en cours
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (contact && activeCallContactId === (contact.UID || contact.id) && callStartTime) {
      interval = setInterval(() => {
        const now = new Date();
        const durationMs = now.getTime() - callStartTime.getTime();
        const seconds = Math.floor((durationMs / 1000) % 60);
        const minutes = Math.floor((durationMs / (1000 * 60)) % 60);
        const durationStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        setCurrentCallDuration(durationStr);
      }, 1000);
    } else {
      setCurrentCallDuration('00:00');
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [contact, activeCallContactId, callStartTime]);
  
  if (!contact) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center">
        <div className="relative">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center mb-4">
            <User className="h-8 w-8 text-slate-400" />
          </div>
          <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur opacity-50"></div>
        </div>
        <h3 className="text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
          Aucun contact sélectionné
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-[200px]">
          Sélectionnez un contact dans la table pour afficher ses informations et gérer ses fichiers
        </p>
      </div>
    );
  }

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { color: string; icon: React.ComponentType<any> }> = {
      'DO': { color: 'bg-emerald-500/10 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-800', icon: Zap },
      'RO': { color: 'bg-blue-500/10 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-800', icon: Building2 },
      'À rappeler': { color: 'bg-amber-500/10 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-800', icon: Clock },
      'Pas intéressé': { color: 'bg-red-500/10 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-800', icon: FileText },
      'Argumenté': { color: 'bg-purple-500/10 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-800', icon: MessageCircle },
      'Mauvais num': { color: 'bg-slate-500/10 text-slate-700 border-slate-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-800', icon: Phone },
      'Non défini': { color: 'bg-orange-500/10 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-800', icon: FileText },
    };
    return configs[status] || configs['Non défini'];
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'short',
      year: 'numeric'
    });
  };

  const isRecentCall = (dateStr: string) => {
    if (!dateStr) return false;
    const callDate = new Date(dateStr);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - callDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  };

  const statusConfig = getStatusConfig(contact.statut_final || contact.statut || 'Non défini');
  const StatusIcon = statusConfig.icon;

  // Helper function pour afficher les valeurs avec fallback
  const displayValue = (value: string | null | undefined, fallback: string = 'N/A') => {
    return value && value.trim() !== '' ? value : fallback;
  };

  return (
    <div className="h-full">
      <ScrollArea className="h-full">
        <div className="p-4 bg-transparent dark:bg-transparent border border-slate-200 dark:border-slate-700 rounded-lg">
          
          {/* Header compact avec avatar et nom */}
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-shrink-0">
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold shadow-lg shadow-blue-500/25">
              {contact.prenom?.charAt(0) || 'N'}{contact.nom?.charAt(0) || 'A'}
            </div>
              <div className="absolute -inset-0.5 rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 opacity-20 blur"></div>
            </div>
            
            <div className="flex-1 min-w-0">
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 truncate">
                {contact.prenom} {contact.nom}
                {displayValue(contact.source) !== 'N/A' && (
                  <span className="text-slate-500 dark:text-slate-400 font-normal"> • {contact.source}</span>
                )}
              </h2>
              <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {displayValue(contact.mail || contact.email)} | {displayValue(contact.numero || contact.telephone)}
              </div>
              {isRecentCall(contact.date_appel_1 || contact.date_appel || contact.dateAppel) && (
                <div className="flex items-center gap-1 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                  <span className="text-green-600 dark:text-green-400 font-medium text-xs">Récent</span>
                </div>
              )}
            </div>

            {/* Actions rapides */}
            <div className="flex gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                      <Phone className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Appeler</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button size="sm" variant="ghost" className="h-7 w-7 p-0">
                      <Mail className="h-3 w-3" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Email</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>

          {/* Statut principal */}
          <div className="mb-4">
            <div className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-md border text-xs font-medium ${statusConfig.color}`}>
              <StatusIcon className="h-3 w-3" />
              {contact.statut_final || contact.statut || 'Non défini'}
            </div>
          </div>

          {/* Indicateur d'appel en cours */}
          {contact && activeCallContactId === (contact.UID || contact.id) && callStartTime && (
            <div className="mb-4">
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md border text-xs font-medium bg-green-500/10 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-800 animate-pulse">
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                  <Phone className="h-3 w-3" />
                </div>
                <span>Appel en cours</span>
                <div className="flex items-center gap-1 bg-green-100 dark:bg-green-900/50 px-1.5 py-0.5 rounded text-xs font-mono">
                  <Timer className="h-2.5 w-2.5" />
                  <span>{currentCallDuration}</span>
                </div>
              </div>
            </div>
          )}

          {/* Historique des appels */}
          {(() => {
            // Extraire les données d'historique d'appels depuis les données brutes
            const callHistory = [];
            for (let i = 1; i <= 4; i++) {
              const dateKey = `date_appel_${i}`;
              const statutKey = `statut_appel_${i}`;
              const commentaireKey = `commentaires_appel_${i}`;
              
              // On considère qu'un appel existe s'il y a au moins une date ou un statut
              const dateAppel = (contact as any)[dateKey] || '';
              const statutAppel = (contact as any)[statutKey] || '';
              const commentaireAppel = (contact as any)[commentaireKey] || '';
              
              if (dateAppel || statutAppel) {
                callHistory.push({
                  numero: i,
                  date: dateAppel,
                  statut: statutAppel,
                  commentaire: commentaireAppel
                });
              }
            }
            
            if (callHistory.length > 0) {
              return (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-2">
                    <Phone className="h-3.5 w-3.5 text-slate-500 dark:text-slate-400" />
                    <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                      Historique des appels ({callHistory.length})
                    </span>
                  </div>
                  <div className="space-y-1.5 max-h-24 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-300 dark:scrollbar-thumb-slate-600">
                    {callHistory.map((call) => (
                      <div key={call.numero} className="bg-slate-50 dark:bg-slate-800/50 rounded-md p-2 text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                            <span className="font-medium text-slate-700 dark:text-slate-300">
                              Appel {call.numero}
                            </span>
                            {call.date && (
                              <span className="text-slate-500 dark:text-slate-400">
                                • {formatDate(call.date)}
                              </span>
                            )}
                          </div>
                          {call.statut && (
                            <div className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                              {call.statut}
                            </div>
                          )}
                        </div>
                        {call.commentaire && (
                          <p className="text-slate-600 dark:text-slate-400 line-clamp-2 leading-tight">
                            {call.commentaire}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            }
            return null;
          })()}

          {/* Autres informations si nécessaire */}
          <div className="space-y-3">
            





          </div>
        </div>
      </ScrollArea>
    </div>
  );
};

interface ClientFileDropZoneProps {
  onFileDrop: (file: File) => void;
  theme: Theme;
  disabled?: boolean;
}

const ClientFileDropZone: React.FC<ClientFileDropZoneProps> = ({ onFileDrop, theme, disabled }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    
    if (disabled) return;
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      onFileDrop(files[0]);
    }
  };

  const handleClick = () => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileDrop(files[0]);
    }
  };

  return (
    <Card className={`transition-all duration-200 ${isDragOver ? 'border-blue-400 bg-blue-50 dark:bg-blue-950/20' : 'border-dashed'} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-blue-400 hover:bg-blue-50/50 dark:hover:bg-blue-950/10'}`}>
      <CardContent 
        className="py-6"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          onChange={handleFileChange}
          accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.zip,.rar"
          disabled={disabled}
        />
        <div className="flex flex-col items-center text-center space-y-2">
          <div className={`h-12 w-12 rounded-full flex items-center justify-center ${isDragOver ? 'bg-blue-100 dark:bg-blue-900' : 'bg-muted'} transition-colors`}>
            <IconUpload className={`h-6 w-6 ${isDragOver ? 'text-blue-600 dark:text-blue-400' : 'text-muted-foreground'}`} />
          </div>
          <div>
            <p className="text-sm font-medium">
              {disabled ? 'Sélectionnez un contact pour ajouter des fichiers' : 'Glissez un fichier ici ou cliquez pour sélectionner'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              PDF, DOC, XLS, Images, Archives (max 10MB)
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

interface FileListWidgetProps {
  files: ClientFile[];
  onDeleteFile: (fileId: string) => void;
  onDownloadFile: (fileId: string) => void;
  theme: Theme;
}

const FileListWidget: React.FC<FileListWidgetProps> = ({ files, onDeleteFile, onDownloadFile, theme }) => {
  const getFileIcon = (type: ClientFile['type']) => {
    switch (type) {
      case 'pdf': return <IconFilePdf className="h-4 w-4" />;
      case 'doc': return <IconFileDoc className="h-4 w-4" />;
      case 'xls': return <IconFileXls className="h-4 w-4" />;
      case 'img': return <IconFileImg className="h-4 w-4" />;
      default: return <IconFileOther className="h-4 w-4" />;
    }
  };

  const getFileTypeColor = (type: ClientFile['type']) => {
    switch (type) {
      case 'pdf': return 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300';
      case 'doc': return 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300';
      case 'xls': return 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300';
      case 'img': return 'bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300';
      default: return 'bg-gray-100 text-gray-700 dark:bg-gray-950 dark:text-gray-300';
    }
  };

  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
          <IconFolder className="h-8 w-8 text-muted-foreground opacity-50" />
        </div>
        <p className="text-sm text-muted-foreground mb-2">Aucun fichier associé</p>
        <p className="text-xs text-muted-foreground">Les fichiers ajoutés apparaîtront ici</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {files.map((file) => (
        <Card key={file.id} className="transition-all duration-200 hover:shadow-md">
          <CardContent className="p-3">
            <div className="flex items-center gap-3">
              <div className={`h-8 w-8 rounded-md flex items-center justify-center ${getFileTypeColor(file.type)}`}>
                {getFileIcon(file.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{file.name}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{file.size}</span>
                  <span>•</span>
                  <span>{file.date}</span>
                </div>
              </div>
              <div className="flex gap-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0"
                        onClick={() => onDownloadFile(file.id)}
                      >
                        <IconArrowDownTray className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Télécharger</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        onClick={() => onDeleteFile(file.id)}
                      >
                        <IconTrash className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Supprimer</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

interface ClientFilesPanelProps {
  contact: any | null; // Accepte les données brutes de Supabase qui contiennent tous les champs
  theme: Theme;
  showNotification: (type: 'success' | 'error' | 'info', message: string, duration?: number) => void;
  activeCallContactId: string | null;
  callStartTime: Date | null;
}

export const ClientFilesPanel: React.FC<ClientFilesPanelProps> = ({ contact, theme, showNotification, activeCallContactId, callStartTime }) => {
  const [files, setFiles] = useState<ClientFile[]>([]);
  const [uploadingFile, setUploadingFile] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // 🔄 Effet pour charger les fichiers quand le contact change
  useEffect(() => {
    const contactUID = contact?.UID || contact?.id;
    if (contactUID) {
      console.log('📱 Contact sélectionné - chargement des fichiers pour UID:', contactUID);
      loadFilesForContact(contactUID);
    } else {
      setFiles([]);
    }
  }, [contact?.UID, contact?.id]);

  // Charger les fichiers depuis Supabase Storage
  const loadFilesForContact = async (uid: string) => {
    setLoading(true);
    try {
      const result = await listFilesForUID(uid);
      
      if (result.success) {
        // Convertir StorageFile vers ClientFile
        const clientFiles: ClientFile[] = result.files.map(storageFile => ({
          id: storageFile.id,
          name: storageFile.name,
          size: storageFile.size,
          date: storageFile.date,
          type: storageFile.type
        }));
        
        setFiles(clientFiles);
        console.log(`📁 ${clientFiles.length} fichier(s) chargé(s) pour ${uid}`);
      } else {
        console.error('Erreur chargement fichiers:', result.message);
        if (result.message?.includes('not found')) {
          // Le dossier n'existe pas encore, c'est normal
          setFiles([]);
        } else {
          showNotification('error', result.message || 'Erreur lors du chargement des fichiers');
        }
      }
    } catch (error) {
      console.error('Erreur chargement fichiers:', error);
      showNotification('error', 'Erreur technique lors du chargement des fichiers');
    } finally {
      setLoading(false);
    }
  };

  const handleFileDrop = async (file: File) => {
    const contactUID = contact?.UID || contact?.id;
    if (!contactUID) {
      showNotification('error', 'Veuillez sélectionner un contact avant d\'ajouter des fichiers.');
      return;
    }

    setUploadingFile(file.name);
    showNotification('info', `Upload de "${file.name}" en cours...`);

    try {
      const result = await uploadFileToStorage(file, contactUID);
      
      if (result.success) {
        showNotification('success', result.message);
        // Recharger la liste des fichiers
        await loadFilesForContact(contactUID);
      } else {
        showNotification('error', result.message);
      }
    } catch (error) {
      console.error('Erreur upload:', error);
      showNotification('error', 'Erreur technique lors de l\'upload');
    } finally {
      setUploadingFile(null);
    }
  };

  const handleDeleteFile = async (fileId: string) => {
    const file = files.find(f => f.id === fileId);
    const contactUID = contact?.UID || contact?.id;
    if (!file || !contactUID) return;

    if (!confirm(`Supprimer le fichier "${file.name}" ?`)) return;

    try {
      const result = await deleteFileFromStorage(file.name, contactUID);
      
      if (result.success) {
        showNotification('success', result.message);
        // Recharger la liste des fichiers
        await loadFilesForContact(contactUID);
      } else {
        showNotification('error', result.message);
      }
    } catch (error) {
      console.error('Erreur suppression:', error);
      showNotification('error', 'Erreur technique lors de la suppression');
    }
  };

  const handleDownloadFile = async (fileId: string) => {
    const file = files.find(f => f.id === fileId);
    const contactUID = contact?.UID || contact?.id;
    if (!file || !contactUID) return;

    try {
      const result = await getDownloadUrl(file.name, contactUID);
      
      if (result.success && result.url) {
        // Ouvrir l'URL dans un nouvel onglet pour télécharger
        window.open(result.url, '_blank');
        showNotification('success', `Téléchargement de "${file.name}" démarré`);
      } else {
        showNotification('error', result.message || 'Erreur lors de la génération du lien de téléchargement');
      }
    } catch (error) {
      console.error('Erreur téléchargement:', error);
      showNotification('error', 'Erreur technique lors du téléchargement');
    }
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Section informations contact */}
      <div className="shrink-0 p-4 border-b">
        <ContactInfoCard contact={contact} theme={theme} activeCallContactId={activeCallContactId} callStartTime={callStartTime} />
      </div>

      {/* Zone de drop */}
      <div className="shrink-0 p-4 border-b">
        <ClientFileDropZone 
          onFileDrop={handleFileDrop} 
          theme={theme} 
          disabled={!contact || !!uploadingFile}
        />
        {uploadingFile && (
          <div className="mt-2 flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400">
            <Loader2 className="h-3 w-3 animate-spin" />
            <span>Upload de "{uploadingFile}" en cours...</span>
          </div>
        )}
      </div>

      {/* Section fichiers */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="shrink-0 flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Fichiers du contact</h3>
          <div className="flex items-center gap-2">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            <Badge variant="secondary" className="text-xs">
              {files.length} fichier{files.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        </div>
        <ScrollArea className="flex-1 p-4">
          <FileListWidget 
            files={files} 
            onDeleteFile={handleDeleteFile} 
            onDownloadFile={handleDownloadFile} 
            theme={theme} 
          />
        </ScrollArea>
      </div>


    </div>
  );
};
