import React, { useState, useEffect } from 'react';
import { 
  Settings, Mail, X, Save, Undo, ChevronDown, Palette, Calendar, MessageSquare, 
  Sun, Moon, Monitor, Keyboard, RotateCcw, DownloadCloud, Info, CheckCircle, 
  ExternalLink, Columns, Bell, Check, Globe, Home, Lock, Video, Link
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { EmailType, Civility, Theme, ContactStatus } from '../types';
import { shortcutService, ShortcutConfig } from '../services/shortcutService';
import { cn } from '../lib/utils';

interface SettingsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  calcomUrl?: string;
  onCalcomUrlChange?: (newUrl: string) => void;
  smsTemplate?: string;
  onSmsTemplateChange?: (newTemplate: string) => void;
  theme?: Theme;
  onThemeChange?: (theme: Theme) => void;
}

interface EmailTemplate {
  subject: string;
  body: string;
}

interface EmailTemplates {
  [EmailType.PremierContact]: EmailTemplate;
  [EmailType.D0Visio]: EmailTemplate;
  [EmailType.R0Interne]: EmailTemplate;
  [EmailType.R0Externe]: EmailTemplate;
}

const defaultTemplates: EmailTemplates = {
  [EmailType.PremierContact]: {
    subject: "Arcanis Conseil - Premier Contact",
    body: "Bonjour {titre} {nom},\n\nPour resituer mon appel, je suis gérant privé au sein du cabinet de gestion de patrimoine Arcanis Conseil. Je vous envoie l'adresse de notre site web que vous puissiez en savoir d'avantage : https://arcanis-conseil.fr\n\nLe site est avant tout une vitrine, le mieux est de m'appeler si vous souhaitez davantage d'informations ou de prendre un créneau de 30 minutes dans mon agenda via ce lien : https://cal.com/dimitri-morel-arcanis-conseil/audit-patrimonial?overlayCalendar=true\n\nBien à vous,"
  },
  [EmailType.D0Visio]: {
    subject: "Confirmation rendez-vous visio - Arcanis Conseil",
    body: "Bonjour {titre} {nom}, merci pour votre temps lors de notre échange téléphonique. \n\nSuite à notre appel, je vous confirme {rdv} en visio.\n\nPour rappel, notre entretien durera une trentaine de minutes. Le but est de vous présenter plus en détail Arcanis Conseil, d'effectuer ensemble l'état des lieux de votre situation patrimoniale (revenus, patrimoine immobilier, épargne constituée etc.), puis de vous donner un diagnostic de vos leviers. Notre métier est de vous apporter un conseil pertinent et personnalisé sur l'optimisation de votre patrimoine.\n\nJe vous invite à visiter notre site internet pour de plus amples renseignements avant le début de notre échange : www.arcanis-conseil.fr\n\nN'hésitez pas à revenir vers moi en cas de question ou d'un besoin supplémentaire d'information.\n\nBien cordialement"
  },
  [EmailType.R0Interne]: {
    subject: "Confirmation rendez-vous présentiel - Arcanis Conseil",
    body: "Bonjour {titre} {nom}, merci pour votre temps lors de notre échange téléphonique. \n\nSuite à notre appel, je vous confirme {rdv} dans nos locaux au 22 rue la Boétie, 75008 Paris.\n\nPour rappel, notre entretien durera une trentaine de minutes. Le but est de vous présenter plus en détail Arcanis Conseil, d'effectuer ensemble l'état des lieux de votre situation patrimoniale (revenus, patrimoine immobilier, épargne constituée etc.), puis de vous donner un diagnostic de vos leviers. Notre métier est de vous apporter un conseil pertinent et personnalisé sur l'optimisation de votre patrimoine.\n\nJe vous invite à visiter notre site internet pour de plus amples renseignements avant le début de notre échange : www.arcanis-conseil.fr\n\nN'hésitez pas à revenir vers moi en cas de question ou d'un besoin supplémentaire d'information.\n\nBien cordialement"
  },
  [EmailType.R0Externe]: {
    subject: "Confirmation rendez-vous présentiel - Arcanis Conseil",
    body: "Bonjour {titre} {nom}, merci pour votre temps lors de notre échange téléphonique. \n\nSuite à notre appel, je vous confirme {rdv} à {adresse}.\n\nPour rappel, notre entretien durera une trentaine de minutes. Le but est de vous présenter plus en détail Arcanis Conseil, d'effectuer ensemble l'état des lieux de votre situation patrimoniale (revenus, patrimoine immobilier, épargne constituée etc.), puis de vous donner un diagnostic de vos leviers. Notre métier est de vous apporter un conseil pertinent et personnalisé sur l'optimisation de votre patrimoine.\n\nJe vous invite à visiter notre site internet pour de plus amples renseignements avant le début de notre échange : www.arcanis-conseil.fr\n\nN'hésitez pas à revenir vers moi en cas de question ou d'un besoin supplémentaire d'information.\n\nBien cordialement"
  }
};

