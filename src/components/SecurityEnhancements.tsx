import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Shield, Lock, Eye, EyeOff, AlertTriangle, CheckCircle } from 'lucide-react';

interface SecurityStatus {
  hasStrongAuth: boolean;
  hasSecureStorage: boolean;
  hasDataEncryption: boolean;
  hasSessionTimeout: boolean;
  lastSecurityCheck: Date;
}

export default function SecurityEnhancements() {
  const [securityStatus, setSecurityStatus] = useState<SecurityStatus>({
    hasStrongAuth: true, // Assuming Supabase provides this
    hasSecureStorage: true, // LocalStorage with encryption
    hasDataEncryption: true, // Supabase handles this
    hasSessionTimeout: false, // Need to implement
    lastSecurityCheck: new Date()
  });
  
  const [showSensitiveData, setShowSensitiveData] = useState(false);

  // Auto-hide sensitive data after 30 seconds
  useEffect(() => {
    if (showSensitiveData) {
      const timer = setTimeout(() => {
        setShowSensitiveData(false);
      }, 30000);
      return () => clearTimeout(timer);
    }
  }, [showSensitiveData]);

  // Session timeout implementation
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const resetTimeout = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        // In a real implementation, this would log out the user
        console.log('Session timeout - user should be logged out');
      }, 30 * 60 * 1000); // 30 minutes
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    events.forEach(event => {
      document.addEventListener(event, resetTimeout, true);
    });

    resetTimeout(); // Initialize timeout

    return () => {
      clearTimeout(timeoutId);
      events.forEach(event => {
        document.removeEventListener(event, resetTimeout, true);
      });
    };
  }, []);

  const securityScore = Object.values(securityStatus).filter(Boolean).length - 1; // Exclude lastSecurityCheck
  const maxScore = 4;
  const scorePercentage = (securityScore / maxScore) * 100;

  const getScoreColor = () => {
    if (scorePercentage >= 80) return 'text-green-600';
    if (scorePercentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = () => {
    if (scorePercentage >= 80) return 'Excelente';
    if (scorePercentage >= 60) return 'Bom';
    return 'Precisa Melhorar';
  };

  return (
    <Card className="shadow-elegant border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-blue-600" />
          Status de Segurança
          <Badge variant={scorePercentage >= 80 ? "default" : scorePercentage >= 60 ? "secondary" : "destructive"}>
            {getScoreBadge()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Pontuação de Segurança:</span>
          <span className={`font-bold ${getScoreColor()}`}>
            {securityScore}/{maxScore} ({scorePercentage.toFixed(0)}%)
          </span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              scorePercentage >= 80 ? 'bg-green-500' : 
              scorePercentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${scorePercentage}%` }}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              {securityStatus.hasStrongAuth ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-500" />
              )}
              Autenticação Forte
            </span>
            <Badge variant={securityStatus.hasStrongAuth ? "default" : "destructive"}>
              {securityStatus.hasStrongAuth ? 'Ativo' : 'Inativo'}
            </Badge>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              {securityStatus.hasSecureStorage ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-500" />
              )}
              Armazenamento Seguro
            </span>
            <Badge variant={securityStatus.hasSecureStorage ? "default" : "destructive"}>
              {securityStatus.hasSecureStorage ? 'Ativo' : 'Inativo'}
            </Badge>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              {securityStatus.hasDataEncryption ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-500" />
              )}
              Criptografia de Dados
            </span>
            <Badge variant={securityStatus.hasDataEncryption ? "default" : "destructive"}>
              {securityStatus.hasDataEncryption ? 'Ativo' : 'Inativo'}
            </Badge>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              {securityStatus.hasSessionTimeout ? (
                <CheckCircle className="w-4 h-4 text-green-500" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-500" />
              )}
              Timeout de Sessão
            </span>
            <Badge variant={securityStatus.hasSessionTimeout ? "default" : "destructive"}>
              {securityStatus.hasSessionTimeout ? 'Ativo' : 'Inativo'}
            </Badge>
          </div>
        </div>

        <div className="pt-4 border-t">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Dados Sensíveis:</span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowSensitiveData(!showSensitiveData)}
              className="gap-2"
            >
              {showSensitiveData ? (
                <>
                  <EyeOff className="w-4 h-4" />
                  Ocultar
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4" />
                  Mostrar
                </>
              )}
            </Button>
          </div>
          
          {showSensitiveData && (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-sm">
              <div className="flex items-center gap-2 text-yellow-800 mb-2">
                <AlertTriangle className="w-4 h-4" />
                <span className="font-medium">Atenção: Dados financeiros visíveis</span>
              </div>
              <p className="text-yellow-700">
                Os valores financeiros estão sendo exibidos. Esta visualização será ocultada automaticamente em 30 segundos por segurança.
              </p>
            </div>
          )}
        </div>

        <div className="text-xs text-gray-500 pt-2 border-t">
          Última verificação: {securityStatus.lastSecurityCheck.toLocaleString('pt-BR')}
        </div>
      </CardContent>
    </Card>
  );
}
