import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../contexts/SupabaseAppContext';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Checkbox } from '../components/ui/checkbox';
import RoutinesManager from '../components/RoutinesManager';

import { 
  ArrowLeft, Plus, Edit, Trash2, Settings, Calendar, Clock, 
  Repeat, Target, Play, Pause, SkipForward, MoreHorizontal 
} from 'lucide-react';
import { format } from 'date-fns';
import { Routine } from '../types';
import { ptBR } from 'date-fns/locale';

export default function Routines() {
  const navigate = useNavigate();
  const { routines, addRoutine, updateRoutine, hardDeleteRoutine, bulkDeleteRoutineOccurrences, bulkSkipRoutinePeriod } = useAppContext();
  const { toast } = useToast();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<Routine | null>(null);
  const [routinesManagerOpen, setRoutinesManagerOpen] = useState(false);
  const [selectedRoutine, setSelectedRoutine] = useState<Routine | null>(null);
  const [routineForm, setRoutineForm] = useState({
    name: '',
    description: '',
    color: '#3b82f6',
    timesPerDay: 1,
    specificTimes: [] as string[],
    weekdays: [] as number[],
    durationDays: null as number | null,
    priority: 'medium' as 'low' | 'medium' | 'high',
    activeFrom: format(new Date(), 'yyyy-MM-dd'),
    activeTo: '',
    pausedUntil: '',
  });

  const activeRoutines = routines.filter(r => !r.deletedAt);
  

  const handleCreateRoutine = () => {
    setEditingRoutine(null);
    setRoutineForm({
      name: '',
      description: '',
      color: '#3b82f6',
      timesPerDay: 1,
      specificTimes: [],
      weekdays: [],
      durationDays: null,
      priority: 'medium',
      activeFrom: format(new Date(), 'yyyy-MM-dd'),
      activeTo: '',
      pausedUntil: '',
    });
    setIsCreateDialogOpen(true);
  };

  const handleEditRoutine = (routine: Routine) => {
    setEditingRoutine(routine);
    setRoutineForm({
      name: routine.name,
      description: routine.description || '',
      color: routine.color,
      timesPerDay: routine.timesPerDay,
      specificTimes: routine.specificTimes || [],
      weekdays: routine.weekdays || [],
      durationDays: routine.durationDays,
      priority: routine.priority,
      activeFrom: routine.activeFrom,
      activeTo: routine.activeTo || '',
      pausedUntil: routine.pausedUntil || '',
    });
    setIsCreateDialogOpen(true);
  };

  const handleSaveRoutine = async () => {
    if (!routineForm.name.trim()) return;

    try {
      if (editingRoutine) {
        await updateRoutine(editingRoutine.id, {
          name: routineForm.name,
          description: routineForm.description,
          color: routineForm.color,
          timesPerDay: routineForm.timesPerDay,
          specificTimes: routineForm.specificTimes,
          weekdays: routineForm.weekdays,
          durationDays: routineForm.durationDays,
          priority: routineForm.priority,
          activeFrom: routineForm.activeFrom,
          activeTo: routineForm.activeTo || undefined,
          pausedUntil: routineForm.pausedUntil || undefined,
        });
      } else {
        await addRoutine({
          name: routineForm.name,
          description: routineForm.description,
          color: routineForm.color,
          timesPerDay: routineForm.timesPerDay,
          specificTimes: routineForm.specificTimes,
          weekdays: routineForm.weekdays,
          durationDays: routineForm.durationDays,
          priority: routineForm.priority,
          schedule: {},
          activeFrom: routineForm.activeFrom,
          activeTo: routineForm.activeTo || undefined,
          pausedUntil: routineForm.pausedUntil || undefined,
        });
      }
      
      setIsCreateDialogOpen(false);
      setEditingRoutine(null);
    } catch (error) {
      console.error('Error saving routine:', error);
    }
  };

  const handleDeleteRoutine = async (routine: Routine) => {
    if (confirm(`Tem certeza que deseja excluir a rotina "${routine.name}"?`)) {
      try {
        await hardDeleteRoutine(routine.id);
        toast({
          title: "Rotina excluída",
          description: "A rotina foi excluída permanentemente.",
        });
      } catch (error) {
        console.error('Error deleting routine:', error);
      }
    }
  };

  const handleOpenRoutinesManager = (routine: Routine) => {
    setSelectedRoutine(routine);
    setRoutinesManagerOpen(true);
  };

  const handleCloseRoutinesManager = () => {
    setRoutinesManagerOpen(false);
    setSelectedRoutine(null);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getStatusBadge = (routine: Routine) => {
    if (routine.pausedUntil && routine.pausedUntil > format(new Date(), 'yyyy-MM-dd')) {
      return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">Pausada</Badge>;
    }
    if (routine.activeTo && routine.activeTo < format(new Date(), 'yyyy-MM-dd')) {
      return <Badge variant="outline" className="text-muted-foreground">Expirada</Badge>;
    }
    return <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Ativa</Badge>;
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between animate-fade-in-left">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/')}
            className="hover:scale-105 active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground transition-colors duration-200">Gerenciar Rotinas</h1>
            <p className="text-muted-foreground transition-colors duration-200">
              Configure e gerencie suas rotinas diárias
            </p>
          </div>
        </div>
        <Button 
          variant="default" 
          onClick={handleCreateRoutine} 
          className="bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 hover:scale-105 active:scale-95 shadow-soft hover:shadow-medium"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nova Rotina
        </Button>
      </div>

      {/* Routines Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {activeRoutines.map((routine) => (
          <Card key={routine.id} className="modern-card hover:shadow-medium transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: routine.color }}
                  />
                  <div>
                    <CardTitle className="text-lg font-semibold text-foreground">{routine.name}</CardTitle>
                    {routine.description && (
                      <p className="text-sm text-muted-foreground mt-1">{routine.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(routine)}
                  <Badge className={getPriorityColor(routine.priority)}>
                    {routine.priority === 'high' ? 'Alta' : routine.priority === 'medium' ? 'Média' : 'Baixa'}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Routine Details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Meta:</span>
                  <span className="font-medium">{routine.timesPerDay}x/dia</span>
                </div>
                
                {routine.durationDays && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Duração:</span>
                    <span className="font-medium">{routine.durationDays} dias</span>
                  </div>
                )}
              </div>

              {/* Specific Times */}
              {routine.specificTimes && routine.specificTimes.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Horários:</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {routine.specificTimes.map((time, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {time}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Weekdays */}
              {routine.weekdays && routine.weekdays.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Repeat className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">Dias:</span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {routine.weekdays.map(day => (
                      <Badge key={day} variant="outline" className="text-xs">
                        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'][day]}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleEditRoutine(routine)}
                  className="flex-1 transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Editar
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleOpenRoutinesManager(routine)}
                  className="flex-1 transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Gerenciar
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDeleteRoutine(routine)}
                  className="text-destructive hover:bg-destructive/10 transition-all duration-200 hover:scale-105 active:scale-95"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {activeRoutines.length === 0 && (
        <Card className="modern-card text-center py-12">
          <CardContent>
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                <Repeat className="w-8 h-8 text-muted-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">Nenhuma rotina criada</h3>
                <p className="text-muted-foreground">
                  Crie sua primeira rotina para começar a organizar suas atividades diárias.
                </p>
              </div>
              <Button onClick={handleCreateRoutine} className="mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Criar Primeira Rotina
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Routine Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingRoutine ? 'Editar Rotina' : 'Nova Rotina'}
            </DialogTitle>
            <DialogDescription>
              {editingRoutine 
                ? 'Edite as configurações da sua rotina.' 
                : 'Configure uma nova rotina com horários específicos e dias da semana.'
              }
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name" className="text-foreground">Nome da Rotina</Label>
                <Input
                  id="name"
                  value={routineForm.name}
                  onChange={(e) => setRoutineForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Beber água"
                  className="modern-input"
                />
              </div>
              <div>
                <Label htmlFor="color" className="text-foreground">Cor</Label>
                <Input
                  id="color"
                  type="color"
                  value={routineForm.color}
                  onChange={(e) => setRoutineForm(prev => ({ ...prev, color: e.target.value }))}
                  className="modern-input h-10"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description" className="text-foreground">Descrição</Label>
              <Textarea
                id="description"
                value={routineForm.description}
                onChange={(e) => setRoutineForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descrição opcional da rotina"
                className="modern-input"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="timesPerDay" className="text-foreground">Vezes por dia</Label>
                <Input
                  id="timesPerDay"
                  type="number"
                  min={1}
                  max={10}
                  value={routineForm.timesPerDay}
                  onChange={(e) => setRoutineForm(prev => ({ ...prev, timesPerDay: Number(e.target.value) }))}
                  className="modern-input"
                />
              </div>
              <div>
                <Label htmlFor="priority" className="text-foreground">Prioridade</Label>
                <Select
                  value={routineForm.priority}
                  onValueChange={(value) => setRoutineForm(prev => ({ ...prev, priority: value as "low" | "medium" | "high" }))}
                >
                  <SelectTrigger className="modern-input">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="modern-dropdown">
                    <SelectItem value="low">Baixa</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="durationDays" className="text-foreground">Duração (dias)</Label>
              <Input
                id="durationDays"
                type="number"
                min={1}
                placeholder="Deixe vazio para sempre"
                value={routineForm.durationDays || ''}
                onChange={(e) => setRoutineForm(prev => ({ ...prev, durationDays: e.target.value ? Number(e.target.value) : null }))}
                className="modern-input"
              />
            </div>

            <div>
              <Label className="text-foreground block mb-2">Horários específicos</Label>
              <div className="space-y-2">
                {routineForm.specificTimes.map((time, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      type="time"
                      value={time}
                      onChange={(e) => {
                        const newTimes = [...routineForm.specificTimes];
                        newTimes[index] = e.target.value;
                        setRoutineForm(prev => ({ ...prev, specificTimes: newTimes }));
                      }}
                      className="modern-input flex-1"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newTimes = routineForm.specificTimes.filter((_, i) => i !== index);
                        setRoutineForm(prev => ({ ...prev, specificTimes: newTimes }));
                      }}
                      className="text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setRoutineForm(prev => ({ ...prev, specificTimes: [...prev.specificTimes, '09:00'] }))}
                  className="w-full"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar horário
                </Button>
              </div>
            </div>

            <div>
              <Label className="text-foreground block mb-2">Dias da semana</Label>
              <div className="grid grid-cols-7 gap-2">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((day, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Checkbox
                      id={`weekday-${index}`}
                      checked={routineForm.weekdays.includes(index)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setRoutineForm(prev => ({ ...prev, weekdays: [...prev.weekdays, index] }));
                        } else {
                          setRoutineForm(prev => ({ ...prev, weekdays: prev.weekdays.filter(d => d !== index) }));
                        }
                      }}
                      className="transition-all duration-200 hover:scale-110"
                    />
                    <Label htmlFor={`weekday-${index}`} className="text-xs text-center">{day}</Label>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {routineForm.weekdays.length === 0 ? 'Selecione para todos os dias' : 
                 routineForm.weekdays.length === 7 ? 'Todos os dias selecionados' :
                 `${routineForm.weekdays.length} dia(s) selecionado(s)`}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="activeFrom" className="text-foreground">Data de início</Label>
                <Input
                  id="activeFrom"
                  type="date"
                  value={routineForm.activeFrom}
                  onChange={(e) => setRoutineForm(prev => ({ ...prev, activeFrom: e.target.value }))}
                  className="modern-input"
                />
              </div>
              <div>
                <Label htmlFor="activeTo" className="text-foreground">Data de fim (opcional)</Label>
                <Input
                  id="activeTo"
                  type="date"
                  value={routineForm.activeTo}
                  onChange={(e) => setRoutineForm(prev => ({ ...prev, activeTo: e.target.value }))}
                  className="modern-input"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                onClick={handleSaveRoutine} 
                className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90 transition-all duration-200 hover:scale-105 active:scale-95 shadow-soft hover:shadow-medium"
              >
                {editingRoutine ? 'Salvar Alterações' : 'Criar Rotina'}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsCreateDialogOpen(false)}
                className="transition-all duration-200 hover:scale-105 active:scale-95 hover:bg-accent"
              >
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Routines Manager Modal */}
      {routinesManagerOpen && selectedRoutine && (
        <RoutinesManager
          routine={selectedRoutine}
          onClose={handleCloseRoutinesManager}
        />
      )}
    </div>
  );
}
