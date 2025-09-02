import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAppContext } from "@/contexts/SupabaseAppContext";
import { useTranslation } from "@/hooks/useTranslation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { FolderOpen, Plus, Edit, Trash2, Briefcase, Target, Lightbulb, Zap, Star, Heart, Maximize2 } from "lucide-react";
import { Project } from "@/types";

export default function Projects() {
  const navigate = useNavigate();
  const { projects, addProject, updateProject, deleteProject } = useAppContext();
  const { t } = useTranslation();
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projectForm, setProjectForm] = useState({ name: "", color: "#3B82F6", icon: "folder" });
  const [cardSize, setCardSize] = useState([200]); // Card size in pixels

  const handleCreateProject = () => {
    setEditingProject(null);
    setProjectForm({ name: "", color: "#3B82F6", icon: "folder" });
    setIsProjectDialogOpen(true);
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
    setProjectForm({ name: project.name, color: project.color, icon: project.icon || "folder" });
    setIsProjectDialogOpen(true);
  };

  const handleSaveProject = () => {
    if (!projectForm.name.trim()) return;
    const data = { name: projectForm.name, color: projectForm.color, icon: projectForm.icon };
    editingProject ? updateProject(editingProject.id, data) : addProject(data);
    setIsProjectDialogOpen(false);
    setEditingProject(null);
  };

  const handleDeleteProject = (projectId: string) => {
    if (confirm(t('projects.delete_project') + '? ' + t('projects.delete_project_warning'))) {
      deleteProject(projectId);
    }
  };

  const colorOptions = [
    "#3B82F6", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6",
    "#06B6D4", "#84CC16", "#F97316", "#EC4899", "#6366F1"
  ];

  const iconOptions = [
    { icon: Briefcase, name: "briefcase" },
    { icon: Target, name: "target" },
    { icon: Lightbulb, name: "lightbulb" },
    { icon: Zap, name: "zap" },
    { icon: Star, name: "star" },
    { icon: Heart, name: "heart" },
    { icon: FolderOpen, name: "folder" }
  ];

  const getProjectIcon = (iconName: string) => {
    const iconOption = iconOptions.find(opt => opt.name === iconName);
    return iconOption ? iconOption.icon : FolderOpen;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{t('projects.title')}</h1>
          <p className="text-muted-foreground">{t('projects.manage_description')}</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 min-w-[200px]">
            <Maximize2 className="w-4 h-4 text-muted-foreground" />
            <Slider
              value={cardSize}
              onValueChange={setCardSize}
              max={300}
              min={150}
              step={10}
              className="flex-1"
            />
            <span className="text-sm text-muted-foreground w-12">{cardSize[0]}px</span>
          </div>
          <Button variant="gradient" onClick={handleCreateProject} className="animate-glow">
            <Plus className="w-4 h-4 mr-2" />
{t('projects.create_project')}
          </Button>
        </div>
      </div>

      <div 
        className="grid gap-6"
        style={{
          gridTemplateColumns: `repeat(auto-fill, minmax(${cardSize[0]}px, 1fr))`
        }}
      >
        {projects.length === 0 ? (
          <div className="col-span-full">
            <Card className="shadow-elegant">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FolderOpen className="w-16 h-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">{t('projects.no_projects')}</h3>
                <p className="text-muted-foreground text-center mb-6">{t('projects.create_first_project')}</p>
                <Button onClick={handleCreateProject}><Plus className="w-4 h-4 mr-2" />{t('projects.create_project')}</Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          projects.map((project) => {
            const IconComponent = getProjectIcon(project.icon || "folder");
            return (
              <Card 
                key={project.id} 
                className="shadow-elegant hover:shadow-glow transition-all duration-300 cursor-pointer group relative overflow-hidden" 
                onClick={() => navigate(`/projects/${project.id}/canvas`)}
                style={{ 
                  backgroundColor: `${project.color}10`,
                  width: `${cardSize[0]}px`,
                  height: `${cardSize[0]}px`
                }}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <IconComponent 
                    className="w-20 h-20 opacity-10 group-hover:opacity-20 transition-opacity duration-300" 
                    style={{ color: project.color }}
                  />
                </div>
                <CardContent className="h-full flex flex-col justify-between p-4 relative z-10">
                  <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 bg-background/80 hover:bg-background"
                      onClick={(e) => { e.stopPropagation(); handleEditProject(project); }}
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0 bg-background/80 hover:bg-background"
                      onClick={(e) => { e.stopPropagation(); handleDeleteProject(project.id); }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="text-center">
                    <h3 className="font-semibold text-foreground text-sm leading-tight">{project.name}</h3>
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
              {editingProject ? t('projects.edit_project') : t('projects.create_project')}
            </DialogTitle>
            <DialogDescription>
              {editingProject 
                ? t('projects.edit_project_description') 
                : t('projects.create_project_description')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">{t('projects.project_name')}</Label>
              <Input
                id="name"
                value={projectForm.name}
                onChange={(e) => setProjectForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder={t('projects.project_name')}
              />
            </div>
            <div>
              <Label htmlFor="color">{t('projects.project_color')}</Label>
              <div className="flex gap-2 mt-2 flex-wrap">
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
            <div>
              <Label htmlFor="icon">{t('projects.project_icon')}</Label>
              <div className="flex gap-2 mt-2 flex-wrap">
                {iconOptions.map(({ icon: Icon, name }) => (
                  <button
                    key={name}
                    type="button"
                    className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center transition-all ${
                      projectForm.icon === name 
                        ? 'border-foreground bg-muted scale-110' 
                        : 'border-border hover:border-muted-foreground hover:bg-muted/50'
                    }`}
                    onClick={() => setProjectForm(prev => ({ ...prev, icon: name }))}
                  >
                    <Icon className="w-5 h-5" />
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button onClick={handleSaveProject} className="flex-1">
                {editingProject ? t('common.save_changes') : t('projects.create_project')}
              </Button>
              <Button variant="outline" onClick={() => setIsProjectDialogOpen(false)}>
                {t('common.cancel')}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Simplified: removed Notes and Receivables dialogs from Projects page */}
    </div>
  );
}