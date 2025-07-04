
import React, { ReactNode, useState, useEffect, useRef } from 'react';
import { IconX } from '../constants'; // Assuming IconX is for closing modal

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  leftIcon,
  rightIcon,
  className,
  ...props
}) => {
  const baseStyle = "font-semibold rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors duration-150 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variantStyles = {
    primary: "bg-oled-accent hover:bg-opacity-80 text-white focus:ring-oled-accent",
    secondary: "bg-oled-interactive hover:bg-oled-interactive-hover text-oled-text border border-oled-border focus:ring-oled-accent",
    danger: "bg-oled-red hover:bg-opacity-80 text-white focus:ring-oled-red",
    ghost: "bg-transparent hover:bg-oled-interactive text-oled-text focus:ring-oled-accent",
  };
  const lightVariantStyles = {
    primary: "dark:bg-oled-accent dark:hover:bg-opacity-80 dark:text-white dark:focus:ring-oled-accent bg-light-accent hover:bg-opacity-80 text-white focus:ring-light-accent",
    secondary: "dark:bg-oled-interactive dark:hover:bg-oled-interactive-hover dark:text-oled-text dark:border-oled-border dark:focus:ring-oled-accent bg-light-interactive hover:bg-light-interactive-hover text-light-text border border-light-border focus:ring-light-accent",
    danger: "dark:bg-oled-red dark:hover:bg-opacity-80 dark:text-white dark:focus:ring-oled-red bg-light-red hover:bg-opacity-80 text-white focus:ring-light-red",
    ghost: "dark:bg-transparent dark:hover:bg-oled-interactive dark:text-oled-text dark:focus:ring-oled-accent bg-transparent hover:bg-light-interactive text-light-text focus:ring-light-accent",
  };

  const sizeStyles = {
    sm: `px-3 py-1.5 text-sm ${leftIcon || rightIcon ? 'space-x-1.5' : ''}`,
    md: `px-4 py-2 text-base ${leftIcon || rightIcon ? 'space-x-2' : ''}`,
    lg: `px-6 py-3 text-lg ${leftIcon || rightIcon ? 'space-x-2.5' : ''}`,
  };

  return (
    <button
      className={`${baseStyle} ${lightVariantStyles[variant]} ${sizeStyles[size]} ${className}`}
      {...props}
    >
      {leftIcon && <span className="mr-2">{leftIcon}</span>}
      {children}
      {rightIcon && <span className="ml-2">{rightIcon}</span>}
    </button>
  );
};

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Input: React.FC<InputProps> = ({ label, id, className, ...props }) => {
  const baseStyle = "block w-full px-3 py-2 bg-oled-card border border-oled-border rounded-md shadow-sm placeholder-oled-text-dim focus:outline-none focus:ring-oled-accent focus:border-oled-accent sm:text-sm text-oled-text dark:bg-oled-card dark:border-oled-border dark:placeholder-oled-text-dim dark:text-oled-text dark:focus:ring-oled-accent dark:focus:border-oled-accent";
  return (
    <div>
      {label && <label htmlFor={id} className="block text-sm font-medium text-oled-text-dim dark:text-oled-text-dim mb-1">{label}</label>}
      <input id={id} className={`${baseStyle} ${className}`} {...props} />
    </div>
  );
};

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string | number; label: string }[];
}