const STORAGE_KEY = 'dimicall_email_templates';
const COLUMNS_STORAGE_KEY = 'dimicall_column_config';

// Configuration par défaut des colonnes
const DEFAULT_COLUMN_CONFIG = {
  '#': { isEssential: true, label: 'Numéro de ligne' },
  'Prénom': { isEssential: true, label: 'Prénom du contact' },
  'Nom': { isEssential: true, label: 'Nom du contact' },
  'Commentaire': { isEssential: true, label: 'Commentaire/Qualification' },
  'Téléphone': { isEssential: false, label: 'Numéro de téléphone' },
  'Mail': { isEssential: false, label: 'Adresse email' },
  'Statut': { isEssential: false, label: 'Statut du contact' },
  'Date Rappel': { isEssential: false, label: 'Date de rappel programmée' },
  'Heure Rappel': { isEssential: false, label: 'Heure de rappel programmée' },
  'Date RDV': { isEssential: false, label: 'Date de rendez-vous' },
  'Heure RDV': { isEssential: false, label: 'Heure de rendez-vous' },
  'Date Appel': { isEssential: false, label: 'Date du dernier appel' },
  'Heure Appel': { isEssential: false, label: 'Heure du dernier appel' },
  'Durée Appel': { isEssential: false, label: 'Durée du dernier appel' },
  'Source': { isEssential: false, label: 'Source du contact' }
};

type SettingsCategory = 'email' | 'sms' | 'calcom' | 'appearance' | 'shortcuts' | 'update' | 'columns';

const categories = [
  { 
    id: 'email' as SettingsCategory, 
    label: 'Templates Email', 
    icon: Mail, 
    description: 'Personnalisez vos modèles d\'email'
  },
  { 
    id: 'sms' as SettingsCategory, 
    label: 'Template SMS', 
    icon: MessageSquare, 
    description: 'Configurez votre message SMS'
  },
  { 
    id: 'calcom' as SettingsCategory, 
    label: 'Cal.com', 
    icon: Calendar, 
    description: 'Configuration de votre calendrier'
  },
  { 
    id: 'appearance' as SettingsCategory, 
    label: 'Apparence', 
    icon: Palette, 
    description: 'Thème et interface'
  },
  { 
    id: 'shortcuts' as SettingsCategory, 
    label: 'Raccourcis', 
    icon: Keyboard, 
    description: 'Touches de fonction'
  },
  {
    id: 'columns' as SettingsCategory,
    label: 'Gestion des Colonnes',
    icon: Columns,
    description: 'Configuration de la visibilité des colonnes'
  },
  {
    id: 'update' as SettingsCategory,
    label: 'Mises à jour',
    icon: DownloadCloud,
    description: 'Système de mise à jour automatique'
  }
] as const;

const emailTypeLabels = {
  [EmailType.PremierContact]: { label: 'Premier Contact', icon: Mail },
  [EmailType.D0Visio]: { label: 'D0 Visio', icon: Calendar },
  [EmailType.R0Interne]: { label: 'R0 Interne', icon: Settings },
  [EmailType.R0Externe]: { label: 'R0 Externe', icon: MessageSquare }
};

