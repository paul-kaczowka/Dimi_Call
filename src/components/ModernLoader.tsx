import React from 'react';
import { motion } from 'framer-motion';

const ModernLoader: React.FC = () => {
  return (
    <motion.div 
      className="flex items-center justify-center min-h-screen bg-black"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
    >
      <div className="relative flex flex-col items-center justify-center">
        {/* Logo principal avec animation de pulsation */}

        {/* Anneaux rotatifs */}
        <div className="relative w-32 h-32 mb-8">
          {/* Anneau extérieur */}
          <motion.div
            className="absolute inset-0 border-2 border-cyan-400 rounded-full border-t-transparent"
            animate={{ rotate: 360 }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear",
            }}
          />
          
          {/* Anneau moyen */}
          <motion.div
            className="absolute inset-2 border-2 border-indigo-400 rounded-full border-r-transparent"
            animate={{ rotate: -360 }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "linear",
            }}
          />
          
          {/* Anneau intérieur */}
          <motion.div
            className="absolute inset-4 border-2 border-fuchsia-400 rounded-full border-b-transparent"
            animate={{ rotate: 360 }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "linear",
            }}
          />

          {/* Points orbitaux */}
          <motion.div
            className="absolute w-2 h-2 bg-cyan-400 rounded-full"
            style={{ 
              top: '-4px', 
              left: '50%', 
              marginLeft: '-4px',
              transformOrigin: '4px 68px'
            }}
            animate={{ rotate: 360 }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "linear",
            }}
          />
          
          <motion.div
            className="absolute w-2 h-2 bg-fuchsia-400 rounded-full"
            style={{ 
              bottom: '-4px', 
              right: '50%', 
              marginRight: '-4px',
              transformOrigin: '-4px -68px'
            }}
            animate={{ rotate: -360 }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "linear",
            }}
          />
        </div>

        {/* Texte avec animation */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <motion.h1
            className="text-3xl font-bold text-white mb-2"
            animate={{
              textShadow: [
                "0 0 10px rgba(59, 130, 246, 0.5)",
                "0 0 20px rgba(59, 130, 246, 0.8)",
                "0 0 10px rgba(59, 130, 246, 0.5)",
              ],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            DimiCall
          </motion.h1>
          
          <motion.p
            className="text-gray-400 text-lg"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 1, 0] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            Chargement en cours...
          </motion.p>
        </motion.div>

        {/* Particules flottantes */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-blue-400 rounded-full opacity-60"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [-20, -100],
                opacity: [0, 1, 0],
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
                ease: "easeOut",
              }}
            />
          ))}
        </div>

        {/* Barre de progression moderne */}
        <motion.div
          className="w-64 h-1 bg-gray-800 rounded-full overflow-hidden mt-8"
          initial={{ opacity: 0, width: 0 }}
          animate={{ opacity: 1, width: 256 }}
          transition={{ delay: 1, duration: 0.5 }}
        >
          <motion.div
            className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        </motion.div>
      </div>
    </motion.div>
  );
};

export default ModernLoader; 