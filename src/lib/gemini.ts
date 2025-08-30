import { GoogleGenerativeAI } from "@google/generative-ai";

// Vite exposes env vars prefixed with VITE_
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;

export function isGeminiConfigured() {
  console.log('🔍 Gemini API Key check:', {
    hasKey: !!API_KEY,
    keyLength: API_KEY?.length || 0,
    keyPreview: API_KEY ? `${API_KEY.substring(0, 10)}...` : 'undefined'
  });
  return typeof API_KEY === "string" && API_KEY.length > 0;
}

export type GeminiModel =
  | "gemini-1.5-pro"
  | "gemini-1.5-flash"
  | "gemini-1.5-flash-8b";

const DEFAULT_MODEL: GeminiModel = "gemini-1.5-flash";

// Simple in-memory cooldown control after 429
let geminiCooldownUntil = 0; // epoch ms

export function getGeminiCooldownRemaining(): number {
  const now = Date.now();
  return Math.max(0, geminiCooldownUntil - now);
}

export async function generateGeminiResponse(
  message: string,
  context: any,
  model?: string,
  conversationHistory?: Array<{role: 'user' | 'assistant', content: string}>
): Promise<string> {
  if (!isGeminiConfigured()) {
    throw new Error("Gemini API key not configured");
  }

  // Respect active cooldown
  if (Date.now() < geminiCooldownUntil) {
    const remainingMs = geminiCooldownUntil - Date.now();
    console.warn(`⏳ Gemini on cooldown: ${(remainingMs / 1000).toFixed(0)}s remaining`);
    const err: any = new Error("API_COOLDOWN");
    err.remainingMs = remainingMs;
    throw err;
  }

  const genAI = new GoogleGenerativeAI(API_KEY!);
  const modelName = (model as GeminiModel) || DEFAULT_MODEL;
  console.log('🤖 Using Gemini model:', modelName, 'from parameter:', model, 'default:', DEFAULT_MODEL);
  const genModel = genAI.getGenerativeModel({ model: modelName });

  // Construct conversation contents with history
  const systemPreamble = `You are Stephany, an AI assistant embedded in Domini Horus productivity app. You have access to COMPLETE and DETAILED user data including:

🎯 PROJECT DATA (COMPLETE ACCESS):
- Project details: name, description, color, icon
- All project tasks: completed, pending, overdue, routine tasks
- Project notes: titles, content, creation dates
- Project checklists: todo items, completion status
- Project images: uploaded files, creation dates
- Project finances: wallet entries, deposits, withdrawals, balance
- Project canvas: visual elements, cards, documents, positioning
- Project progress: completion percentages, analytics

📊 OTHER DATA ACCESS:
- Tasks, contacts, transactions, Clockify time tracking
- Financial analysis, productivity metrics
- Routine completions, goals, debts

Key instructions:
- Be conversational and natural - match the user's energy and question complexity
- For simple greetings (like "olá", "oi", "hello"), respond briefly and warmly
- When asked about projects, you can see EVERYTHING: notes, finances, tasks, images, canvas items, checklists
- Provide detailed project analysis when requested - you have complete visibility
- Always respond in Portuguese
- Be helpful but not overwhelming - let the conversation flow naturally
- If the user estiver frustrado (e.g., palavrões), responda com empatia, foque em ação prática e seja breve

Examples:
- "Olá" → Simple greeting response
- "Como estão meus gastos?" → Detailed financial analysis
- "O que tenho para fazer?" → Task analysis
- "Como vão os projetos?" → COMPLETE project analysis with all details
- "Me fale sobre o projeto X" → Full project breakdown: tasks, notes, finances, canvas, images, etc.`;

  const contextBlock = `\n\nDados Completos (JSON):\n${JSON.stringify(context, (_k, v) => {
    if (v instanceof Date) return v.toISOString();
    return v;
  }, 2)}`;

  // Add specific project data summary for better context
  const projectSummary = context.projectsDetail ? 
    `\n\nRESUMO DOS PROJETOS (você tem acesso completo):\n${context.projectsDetail.map((p: any) => 
      `• ${p.name}: ${p.tasksCount} tarefas (${p.completedTasks} completas), ${p.notesCount} notas, ${p.imagesCount} imagens, R$ ${p.projectBalance?.toFixed(2) || '0,00'} saldo, ${p.canvasItemsCount || 0} elementos no canvas`
    ).join('\n')}` : '';

  // Build conversation contents with history
  const contents: any[] = [];
  
  // Add system message as first user message
  contents.push({
    role: "user",
    parts: [{ text: `${systemPreamble}${projectSummary}${contextBlock}` }]
  });
  
  // Add conversation history if available
  if (conversationHistory && conversationHistory.length > 0) {
    // Take last 10 messages to avoid token limits
    const recentHistory = conversationHistory.slice(-10);
    
    for (const msg of recentHistory) {
      contents.push({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      });
    }
  }
  
  // Add current message
  contents.push({
    role: "user",
    parts: [{ text: message }]
  });

  try {
    const result = await genModel.generateContent({
      contents: contents,
    });

    const text = result.response.text();
    return text?.trim() || "";
  } catch (error: any) {
    console.error('🚨 Gemini API Error:', error);
    
    // Handle rate limiting (429) and other API errors
    if (error?.status === 429 || error?.message?.includes('429')) {
      // Try to extract retryDelay seconds from error message, default to 60s
      const msg: string = String(error?.message ?? "");
      const match = msg.match(/retryDelay\":"(\d+)s"/);
      const retrySeconds = match ? parseInt(match[1], 10) : 60;
      const jitter = Math.floor(Math.random() * 3000); // up to 3s jitter
      geminiCooldownUntil = Date.now() + retrySeconds * 1000 + jitter;
      console.warn(`🧊 Gemini rate-limited. Cooldown set for ${retrySeconds}s (+jitter).`);
      const err: any = new Error("API_RATE_LIMIT");
      err.retryMs = retrySeconds * 1000 + jitter;
      throw err;
    }
    
    if (error?.status === 403) {
      throw new Error("API_QUOTA_EXCEEDED");
    }
    
    if (error?.status === 400) {
      throw new Error("API_INVALID_REQUEST");
    }
    
    // Generic API error
    throw new Error("API_ERROR");
  }
}
