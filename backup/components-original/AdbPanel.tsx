import React, { useState } from 'react';
import { useAdb, AdbConnectionState, PhoneCallResult } from '../hooks/useAdb';
import { Theme } from '../types';
import { Button } from './Common';

interface AdbPanelProps {
  theme: Theme;
  onCallResult?: (result: PhoneCallResult) => void;
}

export const AdbPanel: React.FC<AdbPanelProps> = ({ theme, onCallResult }) => {
  const { 
    connectionState, 
    isConnecting, 
    connect, 
    disconnect, 
    makeCall, 
    sendSms, 
    updateBattery, 
    isWebUsbSupported 
  } = useAdb();

  const [phoneNumber, setPhoneNumber] = useState('');
  const [smsMessage, setSmsMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleConnect = async () => {
    const success = await connect();
    if (success) {
      console.log('Connexion ADB réussie');
    } else {
      console.error('Échec de la connexion ADB');
    }
  };

  const handleDisconnect = async () => {
    await disconnect();
    console.log('Déconnexion ADB');
  };

  const handleMakeCall = async () => {
    if (!phoneNumber.trim()) {
      alert('Veuillez saisir un numéro de téléphone');
      return;
    }

    setIsLoading(true);
    try {
      const result = await makeCall(phoneNumber);
      onCallResult?.(result);
      
      if (result.success) {
        console.log('Appel initié avec succès');
      } else {
        console.error('Échec de l\'appel:', result.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendSms = async () => {
    if (!phoneNumber.trim()) {
      alert('Veuillez saisir un numéro de téléphone');
      return;
    }
    if (!smsMessage.trim()) {
      alert('Veuillez saisir un message');
      return;
    }

    setIsLoading(true);
    try {
      const result = await sendSms(phoneNumber, smsMessage);
      onCallResult?.(result);
      
      if (result.success) {
        console.log('SMS envoyé avec succès');
        setSmsMessage(''); // Vider le message après envoi
      } else {
        console.error('Échec de l\'envoi SMS:', result.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateBattery = async () => {
    await updateBattery();
  };

  const getBatteryIcon = () => {
    if (!connectionState.batteryLevel) return '🔋';
    
    const level = connectionState.batteryLevel;
    if (level > 75) return connectionState.isCharging ? '🔋⚡' : '🔋';
    if (level > 50) return connectionState.isCharging ? '🔋⚡' : '🔋';
    if (level > 25) return connectionState.isCharging ? '🪫⚡' : '🪫';
    return connectionState.isCharging ? '🪫⚡' : '🪫';
  };

  const cardBg = theme === Theme.Dark ? 'bg-oled-card' : 'bg-light-card';
  const textColor = theme === Theme.Dark ? 'text-oled-text' : 'text-light-text';
  const textDimColor = theme === Theme.Dark ? 'text-oled-text-dim' : 'text-light-text-dim';
  const borderColor = theme === Theme.Dark ? 'border-oled-border' : 'border-light-border';
  const inputBg = theme === Theme.Dark ? 'bg-oled-interactive' : 'bg-light-interactive';

  if (!isWebUsbSupported()) {
    return (
      <div className={`p-4 rounded-xl ${cardBg} ${textColor} border ${borderColor}`}>
        <div className="text-center">
          <div className="text-4xl mb-2">⚠️</div>
          <h3 className="text-lg font-semibold mb-2">WebUSB non supporté</h3>
          <p className={`text-sm ${textDimColor}`}>
            Votre navigateur ne supporte pas WebUSB. Veuillez utiliser Chrome ou Edge pour accéder aux fonctionnalités ADB.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`p-4 rounded-xl ${cardBg} ${textColor} border ${borderColor} space-y-4`}>
      {/* En-tête avec statut de connexion */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="text-2xl">📱</div>
          <div>
            <h3 className="text-lg font-semibold">Android Debug Bridge</h3>
            <p className={`text-sm ${textDimColor}`}>
              {connectionState.isConnected ? 'Connecté' : 'Déconnecté'}
            </p>
          </div>
        </div>
        
        {connectionState.isConnected && (
          <div className="flex items-center space-x-2">
            <span className="text-sm">{getBatteryIcon()}</span>
            <span className={`text-sm ${textDimColor}`}>
              {connectionState.batteryLevel}%
            </span>
            <Button
              onClick={handleUpdateBattery}
              variant="ghost"
              size="sm"
              className="!p-1"
              title="Actualiser la batterie"
            >
              🔄
            </Button>
          </div>
        )}
      </div>

      {/* Informations sur l'appareil */}
      {connectionState.isConnected && connectionState.device && (
        <div className={`p-3 rounded-lg ${inputBg} border ${borderColor}`}>
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-sm font-medium">Appareil:</span>
            <span className={`text-sm ${textDimColor}`}>
              {connectionState.device.name || 'Android Device'}
            </span>
          </div>
          <div className="flex items-center space-x-4 text-sm">
            <span>
              Batterie: {connectionState.batteryLevel}% 
              {connectionState.isCharging && ' (En charge)'}
            </span>
          </div>
        </div>
      )}

      {/* Boutons de connexion */}
      <div className="flex space-x-2">
        {!connectionState.isConnected ? (
          <Button
            onClick={handleConnect}
            disabled={isConnecting}
            className="flex-1"
          >
            {isConnecting ? '🔄 Connexion...' : '🔌 Connecter ADB'}
          </Button>
        ) : (
          <Button
            onClick={handleDisconnect}
            variant="secondary"
            className="flex-1"
          >
            🔌 Déconnecter
          </Button>
        )}
      </div>

      {/* Actions disponibles quand connecté */}
      {connectionState.isConnected && (
        <div className="space-y-3">
          <div className={`h-px ${borderColor} bg-current opacity-20`}></div>
          
          {/* Numéro de téléphone */}
          <div>
            <label className={`block text-sm font-medium mb-1 ${textDimColor}`}>
              Numéro de téléphone
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+33 6 12 34 56 78"
              className={`w-full px-3 py-2 rounded-lg ${inputBg} border ${borderColor} ${textColor} placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500`}
            />
          </div>

          {/* Bouton d'appel */}
          <Button
            onClick={handleMakeCall}
            disabled={isLoading || !phoneNumber.trim()}
            className="w-full"
          >
            {isLoading ? '📞 Appel en cours...' : '📞 Passer un appel'}
          </Button>

          {/* Message SMS */}
          <div>
            <label className={`block text-sm font-medium mb-1 ${textDimColor}`}>
              Message SMS
            </label>
            <textarea
              value={smsMessage}
              onChange={(e) => setSmsMessage(e.target.value)}
              placeholder="Tapez votre message..."
              rows={3}
              className={`w-full px-3 py-2 rounded-lg ${inputBg} border ${borderColor} ${textColor} placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none`}
            />
          </div>

          {/* Bouton SMS */}
          <Button
            onClick={handleSendSms}
            disabled={isLoading || !phoneNumber.trim() || !smsMessage.trim()}
            variant="secondary"
            className="w-full"
          >
            {isLoading ? '💬 Envoi en cours...' : '💬 Envoyer SMS'}
          </Button>
        </div>
      )}

      {/* Instructions */}
      {!connectionState.isConnected && (
        <div className={`p-3 rounded-lg ${inputBg} border ${borderColor}`}>
          <h4 className="text-sm font-medium mb-2">Instructions:</h4>
          <ol className={`text-xs ${textDimColor} space-y-1 list-decimal list-inside`}>
            <li>Activez le débogage USB sur votre Android</li>
            <li>Connectez votre téléphone via USB</li>
            <li>Cliquez sur "Connecter ADB"</li>
            <li>Autorisez la connexion sur votre téléphone</li>
          </ol>
        </div>
      )}
    </div>
  );
}; 