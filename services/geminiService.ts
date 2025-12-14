import { GoogleGenAI } from "@google/genai";
import { ScenarioType, SimulationState, LogEntry, Language, ActionEstimate } from '../types';

// Initialize Gemini Client
// The API key must be obtained exclusively from the environment variable process.env.API_KEY.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = 'gemini-2.5-flash';

// --- HELPER FUNCTIONS ---

const extractAndParseJSON = (text: string) => {
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (e) {
    try {
      const firstBrace = text.indexOf('{');
      const lastBrace = text.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1) {
        const jsonStr = text.substring(firstBrace, lastBrace + 1);
        return JSON.parse(jsonStr);
      }
    } catch (e2) {
      console.error("Failed to extract JSON from:", text);
    }
  }
  return null;
};

// --- MAIN FUNCTIONS ---

export const startNewGame = async (type: ScenarioType, difficulty: string, lang: Language): Promise<SimulationState> => {
  const langName = lang === Language.AR ? 'Arabic' : 'English';
  
  const systemPrompt = `
    You are an advanced simulation engine.
    Task: Create a unique, detailed ${difficulty} scenario for ${type} in ${langName}.
    
    CRITICAL INSTRUCTIONS:
    1. Return ONLY valid JSON format.
    2. Do NOT write markdown code blocks. Just the raw JSON object.
    3. The "description" should be detailed and use Markdown for styling (bold, lists).
    4. Ensure the Arabic text is professionally written, free of typos, and uses proper Markdown formatting.
    
    JSON Schema:
    {
      "description": "Scenario narrative in ${langName}...",
      "goal": "Clear objective in ${langName}",
      "imagePrompt": "Cinematic scene description in English (for image generation)",
      "health": 100,
      "budget": 1000,
      "timeRemaining": 60,
      "feedback": "Initial status message...",
      "options": [
        { "id": "1", "label": "MUST BE A FULL SENTENCE DESCRIBING THE ACTION IN ${langName}", "cost": 0, "timeCost": 5, "risk": "Low/Medium/High" },
        { "id": "2", "label": "MUST BE A FULL SENTENCE DESCRIBING THE ACTION IN ${langName}", "cost": 100, "timeCost": 10, "risk": "Low/Medium/High" }
      ]
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: systemPrompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.7,
      }
    });

    const content = response.text || "{}";
    const data = extractAndParseJSON(content);

    if (!data) throw new Error("Failed to generate valid scenario data.");

    return {
      description: data.description || "System Error: No description generated.",
      goal: data.goal || "Survive",
      visualKeyword: "scene",
      imagePrompt: data.imagePrompt || "Abstract digital background",
      health: typeof data.health === 'number' ? data.health : 100,
      budget: typeof data.budget === 'number' ? data.budget : 1000,
      timeRemaining: typeof data.timeRemaining === 'number' ? data.timeRemaining : 60,
      feedback: data.feedback || "Ready",
      options: Array.isArray(data.options) ? data.options.map((o: any) => ({
        ...o,
        risk: o.risk || "Medium",
        label: o.label || o.text || o.action || "Action",
        timeCost: o.timeCost || 5
      })) : [],
      isGameOver: false,
      isVictory: false,
      gameOverReason: ""
    };
  } catch (error) {
    console.error("Gemini Start Game Error:", error);
    throw error;
  }
};

export const processTurn = async (
  currentDesc: string,
  actionLabel: string, 
  currentState: SimulationState,
  scenarioType: ScenarioType,
  lang: Language
): Promise<Partial<SimulationState> & { rawData: any }> => {
  const langName = lang === Language.AR ? 'Arabic' : 'English';
  
  const systemPrompt = `
    Context: ${scenarioType} Simulation.
    Current Goal: ${currentState.goal}
    Current Status: Health=${currentState.health}, Time=${currentState.timeRemaining}.
    Player Action: "${actionLabel}"
    
    Task: Advance the simulation based on the action.
    Return ONLY valid JSON.
    Ensure the Arabic text is professionally written, free of typos, and uses proper Markdown formatting.
    
    JSON Schema:
    {
      "description": "Updated narrative in ${langName} (what happened next?)",
      "goal": "Updated goal (if changed, else keep same)",
      "imagePrompt": "New scene description in English",
      "healthChange": 0,    // Negative for damage, positive for healing
      "budgetChange": 0,    // Negative for cost
      "timeChange": -5,     // Usually negative
      "feedback": "Short result summary in ${langName}",
      "isGameOver": boolean,
      "isVictory": boolean,
      "gameOverReason": "Reason if game ended",
      "options": [
        { "id": "1", "label": "MUST BE A FULL SENTENCE DESCRIBING THE ACTION IN ${langName}", "cost": 0, "timeCost": 5, "risk": "Low/Medium/High" },
        { "id": "2", "label": "MUST BE A FULL SENTENCE DESCRIBING THE ACTION IN ${langName}", "cost": 100, "timeCost": 10, "risk": "Low/Medium/High" }
      ]
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: systemPrompt,
      config: {
        responseMimeType: "application/json",
        temperature: 0.5,
      }
    });

    const content = response.text || "{}";
    const data = extractAndParseJSON(content);
    
    if (!data) throw new Error("Failed to process turn data.");

    return {
      description: data.description,
      goal: data.goal,
      imagePrompt: data.imagePrompt,
      visualKeyword: "update",
      feedback: data.feedback,
      options: Array.isArray(data.options) ? data.options.map((o: any) => ({
        ...o,
        risk: o.risk || "Medium",
        label: o.label || o.text || o.action || "Action",
        timeCost: o.timeCost || 5
      })) : [],
      isGameOver: !!data.isGameOver,
      isVictory: !!data.isVictory,
      gameOverReason: data.gameOverReason,
      rawData: data 
    };

  } catch (error) {
    console.error("Gemini Process Turn Error:", error);
    throw error;
  }
};

export const evaluateCustomAction = async (
  actionText: string,
  currentState: SimulationState,
  scenarioType: ScenarioType,
  lang: Language
): Promise<ActionEstimate> => {
    const langName = lang === Language.AR ? 'Arabic' : 'English';
    const systemPrompt = `
      Analyze custom action: "${actionText}" in context of ${scenarioType} simulation.
      Return JSON only:
      {
        "predictedOutcome": "Prediction in ${langName}",
        "estimatedCost": 0,
        "estimatedTime": 5,
        "estimatedRisk": "High/Medium/Low",
        "recommendation": "Advice in ${langName}"
      }
    `;

    try {
        const response = await ai.models.generateContent({
            model: MODEL_NAME,
            contents: systemPrompt,
            config: {
              responseMimeType: "application/json",
              temperature: 0.3,
            }
        });

        const content = response.text || "{}";
        const data = extractAndParseJSON(content);
        return data as ActionEstimate;
    } catch (e) {
        console.error("Gemini Evaluate Error:", e);
        throw e;
    }
};

export const translateLogs = async (logs: LogEntry[], targetLang: Language): Promise<LogEntry[]> => {
    // Return original logs to save tokens/speed, or implement if needed.
    // For now, we return as is to ensure stability.
    return logs; 
};

export const translateGameState = async (state: SimulationState, targetLang: Language): Promise<SimulationState> => {
    // Return original state to save tokens/speed.
    return state; 
};