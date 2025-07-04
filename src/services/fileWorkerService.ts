import { Contact } from '../types';
import Papa from 'papaparse';

export interface FileProcessingProgress {
  percentage: number;
  message: string;
  processedRows?: number;
  totalRows?: number;
}

export interface FileProcessingResult {
  success: boolean;
  data?: Contact[];
  error?: string;
  totalProcessed?: number;
}

// Worker pour traitement CSV avec PapaParse
const createCsvWorker = () => {
  const workerCode = `
    importScripts('https://esm.sh/papaparse@^5.5.3');
    
    self.onmessage = function(e) {
      const { file, options } = e.data;
      
      let processedRows = 0;
      let totalRows = 0;
      
      Papa.parse(file, {
        ...options,
        worker: false, // Déjà dans un worker
        step: function(result, parser) {
          processedRows++;
          
          // Envoyer le progrès toutes les 100 lignes
          if (processedRows % 100 === 0) {
            self.postMessage({
              type: 'progress',
              data: {
                percentage: totalRows > 0 ? Math.round((processedRows / totalRows) * 100) : 0,
                message: \`Traitement ligne \${processedRows}...\`,
                processedRows,
                totalRows
              }
            });
          }
        },
        complete: function(results) {
          self.postMessage({
            type: 'complete',
            data: {
              success: true,
              data: results.data,
              totalProcessed: processedRows
            }
          });
        },
        error: function(error) {
          self.postMessage({
            type: 'error',
            data: {
              success: false,
              error: error.message
            }
          });
        }
      });
    };
  `;
  
  const blob = new Blob([workerCode], { type: 'application/javascript' });
  return new Worker(URL.createObjectURL(blob));
};

// Worker pour traitement Excel avec SheetJS
const createExcelWorker = () => {
  const workerCode = `
    importScripts('https://cdn.sheetjs.com/xlsx-0.20.3/package/dist/xlsx.full.min.js');
    
    self.onmessage = function(e) {
      const { arrayBuffer, options } = e.data;
      
      try {
        self.postMessage({
          type: 'progress',
          data: {
            percentage: 25,
            message: 'Lecture du fichier Excel...'
          }
        });
        
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        
        self.postMessage({
          type: 'progress',
          data: {
            percentage: 50,
            message: 'Analyse des feuilles...'
          }
        });
        
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        self.postMessage({
          type: 'progress',
          data: {
            percentage: 75,
            message: 'Conversion en JSON...'
          }
        });
        
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
          header: 1,
          defval: '',
          ...options 
        });
        
        self.postMessage({
          type: 'complete',
          data: {
            success: true,
            data: jsonData,
            totalProcessed: jsonData.length
          }
        });
        
      } catch (error) {
        self.postMessage({
          type: 'error',
          data: {
            success: false,
            error: error.message
          }
        });
      }
    };
  `;
  
  const blob = new Blob([workerCode], { type: 'application/javascript' });
  return new Worker(URL.createObjectURL(blob));
};

class FileWorkerService {
  private activeWorkers: Set<Worker> = new Set();

  // Importer un fichier CSV avec Web Worker
  async importCsvFile(
    file: File,
    onProgress?: (progress: FileProcessingProgress) => void
  ): Promise<FileProcessingResult> {
    return new Promise((resolve) => {
      // Pour les fichiers volumineux, utiliser un traitement optimisé
      const fileSizeMB = file.size / (1024 * 1024);
      
      if (fileSizeMB > 10) {
        // Import optimisé pour gros fichiers
        this.importLargeCsvFile(file, onProgress).then(resolve);
        return;
      }

      const worker = createCsvWorker();
      this.activeWorkers.add(worker);

      worker.onmessage = (e) => {
        const { type, data } = e.data;

        switch (type) {
          case 'progress':
            onProgress?.(data);
            break;
          
          case 'complete':
          case 'error':
            this.cleanupWorker(worker);
            resolve(data);
            break;
        }
      };

      worker.onerror = (error) => {
        this.cleanupWorker(worker);
        resolve({
          success: false,
          error: `Erreur du worker: ${error.message}`
        });
      };

      // Démarrer le traitement
      worker.postMessage({
        file,
        options: {
          header: true,
          skipEmptyLines: true,
          transformHeader: (header: string) => header.trim(),
        }
      });
    });
  }

