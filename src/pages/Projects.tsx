import { useState } from "react";
import { useApp } from "@/contexts/AppContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FolderOpen, Plus, Edit, Trash2, CheckSquare, StickyNote } from "lucide-react";
import { Project } from "@/types";

export default function Projects() {
  const { projects, tasks, notes, addProject, updateProject, deleteProject } = useApp();
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
    </div>
  );
}