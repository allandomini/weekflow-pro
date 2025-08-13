import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "@/contexts/AppContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Clock,
  X,
  CheckSquare,
  Undo2,
  Trash2,
  Receipt,
  Pencil,
  UserPlus,
  UserRoundPen,
  UserX,
  FolderPlus,
  FolderPen,
  FolderX,
  StickyNote,
  BadgeDollarSign,
  CheckCircle2
} from "lucide-react";
import { format, isToday, isYesterday } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function Historico() {
  const navigate = useNavigate();
  const { activities, clearActivities } = useApp();
  const [query, setQuery] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [actorFilter, setActorFilter] = useState("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const actorQ = actorFilter.trim().toLowerCase();
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    if (end) {
      end.setHours(23, 59, 59, 999);
    }
    return activities.filter(a => {
      const at = new Date(a.at);
      if (start && at < start) return false;
      if (end && at > end) return false;
      if (actionFilter !== "all" && a.action !== actionFilter) return false;
      if (actorQ && !a.actor.toLowerCase().includes(actorQ)) return false;
      if (q) {
        const label = a.entity?.label?.toLowerCase() || "";
        if (!(label.includes(q) || a.action.includes(q))) return false;
      }
      return true;
    });
  }, [activities, query, actionFilter, actorFilter, startDate, endDate]);

  const formatDayLabel = (date: Date) => {
    if (isToday(date)) return "Hoje";
    if (isYesterday(date)) return "Ontem";
    return format(date, "dd 'de' MMMM, yyyy", { locale: ptBR });
  };

  const iconForAction = (action: string) => {
    switch (action) {
      case 'task_created': return <CheckSquare className="w-4 h-4 text-foreground" />;
      case 'task_completed': return <CheckCircle2 className="w-4 h-4 text-success" />;
      case 'task_uncompleted': return <Undo2 className="w-4 h-4 text-warning" />;
      case 'task_deleted': return <Trash2 className="w-4 h-4 text-destructive" />;
      case 'transaction_added': return <Receipt className="w-4 h-4 text-foreground" />;
      case 'transaction_updated': return <Pencil className="w-4 h-4 text-foreground" />;
      case 'transaction_deleted': return <Trash2 className="w-4 h-4 text-destructive" />;
      case 'contact_added': return <UserPlus className="w-4 h-4 text-foreground" />;
      case 'contact_updated': return <UserRoundPen className="w-4 h-4 text-foreground" />;
      case 'contact_deleted': return <UserX className="w-4 h-4 text-destructive" />;
      case 'project_added': return <FolderPlus className="w-4 h-4 text-foreground" />;
      case 'project_updated': return <FolderPen className="w-4 h-4 text-foreground" />;
      case 'project_deleted': return <FolderX className="w-4 h-4 text-destructive" />;
      case 'note_added': return <StickyNote className="w-4 h-4 text-foreground" />;
      case 'note_updated': return <StickyNote className="w-4 h-4 text-foreground" />;
      case 'note_deleted': return <Trash2 className="w-4 h-4 text-destructive" />;
      case 'receivable_added': return <BadgeDollarSign className="w-4 h-4 text-foreground" />;
      case 'receivable_updated': return <BadgeDollarSign className="w-4 h-4 text-foreground" />;
      case 'receivable_deleted': return <Trash2 className="w-4 h-4 text-destructive" />;
      case 'receivable_received': return <CheckCircle2 className="w-4 h-4 text-success" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const pathForEntity = (type?: string, id?: string) => {
    if (!type || !id) return null;
    if (type === 'project') return `/projects/${id}`;
    return null; // other entity pages not linked yet
  };

  const exportActivities = () => {
    const data = JSON.stringify(activities, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `activities-${format(new Date(), 'yyyyMMdd-HHmmss')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Group by date (yyyy-MM-dd)
  const groups = useMemo(() => {
    const map = new Map<string, { label: string; items: typeof activities }>();
    for (const a of filtered) {
      const d = new Date(a.at);
      const key = format(d, "yyyy-MM-dd");
      if (!map.has(key)) {
        map.set(key, { label: formatDayLabel(d), items: [] as any });
      }
      map.get(key)!.items.push(a);
    }
    // Keep original order (activities already newest first)
    return Array.from(map.entries()).sort(([a], [b]) => (a < b ? 1 : -1));
  }, [filtered]);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground flex items-center gap-2">
            <Clock className="w-6 h-6" /> Histórico de Atividades
          </h1>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={exportActivities}>Exportar</Button>
            <Button variant="destructive" onClick={() => clearActivities()}>Limpar</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="relative md:col-span-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por título/ação..."
              className="pr-8"
            />
            {query && (
              <button
                aria-label="Limpar busca"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground"
                onClick={() => setQuery("")}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div>
            <select
              className="w-full h-10 rounded-md border bg-background px-3 text-sm"
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
            >
              <option value="all">Todas as ações</option>
              <option value="task_created">Tarefa criada</option>
              <option value="task_completed">Tarefa concluída</option>
              <option value="task_uncompleted">Tarefa reaberta</option>
              <option value="task_deleted">Tarefa excluída</option>
              <option value="transaction_added">Transação adicionada</option>
              <option value="transaction_updated">Transação atualizada</option>
              <option value="transaction_deleted">Transação excluída</option>
              <option value="contact_added">Contato adicionado</option>
              <option value="contact_updated">Contato atualizado</option>
              <option value="contact_deleted">Contato excluído</option>
              <option value="project_added">Projeto adicionado</option>
              <option value="project_updated">Projeto atualizado</option>
              <option value="project_deleted">Projeto excluído</option>
              <option value="note_added">Nota adicionada</option>
              <option value="note_updated">Nota atualizada</option>
              <option value="note_deleted">Nota excluída</option>
              <option value="receivable_added">A receber adicionado</option>
              <option value="receivable_updated">A receber atualizado</option>
              <option value="receivable_deleted">A receber excluído</option>
              <option value="receivable_received">A receber recebido</option>
            </select>
          </div>

          <div>
            <Input
              value={actorFilter}
              onChange={(e) => setActorFilter(e.target.value)}
              placeholder="Filtrar por autor"
            />
          </div>

          <div className="flex gap-2">
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </div>
        </div>
      </div>

      {groups.length === 0 ? (
        <Card className="modern-card">
          <CardContent className="py-10 text-center text-muted-foreground">
            Nenhuma atividade encontrada
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {groups.map(([key, group]) => (
            <Card key={key} className="modern-card">
              <CardHeader>
                <CardTitle className="text-foreground">{group.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {group.items.map((a) => (
                    <div key={a.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                      <div className="mt-0.5 text-xs text-muted-foreground w-16 shrink-0">
                        {format(new Date(a.at), 'HH:mm')}
                      </div>
                      <div className="flex-1 text-sm text-foreground">
                        <div className="flex items-center gap-2">
                          {iconForAction(a.action)}
                          <span className="px-2 py-0.5 rounded bg-muted text-muted-foreground text-[11px] uppercase tracking-wide">{a.actor}</span>
                          <span className="text-muted-foreground text-xs">{a.action}</span>
                        </div>
                        <div className="mt-1">
                          {a.action === 'task_created' && (
                            <span>Criou tarefa <span className="font-medium">{a.entity?.label}</span></span>
                          )}
                          {a.action === 'task_completed' && (
                            <span>Concluiu tarefa <span className="font-medium">{a.entity?.label}</span></span>
                          )}
                          {a.action === 'task_uncompleted' && (
                            <span>Reabriu tarefa <span className="font-medium">{a.entity?.label}</span></span>
                          )}
                          {a.action === 'task_deleted' && (
                            <span>Excluiu uma tarefa</span>
                          )}
                          {a.action === 'transaction_added' && (
                            <span>Registrou transação <span className="font-medium">{a.entity?.label}</span></span>
                          )}
                          {a.action === 'transaction_updated' && (
                            <span>Editou transação <span className="font-medium">{a.entity?.label}</span></span>
                          )}
                          {a.action === 'transaction_deleted' && (
                            <span>Excluiu uma transação</span>
                          )}
                          {a.action === 'contact_added' && (
                            <span>Adicionou um contato</span>
                          )}
                          {(a.action.startsWith('project_') || a.entity?.type === 'project') && (
                            <span>
                              Projeto {a.action === 'project_added' ? 'criado' : a.action === 'project_updated' ? 'atualizado' : a.action === 'project_deleted' ? 'excluído' : ''}{' '}
                              {(() => {
                                const path = pathForEntity(a.entity?.type, a.entity?.id);
                                if (path) {
                                  return (
                                    <button className="underline" onClick={() => navigate(path)}>
                                      {a.entity?.label}
                                    </button>
                                  );
                                }
                                return <span className="font-medium">{a.entity?.label}</span>;
                              })()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
