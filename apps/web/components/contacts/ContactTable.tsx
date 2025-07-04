import React, { useCallback } from 'react';
import UploadDropZone from '../UploadDropZone';

const ContactTable = () => {
  const handleFileSelected = useCallback((file: File) => {
    console.log('Fichier sélectionné dans ContactTable simplifiée:', file);
    // Ici, vous pourriez appeler une fonction pour traiter le fichier
    // Par exemple : processFileForImport(file) si disponible dans le scope parent
  }, []);

  return (
    <div
      className={`relative p-4 border-2 border-dashed rounded-lg transition-all duration-300 ease-in-out border-gray-300 dark:border-gray-600`}
    >
      <UploadDropZone onFileSelected={handleFileSelected} />
    </div>
  );
};

export default ContactTable;
