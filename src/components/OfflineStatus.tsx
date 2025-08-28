import React from 'react';
import { useOffline } from '../hooks/useOffline';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { 
  Wifi, 
  WifiOff, 
  Download, 
  Smartphone, 
  RefreshCw,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export function OfflineStatus() {
  const { 
    isOnline, 
    isInstalled, 
    syncOfflineData, 
    installPWA 
  } = useOffline();

  if (isInstalled) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
          <CheckCircle className="w-3 h-3 mr-1" />
          PWA Instalado
        </Badge>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {/* Status de Conexão */}
      <div className="flex items-center gap-2">
        {isOnline ? (
          <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-200">
            <Wifi className="w-3 h-3 mr-1" />
            Online
          </Badge>
        ) : (
          <Badge variant="destructive">
            <WifiOff className="w-3 h-3 mr-1" />
            Offline
          </Badge>
        )}
      </div>

      {/* Botão de Instalação PWA */}
      <Button
        onClick={installPWA}
        size="sm"
        variant="outline"
        className="bg-white/90 backdrop-blur-sm shadow-lg hover:bg-white"
      >
        <Download className="w-4 h-4 mr-2" />
        Instalar App
      </Button>

      {/* Botão de Sincronização */}
      {!isOnline && (
        <Button
          onClick={syncOfflineData}
          size="sm"
          variant="outline"
          className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Sincronizar
        </Button>
      )}

      {/* Indicador de Modo Offline */}
      {!isOnline && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 max-w-xs">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-medium text-yellow-800">Modo Offline</p>
              <p className="text-yellow-700 mt-1">
                Suas alterações serão salvas localmente e sincronizadas quando voltar online.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
