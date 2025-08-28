import { useState, useEffect, useCallback } from 'react';

interface OfflineData {
  routines: any[];
  tasks: any[];
  projects: any[];
  routineCompletions: Record<string, Record<string, any>>;
}

interface UseOfflineReturn {
  isOnline: boolean;
  isInstalled: boolean;
  offlineData: OfflineData;
  saveOffline: (key: keyof OfflineData, data: any) => void;
  loadOffline: (key: keyof OfflineData) => any;
  syncOfflineData: () => Promise<void>;
  installPWA: () => Promise<void>;
}

export function useOffline(): UseOfflineReturn {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isInstalled, setIsInstalled] = useState(false);
  const [offlineData, setOfflineData] = useState<OfflineData>({
    routines: [],
    tasks: [],
    projects: [],
    routineCompletions: {}
  });

  // Verificar status online/offline
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Verificar se é PWA instalado
  useEffect(() => {
    const checkInstallation = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setIsInstalled(true);
      }
    };

    checkInstallation();
    window.addEventListener('resize', checkInstallation);

    return () => window.removeEventListener('resize', checkInstallation);
  }, []);

  // Carregar dados offline do localStorage
  useEffect(() => {
    const loadOfflineData = () => {
      try {
        const savedData = localStorage.getItem('weekflow-offline-data');
        if (savedData) {
          const parsed = JSON.parse(savedData);
          setOfflineData(parsed);
        }
      } catch (error) {
        // Silenciar erro de carregamento offline
      }
    };

    loadOfflineData();
  }, []);

  // Salvar dados offline
  const saveOffline = useCallback((key: keyof OfflineData, data: any) => {
    try {
      const newOfflineData = { ...offlineData, [key]: data };
      setOfflineData(newOfflineData);
      localStorage.setItem('weekflow-offline-data', JSON.stringify(newOfflineData));
    } catch (error) {
      // Silenciar erro de salvamento offline
    }
  }, [offlineData]);

  // Carregar dados offline
  const loadOffline = useCallback((key: keyof OfflineData) => {
    return offlineData[key];
  }, [offlineData]);

  // Sincronizar dados offline quando voltar online
  const syncOfflineData = useCallback(async () => {
    if (!isOnline) {
      return;
    }

    try {
      // Aqui você implementaria a lógica para enviar dados offline para o servidor
      // Por exemplo, enviar rotinas criadas offline, tarefas completadas, etc.
      
      // Limpar dados offline após sincronização bem-sucedida
      const emptyData: OfflineData = {
        routines: [],
        tasks: [],
        projects: [],
        routineCompletions: {}
      };
      setOfflineData(emptyData);
      localStorage.removeItem('weekflow-offline-data');
      
    } catch (error) {
      // Silenciar erro de sincronização
    }
  }, [isOnline]);

  // Instalar PWA
  const installPWA = useCallback(async () => {
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.register('/sw.js');
        
        // Solicitar instalação
        if ('BeforeInstallPromptEvent' in window) {
          const promptEvent = (window as any).deferredPrompt;
          if (promptEvent) {
            promptEvent.prompt();
            const result = await promptEvent.userChoice;
            if (result.outcome === 'accepted') {
              setIsInstalled(true);
            }
          }
        }
      }
    } catch (error) {
      // Silenciar erro de instalação PWA
    }
  }, []);

  return {
    isOnline,
    isInstalled,
    offlineData,
    saveOffline,
    loadOffline,
    syncOfflineData,
    installPWA
  };
}
