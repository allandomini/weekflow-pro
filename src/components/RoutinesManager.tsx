import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from './ui/dialog';
import { Calendar } from './ui/calendar';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Trash2, Calendar as CalendarIcon, SkipForward, Pause, Play } from 'lucide-react';
import { Routine } from '../types';
import { useAppContext } from '../contexts/SupabaseAppContext';
import { format, addDays, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface RoutinesManagerProps {
  routine: Routine;
  onClose: () => void;
}

export default function RoutinesManager({ routine, onClose }: RoutinesManagerProps) {
  const { bulkDeleteRoutineOccurrences, bulkSkipRoutinePeriod, getRoutineOccurrences } = useAppContext();
  const [isOpen, setIsOpen] = useState(true);
  const [selectedDates, setSelectedDates] = useState<Date[]>([]);
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(addDays(new Date(), 7));
  const [operationType, setOperationType] = useState<'delete' | 'skip'>('delete');
  const [isLoading, setIsLoading] = useState(false);

  const handleClose = () => {
    setIsOpen(false);
    onClose();
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) return;
    
    setSelectedDates(prev => {
      const dateStr = date.toISOString().split('T')[0];
      const exists = prev.some(d => d.toISOString().split('T')[0] === dateStr);
      
      if (exists) {
        return prev.filter(d => d.toISOString().split('T')[0] !== dateStr);
      } else {
        return [...prev, date];
      }
    });
  };

  const handleBulkOperation = async () => {
    if (selectedDates.length === 0) return;
    
    setIsLoading(true);
    try {
      const dateStrings = selectedDates.map(d => d.toISOString().split('T')[0]);
      
      if (operationType === 'delete') {
        await bulkDeleteRoutineOccurrences(routine.id, dateStrings);
      } else {
        const minDate = new Date(Math.min(...selectedDates.map(d => d.getTime())));
        const maxDate = new Date(Math.max(...selectedDates.map(d => d.getTime())));
        await bulkSkipRoutinePeriod(routine.id, minDate.toISOString().split('T')[0], maxDate.toISOString().split('T')[0]);
      }
      
      setSelectedDates([]);
      handleClose();
    } catch (error) {
      console.error('Error performing bulk operation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getDateModifiers = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    const isSelected = selectedDates.some(d => d.toISOString().split('T')[0] === dateStr);
    
    return {
      selected: isSelected,
      className: isSelected ? 'bg-primary text-primary-foreground' : ''
    };
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5" />
            Gerenciar Rotina: {routine.name}
          </DialogTitle>
          <DialogDescription>
            Selecione as datas para realizar operações em massa nesta rotina.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Calendar Section */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Selecionar Datas</CardTitle>
              </CardHeader>
              <CardContent>
                <Calendar
                  mode="multiple"
                  selected={selectedDates}
                  onSelect={(dates) => setSelectedDates(dates || [])}
                  className="rounded-md border"
                  locale={ptBR}
                />
                
                <div className="mt-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedDates([])}
                      disabled={selectedDates.length === 0}
                    >
                      Limpar seleção
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      {selectedDates.length} data(s) selecionada(s)
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Operations Section */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Operações em Massa</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-foreground block mb-2">Tipo de Operação</Label>
                  <Select
                    value={operationType}
                    onValueChange={(value) => setOperationType(value as 'delete' | 'skip')}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="delete">
                        <div className="flex items-center gap-2">
                          <Trash2 className="w-4 h-4" />
                          Excluir ocorrências
                        </div>
                      </SelectItem>
                      <SelectItem value="skip">
                        <div className="flex items-center gap-2">
                          <SkipForward className="w-4 h-4" />
                          Pausar período
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {operationType === 'delete' && (
                  <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200 dark:border-red-800">
                    <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
                      <Trash2 className="w-5 h-5" />
                      <strong>Atenção:</strong>
                    </div>
                    <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                      Esta operação irá excluir permanentemente as ocorrências da rotina nas datas selecionadas.
                    </p>
                  </div>
                )}

                {operationType === 'skip' && (
                  <div className="p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <div className="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                      <Pause className="w-5 h-5" />
                      <strong>Pausar Período:</strong>
                    </div>
                    <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                      A rotina será pausada nas datas selecionadas. Você pode reativá-la posteriormente.
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-foreground block">Período de Referência</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs text-muted-foreground">Data Inicial</Label>
                      <Input
                        type="date"
                        value={startDate.toISOString().split('T')[0]}
                        onChange={(e) => setStartDate(new Date(e.target.value))}
                        className="text-sm"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Data Final</Label>
                      <Input
                        type="date"
                        value={endDate.toISOString().split('T')[0]}
                        onChange={(e) => setEndDate(new Date(e.target.value))}
                        className="text-sm"
                      />
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleBulkOperation}
                  disabled={selectedDates.length === 0 || isLoading}
                  className={`w-full ${
                    operationType === 'delete' 
                      ? 'bg-red-600 hover:bg-red-700' 
                      : 'bg-yellow-600 hover:bg-yellow-700'
                  }`}
                >
                  {isLoading ? (
                    'Processando...'
                  ) : operationType === 'delete' ? (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Excluir {selectedDates.length} ocorrência(s)
                    </>
                  ) : (
                    <>
                      <Pause className="w-4 h-4 mr-2" />
                      Pausar {selectedDates.length} dia(s)
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Routine Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informações da Rotina</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: routine.color }}
                  />
                  <span className="font-medium">{routine.name}</span>
                  <Badge variant="outline">{routine.priority}</Badge>
                </div>
                
                {routine.description && (
                  <p className="text-sm text-muted-foreground">{routine.description}</p>
                )}
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Vezes por dia:</span>
                    <span className="ml-2 font-medium">{routine.timesPerDay}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Duração:</span>
                    <span className="ml-2 font-medium">
                      {routine.durationDays ? `${routine.durationDays} dias` : 'Sempre'}
                    </span>
                  </div>
                </div>

                {routine.specificTimes && routine.specificTimes.length > 0 && (
                  <div>
                    <span className="text-sm text-muted-foreground">Horários:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {routine.specificTimes.map((time, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {time}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {routine.weekdays && routine.weekdays.length > 0 && (
                  <div>
                    <span className="text-sm text-muted-foreground">Dias da semana:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {routine.weekdays.map(day => (
                        <Badge key={day} variant="outline" className="text-xs">
                          {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][day]}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
