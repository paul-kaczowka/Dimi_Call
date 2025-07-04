import { useState, useEffect, useCallback } from 'react';

// Import du service ADB réel
import { adbService, AdbConnectionState, PhoneCallResult } from '../services/adbService';

export type { AdbConnectionState, PhoneCallResult };

export const useAdb = () => {
  const [connectionState, setConnectionState] = useState<AdbConnectionState>(
    adbService.getConnectionState()
  );
  const [isConnecting, setIsConnecting] = useState(false);

  useEffect(() => {
    const unsubscribe = adbService.onConnectionStateChange(setConnectionState);
    return unsubscribe;
  }, []);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    try {
      const success = await adbService.connectDevice();
      return success;
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const disconnect = useCallback(async () => {
    await adbService.disconnectDevice();
  }, []);

  const makeCall = useCallback(async (phoneNumber: string) => {
    return await adbService.makePhoneCall(phoneNumber);
  }, []);

  const sendSms = useCallback(async (phoneNumber: string, message: string) => {
    return await adbService.sendSms(phoneNumber, message);
  }, []);

  const updateBattery = useCallback(async () => {
    await adbService.updateBatteryStatus();
  }, []);

  const isWebUsbSupported = useCallback(() => {
    return adbService.isWebUsbSupported();
  }, []);

  return {
    connectionState,
    isConnecting,
    connect,
    disconnect,
    makeCall,
    sendSms,
    updateBattery,
    isWebUsbSupported,
  };
}; 