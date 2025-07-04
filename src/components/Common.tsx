import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Theme } from '../types';
import { Button as ShadcnButton } from '@/components/ui/button';
import { Input as ShadcnInput } from '@/components/ui/input';
import { Select as ShadcnSelect, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '../lib/utils';
import { Upload, CheckCircle, AlertCircle, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';

// Types pour les composants
interface ButtonProps {
  onClick?: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}

interface InputProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  disabled?: boolean;
  type?: string;
  className?: string;
  onBlur?: () => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  autoFocus?: boolean;
}

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps {
  value: string | undefined;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

interface ProgressDonutProps {
  progress?: number; // 0-100 percentage
  value?: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  className?: string;
  strokeWidth?: number;
}

interface DropZoneOverlayProps {
  onDrop: (files: FileList) => void;
  message?: string;
  icon?: React.ReactNode;
}

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

// Composant Button ultra moderne
export const Button: React.FC<ButtonProps> = ({ 
  onClick, 
  children, 
  disabled, 
  variant = 'ghost', 
  size = 'md', 
  className,
  type = 'button'
}) => {
  const getVariant = () => {
    switch (variant) {
      case 'primary': return 'default';
      case 'secondary': return 'secondary';
      case 'danger': return 'destructive';
      case 'outline': return 'outline';
      default: return 'ghost';
    }
  };

  const getSize = () => {
    switch (size) {
      case 'sm': return 'sm';
      case 'lg': return 'lg';
      default: return 'default';
    }
  };

  return (
    <ShadcnButton
      onClick={onClick}
      disabled={disabled}
      variant={getVariant()}
      size={getSize()}
      type={type}
      className={cn(
        "transition-all duration-200 font-medium",
        "hover:scale-[1.02] active:scale-[0.98]",
        "focus-visible:ring-2 focus-visible:ring-primary/50",
        className
      )}
    >
      {children}
    </ShadcnButton>
  );
};

// Composant Input ultra moderne
export const Input: React.FC<InputProps> = ({ 
  value, 
  onChange, 
  placeholder, 
  disabled, 
  type = 'text', 
  className,
  onBlur,
  onKeyDown,
  autoFocus
}) => {
  return (
    <ShadcnInput
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      type={type}
      onBlur={onBlur}
      onKeyDown={onKeyDown}
      autoFocus={autoFocus}
      className={cn(
        "transition-all duration-200",
        "border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 focus:border-primary/50",
        "bg-input text-foreground",
        "placeholder:text-slate-500 dark:placeholder:text-slate-400",
        "focus-visible:ring-2 focus-visible:ring-primary/20",
        className
      )}
    />
  );
};

// Composant Select ultra moderne
export const Select: React.FC<SelectProps> = ({ 
  value, 
  onChange, 
  options, 
  placeholder = "Sélectionner...", 
  disabled, 
  className 
}) => {
  // Filtrer les options valides
  const validOptions = options.filter(option => 
    option.value !== "" && option.value !== null && option.value !== undefined
  );

  // Gérer les valeurs undefined/null
  const currentValue = (value === "" || value === null || value === undefined) 
    ? undefined : String(value);

  return (
    <ShadcnSelect value={currentValue} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className={cn(
        "transition-all duration-200",
        "border-slate-300 dark:border-slate-600 hover:border-slate-400 dark:hover:border-slate-500 focus:border-primary/50",
        "bg-input text-foreground",
        "focus-visible:ring-2 focus-visible:ring-primary/20",
        className
      )}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent className="max-h-[300px]">
        {validOptions.map((option) => (
          <SelectItem 
            key={option.value} 
            value={option.value}
            className="cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 focus:bg-slate-100 dark:focus:bg-slate-700"
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </ShadcnSelect>
  );
};

// Composant ProgressDonut ultra moderne
export const ProgressDonut: React.FC<ProgressDonutProps> = ({ 
  progress,
  value, 
  max, 
  size = 'md', 
  showValue = true, 
  className,
  strokeWidth = 3
}) => {
  // Calculer le pourcentage selon les props disponibles
  const percentage = progress !== undefined 
    ? Math.round(progress) 
    : (value !== undefined && max !== undefined) 
      ? Math.round((value / max) * 100) 
      : 0;
  
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  const textSizes = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  const radius = size === 'sm' ? 12 : size === 'md' ? 18 : 24;
  const circumference = 2 * Math.PI * radius;
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className={cn("relative inline-flex items-center justify-center", sizeClasses[size], className)}>
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 48 48">
        {/* Background circle */}
        <circle
          cx="24"
          cy="24"
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          className="text-muted/20"
        />
        {/* Progress circle */}
        <circle
          cx="24"
          cy="24"
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="text-primary transition-all duration-300"
        />
      </svg>
      {showValue && (
        <div className={cn(
          "absolute inset-0 flex items-center justify-center font-semibold",
          textSizes[size]
        )}>
          <span className="text-foreground">{percentage}%</span>
        </div>
      )}
    </div>
  );
};

// Composant DropZoneOverlay ultra moderne
export const DropZoneOverlay: React.FC<DropZoneOverlayProps> = ({ 
  onDrop, 
  message = "Déposer les fichiers ici",
  icon
}) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.currentTarget === e.target) {
      setIsDragOver(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      onDrop(files);
    }
  }, [onDrop]);

  // Gestionnaires globaux pour le drag & drop
  useEffect(() => {
    const globalDragEnter = (e: DragEvent) => {
      e.preventDefault();
      setIsDragOver(true);
    };

    const globalDragLeave = (e: DragEvent) => {
      e.preventDefault();
      if (!e.relatedTarget) {
        setIsDragOver(false);
      }
    };

    const globalDrop = (e: DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
    };

    const globalDragOver = (e: DragEvent) => {
      e.preventDefault();
    };

    document.addEventListener('dragenter', globalDragEnter);
    document.addEventListener('dragleave', globalDragLeave);
    document.addEventListener('drop', globalDrop);
    document.addEventListener('dragover', globalDragOver);

    return () => {
      document.removeEventListener('dragenter', globalDragEnter);
      document.removeEventListener('dragleave', globalDragLeave);
      document.removeEventListener('drop', globalDrop);
      document.removeEventListener('dragover', globalDragOver);
    };
  }, []);

  if (!isDragOver) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[150] flex items-center justify-center",
        "bg-background/80 backdrop-blur-sm",
        "animate-in fade-in-0 duration-200"
      )}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <Card className={cn(
        "w-96 h-64 border-2 border-dashed border-primary/50",
        "bg-primary/5 hover:bg-primary/10 transition-colors",
        "flex items-center justify-center"
      )}>
        <CardContent className="text-center space-y-4 p-8">
          {icon || <Upload className="w-12 h-12 mx-auto text-primary" />}
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">
              {message}
            </h3>
            <p className="text-sm text-muted-foreground">
              Relâchez pour importer vos contacts
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Composant Modal ultra moderne
export const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  size = 'md', 
  className 
}) => {
  const sizeClasses: Record<string, string> = {
    sm: 'sm:max-w-md',
    md: 'sm:max-w-lg',
    lg: 'sm:max-w-2xl',
    xl: 'sm:max-w-4xl',
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className={cn(sizeClasses[size], className)}>
        {title && (
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
        )}
        {children}
        <DialogClose asChild>
          <button className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
            <X className="h-4 w-4" />
            <span className="sr-only">Fermer</span>
          </button>
        </DialogClose>
      </DialogContent>
    </Dialog>
  );
};

