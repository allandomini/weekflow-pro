import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog";
import { useAppContext } from "@/contexts/SupabaseAppContext";
import { Sparkles, Send, Bot, User, TrendingUp, Calendar, Users, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { isGeminiConfigured, generateGeminiResponse } from "@/lib/gemini";

interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

interface Recommendation {
  id: string;
  title: string;
  description: string;
  category: 'task' | 'finance' | 'contact' | 'project';
  priority: 'low' | 'medium' | 'high';
  data: any;
}

export function GeminiChat() {
  const { tasks, projects, contacts, transactions, aiSettings } = useAppContext();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Auto-generate recommendations based on data analysis
  useEffect(() => {
    generateRecommendations();
  }, [tasks, projects, contacts, transactions]);

  const generateRecommendations = () => {
    const newRecommendations: Recommendation[] = [];

    // Task analysis - using date field instead of dueDate
    const overdueTasks = tasks.filter(task => 
      !task.completed && new Date(task.date) < new Date()
    );
    
    if (overdueTasks.length > 0) {
      newRecommendations.push({
        id: 'overdue-tasks',
        title: `${overdueTasks.length} tarefas em atraso`,
        description: 'Você tem tarefas pendentes que passaram do prazo. Considere repriorizar ou redistribuir.',
        category: 'task',
        priority: 'high',
        data: overdueTasks
      });
    }

    // Project analysis
    const projectsWithoutTasks = projects.filter(project => 
      !tasks.some(task => task.projectId === project.id)
    );
    
    if (projectsWithoutTasks.length > 0) {
      newRecommendations.push({
        id: 'empty-projects',
        title: `${projectsWithoutTasks.length} projetos sem tarefas`,
        description: 'Estes projetos podem precisar de planejamento ou estar inativos.',
        category: 'project',
        priority: 'medium',
        data: projectsWithoutTasks
      });
    }

    // Finance analysis
    const expensesThisMonth = transactions.filter(transaction => 
      transaction.type === 'withdrawal' && 
      new Date(transaction.date).getMonth() === new Date().getMonth()
    );
    
    if (expensesThisMonth.length > 10) {
      newRecommendations.push({
        id: 'high-expenses',
        title: 'Alto número de despesas',
        description: `${expensesThisMonth.length} despesas este mês. Considere revisar o orçamento.`,
        category: 'finance',
        priority: 'medium',
        data: expensesThisMonth
      });
    }

    // Contact analysis
    const contactsWithoutProjects = contacts.filter(contact => 
      contact.projectIds.length === 0
    );
    
    if (contactsWithoutProjects.length > 5) {
      newRecommendations.push({
        id: 'unused-contacts',
        title: `${contactsWithoutProjects.length} contatos não vinculados`,
        description: 'Considere associar estes contatos a projetos ativos.',
        category: 'contact',
        priority: 'low',
        data: contactsWithoutProjects
      });
    }

    setRecommendations(newRecommendations);
  };

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;
    if (!aiSettings.enabled) {
      toast({ title: "Assistente desabilitado", description: "Ative o Gemini em Configurações para usar o chat.", variant: "destructive" });
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      // Create context from user data (expanded if deep analysis enabled)
      const basicContext = {
        tasks: tasks.length,
        completedTasks: tasks.filter(t => t.completed).length,
        projects: projects.length,
        contacts: contacts.length,
        totalRevenue: transactions.filter(t => t.type === 'deposit').reduce((sum, t) => sum + t.amount, 0),
        totalExpenses: transactions.filter(t => t.type === 'withdrawal').reduce((sum, t) => sum + t.amount, 0),
        overdueTasks: tasks.filter(task => !task.completed && new Date(task.date) < new Date()).length,
      } as any;

      let context: any = basicContext;
      if (aiSettings.deepAnalysis) {
        const max = Math.max(1, aiSettings.maxContextItems ?? 100);
        const recentTasks = [...tasks]
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
          .slice(-max)
          .map(t => ({ id: t.id, title: t.title, completed: t.completed, date: t.date, projectId: t.projectId }));
        const overdueTasksList = tasks
          .filter(task => !task.completed && new Date(task.date) < new Date())
          .slice(0, max)
          .map(t => ({ id: t.id, title: t.title, date: t.date, projectId: t.projectId }));
        const projectsDetail = projects.slice(0, max).map(p => ({ id: p.id, name: p.name, status: (p as any).status }));
        const contactsSample = contacts.slice(0, max).map(c => ({ id: c.id, name: c.name, skills: c.skills, projectCount: c.projectIds?.length ?? 0 }));
        const month = new Date().getMonth();
        const expensesThisMonth = transactions.filter(t => t.type === 'withdrawal' && new Date(t.date).getMonth() === month)
          .slice(0, max).map(t => ({ id: t.id, amount: t.amount, date: t.date, accountId: t.accountId }));
        const revenuesThisMonth = transactions.filter(t => t.type === 'deposit' && new Date(t.date).getMonth() === month)
          .slice(0, max).map(t => ({ id: t.id, amount: t.amount, date: t.date, accountId: t.accountId }));

        context = {
          ...basicContext,
          recentTasks,
          overdueTasksList,
          projectsDetail,
          contactsSample,
          expensesThisMonth,
          revenuesThisMonth,
          model: aiSettings.model,
          maxContextItems: max,
        };
      }

      // Prefer real Gemini API when configured, fallback to simulator
      let response: string;
      if (isGeminiConfigured()) {
        try {
          response = await generateGeminiResponse(content, context, aiSettings.model);
        } catch (apiErr) {
          // fallback gracefully to simulator on API errors
          response = await simulateGeminiResponse(content, context);
        }
      } else {
        response = await simulateGeminiResponse(content, context);
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response,
        role: 'assistant',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao enviar mensagem. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const simulateGeminiResponse = async (message: string, context: any): Promise<string> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const lowerMessage = message.toLowerCase();

    if (lowerMessage.includes('tarefa') || lowerMessage.includes('task')) {
      return `Com base nos seus dados, você tem ${context.tasks} tarefas no total, ${context.completedTasks} completadas e ${context.overdueTasks} em atraso. Posso ajudar você a priorizar as tarefas pendentes ou criar um plano para as que estão atrasadas.`;
    }

    if (lowerMessage.includes('projeto') || lowerMessage.includes('project')) {
      return `Você tem ${context.projects} projetos ativos. Baseado na análise, sugiro focar nos projetos com maior número de tarefas pendentes para manter o momentum.`;
    }

    if (lowerMessage.includes('financ') || lowerMessage.includes('money') || lowerMessage.includes('dinheiro')) {
      const profit = context.totalRevenue - context.totalExpenses;
      return `Sua situação financeira atual: R$ ${context.totalRevenue.toFixed(2)} em receitas, R$ ${context.totalExpenses.toFixed(2)} em despesas, resultando em ${profit >= 0 ? 'lucro' : 'prejuízo'} de R$ ${Math.abs(profit).toFixed(2)}.`;
    }

    if (lowerMessage.includes('produtividade') || lowerMessage.includes('performance')) {
      const completionRate = context.tasks > 0 ? (context.completedTasks / context.tasks * 100).toFixed(1) : 0;
      return `Sua taxa de conclusão de tarefas é ${completionRate}%. ${context.overdueTasks > 0 ? `Você tem ${context.overdueTasks} tarefas em atraso que podem estar impactando sua produtividade.` : 'Excelente trabalho mantendo as tarefas em dia!'}`;
    }

    return `Entendi sua pergunta sobre "${message}". Com base nos seus dados (${context.tasks} tarefas, ${context.projects} projetos, ${context.contacts} contatos), posso ajudar com análises específicas, sugestões de otimização ou planejamento estratégico. O que gostaria de saber especificamente?`;
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'task': return <Calendar className="w-4 h-4" />;
      case 'project': return <TrendingUp className="w-4 h-4" />;
      case 'finance': return <DollarSign className="w-4 h-4" />;
      case 'contact': return <Users className="w-4 h-4" />;
      default: return <Sparkles className="w-4 h-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'default';
    }
  };

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="gradient" className="fixed bottom-6 right-6 rounded-full w-14 h-14 shadow-glow">
          <Sparkles className="w-6 h-6" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            {aiSettings.enabled ? 'Assistente Gemini' : 'Recomendações da Stephany'}
          </DialogTitle>
          <DialogDescription>
            {aiSettings.enabled 
              ? 'Converse com seu assistente de IA para obter insights sobre seus dados e produtividade.'
              : 'Receba recomendações personalizadas baseadas em suas atividades e metas.'
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className={`flex-1 grid grid-cols-1 ${aiSettings.enabled ? 'lg:grid-cols-3' : ''} gap-4 min-h-0`}>
          {/* Chat Area (only when AI enabled) */}
          {aiSettings.enabled && (
          <div className="lg:col-span-2 flex flex-col">
            <ScrollArea ref={scrollAreaRef} className="flex-1 pr-4 h-[400px]">
              <div className="space-y-4">
                {messages.length === 0 && (
                  <div className="text-center text-muted-foreground py-8">
                    <Bot className="w-12 h-12 mx-auto mb-4 text-primary" />
                    <p>Olá! Sou seu assistente inteligente.</p>
                    <p className="text-sm">Posso analisar seus dados e fornecer insights sobre produtividade, finanças e projetos.</p>
                  </div>
                )}
                
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.role === 'assistant' && (
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-primary" />
                      </div>
                    )}
                    <div className={`max-w-[80%] rounded-lg p-3 ${
                      message.role === 'user' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted'
                    }`}>
                      <p className="text-sm">{message.content}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {message.timestamp.toLocaleTimeString()}
                      </p>
                    </div>
                    {message.role === 'user' && (
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex gap-3 justify-start">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-primary" />
                    </div>
                    <div className="bg-muted rounded-lg p-3">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:0.1s]" />
                        <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:0.2s]" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
            
            <div className="flex gap-2 mt-4">
              <Input
                placeholder="Digite sua pergunta..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage(input)}
                disabled={isLoading}
              />
              <Button 
                onClick={() => sendMessage(input)}
                disabled={isLoading || !input.trim()}
                size="icon"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
          )}
          
          {/* Recommendations Panel */}
          <div className={aiSettings.enabled ? 'lg:col-span-1' : ''}>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  Recomendações da Stephany
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px]">
                  <div className="space-y-3">
                    {recommendations.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        Nenhuma recomendação no momento. Continue usando o sistema para receber insights!
                      </p>
                    ) : (
                      recommendations.map((rec) => (
                        <Card key={rec.id} className="p-3">
                          <div className="flex items-start gap-2 mb-2">
                            {getCategoryIcon(rec.category)}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-sm">{rec.title}</h4>
                              <p className="text-xs text-muted-foreground mt-1">
                                {rec.description}
                              </p>
                            </div>
                            <Badge variant={getPriorityColor(rec.priority)} className="text-xs">
                              {rec.priority}
                            </Badge>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full text-xs"
                            onClick={() => sendMessage(`Me ajude com: ${rec.title}`)}
                            disabled={!aiSettings.enabled}
                          >
                            {aiSettings.enabled ? 'Analisar' : 'Ative o assistente para analisar'}
                          </Button>
                        </Card>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}