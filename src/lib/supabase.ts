import { createClient } from '@supabase/supabase-js';

// Configuration Supabase - À mettre à jour avec vos vraies clés API
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://oqnagwoqlhqtnhfiakom.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xbmFnd29xbGhxdG5oZmlha29tIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzcxOTg0OTMsImV4cCI6MjA1Mjc3NDQ5M30.MWQ0QKL6TcWXNdTCHKgVXCm7qyKdqYz8X5MXOkL-Flo';

// IMPORTANT: Pour obtenir votre vraie clé anon :
// 1. Allez sur https://supabase.com/dashboard/project/oqnagwoqlhqtnhfiakom
// 2. Settings > API > anon public key
// 3. Remplacez la valeur ci-dessus ou créez un fichier .env.local avec VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types pour l'utilisateur
export interface AuthUser {
  id: string;
  email: string;
  user_metadata?: {
    license_expires_at?: string;
  };
}

// Interface pour l'utilisateur de la base de données
export interface DatabaseUser {
  id: string;
  email: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
} 