import type { NextConfig } from "next";
import path from 'node:path'; // Importer path

const nextConfig: NextConfig = {
  /* config options here */
  // Ajouter outputFileTracingRoot pour le développement en monorepo
  ...(process.env.NODE_ENV === 'development' && {
    outputFileTracingRoot: path.join(__dirname, '../../'),
  }),
  
  // Augmenter la limite de taille des requêtes Server Actions pour permettre l'import de fichiers Excel volumineux
  experimental: {
    serverActions: {
      bodySizeLimit: '100mb' // Augmenté à 100MB comme demandé
    }
  }
};

export default nextConfig;
