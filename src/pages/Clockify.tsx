import React, { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { ClockifyTimeEntry } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Clock, Play, Square, Plus, Edit, Trash2, DollarSign, Tag, User, FolderOpen, Pause, Users } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function Clockify() {
  const {
    clockifyTimeEntries,
    projects,
    contacts,
    addClockifyTimeEntry,
    updateClockifyTimeEntry,
    deleteClockifyTimeEntry,
    startClockifyTimer,
    stopClockifyTimer,
    pauseClockifyTimer,
    resumeClockifyTimer
  } = useApp();

  const [activeTimer, setActiveTimer] = useState<string | null>(null);
  const [timerStart, setTimerStart] = useState<Date | null>(null);
  const [forceUpdate, setForceUpdate] = useState(0);
  const [newEntry, setNewEntry] = useState({
    description: '',
    projectId: '',
    personIds: [] as string[],
    billable: false,
    hourlyRate: 0,
    tags: [] as string[]
  });

  const [newTag, setNewTag] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  // Tags padrão para categorizar pessoas
  const defaultTags = ['cliente', 'apoio', 'devedor', 'fornecedor', 'parceiro', 'funcionário'];

  // Atualizar timer a cada segundo
  useEffect(() => {
    if (activeTimer) {
      const interval = setInterval(() => {
        setForceUpdate(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [activeTimer]);

  // Restaurar timer ativo ao carregar/alterar entradas
  useEffect(() => {
    const active = clockifyTimeEntries.find(e => e.status === 'active');
    if (active) {
      setActiveTimer(active.id);
      if (active.startTime) {
        setTimerStart(new Date(active.startTime));
      }
    } else {
      setActiveTimer(null);
      setTimerStart(null);
    }
  }, [clockifyTimeEntries]);

  const startTimer = (entry: Partial<ClockifyTimeEntry>) => {
    if (activeTimer) return;
    
    const newEntry: Omit<ClockifyTimeEntry, 'id' | 'createdAt' | 'updatedAt'> = {
      description: entry.description || 'Tarefa em andamento',
      projectId: entry.projectId || '',
      personIds: entry.personIds || [],
      startTime: new Date(),
      endTime: undefined,
      duration: 0,
      billable: entry.billable || false,
      hourlyRate: entry.hourlyRate || 0,
      tags: entry.tags || [],
      status: 'active'
    };

    const entryId = startClockifyTimer(newEntry);
    setActiveTimer(entryId);
    setTimerStart(new Date());
  };

  const stopTimer = (id?: string) => {
    const targetId = id || activeTimer;
    if (!targetId) return;
    stopClockifyTimer(targetId);
    if (targetId === activeTimer) {
      setActiveTimer(null);
      setTimerStart(null);
    }
  };

  const pauseTimer = (id?: string) => {
    const targetId = id || activeTimer;
    if (!targetId) return;
    pauseClockifyTimer(targetId);
    if (targetId === activeTimer) {
      setActiveTimer(null);
      setTimerStart(null);
    }
  };

  const resumeTimer = (id: string) => {
    if (!id) return;
    resumeClockifyTimer(id);
    setActiveTimer(id);
    setTimerStart(new Date());
  };

  // Função para calcular duração em tempo real
  const getCurrentDuration = (entry: ClockifyTimeEntry) => {
    if (entry.status === 'active') {
      const now = new Date();
      const start = new Date(entry.startTime);
      // Somar duração acumulada com a sessão atual
      return (entry.duration || 0) + Math.floor((now.getTime() - start.getTime()) / 1000);
    }
    return entry.duration || 0;
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTotalBillable = () => {
    return clockifyTimeEntries
      .filter(entry => entry.billable && entry.hourlyRate && entry.duration)
      .reduce((total, entry) => {
        const hours = entry.duration / 3600;
        return total + (hours * (entry.hourlyRate || 0));
      }, 0);
  };

  const getProjectById = (id: string) => projects.find(p => p.id === id);
  const getPersonById = (id: string) => contacts.find(c => c.id === id);

  const addTag = () => {
    if (newTag.trim() && !selectedTags.includes(newTag.trim())) {
      setSelectedTags([...selectedTags, newTag.trim()]);
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setSelectedTags(selectedTags.filter(t => t !== tag));
  };

  const getPersonTags = (personId: string) => {
    const person = getPersonById(personId);
    if (!person) return [];
    
    // Lógica para determinar tags baseada nas informações da pessoa
    const tags = [];
    if (person.skills.includes('cliente')) tags.push('cliente');
    if (person.skills.includes('apoio')) tags.push('apoio');
    if (person.skills.includes('devedor')) tags.push('devedor');
    return tags;
  };

  const getActiveEntries = () => clockifyTimeEntries.filter(entry => entry.status === 'active');
  const getCompletedEntries = () => clockifyTimeEntries.filter(entry => entry.status === 'completed');

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Clockify</h1>
          <p className="text-muted-foreground">Controle de tempo integrado com projetos e pessoas</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            <DollarSign className="w-3 h-3 mr-1" />
            R$ {getTotalBillable().toFixed(2)}
          </Badge>
        </div>
      </div>

      <Tabs defaultValue="timer" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="timer">Timer</TabsTrigger>
          <TabsTrigger value="entries">Entradas</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Timer Tab */}
        <TabsContent value="timer" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Timer Ativo
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {activeTimer ? (
                <div className="text-center space-y-4">
                  <div className="text-4xl font-mono font-bold text-primary">
                    {(() => {
                      const entry = clockifyTimeEntries.find(e => e.id === activeTimer);
                      if (!entry) return '00:00:00';
                      const duration = getCurrentDuration(entry);
                      return formatDuration(duration);
                    })()}
                  </div>
                  <div className="flex gap-2 justify-center">
                    <Button onClick={() => pauseTimer()} size="lg" variant="outline">
                      <Pause className="w-4 h-4 mr-2" />
                      Pausar
                    </Button>
                    <Button onClick={() => stopTimer()} size="lg" className="bg-red-600 hover:bg-red-700">
                      <Square className="w-4 h-4 mr-2" />
                      Parar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="description">Descrição</Label>
                      <Input
                        id="description"
                        value={newEntry.description}
                        onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
                        placeholder="O que você está fazendo?"
                      />
                    </div>
                    <div>
                      <Label htmlFor="project">Projeto</Label>
                      <Select value={newEntry.projectId} onValueChange={(value) => setNewEntry({ ...newEntry, projectId: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione um projeto" />
                        </SelectTrigger>
                        <SelectContent>
                          {projects.map((project) => (
                            <SelectItem key={project.id} value={project.id}>
                              <div className="flex items-center gap-2">
                                <div 
                                  className="w-3 h-3 rounded-full" 
                                  style={{ backgroundColor: project.color }}
                                />
                                {project.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="people">Pessoas Envolvidas</Label>
                    <Select onValueChange={(value) => {
                      if (!newEntry.personIds.includes(value)) {
                        setNewEntry({ ...newEntry, personIds: [...newEntry.personIds, value] });
                      }
                    }}>
                      <SelectTrigger>
                        <SelectValue placeholder="Adicionar pessoa" />
                      </SelectTrigger>
                      <SelectContent>
                        {contacts.map((contact) => (
                          <SelectItem key={contact.id} value={contact.id}>
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4" />
                              {contact.name}
                              <div className="flex gap-1">
                                {getPersonTags(contact.id).map(tag => (
                                  <Badge key={tag} variant="secondary" className="text-xs">
                                    {tag}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {newEntry.personIds.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {newEntry.personIds.map(personId => {
                          const person = getPersonById(personId);
                          return person ? (
                            <Badge key={personId} variant="outline" className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {person.name}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-4 w-4 p-0 ml-1"
                                onClick={() => setNewEntry({
                                  ...newEntry,
                                  personIds: newEntry.personIds.filter(id => id !== personId)
                                })}
                              >
                                ×
                              </Button>
                            </Badge>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="tags">Tags</Label>
                    <div className="flex gap-2 mb-2">
                      <Input
                        id="tags"
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        placeholder="Nova tag"
                        onKeyPress={(e) => e.key === 'Enter' && addTag()}
                      />
                      <Button onClick={addTag} size="sm">
                        <Plus className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedTags.map(tag => (
                        <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                          <Tag className="w-3 h-3" />
                          {tag}
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-4 w-4 p-0 ml-1"
                            onClick={() => removeTag(tag)}
                          >
                            ×
                          </Button>
                        </Badge>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="billable"
                        checked={newEntry.billable}
                        onCheckedChange={(checked) => setNewEntry({ ...newEntry, billable: checked })}
                      />
                      <Label htmlFor="billable">Faturável</Label>
                    </div>
                    {newEntry.billable && (
                      <div className="flex-1">
                        <Label htmlFor="hourlyRate">Taxa por hora (R$)</Label>
                        <Input
                          id="hourlyRate"
                          type="number"
                          value={newEntry.hourlyRate}
                          onChange={(e) => setNewEntry({ ...newEntry, hourlyRate: parseFloat(e.target.value) || 0 })}
                          placeholder="0.00"
                        />
                      </div>
                    )}
                  </div>

                  <Button 
                    onClick={() => startTimer(newEntry)} 
                    size="lg" 
                    className="w-full"
                    disabled={!newEntry.description || !newEntry.projectId}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Iniciar Timer
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Entries Tab */}
        <TabsContent value="entries" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Entradas de Tempo</h3>
            <div className="flex gap-2">
              <Badge variant="outline">
                {getActiveEntries().length} Ativas
              </Badge>
              <Badge variant="outline">
                {getCompletedEntries().length} Concluídas
              </Badge>
            </div>
          </div>
          <div className="space-y-6">
            <Tabs defaultValue="inprogress" className="space-y-4">
              <TabsList>
                <TabsTrigger value="inprogress">Em andamento</TabsTrigger>
                <TabsTrigger value="completed">Concluídas</TabsTrigger>
              </TabsList>

              <TabsContent value="inprogress" className="mt-0">
                <div className="grid gap-4">
                  {clockifyTimeEntries
                    .filter(e => e.status === 'active' || e.status === 'paused')
                    .map((entry) => (
                      <Card key={entry.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-medium">{entry.description}</h4>
                                {entry.billable && (
                                  <Badge variant="secondary" className="text-xs">
                                    <DollarSign className="w-3 h-3 mr-1" />
                                    R$ {entry.hourlyRate}/h
                                  </Badge>
                                )}
                                <Badge variant={entry.status === 'active' ? 'default' : 'outline'}>
                                  {entry.status === 'active' ? 'Ativo' : 'Pausado'}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                                {entry.projectId && (
                                  <span className="flex items-center gap-1">
                                    <FolderOpen className="w-3 h-3" />
                                    {getProjectById(entry.projectId)?.name}
                                  </span>
                                )}
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {entry.status === 'active' ? 
                                    formatDuration(getCurrentDuration(entry)) : 
                                    entry.duration ? formatDuration(entry.duration) : '00:00:00'}
                                </span>
                                <span>
                                  {entry.startTime && format(entry.startTime, 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                                </span>
                              </div>
                              {entry.personIds.length > 0 && (
                                <div className="flex items-center gap-2 mb-2">
                                  <Users className="w-3 h-3 text-muted-foreground" />
                                  <div className="flex gap-1">
                                    {entry.personIds.map(personId => {
                                      const person = getPersonById(personId);
                                      return person ? (
                                        <Badge key={personId} variant="outline" className="text-xs">
                                          {person.name}
                                        </Badge>
                                      ) : null;
                                    })}
                                  </div>
                                </div>
                              )}
                              {entry.tags.length > 0 && (
                                <div className="flex gap-1">
                                  {entry.tags.map(tag => (
                                    <Badge key={tag} variant="secondary" className="text-xs">
                                      <Tag className="w-3 h-3 mr-1" />
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              {entry.status === 'active' ? (
                                <>
                                  <Button variant="outline" size="sm" onClick={() => pauseTimer(entry.id)}>
                                    <Pause className="w-4 h-4" />
                                  </Button>
                                  <Button variant="outline" size="sm" onClick={() => stopTimer(entry.id)}>
                                    <Square className="w-4 h-4" />
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button variant="outline" size="sm" onClick={() => resumeTimer(entry.id)}>
                                    <Play className="w-4 h-4" />
                                  </Button>
                                  <Button variant="outline" size="sm" onClick={() => stopTimer(entry.id)}>
                                    <Square className="w-4 h-4" />
                                  </Button>
                                </>
                              )}
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Editar Entrada</DialogTitle>
                                    <DialogDescription>Edite os detalhes da entrada de tempo</DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div>
                                      <Label htmlFor="edit-description">Descrição</Label>
                                      <Input
                                        id="edit-description"
                                        value={entry.description}
                                        onChange={(e) => updateClockifyTimeEntry(entry.id, { description: e.target.value })}
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor="edit-project">Projeto</Label>
                                      <Select 
                                        value={entry.projectId} 
                                        onValueChange={(value) => updateClockifyTimeEntry(entry.id, { projectId: value })}
                                      >
                                        <SelectTrigger>
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {projects.map((project) => (
                                            <SelectItem key={project.id} value={project.id}>
                                              {project.name}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <Switch
                                        id="edit-billable"
                                        checked={entry.billable}
                                        onCheckedChange={(checked) => updateClockifyTimeEntry(entry.id, { billable: checked })}
                                      />
                                      <Label htmlFor="edit-billable">Faturável</Label>
                                    </div>
                                    {entry.billable && (
                                      <div>
                                        <Label htmlFor="edit-hourlyRate">Taxa por hora (R$)</Label>
                                        <Input
                                          id="edit-hourlyRate"
                                          type="number"
                                          value={entry.hourlyRate || 0}
                                          onChange={(e) => updateClockifyTimeEntry(entry.id, { hourlyRate: parseFloat(e.target.value) || 0 })}
                                        />
                                      </div>
                                    )}
                                  </div>
                                </DialogContent>
                              </Dialog>
                              <Button variant="outline" size="sm" onClick={() => deleteClockifyTimeEntry(entry.id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  {clockifyTimeEntries.filter(e => e.status === 'active' || e.status === 'paused').length === 0 && (
                    <div className="text-sm text-muted-foreground">Nenhuma entrada ativa ou pausada.</div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="completed" className="mt-0">
                <div className="grid gap-4">
                  {clockifyTimeEntries
                    .filter(e => e.status === 'completed')
                    .map((entry) => (
                      <Card key={entry.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <h4 className="font-medium">{entry.description}</h4>
                                {entry.billable && (
                                  <Badge variant="secondary" className="text-xs">
                                    <DollarSign className="w-3 h-3 mr-1" />
                                    R$ {entry.hourlyRate}/h
                                  </Badge>
                                )}
                                <Badge variant="outline">Concluído</Badge>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                                {entry.projectId && (
                                  <span className="flex items-center gap-1">
                                    <FolderOpen className="w-3 h-3" />
                                    {getProjectById(entry.projectId)?.name}
                                  </span>
                                )}
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {entry.duration ? formatDuration(entry.duration) : '00:00:00'}
                                </span>
                                <span>
                                  {entry.startTime && format(entry.startTime, 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                                </span>
                              </div>
                              {entry.personIds.length > 0 && (
                                <div className="flex items-center gap-2 mb-2">
                                  <Users className="w-3 h-3 text-muted-foreground" />
                                  <div className="flex gap-1">
                                    {entry.personIds.map(personId => {
                                      const person = getPersonById(personId);
                                      return person ? (
                                        <Badge key={personId} variant="outline" className="text-xs">
                                          {person.name}
                                        </Badge>
                                      ) : null;
                                    })}
                                  </div>
                                </div>
                              )}
                              {entry.tags.length > 0 && (
                                <div className="flex gap-1">
                                  {entry.tags.map(tag => (
                                    <Badge key={tag} variant="secondary" className="text-xs">
                                      <Tag className="w-3 h-3 mr-1" />
                                      {tag}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Editar Entrada</DialogTitle>
                                    <DialogDescription>Edite os detalhes da entrada de tempo</DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div>
                                      <Label htmlFor="edit-description">Descrição</Label>
                                      <Input
                                        id="edit-description"
                                        value={entry.description}
                                        onChange={(e) => updateClockifyTimeEntry(entry.id, { description: e.target.value })}
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor="edit-project">Projeto</Label>
                                      <Select 
                                        value={entry.projectId} 
                                        onValueChange={(value) => updateClockifyTimeEntry(entry.id, { projectId: value })}
                                      >
                                        <SelectTrigger>
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {projects.map((project) => (
                                            <SelectItem key={project.id} value={project.id}>
                                              {project.name}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <Switch
                                        id="edit-billable"
                                        checked={entry.billable}
                                        onCheckedChange={(checked) => updateClockifyTimeEntry(entry.id, { billable: checked })}
                                      />
                                      <Label htmlFor="edit-billable">Faturável</Label>
                                    </div>
                                    {entry.billable && (
                                      <div>
                                        <Label htmlFor="edit-hourlyRate">Taxa por hora (R$)</Label>
                                        <Input
                                          id="edit-hourlyRate"
                                          type="number"
                                          value={entry.hourlyRate || 0}
                                          onChange={(e) => updateClockifyTimeEntry(entry.id, { hourlyRate: parseFloat(e.target.value) || 0 })}
                                        />
                                      </div>
                                    )}
                                  </div>
                                </DialogContent>
                              </Dialog>
                              <Button variant="outline" size="sm" onClick={() => deleteClockifyTimeEntry(entry.id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  {clockifyTimeEntries.filter(e => e.status === 'completed').length === 0 && (
                    <div className="text-sm text-muted-foreground">Nenhuma entrada concluída.</div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Total de Horas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatDuration(clockifyTimeEntries.reduce((total, entry) => total + entry.duration, 0))}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Horas Faturáveis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {formatDuration(clockifyTimeEntries
                    .filter(entry => entry.billable)
                    .reduce((total, entry) => total + entry.duration, 0)
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  R$ {getTotalBillable().toFixed(2)}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Projetos por Tempo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {projects.map(project => {
                  const projectTime = clockifyTimeEntries
                    .filter(entry => entry.projectId === project.id)
                    .reduce((total, entry) => total + entry.duration, 0);
                  
                  if (projectTime === 0) return null;
                  
                  return (
                    <div key={project.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: project.color }}
                        />
                        <span>{project.name}</span>
                      </div>
                      <span className="font-mono">{formatDuration(projectTime)}</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 