// Template SMS par défaut
const DEFAULT_SMS_TEMPLATE = `Bonjour {civilite} {nom},

Pour resituer mon appel, je suis gérant privé au sein du cabinet de gestion de patrimoine Arcanis Conseil.

Je vous envoie l'adresse de notre site web que vous puissiez en savoir d'avantage :
https://arcanis-conseil.fr

Le site est avant tout une vitrine, le mieux est de m'appeler si vous souhaitez davantage d'informations ou de prendre un créneau de 30 minutes dans mon agenda via ce lien :

https://calendly.com/dimitri-morel-arcanis-conseil/audit

Bien à vous,

Dimitri MOREL - Arcanis Conseil`;

export const SettingsDialog: React.FC<SettingsDialogProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  calcomUrl, 
  onCalcomUrlChange,
  smsTemplate,
  onSmsTemplateChange,
  theme = Theme.Dark,
  onThemeChange
}) => {
  const [activeCategory, setActiveCategory] = useState<SettingsCategory>('email');
  const [templates, setTemplates] = useState<EmailTemplates>(defaultTemplates);
  const [signature, setSignature] = useState('');
  const [hasChanges, setHasChanges] = useState(false);
  const [selectedEmailType, setSelectedEmailType] = useState<EmailType>(EmailType.PremierContact);
  const [localCalcomUrl, setLocalCalcomUrl] = useState<string>(calcomUrl || 'https://cal.com/dimitri-morel-arcanis-conseil/audit-patrimonial?overlayCalendar=true');
  const [localSmsTemplate, setLocalSmsTemplate] = useState<string>(smsTemplate || DEFAULT_SMS_TEMPLATE);
  const [shortcuts, setShortcuts] = useState<ShortcutConfig[]>([]);
  const [shortcutsChanged, setShortcutsChanged] = useState(false);
  const [appVersion, setAppVersion] = useState<string>('Chargement...');
  const [isCheckingUpdates, setIsCheckingUpdates] = useState(false);
  
  // Configuration des colonnes
  const [columnConfig, setColumnConfig] = useState<Record<string, boolean>>({});
  const [columnConfigChanged, setColumnConfigChanged] = useState(false);

  // Charger les templates sauvegardés
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.templates) setTemplates(data.templates);
        if (data.signature) setSignature(data.signature);
      } catch (error) {
        console.error('Erreur lors du chargement des templates:', error);
      }
    }
  }, []);

  // Mettre à jour l'URL locale et le template SMS quand ils changent depuis l'extérieur
  useEffect(() => {
    if (calcomUrl) {
      setLocalCalcomUrl(calcomUrl);
    }
    if (smsTemplate) {
      setLocalSmsTemplate(smsTemplate);
    }
  }, [calcomUrl, smsTemplate]);

  // Charger les raccourcis lors de l'ouverture
  useEffect(() => {
    if (isOpen) {
      setShortcuts(shortcutService.getShortcuts());
      setShortcutsChanged(false);
    }
  }, [isOpen]);

  // Charger la configuration des colonnes
  useEffect(() => {
    const saved = localStorage.getItem(COLUMNS_STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        setColumnConfig(data);
      } catch (error) {
        console.error('Erreur lors du chargement de la config des colonnes:', error);
        // Initialiser avec la config par défaut
        const defaultConfig: Record<string, boolean> = {};
        Object.keys(DEFAULT_COLUMN_CONFIG).forEach(column => {
          defaultConfig[column] = DEFAULT_COLUMN_CONFIG[column as keyof typeof DEFAULT_COLUMN_CONFIG].isEssential;
        });
        setColumnConfig(defaultConfig);
      }
    } else {
      // Première utilisation - initialiser avec la config par défaut
      const defaultConfig: Record<string, boolean> = {};
      Object.keys(DEFAULT_COLUMN_CONFIG).forEach(column => {
        defaultConfig[column] = DEFAULT_COLUMN_CONFIG[column as keyof typeof DEFAULT_COLUMN_CONFIG].isEssential;
      });
      setColumnConfig(defaultConfig);
    }
  }, []);

  // Charger la version de l'application
  useEffect(() => {
    if (isOpen && window.electronAPI?.getAppVersion) {
      window.electronAPI.getAppVersion()
        .then((version: string) => {
          setAppVersion(version || 'Version inconnue');
        })
        .catch(() => {
          setAppVersion('Version indisponible');
        });
    }
  }, [isOpen]);

  const handleTemplateChange = (field: 'subject' | 'body', value: string) => {
    setTemplates(prev => ({
      ...prev,
      [selectedEmailType]: {
        ...prev[selectedEmailType],
        [field]: value
      }
    }));
    setHasChanges(true);
  };

  const handleSignatureChange = (value: string) => {
    setSignature(value);
    setHasChanges(true);
  };

  const handleCalcomUrlChange = (value: string) => {
    setLocalCalcomUrl(value);
    setHasChanges(true);
  };

  const handleSmsTemplateChange = (value: string) => {
    setLocalSmsTemplate(value);
    setHasChanges(true);
  };

  // Obtenir le libellé d'un statut
  const getStatusLabel = (status: ContactStatus): string => {
    const labelMap: Record<ContactStatus, string> = {
      [ContactStatus.NonDefini]: 'Non défini',
      [ContactStatus.Premature]: 'Prématuré',
      [ContactStatus.MauvaisNum]: 'Mauvais num',
      [ContactStatus.Repondeur]: 'Répondeur',
      [ContactStatus.ARappeler]: 'À rappeler',
      [ContactStatus.PasInteresse]: 'Pas intéressé',
      [ContactStatus.Argumente]: 'Argumenté',
      [ContactStatus.DO]: 'DO',
      [ContactStatus.RO]: 'RO',
      [ContactStatus.ListeNoire]: 'Liste noire'
    };
    return labelMap[status] || status;
  };

  // Gérer le changement de statut pour une touche
  const handleShortcutChange = (key: string, newStatus: ContactStatus) => {
    setShortcuts(prev => 
      prev.map(shortcut => 
        shortcut.key === key 
          ? { ...shortcut, status: newStatus, label: getStatusLabel(newStatus) }
          : shortcut
      )
    );
    setShortcutsChanged(true);
    setHasChanges(true);
  };

  // Remettre les raccourcis par défaut
  const handleShortcutsReset = () => {
    shortcutService.resetToDefaults();
    setShortcuts(shortcutService.getShortcuts());
    setShortcutsChanged(true);
    setHasChanges(true);
  };

  // Gérer le changement de statut essentiel d'une colonne
  const handleColumnEssentialChange = (columnName: string, isEssential: boolean) => {
    setColumnConfig(prev => ({
      ...prev,
      [columnName]: isEssential
    }));
    setColumnConfigChanged(true);
    setHasChanges(true);
  };

  // Remettre la configuration des colonnes par défaut
  const handleColumnConfigReset = () => {
    const defaultConfig: Record<string, boolean> = {};
    Object.keys(DEFAULT_COLUMN_CONFIG).forEach(column => {
      defaultConfig[column] = DEFAULT_COLUMN_CONFIG[column as keyof typeof DEFAULT_COLUMN_CONFIG].isEssential;
    });
    setColumnConfig(defaultConfig);
    setColumnConfigChanged(true);
    setHasChanges(true);
  };

  // Vérifier les mises à jour
  const handleCheckForUpdates = async () => {
    if (typeof window !== 'undefined' && window.electronAPI?.checkForUpdates) {
      setIsCheckingUpdates(true);
      try {
        await window.electronAPI.checkForUpdates();
      } catch (error) {
        console.error('Erreur lors de la vérification des mises à jour:', error);
      } finally {
        setIsCheckingUpdates(false);
      }
    }
  };

  const handleSave = () => {
    const data = {
      templates,
      signature,
      lastModified: new Date().toISOString()
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    
    // Sauvegarder l'URL Cal.com si elle a changé
    if (onCalcomUrlChange && localCalcomUrl !== calcomUrl) {
      onCalcomUrlChange(localCalcomUrl);
    }
    
    // Sauvegarder le template SMS si il a changé
    if (onSmsTemplateChange && localSmsTemplate !== smsTemplate) {
      onSmsTemplateChange(localSmsTemplate);
    }
    
    // Sauvegarder les raccourcis si ils ont changé
    if (shortcutsChanged) {
      shortcutService.updateAllShortcuts(shortcuts);
      setShortcutsChanged(false);
    }
    
    // Sauvegarder la configuration des colonnes si elle a changé
    if (columnConfigChanged) {
      localStorage.setItem(COLUMNS_STORAGE_KEY, JSON.stringify(columnConfig));
      setColumnConfigChanged(false);
    }
    
    setHasChanges(false);
    onSave();
    onClose();
  };

  const handleReset = () => {
    setTemplates(defaultTemplates);
    setSignature('');
    setLocalCalcomUrl('https://cal.com/dimitri-morel-arcanis-conseil/audit-patrimonial?overlayCalendar=true');
    setLocalSmsTemplate(DEFAULT_SMS_TEMPLATE);
    handleShortcutsReset();
    handleColumnConfigReset();
    setHasChanges(true);
  };

  const renderUpdateSettings = () => (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center">
            <Info className="w-4 h-4 text-muted-foreground" />
          </div>
          <div>
            <CardTitle className="text-base">Version actuelle</CardTitle>
            <CardDescription>DimiCall {appVersion}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button 
          onClick={handleCheckForUpdates} 
          className="gap-1.5" 
          disabled={isCheckingUpdates}
        >
          <DownloadCloud className={`w-4 h-4 ${isCheckingUpdates ? 'animate-spin' : ''}`} />
          {isCheckingUpdates ? 'Vérification en cours...' : 'Rechercher une mise à jour'}
        </Button>
        
        <p className="text-xs text-muted-foreground">
          {typeof window !== 'undefined' && window.electronAPI ? 
            'Les mises à jour se font automatiquement au démarrage et toutes les 10 minutes.' :
            'Vérification des mises à jour disponible uniquement dans l\'application installée.'
          }
        </p>
      </CardContent>
    </Card>
  );

  const renderEmailSettings = () => {
    const currentTemplate = templates[selectedEmailType];
    const emailInfo = emailTypeLabels[selectedEmailType];

    return (
      <div className="space-y-6">
        {/* Signature Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center">
                <Settings className="w-4 h-4 text-muted-foreground" />
              </div>
              <div>
                <CardTitle className="text-base">Signature par défaut</CardTitle>
                <CardDescription>Utilisée automatiquement dans tous vos emails</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Input
              id="signature-input"
              value={signature}
              onChange={(e) => handleSignatureChange(e.target.value)}
              placeholder="Votre nom et fonction"
            />
          </CardContent>
        </Card>

        <Separator />

        {/* Template Selection & Editor */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Templates d'Email</h3>
              <p className="text-sm text-muted-foreground">
                Personnalisez vos modèles d'email pour chaque type d'interaction
              </p>
            </div>
            {hasChanges && (
              <Badge variant="outline" className="text-xs">
                Non sauvegardé
              </Badge>
            )}
          </div>

          {/* Email Type Selector */}
          <div className="space-y-3">
            <Label htmlFor="email-type-selector">Type d'email</Label>
            <Select 
              value={selectedEmailType} 
              onValueChange={(value) => setSelectedEmailType(value as EmailType)}
            >
              <SelectTrigger id="email-type-selector">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(emailTypeLabels).map(([type, info]) => (
                  <SelectItem key={type} value={type}>
                    <div className="flex items-center gap-2">
                      <info.icon className="w-4 h-4" />
                      <span>{info.label}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Template Editor */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center">
                  <emailInfo.icon className="w-4 h-4 text-muted-foreground" />
                </div>
                <div>
                  <CardTitle className="text-base">{emailInfo.label}</CardTitle>
                  <CardDescription>Personnalisez le contenu de ce type d'email</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Subject Field */}
              <div className="space-y-2">
                <Label htmlFor={`subject-${selectedEmailType}`}>Sujet de l'email</Label>
                <Input
                  id={`subject-${selectedEmailType}`}
                  value={currentTemplate.subject}
                  onChange={(e) => handleTemplateChange('subject', e.target.value)}
                  placeholder="Sujet de l'email"
                />
              </div>

              {/* Body Field */}
              <div className="space-y-2">
                <Label htmlFor={`body-${selectedEmailType}`}>Corps du message</Label>
                <Textarea
                  id={`body-${selectedEmailType}`}
                  value={currentTemplate.body}
                  onChange={(e) => handleTemplateChange('body', e.target.value)}
                  placeholder="Corps du message"
                  rows={8}
                  className="font-mono text-sm"
                />
              </div>

              {/* Variables Help */}
              <div className="bg-muted/50 p-4 rounded-lg border">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4 text-muted-foreground" />
                    <p className="text-sm font-medium">Variables disponibles</p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <code className="bg-background px-2 py-1 rounded border text-xs">{'{titre}'}</code>
                    <code className="bg-background px-2 py-1 rounded border text-xs">{'{nom}'}</code>
                    <code className="bg-background px-2 py-1 rounded border text-xs">{'{signature}'}</code>
                    <code className="bg-background px-2 py-1 rounded border text-xs">{'{rdv}'}</code>
                  </div>
                  <p className="text-xs text-muted-foreground">Ces variables seront automatiquement remplacées par les informations du contact</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  const renderCalcomSettings = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center">
              <Calendar className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-base">Configuration Cal.com</CardTitle>
              <CardDescription>Personnalisez l'URL de votre calendrier de prise de rendez-vous</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="calcom-url-input">URL Cal.com</Label>
            <Input
              id="calcom-url-input"
              type="url"
              value={localCalcomUrl}
              onChange={(e) => handleCalcomUrlChange(e.target.value)}
              placeholder="https://cal.com/votre-nom/votre-événement"
            />
          </div>

          {/* Informations d'aide */}
          <div className="bg-blue-50/50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start gap-3">
              <Info className="w-4 h-4 text-blue-600 dark:text-blue-400 mt-0.5" />
              <div className="space-y-2">
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  Comment configurer votre URL Cal.com
                </p>
                <ul className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
                  <li>• Connectez-vous à votre compte Cal.com</li>
                  <li>• Allez dans "Event Types" et sélectionnez votre événement</li>
                  <li>• Copiez l'URL de votre événement</li>
                  <li>• Ajoutez "?overlayCalendar=true" à la fin pour l'ouverture en overlay</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderSmsSettings = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center">
              <MessageSquare className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-base">Template SMS</CardTitle>
              <CardDescription>Personnalisez le message SMS envoyé aux contacts</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sms-template-input">Message SMS</Label>
            <Textarea
              id="sms-template-input"
              value={localSmsTemplate}
              onChange={(e) => handleSmsTemplateChange(e.target.value)}
              placeholder="Tapez votre message SMS personnalisé..."
              rows={10}
              className="font-mono text-sm"
            />
            <div className="text-xs text-muted-foreground">
              Caractères: {localSmsTemplate.length} / 1600 (recommandé pour SMS long)
            </div>
          </div>

          {/* Variables disponibles */}
          <div className="bg-muted/50 p-4 rounded-lg border">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-muted-foreground" />
                <p className="text-sm font-medium">Variables disponibles</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <code className="bg-background px-2 py-1 rounded border text-xs">{'{civilite}'}</code>
                <code className="bg-background px-2 py-1 rounded border text-xs">{'{nom}'}</code>
                <code className="bg-background px-2 py-1 rounded border text-xs">{'{signature}'}</code>
                <code className="bg-background px-2 py-1 rounded border text-xs">{'{rdv}'}</code>
              </div>
              <p className="text-xs text-muted-foreground">Ces variables seront automatiquement remplacées par les informations du contact</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderAppearanceSettings = () => (
    <Card>
      <CardHeader>
        <CardTitle>Thème</CardTitle>
        <CardDescription>
          Choisissez le thème de l'application.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {onThemeChange && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button
              variant={theme === Theme.Light ? "default" : "outline"}
              onClick={() => onThemeChange(Theme.Light)}
              className="flex flex-col h-auto p-4"
            >
              <Sun className="w-8 h-8 mb-2" />
              <span>Clair</span>
            </Button>
            <Button
              variant={theme === Theme.Dark ? "default" : "outline"}
              onClick={() => onThemeChange(Theme.Dark)}
              className="flex flex-col h-auto p-4"
            >
              <Moon className="w-8 h-8 mb-2" />
              <span>Sombre</span>
            </Button>
            <Button
              variant={theme === Theme.System ? "default" : "outline"}
              onClick={() => onThemeChange(Theme.System)}
              className="flex flex-col h-auto p-4"
            >
              <Monitor className="w-8 h-8 mb-2" />
              <span>Système</span>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderShortcutSettings = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center">
              <Keyboard className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <CardTitle className="text-base">Configuration des Raccourcis</CardTitle>
              <CardDescription>Personnalisez les touches de fonction F2-F10 pour changer rapidement le statut des contacts</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {shortcuts.map((shortcut) => (
              <div key={shortcut.key} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="font-mono">
                    {shortcut.key}
                  </Badge>
                  <span className="font-medium">{shortcut.label}</span>
                </div>
                <Select
                  value={shortcut.status}
                  onValueChange={(value) => handleShortcutChange(shortcut.key, value as ContactStatus)}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.values(ContactStatus).map((status) => (
                      <SelectItem key={status} value={status}>
                        {getStatusLabel(status)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ))}
            
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                {shortcuts.length} raccourci(s) configuré(s)
              </div>
              <Button variant="outline" size="sm" onClick={handleShortcutsReset}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Remettre par défaut
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Comment utiliser les raccourcis</CardTitle>
          <CardDescription>
            Instructions pour utiliser les touches de fonction
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
              <span>Appuyez sur <strong>F2-F10</strong> pour changer le statut du contact sélectionné</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
              <span>Le statut sera appliqué immédiatement sans confirmation</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
              <span>Un indicateur visuel apparaîtra pour confirmer l'action</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
              <span>Les raccourcis fonctionnent même si la fenêtre n'est pas active</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderColumnSettings = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Columns className="w-5 h-5" />
            Configuration des Colonnes
          </CardTitle>
          <CardDescription>
            Définissez quelles colonnes sont essentielles (ne peuvent pas être masquées) ou optionnelles dans le tableau des contacts.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-blue-50/50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <div className="flex items-center gap-3">
                <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                  Les colonnes essentielles restent toujours visibles
                </span>
              </div>
            </div>

            <div className="border rounded-md divide-y">
              {Object.keys(DEFAULT_COLUMN_CONFIG).map((columnName) => {
                const config = DEFAULT_COLUMN_CONFIG[columnName as keyof typeof DEFAULT_COLUMN_CONFIG];
                const isEssential = columnConfig[columnName] ?? config.isEssential;
                
                return (
                  <div key={columnName} className="flex items-center justify-between p-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-primary"></div>
                        <div>
                          <div className="font-medium">{columnName}</div>
                          <div className="text-sm text-muted-foreground">{config.label}</div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className="flex items-center space-x-2">
                        <Switch
                          id={`column-${columnName}`}
                          checked={isEssential}
                          onCheckedChange={(checked) => handleColumnEssentialChange(columnName, checked)}
                        />
                        <Label htmlFor={`column-${columnName}`} className="text-sm">
                          {isEssential ? (
                            <Badge variant="default" className="text-xs">Essentielle</Badge>
                          ) : (
                            <Badge variant="secondary" className="text-xs">Optionnelle</Badge>
                          )}
                        </Label>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                {Object.values(columnConfig).filter(Boolean).length} colonne(s) essentielle(s) sur {Object.keys(DEFAULT_COLUMN_CONFIG).length}
              </div>
              <Button variant="outline" size="sm" onClick={handleColumnConfigReset}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Remettre par défaut
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Impact des Modifications</CardTitle>
          <CardDescription>
            Comment ces paramètres affectent l'interface
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
              <span>Les colonnes <strong>essentielles</strong> ne peuvent pas être masquées via le menu "Colonnes"</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
              <span>Les colonnes <strong>optionnelles</strong> peuvent être masquées individuellement</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
              <span>L'option "Masquer les colonnes optionnelles" ne cache que les colonnes non-essentielles</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5" />
              <span>Les paramètres sont sauvegardés automatiquement à la fermeture</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderCategory = () => {
    switch (activeCategory) {
      case 'email':
        return renderEmailSettings();
      case 'sms':
        return renderSmsSettings();
      case 'calcom':
        return renderCalcomSettings();
      case 'appearance':
        return renderAppearanceSettings();
      case 'shortcuts':
        return renderShortcutSettings();
      case 'update':
        return renderUpdateSettings();
      case 'columns':
        return renderColumnSettings();
      default:
        return renderEmailSettings();
    }
  };

  const getCategoryLabel = (category: SettingsCategory): string => {
    const categoryInfo = categories.find(cat => cat.id === category);
    return categoryInfo?.label || 'Réglages';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="overflow-hidden p-0 max-w-7xl h-[90vh]">
        <DialogTitle className="sr-only">Réglages de l'application</DialogTitle>
        <DialogDescription className="sr-only">
          Personnalisez vos paramètres d'application.
        </DialogDescription>
        <SidebarProvider className="items-start">
          <Sidebar collapsible="none" className="hidden md:flex">
            <SidebarContent>
              <SidebarHeader className="border-b px-2 py-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-md bg-foreground/10 flex items-center justify-center">
                    <Settings className="w-4 h-4" />
                  </div>
                  <span className="font-semibold">Réglages</span>
                </div>
              </SidebarHeader>
              <SidebarGroup>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {categories.map((category) => (
                      <SidebarMenuItem key={category.id}>
                        <SidebarMenuButton
                          asChild
                          isActive={activeCategory === category.id}
                          onClick={() => setActiveCategory(category.id)}
                        >
                          <button className="w-full text-left">
                            <category.icon />
                            <span>{category.label}</span>
                          </button>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>
          </Sidebar>
          <main className="flex h-[90vh] flex-1 flex-col overflow-hidden">
            <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
              <div className="flex items-center gap-2">
                <Breadcrumb>
                  <BreadcrumbList>
                    <BreadcrumbItem className="hidden md:block">
                      <BreadcrumbLink href="#">Réglages</BreadcrumbLink>
                    </BreadcrumbItem>
                    <BreadcrumbSeparator className="hidden md:block" />
                    <BreadcrumbItem>
                      <BreadcrumbPage>{getCategoryLabel(activeCategory)}</BreadcrumbPage>
                    </BreadcrumbItem>
                  </BreadcrumbList>
                </Breadcrumb>
              </div>
              <div className="ml-auto flex items-center gap-2">
                {hasChanges && (
                  <Badge variant="outline" className="text-xs">
                    Non sauvegardé
                  </Badge>
                )}
              </div>
            </header>
            <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-6 pt-4">
              {renderCategory()}
            </div>
            <div className="p-4 border-t flex justify-end gap-3 bg-muted/30">
              <Button variant="ghost" onClick={handleReset}>
                <Undo className="w-4 h-4 mr-2" />
                Réinitialiser les changements
              </Button>
              <Button onClick={handleSave} disabled={!hasChanges}>
                <Save className="w-4 h-4 mr-2" />
                Sauvegarder et Fermer
              </Button>
            </div>
          </main>
        </SidebarProvider>
      </DialogContent>
    </Dialog>
  );
};

// Fonction utilitaire pour récupérer la configuration des colonnes
export const getSavedColumnConfig = (): Record<string, boolean> => {
  const saved = localStorage.getItem(COLUMNS_STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (error) {
      console.error('Erreur lors du chargement de la config des colonnes:', error);
    }
  }
  
  // Retourner la config par défaut si rien n'est sauvegardé
  const defaultConfig: Record<string, boolean> = {};
  Object.keys(DEFAULT_COLUMN_CONFIG).forEach(column => {
    defaultConfig[column] = DEFAULT_COLUMN_CONFIG[column as keyof typeof DEFAULT_COLUMN_CONFIG].isEssential;
  });
  return defaultConfig;
}; 