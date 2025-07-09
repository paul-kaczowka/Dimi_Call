import React, { useState, useEffect } from 'react';
import { Settings, Mail, X, Save, Undo, ChevronDown, Palette, Calendar, MessageSquare, Sun, Moon, Monitor, Keyboard, RotateCcw, DownloadCloud, Info, CheckCircle, ExternalLink, Columns } from 'lucide-react';
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

  // Obtenir la couleur d'un statut
  const getStatusColor = (status: ContactStatus) => {
    const colors: Record<ContactStatus, string> = {
      [ContactStatus.NonDefini]: 'bg-muted text-muted-foreground border-transparent',
      [ContactStatus.Premature]: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
      [ContactStatus.MauvaisNum]: 'bg-red-500/10 text-red-500 border-red-500/20',
      [ContactStatus.Repondeur]: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
      [ContactStatus.ARappeler]: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
      [ContactStatus.PasInteresse]: 'bg-red-500/10 text-red-500 border-red-500/20',
      [ContactStatus.Argumente]: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
      [ContactStatus.DO]: 'bg-green-500/10 text-green-500 border-green-500/20',
      [ContactStatus.RO]: 'bg-teal-500/10 text-teal-500 border-teal-500/20',
      [ContactStatus.ListeNoire]: 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20'
    };
    return colors[status] || 'bg-muted text-muted-foreground border-transparent';
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

  const handleCheckForUpdates = async () => {
    setIsCheckingUpdates(true);
    console.log('UI: 🔍 Demande de vérification des mises à jour...');
    
    try {
      if (window.electronAPI?.checkForUpdates) {
        const result = await window.electronAPI.checkForUpdates();
        
        console.log(`UI: 📦 Réponse reçue du processus principal:`, result);
        
        if (result.status === 'checking') {
          console.log('UI: ✅ La vérification des mises à jour a été lancée avec succès.');
          // On peut ajouter un toast ici si besoin
        } else if (result.status === 'dev_mode') {
          console.warn(`UI: ⚠️ ${result.message}`);
          // On peut ajouter un toast ici si besoin
        } else if (result.status === 'error') {
          console.error(`UI: ❌ ${result.message}`);
          // On peut ajouter un toast ici si besoin
        }
      } else {
        console.warn('UI: ⚠️ API de mise à jour non disponible. L\'application n\'est probablement pas dans un contexte Electron.');
      }
    } catch (error) {
      console.error('UI: ❌ Erreur de communication IPC lors de la vérification des mises à jour:', error);
    } finally {
      // Laisser le temps à l'utilisateur de voir le changement d'état du bouton
      setTimeout(() => {
        setIsCheckingUpdates(false);
      }, 2500);
    }
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
                    {selectedEmailType === EmailType.R0Externe && (
                      <code className="bg-background px-2 py-1 rounded border text-xs">{'{adresse}'}</code>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Ces variables seront automatiquement remplacées par les informations du contact
                  </p>
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
          <div className="bg-muted/50 rounded-lg p-4 border">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-muted-foreground" />
                <p className="text-sm font-medium">Guide de configuration</p>
              </div>
              <div className="space-y-2 text-xs text-muted-foreground">
                <p>• Utilisez l'URL complète de votre événement Cal.com</p>
                <p>• Format: <code className="bg-background px-2 py-1 rounded border font-mono">https://cal.com/votre-nom/votre-événement</code></p>
                <p>• Les informations du contact seront automatiquement ajoutées :</p>
                <div className="grid grid-cols-1 gap-1 ml-4">
                  <code className="bg-background px-2 py-1 rounded border text-xs font-mono">name (nom du contact)</code>
                  <code className="bg-background px-2 py-1 rounded border text-xs font-mono">email (email du contact)</code>
                  <code className="bg-background px-2 py-1 rounded border text-xs font-mono">smsReminderNumber (téléphone)</code>
                </div>
              </div>
            </div>
          </div>

          {/* Aperçu de l'URL finale */}
          {localCalcomUrl && (
            <div className="bg-muted/50 rounded-lg p-4 border">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium">Aperçu</span>
              </div>
              <div className="text-xs font-mono text-muted-foreground break-all">
                {localCalcomUrl}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Cette URL sera utilisée lors du clic sur le bouton "Cal.com" du ruban
              </p>
            </div>
          )}
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
          <div className="bg-muted/50 rounded-lg p-4 border">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-muted-foreground" />
                <p className="text-sm font-medium">Variables disponibles</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <code className="bg-background px-2 py-1 rounded border text-xs">{'{civilite}'}</code>
                <code className="bg-background px-2 py-1 rounded border text-xs">{'{nom}'}</code>
                <code className="bg-background px-2 py-1 rounded border text-xs">{'{prenom}'}</code>
                <code className="bg-background px-2 py-1 rounded border text-xs">{'{nom_complet}'}</code>
              </div>
              <div className="space-y-2 text-xs text-muted-foreground">
                <p>• <strong>{'{civilite}'}</strong> : "Monsieur" ou "Madame" selon le choix dans le menu</p>
                <p>• <strong>{'{nom}'}</strong> : Nom de famille du contact</p>
                <p>• <strong>{'{prenom}'}</strong> : Prénom du contact</p>
                <p>• <strong>{'{nom_complet}'}</strong> : Prénom + Nom du contact</p>
              </div>
            </div>
          </div>

          {/* Aperçu avec exemple */}
          {localSmsTemplate && (
            <div className="bg-muted/50 rounded-lg p-4 border">
              <div className="flex items-center gap-2 mb-3">
                <MessageSquare className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium">Aperçu avec exemple</span>
              </div>
              <div className="bg-background rounded-lg p-3 border text-xs font-mono whitespace-pre-wrap">
                {localSmsTemplate
                  .replace(/{civilite}/g, 'Madame')
                  .replace(/{nom}/g, 'Dupont')
                  .replace(/{prenom}/g, 'Marie')
                  .replace(/{nom_complet}/g, 'Marie Dupont')
                }
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Exemple avec : Civilité "Madame", Prénom "Marie", Nom "Dupont"
              </p>
            </div>
          )}
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

  const renderShortcutSettings = () => {
    const availableStatuses = Object.values(ContactStatus);

    return (
      <Card>
        <CardHeader>
          <CardTitle>Raccourcis Clavier</CardTitle>
          <CardDescription>
            Configurez les actions pour les touches de fonction F1 à F10.
            Les changements sont sauvegardés lorsque vous cliquez sur "Sauvegarder".
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md">
            <div className="divide-y">
              {/* F1 - Action d'appel fixe */}
              <div className="flex items-center justify-between p-3 bg-blue-50/50 dark:bg-blue-900/20">
                <div className="flex items-center gap-3">
                  <div className="font-mono text-sm bg-blue-100 text-blue-700 dark:bg-blue-800 dark:text-blue-300 rounded-md h-8 w-8 flex items-center justify-center border border-blue-300 dark:border-blue-600">
                    F1
                  </div>
                  <span className="font-medium">📞 Appeler le contact sélectionné</span>
                </div>
                
                <Badge variant="outline" className="text-xs text-blue-600 border-blue-300 dark:text-blue-400 dark:border-blue-600">
                  Fonction fixe
                </Badge>
              </div>
              
              {shortcuts.map((shortcut) => (
                <div key={shortcut.key} className="flex items-center justify-between p-3">
                  <div className="flex items-center gap-3">
                    <div className="font-mono text-sm bg-muted text-muted-foreground rounded-md h-8 w-8 flex items-center justify-center border">
                      {shortcut.key}
                    </div>
                    <span>{shortcut.label}</span>
                  </div>
                  
                  <Select
                    value={shortcut.status}
                    onValueChange={(value) => handleShortcutChange(shortcut.key, value as ContactStatus)}
                  >
                    <SelectTrigger className="w-auto md:w-48">
                      <SelectValue>
                        <Badge className={cn("text-xs font-normal border", getStatusColor(shortcut.status))}>
                          {getStatusLabel(shortcut.status)}
                        </Badge>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {availableStatuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          <Badge className={cn("text-xs font-normal border", getStatusColor(status))}>
                            {getStatusLabel(status)}
                          </Badge>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent showCloseButton={false} className="max-w-7xl h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-4 border-b flex-row items-center justify-between">
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Réglages de l'application
          </DialogTitle>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-muted">
            <X className="w-5 h-5" />
          </button>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar de navigation */}
          <div className="w-64 border-r bg-muted/30 p-4 flex-shrink-0">
            <div className="pb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-md bg-foreground/10 flex items-center justify-center">
                  <Settings className="w-4 h-4" />
                </div>
                <span className="font-semibold">Réglages</span>
              </div>
            </div>
            <nav className="space-y-1">
              {categories.map((category) => (
                <button
                  key={category.id}
                  onClick={() => setActiveCategory(category.id)}
                  className={cn(
                    "w-full text-left rounded-md transition-colors",
                    activeCategory === category.id
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "hover:bg-accent hover:text-accent-foreground"
                  )}
                >
                  <div className="flex items-center gap-3 p-3">
                    <category.icon className={cn("w-4 h-4", activeCategory !== category.id && "text-muted-foreground")} aria-hidden="true" />
                    <div>
                      <div className="text-sm font-medium">{category.label}</div>
                      <div className={cn("text-xs", activeCategory === category.id ? "text-primary-foreground/80" : "text-muted-foreground")}>
                        {category.description}
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </nav>
          </div>

          {/* Contenu principal */}
          <div className="flex-1 p-6 overflow-y-auto">
            {renderCategory()}
          </div>
        </div>
        
        {/* Pied de page avec boutons */}
        <div className="p-4 border-t flex justify-end gap-3 bg-muted/30">
          <Button variant="ghost" onClick={handleReset}>Réinitialiser les changements</Button>
          <Button onClick={handleSave} disabled={!hasChanges}>
            <Save className="w-4 h-4 mr-2" />
            Sauvegarder et Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Fonction utilitaire pour récupérer les templates sauvegardés
export const getSavedEmailTemplates = (): { templates: EmailTemplates; signature: string } => {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      const data = JSON.parse(saved);
      return {
        templates: data.templates || defaultTemplates,
        signature: data.signature || ''
      };
    } catch (error) {
      console.error('Erreur lors du chargement des templates:', error);
    }
  }
  return {
    templates: defaultTemplates,
    signature: ''
  };
};

// Fonction utilitaire pour récupérer la configuration des colonnes sauvegardée
export const getSavedColumnConfig = (): Record<string, boolean> => {
  const saved = localStorage.getItem(COLUMNS_STORAGE_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch (error) {
      console.error('Erreur lors du chargement de la config des colonnes:', error);
    }
  }
  
  // Retourner la config par défaut
  const defaultConfig: Record<string, boolean> = {};
  Object.keys(DEFAULT_COLUMN_CONFIG).forEach(column => {
    defaultConfig[column] = DEFAULT_COLUMN_CONFIG[column as keyof typeof DEFAULT_COLUMN_CONFIG].isEssential;
  });
  return defaultConfig;
}; 