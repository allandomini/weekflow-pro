import { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarDays, CheckSquare, DollarSign, Users, Plus } from "lucide-react";
import { format, isToday, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Dashboard() {
  const { tasks, projects, accounts, contacts, addTask, updateTask } = useApp();

  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    projectId: "",
    startTime: "",
    endTime: "",
    isRoutine: false
  });

  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const todayTasks = tasks.filter(task => isToday(task.date));
  const completedToday = todayTasks.filter(task => task.completed);
  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);

  const getTasksForDay = (day: Date) => {
    return tasks.filter(task => 
      task.date.toDateString() === day.toDateString()
    );
  };

  const getProjectById = (projectId?: string) => {
    return projects.find(p => p.id === projectId);
  };

  const handleCreateTask = () => {
    setTaskForm({
      title: "",
      description: "",
      projectId: "",
      startTime: "",
      endTime: "",
      isRoutine: false
    });
    setIsTaskDialogOpen(true);
  };

  const handleSaveTask = () => {
    if (!taskForm.title.trim()) return;

    const taskData = {
      title: taskForm.title,
      description: taskForm.description,
      projectId: taskForm.projectId || undefined,
      date: new Date(),
      startTime: taskForm.startTime || undefined,
      endTime: taskForm.endTime || undefined,
      isRoutine: taskForm.isRoutine,
      completed: false
    };

    addTask(taskData);
    setIsTaskDialogOpen(false);
  };

  const handleToggleTask = (taskId: string, completed: boolean) => {
    updateTask(taskId, { completed });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">
            {format(today, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>
        <Button variant="gradient" onClick={handleCreateTask} className="animate-glow">
          <Plus className="w-4 h-4 mr-2" />
          Nova Tarefa
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-elegant hover:shadow-glow transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tarefas Hoje</CardTitle>
            <CheckSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{completedToday.length}/{todayTasks.length}</div>
            <p className="text-xs text-muted-foreground">
              {todayTasks.length > 0 ? `${Math.round((completedToday.length / todayTasks.length) * 100)}% completo` : 'Nenhuma tarefa'}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-elegant hover:shadow-glow transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Projetos Ativos</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{projects.length}</div>
            <p className="text-xs text-muted-foreground">
              Projetos em andamento
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-elegant hover:shadow-glow transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Saldo Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {totalBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </div>
            <p className="text-xs text-muted-foreground">
              {accounts.length} conta{accounts.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card className="shadow-elegant hover:shadow-glow transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Contatos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{contacts.length}</div>
            <p className="text-xs text-muted-foreground">
              Total de contatos
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Calendário Semanal */}
        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-primary" />
              Calendário Semanal
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2">
              {weekDays.map((day, index) => {
                const dayTasks = getTasksForDay(day);
                const isCurrentDay = isToday(day);
                
                return (
                  <div 
                    key={index} 
                    className={`p-3 rounded-lg border ${
                      isCurrentDay 
                        ? 'bg-primary text-primary-foreground border-primary shadow-md' 
                        : 'bg-card border-border hover:bg-accent/50'
                    } transition-colors`}
                  >
                    <div className="text-center">
                      <div className={`text-xs font-medium ${isCurrentDay ? 'text-primary-foreground' : 'text-muted-foreground'}`}>
                        {format(day, 'EEE', { locale: ptBR })}
                      </div>
                      <div className={`text-lg font-bold ${isCurrentDay ? 'text-primary-foreground' : 'text-foreground'}`}>
                        {format(day, 'd')}
                      </div>
                      {dayTasks.length > 0 && (
                        <div className="mt-1">
                          <Badge 
                            variant={isCurrentDay ? "secondary" : "default"} 
                            className="text-xs px-1 py-0"
                          >
                            {dayTasks.length}
                          </Badge>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Tarefas de Hoje */}
        <Card className="shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-accent" />
              Tarefas de Hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {todayTasks.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">
                  Nenhuma tarefa para hoje
                </p>
              ) : (
                todayTasks.map((task) => {
                  const project = getProjectById(task.projectId);
                  return (
                    <div 
                      key={task.id} 
                      className={`flex items-center gap-3 p-3 rounded-lg border transition-all ${
                        task.completed 
                          ? 'bg-success/10 border-success/20' 
                          : 'bg-card border-border hover:bg-accent/50'
                      }`}
                    >
                      <button 
                        className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${
                          task.completed 
                            ? 'bg-success border-success' 
                            : 'border-muted-foreground hover:border-primary'
                        }`}
                        onClick={() => handleToggleTask(task.id, !task.completed)}
                      >
                        {task.completed && (
                          <CheckSquare className="w-3 h-3 text-success-foreground" />
                        )}
                      </button>
                      <div className="flex-1">
                        <div className={`font-medium ${task.completed ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                          {task.title}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {project && (
                            <Badge 
                              variant="outline" 
                              style={{ backgroundColor: project.color + '20', borderColor: project.color }}
                              className="text-xs"
                            >
                              {project.name}
                            </Badge>
                          )}
                          {task.startTime && (
                            <span className="text-xs text-muted-foreground">
                              {task.startTime} {task.endTime && `- ${task.endTime}`}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dialog para Nova Tarefa */}
      <Dialog open={isTaskDialogOpen} onOpenChange={setIsTaskDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Tarefa</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                value={taskForm.title}
                onChange={(e) => setTaskForm(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Digite o título da tarefa"
              />
            </div>
            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={taskForm.description}
                onChange={(e) => setTaskForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descrição opcional"
              />
            </div>
            <div>
              <Label htmlFor="project">Projeto</Label>
              <Select
                value={taskForm.projectId}
                onValueChange={(value) => setTaskForm(prev => ({ ...prev, projectId: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um projeto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Nenhum projeto</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startTime">Hora de Início</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={taskForm.startTime}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, startTime: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="endTime">Hora de Fim</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={taskForm.endTime}
                  onChange={(e) => setTaskForm(prev => ({ ...prev, endTime: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isRoutine"
                checked={taskForm.isRoutine}
                onCheckedChange={(checked) => setTaskForm(prev => ({ ...prev, isRoutine: !!checked }))}
              />
              <Label htmlFor="isRoutine">Tarefa de rotina</Label>
            </div>
            <div className="flex gap-3 pt-4">
              <Button onClick={handleSaveTask} className="flex-1">
                Criar Tarefa
              </Button>
              <Button variant="outline" onClick={() => setIsTaskDialogOpen(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}