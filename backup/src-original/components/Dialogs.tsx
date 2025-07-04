
import React, { useState, useEffect } from 'react';
import { Contact, Theme, EmailType, Civility, QualificationStatutMarital, QualificationSituationPro } from '../types';
import { Button, Input, Select, Modal } from './Common'; // Assuming these are in Common.tsx
import { generateGmailComposeUrl } from '../services/dataService'; // Import the new function

interface EmailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  contactName: string;
  contactEmail: string;
  showNotification: (type: 'success' | 'error' | 'info', message: string, duration?: number) => void;
}

const EmailDialog: React.FC<EmailDialogProps> = ({ isOpen, onClose, contactName, contactEmail, showNotification }) => {
  const [emailType, setEmailType] = useState<EmailType>(EmailType.D0Visio);
  const [civility, setCivility] = useState<Civility>(Civility.Monsieur);
  
  const handleGenerateEmail = () => {
    try {
      // contactName is "Prenom Nom", we want "Nom" for the template
      const lastName = contactName.split(' ').slice(1).join(' ') || contactName;
      const mailtoLink = generateGmailComposeUrl(contactEmail, lastName, emailType, civility);
      window.open(mailtoLink, '_blank');
      onClose();
    } catch (error) {
      console.error("Email generation error:", error);
      showNotification('error', `Erreur de génération du lien mail: ${error instanceof Error ? error.message : "Une erreur inconnue est survenue."}`);
    }
  };

  const emailTypeOptions = [
    { value: EmailType.D0Visio, label: "D0 (Visio)" },
    { value: EmailType.R0Interne, label: "R0 (Interne)" },
    { value: EmailType.R0Externe, label: "R0 (Externe)" },
    { value: EmailType.PremierContact, label: "1er Contact" },
  ];

  const civilityOptions = [
    { value: Civility.Monsieur, label: "Monsieur" },
    { value: Civility.Madame, label: "Madame" },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Générer un Email" size="md">
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-oled-text-dim mb-1">Type de rendez-vous</label>
          <div className="grid grid-cols-2 gap-2">
            {emailTypeOptions.map(opt => (
              <Button
                key={opt.value}
                variant={emailType === opt.value ? 'primary' : 'secondary'}
                onClick={() => setEmailType(opt.value)}
                className="w-full justify-center"
              >
                {opt.label}
              </Button>
            ))}
          </div>
        </div>
        <div>
            <label className="block text-sm font-medium text-oled-text-dim mb-1">Civilité</label>
            <div className="flex space-x-2">
                {civilityOptions.map(opt => (
                <Button
                    key={opt.value}
                    variant={civility === opt.value ? 'primary' : 'secondary'}
                    onClick={() => setCivility(opt.value)}
                    className="flex-1 justify-center"
                >
                    {opt.label}
                </Button>
                ))}
            </div>
        </div>
        <div className="flex justify-end space-x-3 pt-4">
          <Button variant="ghost" onClick={onClose}>Annuler</Button>
          <Button variant="primary" onClick={handleGenerateEmail}>
            Ouvrir Gmail
          </Button>
        </div>
      </div>
    </Modal>
  );
};

interface RappelDialogProps {
  isOpen: boolean;
  onClose: () => void;
  contact: Contact;
  onSave: (date: string, time: string) => void;
}

