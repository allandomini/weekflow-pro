import { GoogleGenerativeAI } from "@google/generative-ai";

// Vite exposes env vars prefixed with VITE_
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;

export function isGeminiConfigured() {
  return typeof API_KEY === "string" && API_KEY.length > 0;
}

export type GeminiModel =
  | "gemini-1.5-pro"
  | "gemini-1.5-flash"
  | "gemini-1.5-flash-8b";

const DEFAULT_MODEL: GeminiModel = "gemini-1.5-pro";

export async function generateGeminiResponse(
  message: string,
  context: any,
  model?: string
): Promise<string> {
  if (!isGeminiConfigured()) {
    throw new Error("Gemini API key not configured");
  }

  const genAI = new GoogleGenerativeAI(API_KEY!);
  const modelName = (model as GeminiModel) || DEFAULT_MODEL;
  const genModel = genAI.getGenerativeModel({ model: modelName });

  // Construct a helpful prompt including structured JSON context
  const systemPreamble = `You are an AI assistant embedded in a personal productivity app. Be concise, actionable, and reference user data provided in the JSON context when helpful. Prefer Portuguese responses if the user speaks Portuguese.`;

  const contextBlock = `\n\nContexto JSON:\n${JSON.stringify(context, (_k, v) => {
    if (v instanceof Date) return v.toISOString();
    return v;
  }, 2)}`;

  const fullPrompt = `${systemPreamble}\n\nUsuário: ${message}${contextBlock}`;

  const result = await genModel.generateContent({
    contents: [
      {
        role: "user",
        parts: [{ text: fullPrompt }],
      },
    ],
  });

  const text = result.response.text();
  return text?.trim() || "";
}
