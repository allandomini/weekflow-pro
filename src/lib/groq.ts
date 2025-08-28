import Groq from "groq-sdk";

// Groq API key from environment
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY as string | undefined;

export function isGroqConfigured() {
  console.log('🔍 Groq API Key check:', {
    hasKey: !!GROQ_API_KEY,
    keyLength: GROQ_API_KEY?.length || 0,
    keyPreview: GROQ_API_KEY ? `${GROQ_API_KEY.substring(0, 10)}...` : 'undefined'
  });
  return typeof GROQ_API_KEY === "string" && GROQ_API_KEY.length > 0;
}

export type GroqModel = 
  | "llama-3.1-70b-versatile"
  | "llama-3.1-8b-instant" 
  | "mixtral-8x7b-32768"
  | "gemma2-9b-it";

const DEFAULT_MODEL: GroqModel = "llama-3.1-8b-instant";

export async function generateGroqResponse(
  message: string,
  context: any,
  model?: string
): Promise<string> {
  if (!isGroqConfigured()) {
    throw new Error("Groq API key not configured");
  }

  const groq = new Groq({
    apiKey: GROQ_API_KEY!,
    dangerouslyAllowBrowser: true
  });

  const modelName = (model as GroqModel) || DEFAULT_MODEL;
  console.log('🤖 Using Groq model:', modelName);

  // Pass full context to Groq (same as Gemini gets)
  const fullContext = {
    ...context,
    // Ensure we have the detailed data
    pendingTasks: context.pendingTasks || [],
    detailedTasks: context.detailedTasks || [],
    detailedProjects: context.detailedProjects || [],
    clockifyEntries: context.clockifyEntries || [],
    recentTransactions: context.recentTransactions || []
  };

  const systemPreamble = `Você é um assistente de IA do Domini Horus. Responda em português brasileiro.

${fullContext.conversationContext ? `${fullContext.conversationContext}\n\n` : ''}Dados do usuário:
- ${fullContext.tasks || 0} tarefas (${fullContext.completedTasks || 0} completas, ${fullContext.overdueTasks || 0} atrasadas)
- ${fullContext.projects || 0} projetos ativos
- ${fullContext.contacts || 0} contatos
- R$ ${(fullContext.totalRevenue || 0).toFixed(2)} receitas, R$ ${(fullContext.totalExpenses || 0).toFixed(2)} despesas
- ${fullContext.totalClockifyHours || 0}h registradas no Clockify

Tarefas pendentes detalhadas:
${(fullContext.pendingTasks || []).map((t: any) => `- ${t.title} (${t.isOverdue ? 'ATRASADA' : 'no prazo'}) - ${t.date}`).join('\n')}

Projetos detalhados:
${(fullContext.detailedProjects || []).map((p: any) => `- ${p.name}: ${p.completedTasks}/${p.totalTasks} tarefas completas`).join('\n')}

Instruções:
- Para cumprimentos simples ("oi", "olá"), seja breve e amigável
- Para palavrões/conteúdo inadequado, redirecione educadamente para produtividade
- Para perguntas específicas, use os dados para dar insights úteis
- Seja natural e conversacional
- IMPORTANTE: Se há contexto de conversa anterior, continue a partir dele mantendo a continuidade`;

  const fullPrompt = `${systemPreamble}\n\nUsuário: ${message}`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: "user",
          content: fullPrompt,
        },
      ],
      model: modelName,
      temperature: 0.7,
      max_tokens: 300,
      top_p: 1,
      stream: false,
    });

    const text = completion.choices[0]?.message?.content || "";
    return text.trim();
  } catch (error: any) {
    console.error('🚨 Groq API Error:', error);
    
    // Handle rate limiting and other API errors
    if (error?.status === 429 || error?.message?.includes('429')) {
      throw new Error("API_RATE_LIMIT");
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