export const Select: React.FC<SelectProps> = ({ label, id, options, className, ...props }) => {
  const baseStyle = "block w-full pl-3 pr-10 py-2 text-base bg-oled-card border-oled-border focus:outline-none focus:ring-oled-accent focus:border-oled-accent sm:text-sm rounded-md text-oled-text dark:bg-oled-card dark:border-oled-border dark:text-oled-text dark:focus:ring-oled-accent dark:focus:border-oled-accent";
  return (
    <div>
      {label && <label htmlFor={id} className="block text-sm font-medium text-oled-text-dim dark:text-oled-text-dim mb-1">{label}</label>}
      <select id={id} className={`${baseStyle} ${className}`} {...props}>
        {options.map(option => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </div>
  );
};


interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-full h-full',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-75 flex items-center justify-center p-4">
      <div className={`bg-oled-card dark:bg-oled-card text-oled-text dark:text-oled-text rounded-xl shadow-2xl w-full ${sizeClasses[size]} overflow-hidden`}>
        {title && (
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-oled-border dark:border-oled-border">
            <h3 className="text-xl font-semibold">{title}</h3>
            <button
              onClick={onClose}
              className="p-1 rounded-full text-oled-text-dim hover:bg-oled-interactive dark:text-oled-text-dim dark:hover:bg-oled-interactive"
              aria-label="Close modal"
            >
              <IconX className="w-6 h-6" />
            </button>
          </div>
        )}
         {!title && ( // Add a close button even if there's no title, positioned top-right
          <div className="absolute top-0 right-0 pt-4 pr-4">
            <button
              onClick={onClose}
              className="p-1 rounded-full text-oled-text-dim hover:bg-oled-interactive dark:text-oled-text-dim dark:hover:bg-oled-interactive"
              aria-label="Close modal"
            >
              <IconX className="w-6 h-6" />
            </button>
          </div>
        )}
        <div className="p-4 sm:p-6 max-h-[80vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};


interface ProgressDonutProps {
  progress: number; // 0-100
  size?: number; // diameter in pixels
  strokeWidth?: number;
  className?: string;
}

export const ProgressDonut: React.FC<ProgressDonutProps> = ({ progress, size = 36, strokeWidth = 3, className }) => {
  const normalizedRadius = (size / 2) - strokeWidth * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <svg height={size} width={size} viewBox={`0 0 ${size} ${size}`} className={className}>
      <circle
        className="text-oled-border dark:text-oled-border"
        stroke="currentColor"
        fill="transparent"
        strokeWidth={strokeWidth}
        r={normalizedRadius}
        cx={size / 2}
        cy={size / 2}
      />
      <circle
        className="text-oled-accent dark:text-oled-accent"
        stroke="currentColor"
        fill="transparent"
        strokeWidth={strokeWidth}
        strokeDasharray={`${circumference} ${circumference}`}
        style={{ strokeDashoffset }}
        strokeLinecap="round"
        r={normalizedRadius}
        cx={size / 2}
        cy={size / 2}
        transform={`rotate(-90 ${size/2} ${size/2})`} // Start from top
      />
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dy=".3em"
        className="text-xs font-semibold fill-current text-oled-text-dim dark:text-oled-text-dim"
      >
        {`${Math.round(progress)}%`}
      </text>
    </svg>
  );
};


interface DropZoneOverlayProps {
  onDrop: (files: FileList) => void;
  message?: string;
  icon?: ReactNode;
}

export const DropZoneOverlay: React.FC<DropZoneOverlayProps> = ({ onDrop, message, icon }) => {
  const [isActive, setIsActive] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsActive(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    // Only deactivate if leaving the actual overlay, not child elements
    if (e.target === overlayRef.current) {
        setIsActive(false);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onDrop(e.dataTransfer.files);
      e.dataTransfer.clearData();
    }
  };
  
  // Effect to add global listeners for drag events on the window
  // This makes the dropzone activate when dragging anywhere over the window
  useEffect(() => {
    const globalDragEnter = (e: DragEvent) => {
      e.preventDefault();
      setIsActive(true);
    };
    const globalDragLeave = (e: DragEvent) => {
        // More robust check for leaving window
        if (!e.relatedTarget || (e.relatedTarget as Node).nodeName === "HTML") {
            setIsActive(false);
        }
    };
    const globalDrop = (e: DragEvent) => {
      e.preventDefault(); // Prevent default browser behavior for drop
      setIsActive(false);
    };
    const globalDragOver = (e: DragEvent) => {
        e.preventDefault(); // Necessary to allow drop
    };

    window.addEventListener('dragenter', globalDragEnter);
    window.addEventListener('dragleave', globalDragLeave);
    window.addEventListener('drop', globalDrop);
    window.addEventListener('dragover', globalDragOver);

    return () => {
      window.removeEventListener('dragenter', globalDragEnter);
      window.removeEventListener('dragleave', globalDragLeave);
      window.removeEventListener('drop', globalDrop);
      window.removeEventListener('dragover', globalDragOver);
    };
  }, []);


  if (!isActive) return null;

  return (
    <div
      ref={overlayRef}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className="fixed inset-0 z-[100] bg-black/70 flex flex-col items-center justify-center p-10 transition-opacity duration-300"
    >
      <div className="w-full max-w-2xl p-10 sm:p-16 border-4 border-dashed border-oled-accent dark:border-oled-accent rounded-xl bg-oled-card/90 dark:bg-oled-card/90 shadow-2xl text-center">
        {icon || (
          <svg className="mx-auto h-20 w-20 text-oled-accent dark:text-oled-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        )}
        <p className="mt-6 text-2xl font-semibold text-oled-text dark:text-oled-text">
          {message || "Déposez votre fichier Excel ou CSV ici pour l'importer"}
        </p>
        <p className="mt-2 text-sm text-oled-text-dim dark:text-oled-text-dim">
          Glissez et déposez un fichier pour commencer l'importation.
        </p>
      </div>
    </div>
  );
};

interface SwitchControlProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}

export const SwitchControl: React.FC<SwitchControlProps> = ({ checked, onChange, className }) => {
  const toggleSwitch = () => onChange(!checked);

  return (
    <button
      type="button"
      onClick={toggleSwitch}
      className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-oled-accent dark:focus:ring-offset-oled-bg ${
        checked ? 'bg-oled-accent dark:bg-oled-accent' : 'bg-oled-interactive dark:bg-oled-interactive'
      } ${className}`}
      role="switch"
      aria-checked={checked}
    >
      <span
        className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-200 ease-in-out ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
};
