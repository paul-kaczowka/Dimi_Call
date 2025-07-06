import { useState, useEffect, useCallback } from 'react'

interface UpdateInfo {
  version: string
  releaseDate?: string
  releaseName?: string
  releaseNotes?: string
}

interface UpdateState {
  checking: boolean
  available: boolean
  downloading: boolean
  downloaded: boolean
  error: string | null
  progress: number
  updateInfo: UpdateInfo | null
}

interface UseAutoUpdateResult {
  updateState: UpdateState
  checkForUpdates: () => Promise<void>
  installUpdate: () => Promise<void>
}

export const useAutoUpdate = (): UseAutoUpdateResult => {
  const [updateState, setUpdateState] = useState<UpdateState>({
    checking: false,
    available: false,
    downloading: false,
    downloaded: false,
    error: null,
    progress: 0,
    updateInfo: null
  })

  // Initialiser l'état depuis le main process
  useEffect(() => {
    const initializeUpdateState = async () => {
      if (window.electronAPI?.getUpdateStatus) {
        try {
          const status = await window.electronAPI.getUpdateStatus()
          setUpdateState(prev => ({
            ...prev,
            available: status.updateAvailable,
            downloaded: status.updateDownloaded,
            updateInfo: status.updateInfo
          }))
        } catch (error) {
          console.error('Erreur lors de l\'initialisation de l\'état de mise à jour:', error)
        }
      }
    }

    initializeUpdateState()
  }, [])

  // Configurer les listeners pour les événements de mise à jour
  useEffect(() => {
    if (!window.electronAPI) return

    const handleUpdateChecking = () => {
      setUpdateState(prev => ({
        ...prev,
        checking: true,
        error: null
      }))
    }

    const handleUpdateAvailable = (updateInfo: UpdateInfo) => {
      setUpdateState(prev => ({
        ...prev,
        checking: false,
        available: true,
        downloading: true,
        updateInfo
      }))
    }

    const handleUpdateNotAvailable = () => {
      setUpdateState(prev => ({
        ...prev,
        checking: false,
        available: false,
        downloading: false,
        downloaded: false,
        updateInfo: null
      }))
    }

    const handleUpdateError = (error: string) => {
      setUpdateState(prev => ({
        ...prev,
        checking: false,
        downloading: false,
        error
      }))
    }

    const handleDownloadProgress = (progress: { percent: number }) => {
      setUpdateState(prev => ({
        ...prev,
        progress: Math.round(progress.percent)
      }))
    }

    const handleUpdateDownloaded = (updateInfo: UpdateInfo) => {
      setUpdateState(prev => ({
        ...prev,
        downloading: false,
        downloaded: true,
        progress: 100,
        updateInfo
      }))
    }

    // Enregistrer les listeners
    window.electronAPI.onUpdateChecking(handleUpdateChecking)
    window.electronAPI.onUpdateAvailable(handleUpdateAvailable)
    window.electronAPI.onUpdateNotAvailable(handleUpdateNotAvailable)
    window.electronAPI.onUpdateError(handleUpdateError)
    window.electronAPI.onUpdateDownloadProgress(handleDownloadProgress)
    window.electronAPI.onUpdateDownloaded(handleUpdateDownloaded)

    // Note: Les listeners electron ne sont pas nettoyés ici car electron-preload
    // ne fournit pas de méthode pour les supprimer facilement
    // et ils seront nettoyés automatiquement lors du rechargement de la page
  }, [])

  const checkForUpdates = useCallback(async () => {
    if (!window.electronAPI?.checkForUpdates) {
      console.warn('API de mise à jour non disponible')
      return
    }

    try {
      const result = await window.electronAPI.checkForUpdates()
      if (result.status === 'error') {
        setUpdateState(prev => ({ ...prev, error: result.message }))
      }
    } catch (error) {
      console.error('Erreur lors de la vérification des mises à jour:', error)
      setUpdateState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      }))
    }
  }, [])

  const installUpdate = useCallback(async () => {
    if (!window.electronAPI?.installUpdate) {
      console.warn('API d\'installation de mise à jour non disponible')
      return
    }

    if (!updateState.downloaded) {
      console.warn('Aucune mise à jour téléchargée disponible')
      return
    }

    try {
      const result = await window.electronAPI.installUpdate()
      if (!result.success) {
        setUpdateState(prev => ({ 
          ...prev, 
          error: result.message || 'Erreur lors de l\'installation' 
        }))
      }
    } catch (error) {
      console.error('Erreur lors de l\'installation de la mise à jour:', error)
      setUpdateState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Erreur inconnue' 
      }))
    }
  }, [updateState.downloaded])

  return {
    updateState,
    checkForUpdates,
    installUpdate
  }
} 