  // Méthode optimisée pour les gros fichiers CSV
  private async importLargeCsvFile(
    file: File,
    onProgress?: (progress: FileProcessingProgress) => void
  ): Promise<FileProcessingResult> {
    return new Promise((resolve) => {
      const contacts: any[] = [];
      let processedRows = 0;
      let totalRows = 0;
      let hasError = false;

      onProgress?.({
        percentage: 0,
        message: `Analyse du fichier (${(file.size / (1024 * 1024)).toFixed(1)} MB)...`,
        processedRows: 0,
        totalRows: 0
      });

      // Utilisation de Papa Parse avec streaming
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        chunkSize: 1024 * 512, // 512KB chunks pour optimiser la performance
        chunk: (results: any, parser: any) => {
          if (hasError) return;

          try {
            // Traiter chaque chunk
            const chunkContacts = results.data.map((row: any) => {
              processedRows++;
              return {
                id: `temp_${processedRows}`,
                numeroLigne: processedRows,
                prenom: row['Prénom'] || row['prenom'] || row['Prenom'] || '',
                nom: row['Nom'] || row['nom'] || '',
                telephone: row['Numéro'] || row['Téléphone'] || row['telephone'] || row['numero'] || '',
                email: row['mail'] || row['Email'] || row['email'] || '',
                source: row['École'] || row['ecole'] || row['source'] || '',
                statut: row.statut || 'Non défini',
                commentaire: row.commentaire || '',
                dateRappel: row.dateRappel || '',
                heureRappel: row.heureRappel || '',
                dateRDV: row.dateRDV || '',
                heureRDV: row.heureRDV || '',
                dateAppel: row.dateAppel || '',
                heureAppel: row.heureAppel || '',
                dureeAppel: row.dureeAppel || '',
              };
            });

            contacts.push(...chunkContacts);

            // Mise à jour du progrès
            const estimatedTotal = totalRows || Math.floor(file.size / 100); // Estimation approximative
            const percentage = Math.min(Math.floor((processedRows / estimatedTotal) * 80), 80);
            
            onProgress?.({
              percentage,
              message: `Traitement en cours... ${processedRows.toLocaleString()} lignes`,
              processedRows,
              totalRows: estimatedTotal
            });

            // Pause pour ne pas bloquer l'UI
            if (processedRows % 1000 === 0) {
              setTimeout(() => {
                // Continue processing
              }, 5);
            }
            
          } catch (error) {
            hasError = true;
            parser.abort();
            resolve({
              success: false,
              error: `Erreur lors du traitement: ${error}`
            });
          }
        },
        complete: (results: any) => {
          if (hasError) return;

          try {
            onProgress?.({
              percentage: 100,
              message: `✅ Import terminé: ${contacts.length.toLocaleString()} contacts traités`,
              processedRows: contacts.length,
              totalRows: contacts.length
            });

            resolve({
              success: true,
              data: contacts,
              totalProcessed: contacts.length
            });
          } catch (error) {
            resolve({
              success: false,
              error: `Erreur lors de la finalisation: ${error}`
            });
          }
        },
        error: (error: any) => {
          if (hasError) return;
          hasError = true;
          resolve({
            success: false,
            error: `Erreur Papa Parse: ${error.message || error}`
          });
        },
        transformHeader: (header: string) => header.trim()
      });
    });
  }

  // Importer un fichier Excel avec Web Worker
  async importExcelFile(
    file: File,
    onProgress?: (progress: FileProcessingProgress) => void
  ): Promise<FileProcessingResult> {
    return new Promise((resolve) => {
      const worker = createExcelWorker();
      this.activeWorkers.add(worker);

      worker.onmessage = (e) => {
        const { type, data } = e.data;

        switch (type) {
          case 'progress':
            onProgress?.(data);
            break;
          
          case 'complete':
          case 'error':
            this.cleanupWorker(worker);
            resolve(data);
            break;
        }
      };

      worker.onerror = (error) => {
        this.cleanupWorker(worker);
        resolve({
          success: false,
          error: `Erreur du worker: ${error.message}`
        });
      };

      // Lire le fichier en ArrayBuffer
      const reader = new FileReader();
      reader.onload = (e) => {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        worker.postMessage({
          arrayBuffer,
          options: {
            raw: false,
            dateNF: 'yyyy-mm-dd'
          }
        });
      };

      reader.onerror = () => {
        this.cleanupWorker(worker);
        resolve({
          success: false,
          error: 'Erreur lors de la lecture du fichier'
        });
      };

      reader.readAsArrayBuffer(file);
    });
  }

  // Exporter des contacts vers CSV avec streaming
  async exportToCsv(
    contacts: Contact[],
    onProgress?: (progress: FileProcessingProgress) => void
  ): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const worker = createCsvWorker();
      this.activeWorkers.add(worker);

      const csvHeaders = [
        'Prénom', 'Nom', 'Téléphone', 'Email', 'École/Source', 'Statut',
        'Commentaire', 'Date Rappel', 'Heure Rappel', 'Date RDV', 'Heure RDV',
        'Date Appel', 'Heure Appel', 'Durée Appel'
      ];

      const csvData = contacts.map(contact => [
        contact.prenom,
        contact.nom,
        contact.telephone,
        contact.email,
        contact.ecole,
        contact.statut,
        contact.commentaire,
        contact.dateRappel,
        contact.heureRappel,
        contact.dateRDV,
        contact.heureRDV,
        contact.dateAppel,
        contact.heureAppel,
        contact.dureeAppel
      ]);

      // Ajouter les en-têtes
      const allData = [csvHeaders, ...csvData];

      // Simuler le traitement par chunks pour le progrès
      let processedChunks = 0;
      const totalChunks = Math.ceil(allData.length / 1000);

      const processChunk = () => {
        processedChunks++;
        const percentage = Math.round((processedChunks / totalChunks) * 100);
        
        onProgress?({
          percentage,
          message: `Export en cours... ${processedChunks}/${totalChunks} chunks`,
          processedRows: processedChunks * 1000,
          totalRows: allData.length
        });

        if (processedChunks < totalChunks) {
          setTimeout(processChunk, 10); // Petit délai pour ne pas bloquer l'UI
        } else {
          // Créer le CSV final
          const csvContent = allData.map(row => 
            row.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
          ).join('\n');

          const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
          this.cleanupWorker(worker);
          resolve(blob);
        }
      };

      processChunk();
    });
  }

  // Exporter des contacts vers Excel avec streaming
  async exportToExcel(
    contacts: Contact[],
    onProgress?: (progress: FileProcessingProgress) => void
  ): Promise<Blob> {
    return new Promise((resolve) => {
      const worker = createExcelWorker();
      this.activeWorkers.add(worker);

      // Préparer les données pour Excel
      const excelData = contacts.map(contact => ({
        'Prénom': contact.prenom,
        'Nom': contact.nom,
        'Téléphone': contact.telephone,
        'Email': contact.email,
        'École/Source': contact.ecole,
        'Statut': contact.statut,
        'Commentaire': contact.commentaire,
        'Date Rappel': contact.dateRappel,
        'Heure Rappel': contact.heureRappel,
        'Date RDV': contact.dateRDV,
        'Heure RDV': contact.heureRDV,
        'Date Appel': contact.dateAppel,
        'Heure Appel': contact.heureAppel,
        'Durée Appel': contact.dureeAppel
      }));

      // Simuler le progrès
      onProgress?.({ percentage: 25, message: 'Préparation des données...' });
      
      setTimeout(() => {
        onProgress?.({ percentage: 50, message: 'Création du classeur Excel...' });
        
        setTimeout(() => {
          onProgress?.({ percentage: 75, message: 'Génération du fichier...' });
          
          setTimeout(() => {
            // Utiliser une approche simplifiée pour l'export Excel
            // En production, vous utiliseriez le worker pour les gros fichiers
            import('xlsx').then(XLSX => {
              const worksheet = XLSX.utils.json_to_sheet(excelData);
              const workbook = XLSX.utils.book_new();
              XLSX.utils.book_append_sheet(workbook, worksheet, 'Contacts');
              
              const excelBuffer = XLSX.write(workbook, { 
                bookType: 'xlsx', 
                type: 'array' 
              });
              
              const blob = new Blob([excelBuffer], { 
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
              });
              
              this.cleanupWorker(worker);
              resolve(blob);
            });
          }, 100);
        }, 100);
      }, 100);
    });
  }

  // Nettoyer un worker
  private cleanupWorker(worker: Worker) {
    worker.terminate();
    this.activeWorkers.delete(worker);
  }

  // Nettoyer tous les workers actifs
  cleanup() {
    this.activeWorkers.forEach(worker => {
      worker.terminate();
    });
    this.activeWorkers.clear();
  }
}

// Instance singleton
export const fileWorkerService = new FileWorkerService(); 