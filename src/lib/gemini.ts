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
  const systemPreamble = `You are an AI assistant embedded in a personal productivity app called Domini Horus!. You have access to detailed user data, but be smart about when to use it.

Key instructions:
- Be conversational and natural - match the user's energy and question complexity
- For simple greetings (like "olá", "oi", "hello"), respond briefly and warmly
- Only provide detailed data analysis when the user specifically asks about finances, tasks, projects, or productivity
- When asked about specific topics, then use the detailed data to give precise insights
- Always respond in Portuguese
- Be helpful but not overwhelming - let the conversation flow naturally
- If the user estiver frustrado (e.g., palavrões), responda com empatia, foque em ação prática e seja breve

Examples:
- "Olá" → Simple greeting response
- "Como estão meus gastos?" → Detailed financial analysis
- "O que tenho para fazer?" → Task analysis
- "Como vão os projetos?" → Project progress details`;

  const contextBlock = `\n\nContexto JSON:\n${JSON.stringify(context, (_k, v) => {
    if (v instanceof Date) return v.toISOString();
    return v;
  }, 2)}`;

  // Build conversation contents with history
  const contents: any[] = [];
  
  // Add system message as first user message
  contents.push({
    role: "user",
    parts: [{ text: `${systemPreamble}${contextBlock}` }]
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