// Composants utilitaires pour les statuts
interface StatusBadgeProps {
  status: 'success' | 'error' | 'warning' | 'info';
  children: React.ReactNode;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, children, className }) => {
  const getVariant = () => {
    switch (status) {
      case 'success': return 'default';
      case 'error': return 'destructive';
      case 'warning': return 'secondary';
      default: return 'outline';
    }
  };

  const getIcon = () => {
    switch (status) {
      case 'success': return <CheckCircle className="w-3 h-3" />;
      case 'error': return <AlertCircle className="w-3 h-3" />;
      case 'warning': return <AlertCircle className="w-3 h-3" />;
      default: return null;
    }
  };

  return (
    <Badge variant={getVariant()} className={cn("gap-1", className)}>
      {getIcon()}
      {children}
    </Badge>
  );
};

// Hook pour la gestion des thèmes
export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = localStorage.getItem('dimicall-theme');
    return (saved as Theme) || Theme.Dark;
  });

  const toggleTheme = useCallback(() => {
    const newTheme: Theme = theme === Theme.Dark ? Theme.Light : Theme.Dark;
    setTheme(newTheme);
    localStorage.setItem('dimicall-theme', newTheme);
    
    // Appliquer le thème au document
    if (newTheme === Theme.Dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  // Appliquer le thème initial
  React.useEffect(() => {
    if (theme === Theme.Dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  return { theme, toggleTheme };
};
