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
import { isGeminiConfigured, generateGeminiResponse, getGeminiCooldownRemaining } from "@/lib/gemini";
import { isGroqConfigured, generateGroqResponse } from "@/lib/groq";
import { conversationPersistence } from "@/lib/conversationPersistence";
import ReactMarkdown from 'react-markdown';

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
  const { tasks, projects, contacts, transactions, clockifyTimeEntries, aiSettings } = useAppContext();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [conversationLoaded, setConversationLoaded] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversation history on mount
  useEffect(() => {
    loadConversationHistory();
  }, []);

  // Auto-generate recommendations based on data analysis
  useEffect(() => {
    generateRecommendations();
  }, [tasks, projects, contacts, transactions]);

  const loadConversationHistory = async () => {
    try {
      const history = await conversationPersistence.loadConversationHistory();
      const loadedMessages: Message[] = history.map(msg => ({
        id: msg.messageId,
        content: msg.content,
        role: msg.role,
        timestamp: msg.timestamp
      }));
      setMessages(loadedMessages);
      setConversationLoaded(true);
    } catch (error) {
      console.error('Failed to load conversation history:', error);
      setConversationLoaded(true);
    }
  };

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

  // Hoisted simulator to avoid "used before declaration" lints
  async function simulateStephanyResponse(message: string, context: any): Promise<string> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const lowerMessage = message.toLowerCase();

    // Handle greetings and casual messages
    if (lowerMessage.match(/^(oi|olá|hello|hi)!?$/)) {
      return `Oi! 😊 Como posso te ajudar hoje? Posso analisar sua produtividade, finanças, projetos ou qualquer coisa relacionada aos seus dados.`;
    }

    // Handle inappropriate content with redirection
    if (
      lowerMessage.includes('maconha') ||
      lowerMessage.includes('droga') ||
      lowerMessage.includes('cague') ||
      lowerMessage.includes('fude') ||
      lowerMessage.includes('porra') ||
      lowerMessage.includes('caralho') ||
      lowerMessage.includes('mds')
    ) {
      // Empathic and action-focused
      const overdue = context.overdueTasks ?? 0;
      const nextStep = overdue > 0
        ? `Você tem ${overdue} tarefa${overdue>1?'s':''} em atraso. Quer que eu liste as 3 principais e te dê o primeiro passo agora?`
        : `Vamos escolher 1 tarefa importante agora. Quer priorizar por prazo ou impacto?`;
      return `Tamo junto. Bora resolver em 2 passos: 1) escolher a próxima ação 2) começar. ${nextStep}`;
    }

    // Handle productivity questions
    if (lowerMessage.includes('produtividade') || lowerMessage.includes('performance') || lowerMessage.includes('melhorar')) {
      const completionRate = context.tasks > 0 ? (context.completedTasks / context.tasks * 100).toFixed(1) : 0;
      const suggestions = [] as string[];
      
      if (context.overdueTasks > 0) {
        suggestions.push(`• Você tem ${context.overdueTasks} tarefas em atraso - priorize essas primeiro`);
      }
      
      if (context.totalClockifyHours > 0) {
        suggestions.push(`• Você registrou ${context.totalClockifyHours}h no Clockify - ótimo controle de tempo!`);
      }
      
      const projectsWithoutTasks = context.projects - (context.tasks > 0 ? 1 : 0);
      if (projectsWithoutTasks > 0) {
        suggestions.push(`• ${projectsWithoutTasks} projetos podem precisar de mais tarefas`);
      }

      return `Sua produtividade está em ${completionRate}%! 📊\n\n${suggestions.length > 0 ? 'Sugestões para melhorar:\n' + suggestions.join('\n') : 'Continue assim, está indo muito bem!'}`;
    }

    // Handle task-related questions
    if (lowerMessage.includes('tarefa') || lowerMessage.includes('task') || lowerMessage.includes('fazer')) {
      return `Você tem ${context.tasks} tarefas no total:\n• ✅ ${context.completedTasks} completadas\n• ⏰ ${context.overdueTasks} em atraso\n• 📋 ${context.tasks - context.completedTasks} pendentes\n\n${context.overdueTasks > 0 ? 'Foque nas tarefas em atraso primeiro!' : 'Parabéns pelo progresso! 🎉'}`;
    }

    // Handle project questions
    if (lowerMessage.includes('projeto') || lowerMessage.includes('project')) {
      return `Você tem ${context.projects} projetos ativos. ${context.totalClockifyHours > 0 ? `Já registrou ${context.totalClockifyHours}h de trabalho no Clockify.` : ''} Quer saber mais detalhes sobre algum projeto específico?`;
    }

    // Handle financial questions
    if (lowerMessage.includes('financ') || lowerMessage.includes('money') || lowerMessage.includes('dinheiro') || lowerMessage.includes('gasto')) {
      const profit = context.totalRevenue - context.totalExpenses;
      return `💰 Situação financeira:\n• Receitas: R$ ${context.totalRevenue.toFixed(2)}\n• Despesas: R$ ${context.totalExpenses.toFixed(2)}\n• ${profit >= 0 ? 'Lucro' : 'Prejuízo'}: R$ ${Math.abs(profit).toFixed(2)}\n\n${context.monthlyExpenses > 0 ? `Este mês você gastou R$ ${context.monthlyExpenses.toFixed(2)}.` : ''}`;
    }

    // Handle Clockify/time tracking questions
    if (lowerMessage.includes('clockify') || lowerMessage.includes('tempo') || lowerMessage.includes('horas')) {
      return `⏱️ Controle de tempo:\n• Total registrado: ${context.totalClockifyHours}h\n• Entradas ativas: ${context.clockifyEntries.filter((e: any) => e.isActive).length}\n\nContinue registrando seu tempo para ter insights mais precisos!`;
    }

    // Default response with context
    return `Entendi! Com base nos seus dados:\n• ${context.tasks} tarefas (${context.completedTasks} completas)\n• ${context.projects} projetos\n• ${context.contacts} contatos\n• ${context.totalClockifyHours}h registradas\n\nSobre o que gostaria de conversar especificamente? 🤔`;
  }

  const sendMessage = async (content: string) => {
    if (!content.trim()) return;
    if (!aiSettings.enabled) {
      toast({ title: "Assistente desabilitado", description: "Ative a Stephany em Configurações para usar o chat.", variant: "destructive" });
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

    // Save user message
    await conversationPersistence.saveMessage(
      userMessage.id,
      'user',
      content
    );

    try {
      // Create context from user data (expanded if deep analysis enabled)
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      const basicContext = {
        tasks: tasks.length,
        completedTasks: tasks.filter(t => t.completed).length,
        projects: projects.length,
        contacts: contacts.length,
        totalRevenue: transactions.filter(t => t.type === 'deposit').reduce((sum, t) => sum + t.amount, 0),
        totalExpenses: transactions.filter(t => t.type === 'withdrawal').reduce((sum, t) => sum + t.amount, 0),
        overdueTasks: tasks.filter(task => !task.completed && new Date(task.date) < new Date()).length,
        
        // Enhanced financial data
        monthlyExpenses: transactions.filter(t => 
          t.type === 'withdrawal' && 
          new Date(t.date).getMonth() === currentMonth &&
          new Date(t.date).getFullYear() === currentYear
        ).reduce((sum, t) => sum + t.amount, 0),
        
        // Expense categories this month
        expensesByCategory: transactions
          .filter(t => t.type === 'withdrawal' && 
            new Date(t.date).getMonth() === currentMonth &&
            new Date(t.date).getFullYear() === currentYear)
          .reduce((acc, t) => {
            const category = t.category || 'Sem categoria';
            acc[category] = (acc[category] || 0) + t.amount;
            return acc;
          }, {} as Record<string, number>),
          
        // Recent transactions for context
        recentTransactions: transactions
          .filter(t => new Date(t.date).getMonth() === currentMonth)
          .slice(0, 10)
          .map(t => ({
            amount: t.amount,
            type: t.type,
            description: t.description,
            category: t.category,
            date: t.date.toLocaleDateString('pt-BR')
          })),
          
        // Pending tasks with details
        pendingTasks: tasks
          .filter(t => !t.completed)
          .slice(0, 5)
          .map(t => ({
            title: t.title,
            date: t.date.toLocaleDateString('pt-BR'),
            isOverdue: new Date(t.date) < new Date(),
            projectId: t.projectId
          })),
          
        // Project details
        projectsDetail: projects.slice(0, 5).map(p => ({
          name: p.name,
          description: p.description,
          tasksCount: tasks.filter(t => t.projectId === p.id).length,
          completedTasks: tasks.filter(t => t.projectId === p.id && t.completed).length
        })),
        
        // Clockify time tracking data (duration in seconds, converted to hours)
        clockifyEntries: clockifyTimeEntries.slice(0, 10).map(entry => ({
          description: entry.description,
          duration: Math.round((entry.duration || 0) / 3600 * 100) / 100, // Convert seconds to hours (2 decimals)
          startTime: entry.startTime?.toLocaleDateString('pt-BR'),
          endTime: entry.endTime?.toLocaleDateString('pt-BR'),
          projectId: entry.projectId,
          projectName: projects.find(p => p.id === entry.projectId)?.name || 'Sem projeto'
        })),
        totalClockifyHours: Math.round(clockifyTimeEntries.reduce((total, entry) => total + (entry.duration || 0), 0) / 3600 * 100) / 100 // Convert total seconds to hours
      } as any;

      let context: any = basicContext;
      if (aiSettings.deepAnalysis) {
        const max = Math.max(1, aiSettings.maxContextItems ?? 500);
        
        // Enhanced detailed analysis with full transaction details
        const detailedExpensesThisMonth = transactions
          .filter(t => t.type === 'withdrawal' && 
            new Date(t.date).getMonth() === currentMonth &&
            new Date(t.date).getFullYear() === currentYear)
          .slice(0, max)
          .map(t => ({ 
            amount: t.amount, 
            description: t.description,
            category: t.category || 'Sem categoria',
            date: t.date.toLocaleDateString('pt-BR'),
            accountId: t.accountId 
          }));
          
        const detailedRevenuesThisMonth = transactions
          .filter(t => t.type === 'deposit' && 
            new Date(t.date).getMonth() === currentMonth &&
            new Date(t.date).getFullYear() === currentYear)
          .slice(0, max)
          .map(t => ({ 
            amount: t.amount, 
            description: t.description,
            category: t.category || 'Receita',
            date: t.date.toLocaleDateString('pt-BR'),
            accountId: t.accountId 
          }));

        // Enhanced task analysis
        const detailedTasks = tasks.slice(0, max).map(t => ({
          title: t.title,
          completed: t.completed,
          date: t.date.toLocaleDateString('pt-BR'),
          isOverdue: !t.completed && new Date(t.date) < new Date(),
          projectName: projects.find(p => p.id === t.projectId)?.name || 'Sem projeto',
          daysSinceCreation: Math.floor((new Date().getTime() - new Date(t.date).getTime()) / (1000 * 60 * 60 * 24))
        }));

        // Enhanced project analysis
        const detailedProjects = projects.slice(0, max).map(p => ({
          name: p.name,
          description: p.description,
          totalTasks: tasks.filter(t => t.projectId === p.id).length,
          completedTasks: tasks.filter(t => t.projectId === p.id && t.completed).length,
          overdueTasks: tasks.filter(t => t.projectId === p.id && !t.completed && new Date(t.date) < new Date()).length,
          progress: tasks.filter(t => t.projectId === p.id).length > 0 ? 
            Math.round((tasks.filter(t => t.projectId === p.id && t.completed).length / tasks.filter(t => t.projectId === p.id).length) * 100) : 0
        }));

        // Financial insights
        const topExpenseCategories = Object.entries(basicContext.expensesByCategory)
          .sort(([,a], [,b]) => (b as number) - (a as number))
          .slice(0, 5)
          .map(([category, amount]) => ({ category, amount, percentage: Math.round(((amount as number) / basicContext.monthlyExpenses) * 100) }));

        // Enhanced Clockify analysis (duration in seconds, converted to hours)
        const detailedClockifyEntries = clockifyTimeEntries.slice(0, max).map(entry => ({
          description: entry.description,
          duration: Math.round((entry.duration || 0) / 3600 * 100) / 100, // Convert seconds to hours (2 decimals)
          durationSeconds: entry.duration || 0, // Keep original seconds for accuracy
          startTime: entry.startTime?.toLocaleDateString('pt-BR'),
          endTime: entry.endTime?.toLocaleDateString('pt-BR'),
          projectName: projects.find(p => p.id === entry.projectId)?.name || 'Sem projeto',
          isActive: !entry.endTime,
          daysSinceStart: entry.startTime ? Math.floor((new Date().getTime() - entry.startTime.getTime()) / (1000 * 60 * 60 * 24)) : 0
        }));
        
        const clockifyByProject = clockifyTimeEntries.reduce((acc, entry) => {
          const projectName = projects.find(p => p.id === entry.projectId)?.name || 'Sem projeto';
          acc[projectName] = Math.round(((acc[projectName] || 0) + (entry.duration || 0)) / 3600 * 100) / 100; // Convert seconds to hours
          return acc;
        }, {} as Record<string, number>);

        context = {
          ...basicContext,
          detailedTasks,
          detailedProjects,
          detailedExpensesThisMonth,
          detailedRevenuesThisMonth,
          topExpenseCategories,
          detailedClockifyEntries,
          clockifyByProject,
          contactsSample: contacts.slice(0, max).map(c => ({ 
            name: c.name, 
            skills: c.skills, 
            projectCount: c.projectIds?.length ?? 0 
          })),
          model: aiSettings.model,
          maxContextItems: max,
          totalDataPoints: {
            tasks: tasks.length,
            projects: projects.length,
            transactions: transactions.length,
            contacts: contacts.length,
            clockifyEntries: clockifyTimeEntries.length
          },
          analysisDate: new Date().toLocaleDateString('pt-BR'),
          currentMonth: new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
        };
      }

      // Try APIs in order: Gemini → Groq → Simulator, with cooldown awareness
      let response: string;
      let apiUsed = 'simulator';
      let modelUsed = 'simulator';
      
      // Check if we need context bridging for model transitions
      const existingMessages = await conversationPersistence.loadConversationHistory();
      let contextWithBridge = context;
      
      if (isGeminiConfigured()) {
        const cooldownMs = getGeminiCooldownRemaining?.() ?? 0;
        if (cooldownMs > 0) {
          // Skip Gemini while cooling down
          if (isGroqConfigured()) {
            response = await generateGroqResponse(content, context, 'llama-3.1-8b-instant');
            apiUsed = 'groq';
            toast({
              title: "Stephany em cooldown",
              description: `Aguardando ${(cooldownMs/1000).toFixed(0)}s. Usando backup temporariamente.`,
              variant: "default"
            });
          } else {
            response = await simulateStephanyResponse(content, context);
            toast({
              title: "Stephany em cooldown",
              description: `Aguardando ${(cooldownMs/1000).toFixed(0)}s. Sem backup configurado, usando simulador.`,
              variant: "destructive"
            });
          }
        } else {
          try {
            console.log('🔧 Trying Stephany API...');
            
            // Add context bridge if switching models
            if (conversationPersistence.shouldBridgeContext('gemini')) {
              const bridge = conversationPersistence.getContextBridge(existingMessages, 'Stephany (Gemini)');
              contextWithBridge = { ...context, conversationContext: bridge };
            }
            
            // Convert messages to conversation history format
            const conversationHistory = messages.map(msg => ({
              role: msg.role,
              content: msg.content
            }));
            
            response = await generateGeminiResponse(content, contextWithBridge, aiSettings.model, conversationHistory);
            apiUsed = 'gemini';
            modelUsed = 'gemini';
          } catch (apiErr: any) {
            console.log('🔄 Stephany failed, trying backup:', apiErr.message);
            
            if (isGroqConfigured()) {
              try {
                // Add context bridge if switching to Groq
                if (conversationPersistence.shouldBridgeContext('groq')) {
                  const bridge = conversationPersistence.getContextBridge(existingMessages, 'Stephany (Groq)');
                  contextWithBridge = { ...context, conversationContext: bridge };
                }
                
                response = await generateGroqResponse(content, contextWithBridge, 'llama-3.1-8b-instant');
                apiUsed = 'groq';
                modelUsed = 'groq';
                toast({
                  title: apiErr?.message === 'API_COOLDOWN' || apiErr?.message === 'API_RATE_LIMIT' ? 'Stephany temporariamente indisponível' : 'Usando backup AI',
                  description: apiErr?.remainingMs
                    ? `Aguarde ${(apiErr.remainingMs/1000).toFixed(0)}s para tentar novamente. Fallback para Groq.`
                    : 'Stephany indisponível, conectado ao backup.',
                  variant: "default"
                });
              } catch (groqErr: any) {
                console.log('🔄 Groq also failed, using simulator:', groqErr.message);
                
                // Add context bridge for simulator
                if (conversationPersistence.shouldBridgeContext('simulator')) {
                  const bridge = conversationPersistence.getContextBridge(existingMessages, 'Stephany (Simulador)');
                  contextWithBridge = { ...context, conversationContext: bridge };
                }
                
                response = await simulateStephanyResponse(content, contextWithBridge);
                modelUsed = 'simulator';
                toast({
                  title: "Usando simulador local",
                  description: "APIs externas indisponíveis no momento.",
                  variant: "destructive"
                });
              }
            } else {
              // Add context bridge for simulator fallback
              if (conversationPersistence.shouldBridgeContext('simulator')) {
                const bridge = conversationPersistence.getContextBridge(existingMessages, 'Stephany (Simulador)');
                contextWithBridge = { ...context, conversationContext: bridge };
              }
              
              response = await simulateStephanyResponse(content, contextWithBridge);
              modelUsed = 'simulator';
              toast({
                title: "Limite da Stephany atingido",
                description: "Configure backup API ou aguarde reset.",
                variant: "destructive"
              });
            }
          }
        }
      } else if (isGroqConfigured()) {
        try {
          console.log('🔧 Using backup API as primary...');
          
          // Add context bridge for Groq as primary
          if (conversationPersistence.shouldBridgeContext('groq')) {
            const bridge = conversationPersistence.getContextBridge(existingMessages, 'Stephany (Groq)');
            contextWithBridge = { ...context, conversationContext: bridge };
          }
          
          response = await generateGroqResponse(content, contextWithBridge, 'llama-3.1-8b-instant');
          apiUsed = 'groq';
          modelUsed = 'groq';
        } catch (groqErr: any) {
          console.log('🔄 Backup failed, using simulator:', groqErr.message);
          
          // Add context bridge for simulator
          if (conversationPersistence.shouldBridgeContext('simulator')) {
            const bridge = conversationPersistence.getContextBridge(existingMessages, 'Stephany (Simulador)');
            contextWithBridge = { ...context, conversationContext: bridge };
          }
          
          response = await simulateStephanyResponse(content, contextWithBridge);
          modelUsed = 'simulator';
        }
      } else {
        // Add context bridge for simulator as fallback
        if (conversationPersistence.shouldBridgeContext('simulator')) {
          const bridge = conversationPersistence.getContextBridge(existingMessages, 'Stephany (Simulador)');
          contextWithBridge = { ...context, conversationContext: bridge };
        }
        
        response = await simulateStephanyResponse(content, contextWithBridge);
        modelUsed = 'simulator';
      }
      
      console.log(`✅ Response generated using: ${apiUsed}`);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response,
        role: 'assistant',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Save assistant message with model info
      await conversationPersistence.saveMessage(
        assistantMessage.id,
        'assistant',
        response,
        modelUsed,
        apiUsed,
        context
      );
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
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="gradient" className="fixed bottom-6 right-6 rounded-full w-14 h-14 shadow-glow">
          <Sparkles className="w-6 h-6" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] h-[80vh] flex flex-col overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            {aiSettings.enabled ? 'Assistente Stephany' : 'Recomendações da Stephany'}
          </DialogTitle>
          <DialogDescription>
            {aiSettings.enabled 
              ? 'Converse com seu assistente de IA para obter insights sobre seus dados e produtividade.'
              : 'Receba recomendações personalizadas baseadas em suas atividades e metas.'
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className={`flex-1 grid grid-cols-1 ${aiSettings.enabled ? 'lg:grid-cols-3' : ''} gap-4 min-h-0 overflow-hidden`}>
          {/* Chat Area (only when AI enabled) */}
          {aiSettings.enabled && (
          <div className="lg:col-span-2 flex flex-col min-h-0">
            <div className="flex-1 min-h-0 overflow-y-auto border rounded-md p-4 bg-background/50 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border">
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
                      {message.role === 'assistant' ? (
                        <div className="text-sm prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-ul:my-1 prose-li:my-0">
                          <ReactMarkdown 
                            components={{
                              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                              strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                              ul: ({ children }) => <ul className="list-disc list-inside space-y-1 my-2">{children}</ul>,
                              li: ({ children }) => <li className="text-sm">{children}</li>,
                              h1: ({ children }) => <h1 className="text-base font-semibold mb-2">{children}</h1>,
                              h2: ({ children }) => <h2 className="text-sm font-semibold mb-1">{children}</h2>,
                              h3: ({ children }) => <h3 className="text-sm font-medium mb-1">{children}</h3>,
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <p className="text-sm">{message.content}</p>
                      )}
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
                <div ref={messagesEndRef} />
              </div>
            </div>
            
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
              <CardContent className="p-4">
                <div className="h-[400px] overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-border">
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
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}