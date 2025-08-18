import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "@/contexts/SupabaseAppContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FolderOpen, Plus, Edit, Trash2 } from "lucide-react";
import { Project } from "@/types";

export default function Projects() {
  const navigate = useNavigate();
  const { projects, addProject, updateProject, deleteProject } = useAppContext();
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projectForm, setProjectForm] = useState({ name: "", color: "#3B82F6" });

  const handleCreateProject = () => {
    setEditingProject(null);
    setProjectForm({ name: "", color: "#3B82F6" });
    setIsProjectDialogOpen(true);
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setProjectForm({ name: project.name, color: project.color });
    setIsProjectDialogOpen(true);
  };

  const handleSaveProject = () => {
    if (!projectForm.name.trim()) return;
    const data = { name: projectForm.name, color: projectForm.color };
    editingProject ? updateProject(editingProject.id, data) : addProject(data);
    setIsProjectDialogOpen(false);
    setEditingProject(null);
  };

  const handleDeleteProject = (projectId: string) => {
    if (confirm('Tem certeza que deseja excluir este projeto? Todas as tarefas e notas relacionadas também serão excluídas.')) {
      deleteProject(projectId);
    }
  };

  const colorOptions = [
    "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6",
    "#06B6D4", "#84CC16", "#F97316", "#EC4899", "#6366F1"
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Projetos</h1>
          <p className="text-muted-foreground">Organize suas tarefas em projetos</p>
        </div>
        <Button variant="gradient" onClick={handleCreateProject} className="animate-glow">
          <Plus className="w-4 h-4 mr-2" />
          Novo Projeto
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.length === 0 ? (
          <div className="col-span-full">
            <Card className="shadow-elegant">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FolderOpen className="w-16 h-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">Nenhum projeto criado</h3>
                <p className="text-muted-foreground text-center mb-6">Comece criando seu primeiro projeto para organizar suas tarefas</p>
                <Button onClick={handleCreateProject}><Plus className="w-4 h-4 mr-2" />Criar Primeiro Projeto</Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          projects.map((project) => (
            <Card key={project.id} className="shadow-elegant hover:shadow-glow transition-all duration-300 cursor-pointer" onClick={() => navigate(`/projects/${project.id}`)}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 truncate">
                    <div className="w-4 h-4 rounded-full shadow-sm" style={{ backgroundColor: project.color }} />
                    <CardTitle className="text-lg truncate">{project.name}</CardTitle>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleEditProject(project); }}><Edit className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); handleDeleteProject(project.id); }}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Clique para abrir o quadro do projeto</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Dialog para Novo/Editar Projeto */}
      <Dialog open={isProjectDialogOpen} onOpenChange={setIsProjectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingProject ? 'Editar Projeto' : 'Novo Projeto'}
            </DialogTitle>
            <DialogDescription>
              {editingProject 
                ? 'Edite as informações do projeto selecionado.' 
                : 'Crie um novo projeto para organizar suas tarefas e atividades.'}
            </DialogDescription>
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

      {/* Simplified: removed Notes and Receivables dialogs from Projects page */}
    </div>
  );
}