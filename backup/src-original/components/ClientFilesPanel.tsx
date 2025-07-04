import React, { useState, useRef } from 'react';
import { Contact, ClientFile, Theme } from '../types';
import { Button } from './Common';
import { IconFolder, IconDocument, IconFilePdf, IconFileDoc, IconFileXls, IconFileImg, IconFileOther, IconArrowDownTray, IconTrash, IconUpload } from '../constants';

interface ContactInfoCardProps {
  contact: Contact | null;
  theme: Theme;
}

const ContactInfoCard: React.FC<ContactInfoCardProps> = ({ contact, theme }) => {
  if (!contact) {
    return (
      <div className={`p-4 rounded-xl ${theme === Theme.Dark ? 'bg-oled-card text-oled-text-dim' : 'bg-light-card text-light-text-dim'} text-center`}>
        <IconFolder className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>Sélectionnez un contact pour voir ses fichiers</p>
      </div>
    );
  }

  const infoItem = (icon: React.ReactNode, label: string, value?: string | null) => {
    if (!value) return null;
    return (
      <div className="flex items-center space-x-2 text-sm">
        {icon}
        <span className={theme === Theme.Dark ? 'text-oled-text-dim' : 'text-light-text-dim'}>{label}:</span>
        <span className={theme === Theme.Dark ? 'text-oled-text' : 'text-light-text'}>{value}</span>
      </div>
    );
  };

  return (
    <div className={`p-4 rounded-xl ${theme === Theme.Dark ? 'bg-oled-card' : 'bg-light-card'} space-y-3`}>
      <h3 className={`text-lg font-semibold ${theme === Theme.Dark ? 'text-oled-text' : 'text-light-text'}`}>
        {contact.prenom} {contact.nom}
      </h3>
      <div className="space-y-2">
        {infoItem(<IconDocument className="w-4 h-4" />, "Téléphone", contact.telephone)}
        {infoItem(<IconDocument className="w-4 h-4" />, "Email", contact.email)}
        {infoItem(<IconDocument className="w-4 h-4" />, "École", contact.ecole)}
        {infoItem(<IconDocument className="w-4 h-4" />, "Statut", contact.statut)}
        {infoItem(<IconDocument className="w-4 h-4" />, "Commentaire", contact.commentaire)}
      </div>
    </div>
  );
};

interface ClientFileDropZoneProps {
  onFileDrop: (file: File) => void;
  theme: Theme;
  disabled?: boolean;
}

