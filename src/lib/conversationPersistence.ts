export interface ConversationMessage {
  id: string;
  sessionId: string;
  messageId: string;
  role: 'user' | 'assistant';
  content: string;
  modelUsed?: string;
  apiUsed?: string;
  contextSnapshot?: any;
  timestamp: Date;
}

export interface ConversationSession {
  sessionId: string;
  messages: ConversationMessage[];
  lastActivity: Date;
  messageCount: number;
}

class ConversationPersistence {
  private currentSessionId: string | null = null;
  private lastUsedModel: string | null = null;

  // Generate new session ID
  generateSessionId(): string {
    this.currentSessionId = crypto.randomUUID();
    return this.currentSessionId;
  }

  getCurrentSessionId(): string {
    if (!this.currentSessionId) {
      this.currentSessionId = this.generateSessionId();
    }
    return this.currentSessionId;
  }

  // Save message to localStorage (primary storage for now)
  async saveMessage(
    messageId: string,
    role: 'user' | 'assistant',
    content: string,
    modelUsed?: string,
    apiUsed?: string,
    contextSnapshot?: any
  ): Promise<void> {
    try {
      const sessionId = this.getCurrentSessionId();
      this.saveToLocalStorage(sessionId, messageId, role, content, modelUsed, apiUsed, contextSnapshot);
      
      // Track model changes for context bridging
      if (modelUsed && this.lastUsedModel && this.lastUsedModel !== modelUsed) {
        console.log(`🔄 Model switched from ${this.lastUsedModel} to ${modelUsed}`);
      }
      this.lastUsedModel = modelUsed || null;
    } catch (error) {
      console.error('Conversation persistence error:', error);
    }
  }

  // Save to localStorage
  private saveToLocalStorage(
    sessionId: string,
    messageId: string,
    role: 'user' | 'assistant',
    content: string,
    modelUsed?: string,
    apiUsed?: string,
    contextSnapshot?: any
  ): void {
    try {
      const key = `ai_conversation_${sessionId}`;
      const existing = localStorage.getItem(key);
      const messages = existing ? JSON.parse(existing) : [];
      
      messages.push({
        messageId,
        role,
        content,
        modelUsed,
        apiUsed,
        contextSnapshot,
        timestamp: new Date().toISOString()
      });

      // Keep only last 50 messages per session to avoid localStorage bloat
      if (messages.length > 50) {
        messages.splice(0, messages.length - 50);
      }

      localStorage.setItem(key, JSON.stringify(messages));
    } catch (error) {
      console.error('localStorage save failed:', error);
    }
  }

  // Load conversation history from localStorage
  async loadConversationHistory(sessionId?: string): Promise<ConversationMessage[]> {
    const targetSessionId = sessionId || this.getCurrentSessionId();
    return this.loadFromLocalStorage(targetSessionId);
  }

  private loadFromLocalStorage(sessionId: string): ConversationMessage[] {
    try {
      const key = `ai_conversation_${sessionId}`;
      const data = localStorage.getItem(key);
      if (!data) return [];

      const messages = JSON.parse(data);
      return messages.map((msg: any) => ({
        id: msg.messageId,
        sessionId,
        messageId: msg.messageId,
        role: msg.role,
        content: msg.content,
        modelUsed: msg.modelUsed,
        apiUsed: msg.apiUsed,
        contextSnapshot: msg.contextSnapshot,
        timestamp: new Date(msg.timestamp)
      }));
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
      return [];
    }
  }

  // Get recent sessions from localStorage
  async getRecentSessions(limit: number = 10): Promise<ConversationSession[]> {
    try {
      const sessions: ConversationSession[] = [];
      
      // Scan localStorage for conversation keys
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('ai_conversation_')) {
          const sessionId = key.replace('ai_conversation_', '');
          const messages = this.loadFromLocalStorage(sessionId);
          
          if (messages.length > 0) {
            sessions.push({
              sessionId,
              messages,
              lastActivity: new Date(Math.max(...messages.map(m => m.timestamp.getTime()))),
              messageCount: messages.length
            });
          }
        }
      }

      return sessions
        .sort((a, b) => b.lastActivity.getTime() - a.lastActivity.getTime())
        .slice(0, limit);
    } catch (error) {
      console.error('Failed to get recent sessions:', error);
      return [];
    }
  }

  // Create conversation summary for context bridging
  createConversationSummary(messages: ConversationMessage[]): string {
    if (messages.length === 0) return '';

    const recentMessages = messages.slice(-8); // Last 8 messages for better context
    const userMessages = recentMessages.filter(m => m.role === 'user');
    const assistantMessages = recentMessages.filter(m => m.role === 'assistant');

    let summary = 'Contexto da conversa:\n';
    
    if (userMessages.length > 0) {
      const lastUserMsg = userMessages[userMessages.length - 1];
      summary += `Última pergunta: "${lastUserMsg.content}"\n`;
    }
    
    if (assistantMessages.length > 0) {
      const lastResponse = assistantMessages[assistantMessages.length - 1];
      summary += `Última resposta: "${lastResponse.content.slice(0, 150)}..."\n`;
      summary += `Modelo anterior: ${lastResponse.modelUsed || 'desconhecido'}\n`;
    }

    // Add conversation flow context
    if (recentMessages.length >= 4) {
      summary += `Tópicos discutidos: ${userMessages.map(m => 
        m.content.toLowerCase().includes('tarefa') ? 'tarefas' :
        m.content.toLowerCase().includes('projeto') ? 'projetos' :
        m.content.toLowerCase().includes('financ') ? 'finanças' :
        m.content.toLowerCase().includes('clockify') ? 'tempo' : 'geral'
      ).join(', ')}\n`;
    }

    return summary;
  }

  // Get context bridge for model transitions
  getContextBridge(messages: ConversationMessage[], newModel: string): string {
    const summary = this.createConversationSummary(messages);
    return `${summary}\n[Continuando conversa com ${newModel}]`;
  }

  // Clear current session (start fresh)
  startNewSession(): string {
    this.currentSessionId = null;
    this.lastUsedModel = null;
    return this.generateSessionId();
  }

  // Check if model changed and needs context bridge
  shouldBridgeContext(currentModel: string): boolean {
    return this.lastUsedModel !== null && this.lastUsedModel !== currentModel;
  }
}

export const conversationPersistence = new ConversationPersistence();
