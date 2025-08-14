import { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAppContext } from "@/contexts/SupabaseAppContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar, ChevronLeft, Image as ImageIcon, ListChecks, StickyNote, Wallet } from "lucide-react";
import { format, addWeeks, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ProjectDetail() {
  const { projectId } = useParams();
  const navigate = useNavigate();
  const {
    projects, tasks, notes, todoLists, projectImages, projectWalletEntries,
    addNote, addTodoList, updateTodoList, addTask,
    addProjectImage, deleteProjectImage,
    addProjectWalletEntry,
  } = useAppContext();

  const project = useMemo(() => projects.find(p => p.id === projectId), [projects, projectId]);

  const projectNotes = useMemo(() => notes.filter(n => n.projectId === projectId), [notes, projectId]);
  const projectTodoList = useMemo(() => todoLists.find(l => l.projectId === projectId), [todoLists, projectId]);
  const projectTasks = useMemo(() => tasks.filter(t => t.projectId === projectId), [tasks, projectId]);
  const images = useMemo(() => projectImages.filter(i => i.projectId === projectId), [projectImages, projectId]);
  const walletEntries = useMemo(() => projectWalletEntries.filter(e => e.projectId === projectId), [projectWalletEntries, projectId]);

  const balance = useMemo(() => walletEntries.reduce((acc, e) => acc + (e.type === 'deposit' ? e.amount : -e.amount), 0), [walletEntries]);

  const [noteForm, setNoteForm] = useState({ title: "", content: "" });
  const [todoInput, setTodoInput] = useState("");
  const [routineForm, setRoutineForm] = useState({ title: "", weeks: 4, weekday: 1 }); // 1=Mon
  const [uploading, setUploading] = useState(false);
  const [walletForm, setWalletForm] = useState({ type: 'deposit' as 'deposit' | 'withdrawal', amount: '', description: '' });

  if (!project) {
    return (
      <div className="space-y-4">
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ChevronLeft className="w-4 h-4 mr-2" /> Voltar
        </Button>
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">Projeto não encontrado.</CardContent>
        </Card>
      </div>
    );
  }

  const ensureTodoList = () => {
    if (projectTodoList) return projectTodoList;
    const list = { title: `Checklist - ${project.name}`, items: [], projectId: project.id };
    addTodoList(list);
    return undefined; // UI atualizará quando o estado mudar
  };

  const handleAddTodoItem = () => {
    if (!projectTodoList) return;
    const text = todoInput.trim();
    if (!text) return;
    const newItem = { id: Date.now().toString(), text, completed: false, createdAt: new Date() };
    updateTodoList(projectTodoList.id, { items: [...projectTodoList.items, newItem] });
    setTodoInput("");
  };

  const handleToggleTodoItem = (itemId: string) => {
    if (!projectTodoList) return;
    const nextItems = projectTodoList.items.map(i => i.id === itemId ? { ...i, completed: !i.completed } : i);
    updateTodoList(projectTodoList.id, { items: nextItems });
  };

  const handleCreateNote = () => {
    if (!noteForm.title.trim()) return;
    addNote({ title: noteForm.title, content: noteForm.content, projectId: project.id });
    setNoteForm({ title: "", content: "" });
  };

  const handleCreateRoutine = () => {
    const title = routineForm.title.trim();
    if (!title) return;
    const start = startOfWeek(new Date(), { weekStartsOn: 1 });
    for (let w = 0; w < routineForm.weeks; w++) {
      const weekStartDate = addWeeks(start, w);
      const date = new Date(weekStartDate);
      const dayOffset = routineForm.weekday - 1; // 0..6
      date.setDate(weekStartDate.getDate() + dayOffset);
      addTask({
        title,
        description: '',
        projectId: project.id,
        date,
        startTime: undefined,
        endTime: undefined,
        isRoutine: true,
        completed: false,
        isOverdue: false,
      });
    }
    setRoutineForm({ title: "", weeks: 4, weekday: 1 });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = () => {
        const url = reader.result as string;
        addProjectImage({ projectId: project.id, url });
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch {
      setUploading(false);
    }
  };

  const handleAddWallet = () => {
    const amountNumber = parseFloat(walletForm.amount || '0');
    if (!amountNumber || amountNumber <= 0) return;
    addProjectWalletEntry({
      projectId: project.id,
      type: walletForm.type,
      amount: amountNumber,
      description: walletForm.description || undefined,
    });
    setWalletForm({ type: 'deposit', amount: '', description: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">{project.name}</h1>
          {project.description && (
            <p className="text-muted-foreground">{project.description}</p>
          )}
        </div>
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ChevronLeft className="w-4 h-4 mr-2" /> Voltar
        </Button>
      </div>

      <Tabs defaultValue="notes">
        <TabsList className="grid grid-cols-5 w-full md:w-auto">
          <TabsTrigger value="notes"><StickyNote className="w-4 h-4 mr-2" /> Notas</TabsTrigger>
          <TabsTrigger value="checklist"><ListChecks className="w-4 h-4 mr-2" /> Checklist</TabsTrigger>
          <TabsTrigger value="routine"><Calendar className="w-4 h-4 mr-2" /> Rotina</TabsTrigger>
          <TabsTrigger value="images"><ImageIcon className="w-4 h-4 mr-2" /> Imagens</TabsTrigger>
          <TabsTrigger value="wallet"><Wallet className="w-4 h-4 mr-2" /> Financeiro</TabsTrigger>
        </TabsList>

        <TabsContent value="notes">
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle>Notas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="note-title">Título</Label>
                  <Input id="note-title" value={noteForm.title} onChange={(e) => setNoteForm(p => ({ ...p, title: e.target.value }))} />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="note-content">Conteúdo</Label>
                  <Textarea id="note-content" value={noteForm.content} onChange={(e) => setNoteForm(p => ({ ...p, content: e.target.value }))} />
                </div>
                <div className="md:col-span-2 flex justify-end">
                  <Button onClick={handleCreateNote}>Adicionar Nota</Button>
                </div>
              </div>
              <div className="space-y-2">
                {projectNotes.length === 0 ? (
                  <p className="text-muted-foreground">Sem notas ainda.</p>
                ) : projectNotes.map(n => (
                  <div key={n.id} className="p-3 rounded border">
                    <div className="font-medium">{n.title}</div>
                    {n.content && <div className="text-sm text-muted-foreground mt-1">{n.content}</div>}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="checklist">
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle>Checklist</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!projectTodoList && (
                <Button onClick={ensureTodoList}>Criar Lista</Button>
              )}
              {projectTodoList && (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input placeholder="Novo item" value={todoInput} onChange={(e) => setTodoInput(e.target.value)} />
                    <Button onClick={handleAddTodoItem}>Adicionar</Button>
                  </div>
                  <div className="space-y-2">
                    {projectTodoList.items.length === 0 ? (
                      <p className="text-muted-foreground">Sem itens.</p>
                    ) : projectTodoList.items.map(item => (
                      <button key={item.id} onClick={() => handleToggleTodoItem(item.id)} className="w-full text-left p-2 rounded border flex items-center gap-2">
                        <span className={`w-3 h-3 rounded border ${item.completed ? 'bg-success border-success' : 'border-border'}`} />
                        <span className={item.completed ? 'line-through text-muted-foreground' : ''}>{item.text}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="routine">
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle>Rotina semanal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4 items-end">
                <div className="md:col-span-2">
                  <Label>Título</Label>
                  <Input value={routineForm.title} onChange={(e) => setRoutineForm(p => ({ ...p, title: e.target.value }))} />
                </div>
                <div>
                  <Label>Semanas</Label>
                  <Input type="number" min={1} max={52} value={routineForm.weeks} onChange={(e) => setRoutineForm(p => ({ ...p, weeks: Math.max(1, Math.min(52, Number(e.target.value) || 1)) }))} />
                </div>
                <div>
                  <Label>Dia da semana</Label>
                  <select className="w-full h-10 rounded border px-3 bg-card" value={routineForm.weekday} onChange={(e) => setRoutineForm(p => ({ ...p, weekday: Number(e.target.value) }))}>
                    <option value={1}>Segunda</option>
                    <option value={2}>Terça</option>
                    <option value={3}>Quarta</option>
                    <option value={4}>Quinta</option>
                    <option value={5}>Sexta</option>
                    <option value={6}>Sábado</option>
                    <option value={7}>Domingo</option>
                  </select>
                </div>
                <div className="md:col-span-3 flex justify-end">
                  <Button onClick={handleCreateRoutine}>Criar tarefas</Button>
                </div>
              </div>
              <div className="space-y-2">
                {projectTasks.length === 0 ? (
                  <p className="text-muted-foreground">Sem tarefas deste projeto.</p>
                ) : projectTasks.map(t => (
                  <div key={t.id} className="p-3 rounded border flex items-center gap-2">
                    <Checkbox checked={t.completed} disabled />
                    <div className="flex-1">
                      <div className="font-medium">{t.title}</div>
                      <div className="text-xs text-muted-foreground flex gap-2 mt-1">
                        <Badge variant="outline">{t.isRoutine ? 'Rotina' : 'Avulsa'}</Badge>
                        <span>
                          {format(t.date, "d 'de' MMMM yyyy", { locale: ptBR })}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="images">
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle>Imagens</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Input type="file" accept="image/*" onChange={handleImageUpload} />
                <Button disabled={uploading}>{uploading ? 'Enviando...' : 'Upload'}</Button>
              </div>
              {images.length === 0 ? (
                <p className="text-muted-foreground">Sem imagens.</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {images.map(img => (
                    <div key={img.id} className="rounded border overflow-hidden">
                      <img src={img.url} alt="Imagem do projeto" className="w-full h-32 object-cover" />
                      <div className="p-2 flex justify-end">
                        <Button size="sm" variant="outline" onClick={() => deleteProjectImage(img.id)}>Remover</Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="wallet">
          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle>Financeiro do Projeto</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-4 gap-3 items-end">
                <div>
                  <Label>Tipo</Label>
                  <select className="w-full h-10 rounded border px-3 bg-card" value={walletForm.type} onChange={(e) => setWalletForm(p => ({ ...p, type: e.target.value as 'deposit' | 'withdrawal' }))}>
                    <option value="deposit">Depósito</option>
                    <option value="withdrawal">Retirada</option>
                  </select>
                </div>
                <div>
                  <Label>Valor</Label>
                  <Input type="number" step="0.01" min="0" value={walletForm.amount} onChange={(e) => setWalletForm(p => ({ ...p, amount: e.target.value }))} />
                </div>
                <div className="md:col-span-2">
                  <Label>Descrição</Label>
                  <Input value={walletForm.description} onChange={(e) => setWalletForm(p => ({ ...p, description: e.target.value }))} />
                </div>
                <div className="md:col-span-4 flex justify-end">
                  <Button onClick={handleAddWallet}>Adicionar</Button>
                </div>
              </div>
              <div className="flex items-center justify-between p-3 rounded border bg-card/50">
                <div className="text-muted-foreground">Saldo</div>
                <div className="text-lg font-semibold">{balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</div>
              </div>
              <div className="space-y-2">
                {walletEntries.length === 0 ? (
                  <p className="text-muted-foreground">Sem lançamentos.</p>
                ) : walletEntries.map(e => (
                  <div key={e.id} className="p-3 rounded border flex items-center justify-between">
                    <div>
                      <div className="font-medium">{e.description || (e.type === 'deposit' ? 'Depósito' : 'Retirada')}</div>
                      <div className="text-xs text-muted-foreground">{format(e.createdAt, "d/MM/yyyy HH:mm")}</div>
                    </div>
                    <div className={`font-semibold ${e.type === 'deposit' ? 'text-success' : 'text-destructive'}`}>
                      {e.type === 'deposit' ? '+' : '-'} {e.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

