// Utility for automatic translation using AI
// This can be used to generate translations for new text automatically

export interface TranslationRequest {
  text: string;
  targetLanguages: string[];
  context?: string;
}

export interface TranslationResult {
  [languageCode: string]: string;
}

export const generateTranslations = async (request: TranslationRequest): Promise<TranslationResult> => {
  // This is a placeholder for AI-powered translation
  // In production, you would integrate with Google Translate API, OpenAI, or similar
  
  const { text, targetLanguages, context } = request;
  const result: TranslationResult = {};
  
  // For now, return the original text for all languages
  // In production, replace this with actual AI translation calls
  targetLanguages.forEach(lang => {
    result[lang] = text; // Placeholder - would be actual translation
  });
  
  return result;
};

// Helper to extract all translatable strings from a React component
export const extractTranslatableStrings = (componentCode: string): string[] => {
  const strings: string[] = [];
  
  // Regex patterns to find hardcoded strings
  const patterns = [
    /"([^"]+)"/g, // Double quoted strings
    /'([^']+)'/g, // Single quoted strings
    /`([^`]+)`/g, // Template literals
  ];
  
  patterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(componentCode)) !== null) {
      const str = match[1];
      // Filter out obvious non-translatable strings
      if (str.length > 2 && 
          !str.match(/^[a-zA-Z0-9_-]+$/) && // Not just variable names
          !str.includes('http') && // Not URLs
          !str.includes('px') && // Not CSS
          !str.includes('#')) { // Not colors
        strings.push(str);
      }
    }
  });
  
  return [...new Set(strings)]; // Remove duplicates
};

// Auto-generate translation keys from text
export const generateTranslationKey = (text: string, namespace: string = 'common'): string => {
  const key = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .substring(0, 50); // Limit length
  
  return `${namespace}.${key}`;
};