const RappelDialog: React.FC<RappelDialogProps> = ({ isOpen, onClose, contact, onSave }) => {
  const [date, setDate] = useState(contact.dateRappel || new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState(contact.heureRappel || new Date().toTimeString().substring(0,5));

  const handleSave = () => {
    onSave(date, time);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Définir un Rappel" size="sm">
      <div className="space-y-4">
        <Input label="Date du rappel" type="date" value={date} onChange={e => setDate(e.target.value)} />
        <Input label="Heure du rappel" type="time" value={time} onChange={e => setTime(e.target.value)} />
        <div className="flex justify-end space-x-3 pt-4">
          <Button variant="ghost" onClick={onClose}>Annuler</Button>
          <Button variant="primary" onClick={handleSave}>Enregistrer</Button>
        </div>
      </div>
    </Modal>
  );
};

interface CalendarDialogProps {
  isOpen: boolean;
  onClose: () => void;
  contactInfo?: { nom: string; prenom: string; email: string; telephone: string };
}

const CalendarDialog: React.FC<CalendarDialogProps> = ({ isOpen, onClose, contactInfo }) => {
  const calLink = "https://cal.com/dimitri-morel-arcanis-conseil/audit-patrimonial";
  
  const queryParams = new URLSearchParams();
  if (contactInfo) {
    if (contactInfo.prenom || contactInfo.nom) queryParams.append('name', `${contactInfo.prenom || ''} ${contactInfo.nom || ''}`.trim());
    if (contactInfo.email) queryParams.append('email', contactInfo.email);
    // Cal.com might not directly support prefilling phone number via URL params easily without custom setup
  }
  const finalCalLink = `${calLink}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;


  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Prise de Rendez-vous (Cal.com)" size="lg">
      <div className="space-y-4">
        <p className="text-oled-text-dim dark:text-oled-text-dim">
          Le calendrier Cal.com va s'ouvrir dans un nouvel onglet.
          {contactInfo && " Vos informations (nom, email) seront pré-remplies si possible."}
        </p>
        <iframe 
            src={finalCalLink} 
            className="w-full h-[600px] border-0 rounded-md"
            title="Cal.com Scheduler"
            sandbox="allow-scripts allow-same-origin allow-forms" 
        ></iframe>
        <p className="text-xs text-center text-oled-text-dim dark:text-oled-text-dim">Si l'intégration ne fonctionne pas, vous pouvez ouvrir le lien manuellement.</p>
        <div className="flex justify-center pt-2">
          <Button variant="secondary" onClick={() => window.open(finalCalLink, '_blank')}>
            Ouvrir Cal.com
          </Button>
        </div>
         <div className="flex justify-end space-x-3 pt-4">
          <Button variant="primary" onClick={onClose}>Fermer</Button>
        </div>
      </div>
    </Modal>
  );
};


interface QualificationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (comment: string) => void;
  theme: Theme;
}

const QualificationDialog: React.FC<QualificationDialogProps> = ({ isOpen, onClose, onSave, theme }) => {
  const [statutMarital, setStatutMarital] = useState<QualificationStatutMarital>(QualificationStatutMarital.Marie);
  const [situationPro, setSituationPro] = useState<QualificationSituationPro>(QualificationSituationPro.CDI);
  const [revenus, setRevenus] = useState('');
  const [charges, setCharges] = useState('');
  const [resultat, setResultat] = useState('');
  const [commentaire, setCommentaire] = useState('');

  const statutMaritalOptions = Object.values(QualificationStatutMarital).map(s => ({value: s, label: s}));
  const situationProOptions = Object.values(QualificationSituationPro).map(s => ({value: s, label: s}));

  useEffect(() => {
    const rev = parseFloat(revenus) || 0;
    const chg = parseFloat(charges) || 0;
    let calculatedResult = 0;
    if (rev > 0) {
      calculatedResult = situationPro === QualificationSituationPro.ChefEntreprise ? chg / rev : chg / (rev * 0.77);
      setResultat(calculatedResult.toFixed(2));
    } else {
      setResultat('N/A');
    }
    // Auto-update comment based on inputs
    const defaultComment = `Qualification: Statut marital: ${statutMarital}, Situation pro.: ${situationPro}. Revenus foyer: ${rev}€, Charges foyer: ${chg}€. Résultat calculé: ${calculatedResult.toFixed(2)}.`;
    setCommentaire(defaultComment);

  }, [revenus, charges, situationPro, statutMarital]);
  
  const handleSave = () => {
    // Commentaire is already updated by useEffect
    onSave(commentaire);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Qualification du Contact" size="lg">
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Select label="Statut marital" options={statutMaritalOptions} value={statutMarital} onChange={e => setStatutMarital(e.target.value as QualificationStatutMarital)} />
          <Select label="Situation professionnelle" options={situationProOptions} value={situationPro} onChange={e => setSituationPro(e.target.value as QualificationSituationPro)} />
        </div>
        <Input label="Revenus du foyer (€)" type="number" placeholder="Ex: 3000" value={revenus} onChange={e => setRevenus(e.target.value)} />
        <Input label="Charges du foyer (€)" type="number" placeholder="Ex: 1000" value={charges} onChange={e => setCharges(e.target.value)} />
        <Input label="Résultat (calculé)" value={resultat} readOnly className={`${theme === Theme.Dark ? 'bg-oled-interactive' : 'bg-gray-100 dark:bg-gray-700'} cursor-not-allowed`} />
        
        <div className="space-y-1">
            <label className={`block text-sm font-medium ${theme === Theme.Dark ? 'text-oled-text-dim': 'text-gray-500'} mb-1`}>Commentaire</label>
            <textarea
            value={commentaire}
            onChange={e => setCommentaire(e.target.value)}
            rows={3}
            className={`block w-full px-3 py-2 border rounded-md shadow-sm placeholder-opacity-50 focus:outline-none focus:ring-1 sm:text-sm 
                        ${theme === Theme.Dark ? 'bg-oled-card border-oled-border placeholder-oled-text-dim text-oled-text focus:ring-oled-accent focus:border-oled-accent' 
                                             : 'bg-white border-gray-300 placeholder-gray-400 text-gray-900 focus:ring-light-accent focus:border-light-accent'}`}
            placeholder="Le commentaire sera généré en fonction des saisies."
            />
        </div>

        <div className="flex justify-end space-x-3 pt-4">
          <Button variant="ghost" onClick={onClose}>Annuler</Button>
          <Button variant="primary" onClick={handleSave}>Enregistrer</Button>
        </div>
      </div>
    </Modal>
  );
};


interface GenericInfoDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: React.ReactNode;
  theme: Theme;
}

// Define GenericInfoDialogComponent as a const without export initially
const GenericInfoDialogComponent: React.FC<GenericInfoDialogProps> = ({ isOpen, onClose, title, content, theme }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="md">
      <div className={`space-y-4 ${theme === Theme.Dark ? 'text-oled-text' : 'text-light-text'}`}>
        {typeof content === 'string' ? <p className="whitespace-pre-wrap">{content}</p> : content}
        <div className="flex justify-end pt-4">
          <Button variant="primary" onClick={onClose}>OK</Button>
        </div>
      </div>
    </Modal>
  );
};

// Export GenericInfoDialog (and others if needed for this pattern) at the end
export { EmailDialog, RappelDialog, CalendarDialog, QualificationDialog, GenericInfoDialogComponent as GenericInfoDialog };
