import { useState, useEffect, useCallback } from 'react';

// Import du service ADB réel
import { adbService, AdbConnectionState, PhoneCallResult, CallEndEvent, CallEndCallback } from '../services/adbService';

export type { AdbConnectionState, PhoneCallResult, CallEndEvent, CallEndCallback };

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

  const getLogs = useCallback(() => {
    return adbService.getLogs();
  }, []);

  const setAutoDetection = useCallback((enabled: boolean) => {
    adbService.setAutoDetection(enabled);
  }, []);

  const restartAdbServer = useCallback(async () => {
    return await adbService.restartAdbServer();
  }, []);

  const getCurrentCallState = useCallback(() => {
    return adbService.getCurrentCallState();
  }, []);

  const getLastCallNumber = useCallback(() => {
    return adbService.getLastCallNumber();
  }, []);

  const checkCallState = useCallback(async () => {
    await adbService.checkCallState();
  }, []);

  const onCallEnd = useCallback((callback: CallEndCallback) => {
    return adbService.onCallEnd(callback);
  }, []);

  const endCall = useCallback(async () => {
    return await adbService.endCall();
  }, []);

  return {
    connectionState,
    isConnecting,
    connect,
    disconnect,
    makeCall,
    endCall,
    sendSms,
    updateBattery,
    isWebUsbSupported,
    getLogs,
    setAutoDetection,
    restartAdbServer,
    getCurrentCallState,
    getLastCallNumber,
    checkCallState,
    onCallEnd,
  };
}; 