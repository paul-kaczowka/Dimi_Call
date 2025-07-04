import React, { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle } from 'lucide-react';
import { Theme } from '../types';

interface ShortcutIndicatorProps {
  isVisible: boolean;
  keyPressed: string;
  statusLabel: string;
  theme: Theme;
  onClose: () => void;
}

export const ShortcutIndicator: React.FC<ShortcutIndicatorProps> = ({
  isVisible,
  keyPressed,
  statusLabel,
  theme,
  onClose
}) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => {
        onClose();
      }, 2000); // Afficher pendant 2 secondes

      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-[9998] animate-in slide-in-from-right-5 duration-300">
      <div className={`
        flex items-center gap-3 p-3 rounded-lg border shadow-lg backdrop-blur-sm
        ${theme === Theme.Dark 
          ? 'bg-slate-900/90 border-slate-700 text-white' 
          : 'bg-white/90 border-gray-200 text-slate-900'
        }
      `}>
        <CheckCircle className="w-5 h-5 text-green-500" />
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-mono text-xs">
            {keyPressed}
          </Badge>
          <span className="text-sm font-medium">→</span>
          <span className="text-sm">{statusLabel}</span>
        </div>
      </div>
    </div>
  );
}; 