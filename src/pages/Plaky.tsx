import React, { useState } from 'react';
import { useAppContext } from '@/contexts/SupabaseAppContext';
import { PlakyBoard, PlakyColumn, PlakyItem } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Edit, Trash2, Trello, GripVertical, Calendar, User, Hash, List, MoreHorizontal, CheckCircle, Clock, AlertCircle, FolderOpen } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// Special board ID for the HOJE! board
const HOJE_BOARD_ID = 'hoje-board';

// Get today's date in YYYY-MM-DD format for comparison
const getTodayDateString = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

export default function Plaky() {
  const {
    plakyBoards,
    plakyItems,
    projects,
    tasks,
    contacts,
    addPlakyBoard,
    updatePlakyBoard,
    deletePlakyBoard,
    addPlakyItem,
    updatePlakyItem,
    deletePlakyItem,
    updateTask
  } = useAppContext();
  
  // Get today's tasks
  const todayTasks = tasks.filter(task => {
    const taskDate = new Date(task.date).toISOString().split('T')[0];
    return taskDate === getTodayDateString();
  });
  
  // Create a proper board object for the HOJE! board with correct PlakyColumn types
  const hojeBoard = React.useMemo((): PlakyBoard => ({
    id: HOJE_BOARD_ID,
    name: 'HOJE!',
    description: 'Tarefas para hoje',
    color: '#10B981',
    projectId: undefined,
    columns: [
      { id: 'todo', name: 'A Fazer', type: 'status' as const, options: ['A Fazer', 'Em Progresso', 'Concluído'], order: 1 },
      { id: 'inprogress', name: 'Em Progresso', type: 'status' as const, options: ['A Fazer', 'Em Progresso', 'Concluído'], order: 2 },
      { id: 'done', name: 'Concluído', type: 'status' as const, options: ['A Fazer', 'Em Progresso', 'Concluído'], order: 3 }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  }), []);

  // Add HOJE board if it doesn't exist
  const allBoards = React.useMemo(() => {
    const hojeBoardExists = plakyBoards.some(b => b.id === HOJE_BOARD_ID);
    
    if (!hojeBoardExists && todayTasks.length > 0) {
      // Add HOJE board at the beginning of the list
      return [hojeBoard, ...plakyBoards];
    } else if (hojeBoardExists) {
      // If HOJE board exists, make sure it's up to date
      return plakyBoards.map(board => 
        board.id === HOJE_BOARD_ID ? { ...hojeBoard, ...board } : board
      );
    }
    
    return plakyBoards;
  }, [plakyBoards, todayTasks, hojeBoard]);

  // State for selected board
  const [selectedBoard, setSelectedBoard] = React.useState<PlakyBoard | null>(null);

  // Ensure HOJE! board is selected by default if it exists and no board is selected
  React.useEffect(() => {
    if (allBoards.length > 0 && !selectedBoard) {
      const hojeBoard = allBoards.find(b => b.id === HOJE_BOARD_ID);
      if (hojeBoard) {
        setSelectedBoard(hojeBoard);
      } else if (allBoards.length > 0) {
        setSelectedBoard(allBoards[0]);
      }
    }
  }, [allBoards, selectedBoard]);

  // Create plaky items for today's tasks if they don't exist
  React.useEffect(() => {
    todayTasks.forEach(task => {
      const itemExists = plakyItems.some(item => item.taskId === task.id);
      
      if (!itemExists) {
        addPlakyItem({
          boardId: HOJE_BOARD_ID,
          taskId: task.id,
          values: {
            'todo': task.completed ? '' : task.title,
            'inprogress': '',
            'done': task.completed ? task.title : ''
          },
          personIds: [],
          tags: [],
        });
      }
    });
  }, [todayTasks]);

  const [newBoard, setNewBoard] = useState({
    name: '',
    description: '',
    color: '#3B82F6',
    projectId: ''
  });

  const [newColumn, setNewColumn] = useState({
    name: '',
    type: 'text' as const,
    options: [] as string[]
  });

  const [newItem, setNewItem] = useState({
    values: {} as Record<string, any>,
    taskId: '',
    personIds: [] as string[],
    tags: [] as string[]
  });

  const [draggedItem, setDraggedItem] = useState<string | null>(null);

  // Colunas padrão baseadas no status das tarefas
  const defaultColumns: PlakyColumn[] = [
    { id: 'todo', name: 'A Fazer', type: 'status' as const, options: ['A Fazer', 'Em Progresso', 'Concluído'], order: 1 },
    { id: 'inprogress', name: 'Em Progresso', type: 'status' as const, options: ['A Fazer', 'Em Progresso', 'Concluído'], order: 2 },
    { id: 'done', name: 'Concluído', type: 'status' as const, options: ['A Fazer', 'Em Progresso', 'Concluído'], order: 3 }
  ];

  const createBoard = () => {
    if (!newBoard.name.trim()) return;
    
    const board: Omit<PlakyBoard, 'id' | 'createdAt' | 'updatedAt'> = {
      name: newBoard.name,
      description: newBoard.description,
      color: newBoard.color,
      projectId: newBoard.projectId || undefined,
      columns: defaultColumns
    };

    addPlakyBoard(board);
    setNewBoard({ name: '', description: '', color: '#3B82F6', projectId: '' });
  };

  const isColumnWithOptions = (type: string): type is 'dropdown' | 'status' => {
    return type === 'dropdown' || type === 'status';
  };

  const addColumnToBoard = (boardId: string) => {
    if (!newColumn.name.trim()) return;

    const column: PlakyColumn = {
      id: Date.now().toString(),
      name: newColumn.name,
      type: newColumn.type,
      options: isColumnWithOptions(newColumn.type) ? newColumn.options : [],
      order: (plakyBoards.find(b => b.id === boardId)?.columns.length || 0) + 1
    };

    updatePlakyBoard(boardId, {
      columns: [...(plakyBoards.find(b => b.id === boardId)?.columns || []), column]
    });

    setNewColumn({ name: '', type: 'text', options: [] });
  };

  const addItemToColumn = (boardId: string, columnId: string) => {
    if (!newItem.values[columnId]?.trim()) return;

    const item: Omit<PlakyItem, 'id' | 'createdAt' | 'updatedAt'> = {
      boardId,
      taskId: newItem.taskId || undefined,
      personIds: newItem.personIds,
      values: { [columnId]: newItem.values[columnId] },
      tags: newItem.tags
    };

    addPlakyItem(item);
    setNewItem({ values: {}, taskId: '', personIds: [], tags: [] });
  };

  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    setDraggedItem(itemId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, targetColumnId: string) => {
    e.preventDefault();
    if (!draggedItem) return;

    const item = plakyItems.find(i => i.id === draggedItem);
    if (!item) return;

    // Update item values to move it to the new column
    const newValues = { ...item.values };
    // Remove from old column and add to new column
    Object.keys(newValues).forEach(key => {
      if (newValues[key] && key !== targetColumnId) {
        delete newValues[key];
      }
    });
    newValues[targetColumnId] = item.values[Object.keys(item.values)[0]] || '';

    updatePlakyItem(draggedItem, { values: newValues });
    setDraggedItem(null);
  };

  const getProjectById = (id: string) => projects.find(p => p.id === id);
  const getTaskById = (id: string) => tasks.find(t => t.id === id);
  const getPersonById = (id: string) => contacts.find(c => c.id === id);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'A Fazer':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'Em Progresso':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'Concluído':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return <List className="w-4 h-4 text-gray-500" />;
    }
  };

  const handleTaskStatusChange = (taskId: string, newStatus: 'todo' | 'inprogress' | 'done') => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    // Update task completion status based on the column
    const completed = newStatus === 'done';
    updateTask(taskId, { completed });
    
    // Update the plaky item to reflect the change
    const item = plakyItems.find(item => item.taskId === taskId && item.boardId === HOJE_BOARD_ID);
    if (item) {
      updatePlakyItem(item.id, {
        values: {
          'todo': newStatus === 'todo' ? task.title : '',
          'inprogress': newStatus === 'inprogress' ? task.title : '',
          'done': newStatus === 'done' ? task.title : ''
        }
      });
    }
  };

  const renderColumnContent = (column: PlakyColumn, boardId: string) => {
    const isHojeBoard = boardId === HOJE_BOARD_ID;
    let columnItems = [];
    
    if (isHojeBoard) {
      // For HOJE! board, show today's tasks in the appropriate column
      columnItems = todayTasks
        .filter(task => {
          const item = plakyItems.find(item => item.taskId === task.id && item.boardId === HOJE_BOARD_ID);
          if (!item) return false;
          return item.values[column.id] === task.title;
        })
        .map(task => ({
          id: task.id,
          taskId: task.id,
          boardId: HOJE_BOARD_ID,
          values: { [column.id]: task.title },
          personIds: [],
          tags: [],
          createdAt: new Date(),
          updatedAt: new Date()
        }));
    } else {
      // For regular boards, use the existing logic
      columnItems = plakyItems.filter(item => 
        item.boardId === boardId && 
        Object.keys(item.values).some(key => key === column.id && item.values[key])
      );
    }

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-sm">{column.name}</h3>
          <Badge variant="secondary" className="text-xs">
            {columnItems.length}
          </Badge>
        </div>

        {/* Add new item */}
        <div className="space-y-2">
          <Input
            placeholder="Adicionar item..."
            value={newItem.values[column.id] || ''}
            onChange={(e) => setNewItem({
              ...newItem,
              values: { ...newItem.values, [column.id]: e.target.value }
            })}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                addItemToColumn(boardId, column.id);
              }
            }}
          />
          
          {/* Task selection */}
          <Select value={newItem.taskId} onValueChange={(value) => setNewItem({ ...newItem, taskId: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Vincular a tarefa (opcional)" />
            </SelectTrigger>
            <SelectContent>
              {tasks.map((task) => (
                <SelectItem key={task.id} value={task.id}>
                  <div className="flex items-center gap-2">
                    <CheckCircle className={`w-4 h-4 ${task.completed ? 'text-green-500' : 'text-gray-400'}`} />
                    {task.title}
                    {task.projectId && (
                      <Badge variant="outline" className="text-xs">
                        {getProjectById(task.projectId)?.name}
                      </Badge>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* People selection */}
          <Select onValueChange={(value) => {
            if (!newItem.personIds.includes(value)) {
              setNewItem({ ...newItem, personIds: [...newItem.personIds, value] });
            }
          }}>
            <SelectTrigger>
              <SelectValue placeholder="Adicionar pessoa responsável" />
            </SelectTrigger>
            <SelectContent>
              {contacts.map((contact) => (
                <SelectItem key={contact.id} value={contact.id}>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    {contact.name}
                    <div className="flex gap-1">
                      {contact.skills.slice(0, 2).map(skill => (
                        <Badge key={skill} variant="secondary" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {newItem.personIds.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {newItem.personIds.map(personId => {
                const person = getPersonById(personId);
                return person ? (
                  <Badge key={personId} variant="outline" className="text-xs flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {person.name}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-3 w-3 p-0 ml-1"
                      onClick={() => setNewItem({
                        ...newItem,
                        personIds: newItem.personIds.filter(id => id !== personId)
                      })}
                    >
                      ×
                    </Button>
                  </Badge>
                ) : null;
              })}
            </div>
          )}

          <Button 
            size="sm" 
            className="w-full"
            onClick={() => addItemToColumn(boardId, column.id)}
          >
            <Plus className="w-3 h-3 mr-1" />
            Adicionar
          </Button>
        </div>

        {/* Items */}
        <div className="space-y-2">
          {columnItems.map((item) => (
            <Card 
              key={item.id} 
              className="cursor-move hover:shadow-md transition-shadow"
              draggable
              onDragStart={(e) => handleDragStart(e, item.id)}
            >
              <CardContent className="p-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium">{item.values[column.id]}</p>
                    
                    {/* Task info */}
                    {item.taskId && (
                      <p className="text-sm text-muted-foreground">
                        {boardId === HOJE_BOARD_ID 
                          ? `Atualizado em ${format(new Date(), 'HH:mm')}` 
                          : 'Tarefa vinculada'}
                      </p>
                    )}

                    {/* People info */}
                    {item.personIds.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {item.personIds.map(personId => {
                          const person = getPersonById(personId);
                          return person ? (
                            <Badge key={personId} variant="outline" className="text-xs">
                              <User className="w-3 h-3 mr-1" />
                              {person.name}
                            </Badge>
                          ) : null;
                        })}
                      </div>
                    )}

                    {/* Tags */}
                    {item.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {item.tags.map(tag => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <span>#{item.id.slice(-4)}</span>
                      <span>{format(item.createdAt, 'dd/MM', { locale: ptBR })}</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <MoreHorizontal className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Plaky</h1>
          <p className="text-muted-foreground">Quadros Kanban integrados com tarefas e pessoas</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Novo Quadro
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Quadro</DialogTitle>
              <DialogDescription>Crie um novo quadro Kanban</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="board-name">Nome</Label>
                <Input
                  id="board-name"
                  value={newBoard.name}
                  onChange={(e) => setNewBoard({ ...newBoard, name: e.target.value })}
                  placeholder="Nome do quadro"
                />
              </div>
              <div>
                <Label htmlFor="board-description">Descrição</Label>
                <Textarea
                  id="board-description"
                  value={newBoard.description}
                  onChange={(e) => setNewBoard({ ...newBoard, description: e.target.value })}
                  placeholder="Descrição do quadro"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="board-color">Cor</Label>
                  <Input
                    id="board-color"
                    type="color"
                    value={newBoard.color}
                    onChange={(e) => setNewBoard({ ...newBoard, color: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="board-project">Projeto (opcional)</Label>
                  <Select value={newBoard.projectId} onValueChange={(value) => setNewBoard({ ...newBoard, projectId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um projeto" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="no-project">Sem projeto</SelectItem>
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
              <Button onClick={createBoard} className="w-full">
                Criar Quadro
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="boards" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="boards">Quadros</TabsTrigger>
          <TabsTrigger value="kanban">Kanban</TabsTrigger>
        </TabsList>

        {/* Boards Tab */}
        <TabsContent value="boards" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[hojeBoard, ...allBoards.filter(b => b.id !== HOJE_BOARD_ID)].map((board) => (
              <Card key={board.id} className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ backgroundColor: board.color }}
                    />
                    <h3 className="font-medium">
                      {board.name}
                      {board.id === HOJE_BOARD_ID && (
                        <span className="ml-2 text-xs px-2 py-0.5 bg-green-100 text-green-800 rounded-full">
                          {todayTasks.length} tarefas
                        </span>
                      )}
                    </h3>
                  </div>
                  <CardDescription>{board.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {board.projectId && (
                    <div className="flex items-center gap-2 text-sm">
                      <FolderOpen className="w-4 h-4 text-muted-foreground" />
                      <span>{getProjectById(board.projectId)?.name}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Trello className="w-4 h-4" />
                    <span>{board.columns.length} colunas</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Hash className="w-4 h-4" />
                    <span>{plakyItems.filter(item => item.boardId === board.id).length} itens</span>
                  </div>
                  <div className="flex items-center gap-2 pt-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => setSelectedBoard(board)}
                    >
                      Abrir
                    </Button>
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => deletePlakyBoard(board.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Kanban Tab */}
        <TabsContent value="kanban" className="space-y-4">
          {selectedBoard ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-4 h-4 rounded-full" 
                    style={{ backgroundColor: selectedBoard.color }}
                  />
                  <h2 className="text-xl font-bold">
                    {selectedBoard.name}
                    {selectedBoard.id === HOJE_BOARD_ID && (
                      <span className="ml-2 text-sm font-normal text-muted-foreground">
                        {todayTasks.length} tarefas para hoje
                      </span>
                    )}
                  </h2>
                  {selectedBoard.projectId && (
                    <Badge variant="outline">
                      {getProjectById(selectedBoard.projectId)?.name}
                    </Badge>
                  )}
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setSelectedBoard(null)}
                  >
                    Voltar
                  </Button>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="w-4 h-4 mr-2" />
                      Nova Coluna
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Nova Coluna</DialogTitle>
                      <DialogDescription>Adicione uma nova coluna ao quadro</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="column-name">Nome</Label>
                        <Input
                          id="column-name"
                          value={newColumn.name}
                          onChange={(e) => setNewColumn({ ...newColumn, name: e.target.value })}
                          placeholder="Nome da coluna"
                        />
                      </div>
                      <div>
                        <Label htmlFor="column-type">Tipo</Label>
                        <Select value={newColumn.type} onValueChange={(value: any) => setNewColumn({ ...newColumn, type: value })}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">Texto</SelectItem>
                            <SelectItem value="number">Número</SelectItem>
                            <SelectItem value="date">Data</SelectItem>
                            <SelectItem value="status">Status</SelectItem>
                            <SelectItem value="person">Pessoa</SelectItem>
                            <SelectItem value="dropdown">Dropdown</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {isColumnWithOptions(newColumn.type) && (
                        <div>
                          <Label htmlFor="column-options">Opções (uma por linha)</Label>
                          <Textarea
                            id="column-options"
                            value={newColumn.options.join('\n')}
                            onChange={(e) => setNewColumn({
                              ...newColumn,
                              options: e.target.value.split('\n').filter(opt => opt.trim())
                            })}
                            placeholder="Opção 1&#10;Opção 2&#10;Opção 3"
                          />
                        </div>
                      )}
                      <Button 
                        onClick={() => addColumnToBoard(selectedBoard.id)} 
                        className="w-full"
                      >
                        Adicionar Coluna
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid gap-6" style={{ gridTemplateColumns: `repeat(${selectedBoard.columns.length}, 1fr)` }}>
                {selectedBoard.columns.map((column) => (
                  <div
                    key={column.id}
                    className="bg-muted/30 rounded-lg p-4 min-h-[500px]"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, column.id)}
                  >
                    {renderColumnContent(column, selectedBoard.id)}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <Trello className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhum quadro selecionado</h3>
              <p className="text-muted-foreground mb-4">
                Selecione um quadro da aba "Quadros" para visualizar o Kanban
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
} 