const ClientFileDropZone: React.FC<ClientFileDropZoneProps> = ({ onFileDrop, theme, disabled }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!disabled) setIsDragOver(true);
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
    if (!disabled) fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileDrop(files[0]);
    }
  };

  const bgColor = isDragOver 
    ? (theme === Theme.Dark ? 'bg-oled-accent/20 border-oled-accent' : 'bg-light-accent/20 border-light-accent')
    : (theme === Theme.Dark ? 'bg-oled-interactive border-oled-border' : 'bg-light-interactive border-light-border');

  const textColor = theme === Theme.Dark ? 'text-oled-text-dim' : 'text-light-text-dim';

  return (
    <div
      className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${bgColor} ${textColor} ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'}`}
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
      <IconUpload className="w-8 h-8 mx-auto mb-2" />
      <p className="text-sm">
        {disabled ? 'Sélectionnez un contact pour ajouter des fichiers' : 'Glissez un fichier ici ou cliquez pour sélectionner'}
      </p>
      <p className="text-xs mt-1 opacity-75">
        PDF, DOC, XLS, Images, Archives
      </p>
    </div>
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
      case 'pdf': return <IconFilePdf />;
      case 'doc': return <IconFileDoc />;
      case 'xls': return <IconFileXls />;
      case 'img': return <IconFileImg />;
      default: return <IconFileOther />;
    }
  };

  if (files.length === 0) {
    return (
      <div className={`p-6 text-center ${theme === Theme.Dark ? 'text-oled-text-dim' : 'text-light-text-dim'}`}>
        <IconFolder className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>Aucun fichier associé à ce contact</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {files.map((file) => (
        <div
          key={file.id}
          className={`flex items-center justify-between p-3 rounded-lg ${theme === Theme.Dark ? 'bg-oled-interactive hover:bg-oled-interactive-hover' : 'bg-light-interactive hover:bg-light-interactive-hover'} transition-colors`}
        >
          <div className="flex items-center space-x-3">
            {getFileIcon(file.type)}
            <div>
              <p className={`text-sm font-medium ${theme === Theme.Dark ? 'text-oled-text' : 'text-light-text'}`}>
                {file.name}
              </p>
              <p className={`text-xs ${theme === Theme.Dark ? 'text-oled-text-dim' : 'text-light-text-dim'}`}>
                {file.size} • {file.date}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => onDownloadFile(file.id)}
              variant="ghost"
              size="sm"
              className="!p-2"
              title="Télécharger"
            >
              <IconArrowDownTray className="w-4 h-4" />
            </Button>
            <Button
              onClick={() => onDeleteFile(file.id)}
              variant="ghost"
              size="sm"
              className="!p-2 text-red-500 hover:text-red-400"
              title="Supprimer"
            >
              <IconTrash className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};

interface ClientFilesPanelProps {
  contact: Contact | null;
  theme: Theme;
  showNotification: (type: 'success' | 'error' | 'info', message: string, duration?: number) => void;
}

export const ClientFilesPanel: React.FC<ClientFilesPanelProps> = ({ contact, theme, showNotification }) => {
  const [files, setFiles] = useState<ClientFile[]>([]);

  // Simuler le chargement des fichiers pour un contact
  React.useEffect(() => {
    if (contact) {
      // Pour l'instant, on initialise avec une liste vide
      // Dans une vraie application, on chargerait les fichiers depuis une API
      setFiles([]);
    } else {
      setFiles([]);
    }
  }, [contact]);

  const handleFileDrop = (file: File) => {
    if (!contact) {
      showNotification('error', 'Veuillez sélectionner un contact avant d\'ajouter un fichier');
      return;
    }

    // Simuler l'upload du fichier
    const newFile: ClientFile = {
      id: `file-${Date.now()}`,
      name: file.name,
      size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
      date: new Date().toLocaleDateString('fr-FR'),
      type: getFileType(file.name),
    };

    setFiles(prev => [...prev, newFile]);
    showNotification('success', `Fichier "${file.name}" ajouté avec succès`);
  };

  const getFileType = (fileName: string): ClientFile['type'] => {
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

  const handleDeleteFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
    showNotification('info', 'Fichier supprimé');
  };

  const handleDownloadFile = (fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (file) {
      showNotification('info', `Téléchargement de "${file.name}" (fonctionnalité à implémenter)`);
    }
  };

  return (
    <div className={`h-full flex flex-col space-y-4 p-4 ${theme === Theme.Dark ? 'bg-oled-bg' : 'bg-light-bg'}`}>
      {/* Informations du contact */}
      <ContactInfoCard contact={contact} theme={theme} />

      {/* Zone de dépôt de fichiers */}
      <ClientFileDropZone 
        onFileDrop={handleFileDrop} 
        theme={theme} 
        disabled={!contact}
      />

      {/* Liste des fichiers */}
      <div className={`flex-1 rounded-xl ${theme === Theme.Dark ? 'bg-oled-card' : 'bg-light-card'} p-4 overflow-y-auto`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className={`text-lg font-semibold ${theme === Theme.Dark ? 'text-oled-text' : 'text-light-text'}`}>
            Fichiers du contact
          </h3>
          <span className={`text-sm ${theme === Theme.Dark ? 'text-oled-text-dim' : 'text-light-text-dim'}`}>
            {files.length} fichier(s)
          </span>
        </div>
        <FileListWidget 
          files={files} 
          onDeleteFile={handleDeleteFile}
          onDownloadFile={handleDownloadFile}
          theme={theme}
        />
      </div>

      {/* Note d'information */}
      <div className={`p-3 rounded-lg ${theme === Theme.Dark ? 'bg-oled-interactive' : 'bg-light-interactive'} border ${theme === Theme.Dark ? 'border-oled-border' : 'border-light-border'}`}>
        <p className={`text-xs ${theme === Theme.Dark ? 'text-oled-text-dim' : 'text-light-text-dim'}`}>
          💡 <strong>Note:</strong> Cette fonctionnalité de gestion de fichiers est actuellement en mode démo. 
          Pour une utilisation en production, une intégration avec un service de stockage (Supabase Storage, AWS S3, etc.) est nécessaire.
        </p>
      </div>
    </div>
  );
};
