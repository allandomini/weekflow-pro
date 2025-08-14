import React, { useEffect, useMemo, useState } from 'react';
import { useAppContext } from '@/contexts/SupabaseAppContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Pause, Play, Square, Minimize2, Maximize2, X, Clock } from 'lucide-react';
import { useLocation } from 'react-router-dom';

export default function FloatingClockify() {
  const {
    clockifyTimeEntries,
    pauseClockifyTimer,
    resumeClockifyTimer,
    stopClockifyTimer,
  } = useAppContext();
  const location = useLocation();

  const [isOpen, setIsOpen] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);
  const [forceTick, setForceTick] = useState(0);

  const activeOrPaused = useMemo(() => {
    // Preferir ativo; se não houver, pegar o pausado mais recente
    const active = clockifyTimeEntries.find(e => e.status === 'active');
    if (active) return active;
    const paused = clockifyTimeEntries
      .filter(e => e.status === 'paused')
      .sort((a, b) => {
        const bTime = new Date((b as any).updatedAt || (b as any).endTime || (b as any).startTime).getTime();
        const aTime = new Date((a as any).updatedAt || (a as any).endTime || (a as any).startTime).getTime();
        return bTime - aTime;
      })[0];
    return paused || null;
  }, [clockifyTimeEntries, forceTick]);

  // Tick a cada segundo se houver ativo
  useEffect(() => {
    if (!activeOrPaused || activeOrPaused.status !== 'active') return;
    const id = setInterval(() => setForceTick(v => v + 1), 1000);
    return () => clearInterval(id);
  }, [activeOrPaused]);

  // Se não tem nada ativo nem pausado, não renderiza nada
  // Não mostrar na própria página do Clockify
  if (location.pathname.toLowerCase().includes('clockify')) return null;
  if (!activeOrPaused || !isOpen) return null;

  const getCurrentDuration = (entry: any) => {
    if (entry.status === 'active') {
      const now = new Date();
      const start = new Date(entry.startTime);
      return Math.floor((now.getTime() - start.getTime()) / 1000) + (entry.duration || 0);
    }
    return entry.duration || 0;
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePause = () => {
    if (activeOrPaused.status === 'active') {
      pauseClockifyTimer(activeOrPaused.id);
    }
  };

  const handleResume = () => {
    if (activeOrPaused.status === 'paused') {
      resumeClockifyTimer(activeOrPaused.id);
    }
  };

  const handleStop = () => {
    stopClockifyTimer(activeOrPaused.id);
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsMinimized(false)}
          className="rounded-full w-12 h-12 shadow-lg bg-primary hover:bg-primary/90"
          aria-label="Expandir Clockify"
        >
          <Maximize2 className="w-5 h-5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80">
      <Card className="shadow-2xl border-2 border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Clockify
              <Badge variant="outline" className="text-xs">
                {activeOrPaused.status === 'active' ? 'Ativo' : 'Pausado'}
              </Badge>
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMinimized(true)}
                className="h-8 w-8 p-0"
                aria-label="Minimizar"
              >
                <Minimize2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 p-0"
                aria-label="Fechar"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <div className="text-sm font-medium line-clamp-2" title={activeOrPaused.description}>
              {activeOrPaused.description || 'Tarefa em andamento'}
            </div>
            <div className="text-3xl font-mono font-bold text-primary">
              {formatDuration(getCurrentDuration(activeOrPaused))}
            </div>
          </div>

          <div className="flex gap-2 justify-center">
            {activeOrPaused.status === 'paused' ? (
              <Button onClick={handleResume} className="flex-1">
                <Play className="w-4 h-4 mr-2" />
                Continuar
              </Button>
            ) : (
              <Button onClick={handlePause} variant="outline" className="flex-1">
                <Pause className="w-4 h-4 mr-2" />
                Pausar
              </Button>
            )}
            <Button onClick={handleStop} variant="outline" className="flex-1">
              <Square className="w-4 h-4 mr-2" />
              Parar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
