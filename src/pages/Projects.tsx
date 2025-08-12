import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FolderOpen, Plus, Edit, Trash2, CheckSquare, StickyNote, ListChecks, BadgeDollarSign } from "lucide-react";
import { Project, TodoList, Note } from "@/types";

export default function Projects() {
  const navigate = useNavigate();
  const { 
    projects, tasks, notes, todoLists, receivables,
    addProject, updateProject, deleteProject,
    addNote, deleteNote, addTodoList, updateTodoList, addReceivable
  } = useApp();
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projectForm, setProjectForm] = useState({
    name: "",
    description: "",
    color: "#3B82F6"
  });

  const handleCreateProject = () => {
    setEditingProject(null);
    setProjectForm({
      name: "",
      description: "",
      color: "#3B82F6"
    });
    setIsProjectDialogOpen(true);
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setProjectForm({
      name: project.name,
      description: project.description || "",
      color: project.color
    });
    setIsProjectDialogOpen(true);
  };

  const handleSaveProject = () => {
    if (!projectForm.name.trim()) return;

    const projectData = {
      name: projectForm.name,
      description: projectForm.description,
      color: projectForm.color
    };

    if (editingProject) {
      updateProject(editingProject.id, projectData);
    } else {
      addProject(projectData);
    }

    setIsProjectDialogOpen(false);
    setEditingProject(null);
  };

  const handleDeleteProject = (projectId: string) => {
    if (confirm('Tem certeza que deseja excluir este projeto? Todas as tarefas e notas relacionadas também serão excluídas.')) {
      deleteProject(projectId);
    }
  };

  const getProjectStats = (projectId: string) => {
    const projectTasks = tasks.filter(task => task.projectId === projectId);
    const completedTasks = projectTasks.filter(task => task.completed);
    const projectNotes = notes.filter(note => note.projectId === projectId);
    
    return {
      totalTasks: projectTasks.length,
      completedTasks: completedTasks.length,
      totalNotes: projectNotes.length,
      completionRate: projectTasks.length > 0 ? Math.round((completedTasks.length / projectTasks.length) * 100) : 0
    };
  };

  const colorOptions = [
    "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6", 
    "#06B6D4", "#84CC16", "#F97316", "#EC4899", "#6366F1"
  ];

  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [activeProjectForNote, setActiveProjectForNote] = useState<Project | null>(null);
  const [noteForm, setNoteForm] = useState({ title: "", content: "" });

  const [todoInputByList, setTodoInputByList] = useState<Record<string, string>>({});

  const [receivableDialogOpen, setReceivableDialogOpen] = useState(false);
  const [activeProjectForReceivable, setActiveProjectForReceivable] = useState<Project | null>(null);
  const [receivableForm, setReceivableForm] = useState({ name: "", amount: "", dueDate: "" });

  const getProjectTodoLists = (projectId: string) => todoLists.filter(l => l.projectId === projectId);
  const getProjectNotes = (projectId: string) => notes.filter(n => n.projectId === projectId);
  const getProjectReceivables = (projectId: string) => receivables.filter(r => r.projectId === projectId);

  const ensureTodoList = (project: Project): TodoList => {
    const lists = getProjectTodoLists(project.id);
    if (lists.length > 0) return lists[0];
    const newList: Omit<TodoList, 'id' | 'createdAt' | 'updatedAt'> = {
      title: `Checklist - ${project.name}`,
      items: [],
      projectId: project.id,
    };
    addTodoList(newList);
    // naive: return a placeholder; UI will refresh via state update
    return { ...(newList as any), id: 'temp', createdAt: new Date(), updatedAt: new Date() } as TodoList;
  };

  const handleAddTodoItem = (list: TodoList) => {
    const text = (todoInputByList[list.id] || '').trim();
    if (!text) return;
    const newItem = { id: Date.now().toString(), text, completed: false, createdAt: new Date() };
    updateTodoList(list.id, { items: [...list.items, newItem] });
    setTodoInputByList(prev => ({ ...prev, [list.id]: '' }));
  };

  const handleToggleTodoItem = (list: TodoList, itemId: string) => {
    const nextItems = list.items.map(i => i.id === itemId ? { ...i, completed: !i.completed } : i);
    updateTodoList(list.id, { items: nextItems });
  };

  const handleCreateNote = () => {
    if (!activeProjectForNote || !noteForm.title.trim()) return;
    addNote({ title: noteForm.title, content: noteForm.content, projectId: activeProjectForNote.id });
    setNoteForm({ title: '', content: '' });
    setNoteDialogOpen(false);
    setActiveProjectForNote(null);
  };

  const handleCreateReceivableForProject = () => {
    if (!activeProjectForReceivable || !receivableForm.name.trim() || !receivableForm.amount || !receivableForm.dueDate) return;
    addReceivable({
      name: receivableForm.name,
      amount: parseFloat(receivableForm.amount),
      dueDate: new Date(receivableForm.dueDate),
      projectId: activeProjectForReceivable.id,
      description: undefined,
    });
    setReceivableForm({ name: '', amount: '', dueDate: '' });
    setReceivableDialogOpen(false);
    setActiveProjectForReceivable(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Projetos</h1>
          <p className="text-muted-foreground">
            Organize suas tarefas em projetos
          </p>
        </div>
        <Button variant="gradient" onClick={handleCreateProject} className="animate-glow">
          <Plus className="w-4 h-4 mr-2" />
          Novo Projeto
        </Button>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.length === 0 ? (
          <div className="col-span-full">
            <Card className="shadow-elegant">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FolderOpen className="w-16 h-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  Nenhum projeto criado
                </h3>
                <p className="text-muted-foreground text-center mb-6">
                  Comece criando seu primeiro projeto para organizar suas tarefas
                </p>
                <Button onClick={handleCreateProject}>
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Primeiro Projeto
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          projects.map((project) => {
            const stats = getProjectStats(project.id);
            return (
              <Card key={project.id} className="shadow-elegant hover:shadow-glow transition-all duration-300">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full shadow-sm"
                        style={{ backgroundColor: project.color }}
                      />
                      <CardTitle className="text-lg">{project.name}</CardTitle>
                    </div>
                    <div className="flex gap-1">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate(`/projects/${project.id}`)}
                      >
                        Abrir
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleEditProject(project)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleDeleteProject(project.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  {project.description && (
                    <p className="text-sm text-muted-foreground mt-2">
                      {project.description}
                    </p>
                  )}
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Progress Bar */}
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Progresso</span>
                        <span className="font-medium">{stats.completionRate}%</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2">
                        <div 
                          className="h-2 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${stats.completionRate}%`,
                            backgroundColor: project.color
                          }}
                        />
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <CheckSquare className="w-4 h-4 text-primary" />
                        <div>
                          <div className="text-sm font-medium">
                            {stats.completedTasks}/{stats.totalTasks}
                          </div>
                          <div className="text-xs text-muted-foreground">Tarefas</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <StickyNote className="w-4 h-4 text-accent" />
                        <div>
                          <div className="text-sm font-medium">{stats.totalNotes}</div>
                          <div className="text-xs text-muted-foreground">Notas</div>
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="flex justify-end">
                      <Badge 
                        variant={stats.completionRate === 100 ? "default" : "secondary"}
                        className="text-xs"
                      >
                        {stats.completionRate === 100 ? 'Concluído' : 'Em andamento'}
                      </Badge>
                    </div>

                    {/* Mixed Content: Tasks + Notes + Todo + Finance */}
                    <div className="space-y-4 pt-2">
                      {/* Tasks (read-only list) */}
                      <div>
                        <h4 className="text-sm font-medium text-muted-foreground mb-2">Tarefas</h4>
                        <div className="space-y-1">
                          {tasks.filter(t => t.projectId === project.id).slice(0,5).map(t => (
                            <div key={t.id} className="text-sm flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${t.completed ? 'bg-success' : 'bg-warning'}`} />
                              <span className={t.completed ? 'line-through text-muted-foreground' : ''}>{t.title}</span>
                            </div>
                          ))}
                          {tasks.filter(t => t.projectId === project.id).length === 0 && (
                            <p className="text-sm text-muted-foreground">Sem tarefas</p>
                          )}
                        </div>
                      </div>

                      {/* Notes */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-medium text-muted-foreground">Notas</h4>
                          <Button size="sm" variant="outline" onClick={() => { setActiveProjectForNote(project); setNoteDialogOpen(true); }}>
                            <StickyNote className="w-4 h-4 mr-1" /> Nova Nota
                          </Button>
                        </div>
                        <div className="space-y-1">
                          {getProjectNotes(project.id).slice(0,3).map(n => (
                            <div key={n.id} className="text-sm">
                              <span className="font-medium">{n.title}</span>
                            </div>
                          ))}
                          {getProjectNotes(project.id).length === 0 && (
                            <p className="text-sm text-muted-foreground">Sem notas</p>
                          )}
                        </div>
                      </div>

                      {/* Todo List */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-medium text-muted-foreground">Checklist</h4>
                          <Button size="sm" variant="outline" onClick={() => ensureTodoList(project)}>
                            <ListChecks className="w-4 h-4 mr-1" /> Criar/Usar Lista
                          </Button>
                        </div>
                        {getProjectTodoLists(project.id).slice(0,1).map(list => (
                          <div key={list.id} className="space-y-2">
                            <div className="flex gap-2">
                              <Input 
                                placeholder="Novo item"
                                value={todoInputByList[list.id] || ''}
                                onChange={(e) => setTodoInputByList(prev => ({ ...prev, [list.id]: e.target.value }))}
                              />
                              <Button size="sm" onClick={() => handleAddTodoItem(list)}>Adicionar</Button>
                            </div>
                            <div className="space-y-1">
                              {list.items.slice(0,5).map(item => (
                                <button key={item.id} className="text-left w-full text-sm flex items-center gap-2" onClick={() => handleToggleTodoItem(list, item.id)}>
                                  <span className={`w-3 h-3 rounded border ${item.completed ? 'bg-success border-success' : 'border-border'}`} />
                                  <span className={item.completed ? 'line-through text-muted-foreground' : ''}>{item.text}</span>
                                </button>
                              ))}
                              {list.items.length === 0 && (
                                <p className="text-sm text-muted-foreground">Sem itens</p>
                              )}
                            </div>
                          </div>
                        ))}
                        {getProjectTodoLists(project.id).length === 0 && (
                          <p className="text-sm text-muted-foreground">Nenhuma lista. Clique em "Criar/Usar Lista".</p>
                        )}
                      </div>

                      {/* Finance (Receivables) */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="text-sm font-medium text-muted-foreground">Financeiro (A Receber)</h4>
                          <Button size="sm" variant="outline" onClick={() => { setActiveProjectForReceivable(project); setReceivableDialogOpen(true); }}>
                            <BadgeDollarSign className="w-4 h-4 mr-1" /> Novo
                          </Button>
                        </div>
                        <div className="space-y-1">
                          {getProjectReceivables(project.id).slice(0,3).map(r => (
                            <div key={r.id} className="text-sm flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${r.status === 'received' ? 'bg-success' : 'bg-warning'}`} />
                              <span>{r.name} • {r.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                            </div>
                          ))}
                          {getProjectReceivables(project.id).length === 0 && (
                            <p className="text-sm text-muted-foreground">Sem lançamentos</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Dialog para Novo/Editar Projeto */}
      <Dialog open={isProjectDialogOpen} onOpenChange={setIsProjectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingProject ? 'Editar Projeto' : 'Novo Projeto'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nome do Projeto</Label>
              <Input
                id="name"
                value={projectForm.name}
                onChange={(e) => setProjectForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Digite o nome do projeto"
              />
            </div>
            <div>
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={projectForm.description}
                onChange={(e) => setProjectForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descrição opcional do projeto"
              />
            </div>
            <div>
              <Label htmlFor="color">Cor do Projeto</Label>
              <div className="flex gap-2 mt-2">
                {colorOptions.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      projectForm.color === color 
                        ? 'border-foreground scale-110' 
                        : 'border-border hover:border-muted-foreground'
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setProjectForm(prev => ({ ...prev, color }))}
                  />
                ))}
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button onClick={handleSaveProject} className="flex-1">
                {editingProject ? 'Salvar Alterações' : 'Criar Projeto'}
              </Button>
              <Button variant="outline" onClick={() => setIsProjectDialogOpen(false)}>
                Cancelar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Nova Nota */}
      <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Nota {activeProjectForNote ? `- ${activeProjectForNote.name}` : ''}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="noteTitle">Título</Label>
              <Input id="noteTitle" value={noteForm.title} onChange={(e) => setNoteForm(prev => ({ ...prev, title: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="noteContent">Conteúdo</Label>
              <Textarea id="noteContent" value={noteForm.content} onChange={(e) => setNoteForm(prev => ({ ...prev, content: e.target.value }))} />
            </div>
            <div className="flex gap-3 pt-4">
              <Button className="flex-1" onClick={handleCreateNote}>Criar Nota</Button>
              <Button variant="outline" onClick={() => setNoteDialogOpen(false)}>Cancelar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Novo A Receber do Projeto */}
      <Dialog open={receivableDialogOpen} onOpenChange={setReceivableDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo A Receber {activeProjectForReceivable ? `- ${activeProjectForReceivable.name}` : ''}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="recName">Nome</Label>
              <Input id="recName" value={receivableForm.name} onChange={(e) => setReceivableForm(prev => ({ ...prev, name: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="recAmount">Valor</Label>
              <Input id="recAmount" type="number" step="0.01" value={receivableForm.amount} onChange={(e) => setReceivableForm(prev => ({ ...prev, amount: e.target.value }))} />
            </div>
            <div>
              <Label htmlFor="recDate">Vencimento</Label>
              <Input id="recDate" type="date" value={receivableForm.dueDate} onChange={(e) => setReceivableForm(prev => ({ ...prev, dueDate: e.target.value }))} />
            </div>
            <div className="flex gap-3 pt-4">
              <Button className="flex-1" onClick={handleCreateReceivableForProject}>Criar</Button>
              <Button variant="outline" onClick={() => setReceivableDialogOpen(false)}>Cancelar</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}