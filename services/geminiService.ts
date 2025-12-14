import { GoogleGenAI, Type, Schema, GenerateContentResponse } from "@google/genai";
import { ScenarioType, SimulationState, ActionEstimate, Language, LogEntry } from '../types';

// --- API KEY MANAGEMENT ---

// Initialize the client safely.
// We provide a fallback string to prevent "new GoogleGenAI" from throwing immediately on import
// if the env var is missing. The error will be caught later during API calls.
const apiKey = process.env.API_KEY || "MISSING_KEY";
const ai = new GoogleGenAI({ apiKey: apiKey });

// Updated to use gemini-2.5-flash-lite as requested
const MODEL_NAME = 'gemini-2.5-flash-lite';

// --- CACHING SYSTEM ---
// Stores API responses to prevent redundant calls (Quota Saver)
const requestCache = new Map<string, { data: any, timestamp: number }>();
const CACHE_TTL = 1000 * 60 * 60; // 1 Hour Cache

const getFromCache = (key: string) => {
  const cached = requestCache.get(key);
  if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
    console.log(`[CACHE HIT] Serving from memory: ${key}`);
    return JSON.parse(JSON.stringify(cached.data)); // Deep copy to prevent mutation
  }
  return null;
};

const setCache = (key: string, data: any) => {
  // Store a deep copy
  requestCache.set(key, { data: JSON.parse(JSON.stringify(data)), timestamp: Date.now() });
};

// --- RETRY LOGIC ---

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const MAX_RETRIES = 5;

async function callWithRetry<T>(
  fn: () => Promise<T>,
  retries = MAX_RETRIES, 
  initialDelay = 1000
): Promise<T> {
  // Check for missing key before attempting call
  if (apiKey === "MISSING_KEY" || !apiKey) {
      throw new Error("API Key is missing. Please configure GEMINI_API_KEY in your Netlify settings.");
  }

  try {
    return await fn();
  } catch (error: any) {
    let errorMessage = "Unknown API Error";

    // Robust error message extraction to handle various SDK/API error formats
    if (error instanceof Error) {
        errorMessage = error.message;
        if ((error as any).error?.message) {
            errorMessage = (error as any).error.message;
        }
    } else if (error?.error?.message) {
        errorMessage = error.error.message;
    } else if (error?.message) {
        errorMessage = error.message;
    } else {
        try {
            errorMessage = JSON.stringify(error);
        } catch {
            errorMessage = "Non-serializable Error";
        }
    }
    
    // Identify error types
    const isAuthError = 
        errorMessage.includes('API key') || 
        errorMessage.includes('expired') || 
        errorMessage.includes('INVALID_ARGUMENT') ||
        errorMessage.includes('PERMISSION_DENIED');

    const isQuotaError = 
      error?.status === 429 || 
      error?.code === 429 || 
      errorMessage.includes('429') || 
      errorMessage.includes('RESOURCE_EXHAUSTED') ||
      errorMessage.includes('quota');
    
    const isServerOverload = error?.status === 503 || error?.code === 503 || errorMessage.includes('503');
    
    // RETRY STRATEGY
    if (retries > 0) {
        if (isQuotaError || isServerOverload) {
             let waitTime = initialDelay;
             const retryMatch = errorMessage.match(/retry in ([\d\.]+)s/);
             if (retryMatch && retryMatch[1]) {
                waitTime = Math.ceil(parseFloat(retryMatch[1]) * 1000) + 1000;
             } else {
                // Exponential backoff
                waitTime = initialDelay * 1.5;
             }
             console.warn(`API Error (${errorMessage}). Retrying in ${waitTime}ms...`);
             await sleep(waitTime);
             return callWithRetry(fn, retries - 1, waitTime);
        }
    }
    
    if (isAuthError) {
        console.error("Critical: Authentication failed. Please check process.env.API_KEY.");
    }
    
    throw new Error(errorMessage);
  }
}

// --- SCHEMAS ---

const stateSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    description: { type: Type.STRING },
    goal: { type: Type.STRING },
    visualKeyword: { type: Type.STRING },
    imagePrompt: { type: Type.STRING },
    health: { type: Type.INTEGER },
    budget: { type: Type.INTEGER },
    timeRemaining: { type: Type.INTEGER },
    feedback: { type: Type.STRING },
    isGameOver: { type: Type.BOOLEAN },
    isVictory: { type: Type.BOOLEAN },
    gameOverReason: { type: Type.STRING },
    options: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          label: { type: Type.STRING },
          cost: { type: Type.INTEGER },
          timeCost: { type: Type.INTEGER },
          risk: { type: Type.STRING }
        },
        required: ["id", "label", "cost", "timeCost", "risk"]
      }
    }
  },
  required: ["description", "goal", "imagePrompt", "health", "budget", "timeRemaining", "feedback", "options"]
};

const logListSchema: Schema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      turn: { type: Type.INTEGER },
      actionTaken: { type: Type.STRING },
      feedback: { type: Type.STRING },
      timestamp: { type: Type.STRING }
    },
    required: ["turn", "actionTaken", "feedback", "timestamp"]
  }
};

const simulationSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    description: { type: Type.STRING, description: "Detailed narrative." },
    goal: { type: Type.STRING, description: "The specific objective to win the scenario." },
    imagePrompt: { type: Type.STRING, description: "A detailed, cinematic ENGLISH prompt to generate an image of the current scene." },
    healthChange: { type: Type.INTEGER },
    budgetChange: { type: Type.INTEGER },
    timeChange: { type: Type.INTEGER },
    feedback: { type: Type.STRING, description: "Feedback on the action taken." },
    isGameOver: { type: Type.BOOLEAN },
    isVictory: { type: Type.BOOLEAN },
    gameOverReason: { type: Type.STRING, description: "Reason for game over or victory." },
    options: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          label: { type: Type.STRING },
          cost: { type: Type.INTEGER },
          timeCost: { type: Type.INTEGER },
          risk: { type: Type.STRING }
        },
        required: ["id", "label", "cost", "timeCost", "risk"]
      }
    }
  },
  required: ["description", "goal", "imagePrompt", "healthChange", "budgetChange", "timeChange", "feedback", "isGameOver", "isVictory", "options"]
};

const estimationSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    predictedOutcome: { type: Type.STRING, description: "Short prediction." },
    estimatedCost: { type: Type.INTEGER },
    estimatedTime: { type: Type.INTEGER },
    estimatedRisk: { type: Type.STRING, description: "High/Medium/Low" },
    recommendation: { type: Type.STRING, description: "Short advice." }
  },
  required: ["predictedOutcome", "estimatedCost", "estimatedTime", "estimatedRisk", "recommendation"]
};

// --- API CALLS ---

export const translateLogs = async (logs: LogEntry[], targetLang: Language): Promise<LogEntry[]> => {
  if (!logs || logs.length === 0) return [];
  
  const cacheKey = `TRANS_LOGS_${targetLang}_${logs.length}_${logs[logs.length-1].actionTaken}`;
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  const langName = targetLang === Language.AR ? 'Arabic' : 'English';

  const prompt = `
    Task: Translate 'actionTaken' and 'feedback' to ${langName}.
    Rules: Keep 'turn'/'timestamp'. Use academic terms.
    Input: ${JSON.stringify(logs)}
  `;

  try {
     const response = await callWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: logListSchema,
        temperature: 0.2,
      },
    }));
    const result = JSON.parse(response.text || "[]");
    setCache(cacheKey, result);
    return result;
  } catch (error) {
      console.error("Log translation failed", error);
      // Return original logs on failure instead of breaking
      return logs;
  }
};

export const translateGameState = async (state: SimulationState, targetLang: Language): Promise<SimulationState> => {
  const cacheKey = `TRANS_STATE_${targetLang}_${state.description.substring(0, 30)}`;
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  const langName = targetLang === Language.AR ? 'Arabic' : 'English';
  
  const prompt = `
    Task: Translate content to ${langName}.
    Keys: 'description', 'goal', 'feedback', 'gameOverReason', 'options'.
    Ignore: 'imagePrompt', numbers.
    Input: ${JSON.stringify(state)}
  `;

  try {
    const response = await callWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: stateSchema,
        temperature: 0.2,
      },
    }));

    const data = JSON.parse(response.text || "{}");
    const result = {
      ...data,
      health: state.health,
      budget: state.budget,
      timeRemaining: state.timeRemaining,
      imagePrompt: state.imagePrompt, 
      visualKeyword: state.visualKeyword
    };
    setCache(cacheKey, result);
    return result;
  } catch (error) {
    console.error("Translation failed:", error);
    return state;
  }
};

export const startNewGame = async (type: ScenarioType, difficulty: string, lang: Language): Promise<SimulationState> => {
  const cacheKey = `START_${type}_${difficulty}_${lang}`;
  const cached = getFromCache(cacheKey);
  if (cached) {
      return { ...cached };
  }

  const langName = lang === Language.AR ? 'Arabic' : 'English';

  let budget = 1000;
  let time = 60;
  let contextPrompt = "Textbook case for students.";
  let complexityPrompt = "Standard.";
  let temperature = 0.7;

  if (difficulty === 'MEDIUM') {
      budget = 750;
      time = 45;
      contextPrompt = "Professional scenario with ambiguities.";
      complexityPrompt = "Moderate.";
  } else if (difficulty === 'HARD') {
      budget = 500;
      time = 30;
      contextPrompt = "Complex Crisis (e.g., massive breach, multi-organ failure). Critical.";
      complexityPrompt = "Start Health=80. Drops fast.";
      temperature = 0.9;
  }

  const prompt = `
    Role: PBL Simulation Engine.
    Task: Create ${difficulty} scenario for ${type}.
    Lang: ${langName}.
    
    Constraints:
    1. Goal: Clear technical objective.
    2. Focus:
       - MEDICAL: Patient vitals.
       - PROGRAMMING: Source code/Debugging. Include code snippet.
       - CYBERSECURITY: Network logs/Defense. Include terminal logs.
       - ENGINEERING: Mechanical integrity.
       - LEGAL: Courtroom arguments, Evidence analysis, Case strength (Health=Case Credibility).
    3. Tone: Academic ${langName}.
    4. Realism: ${contextPrompt}
    5. Diff: ${complexityPrompt}

    Reqs:
    - Output in ${langName} (except imagePrompt).
    - imagePrompt: Visual, cinematic (English).
    - options.risk: Translated.
    - Budget: ${budget}, Time: ${time}.
    
    Output JSON.
  `;

  try {
    const response = await callWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: simulationSchema,
        temperature: temperature,
      },
    }));

    const data = JSON.parse(response.text || "{}");
    
    const newState = {
      description: data.description,
      goal: data.goal,
      visualKeyword: "scene", 
      imagePrompt: data.imagePrompt,
      health: data.healthChange ? 100 + data.healthChange : (difficulty === 'HARD' ? 80 : 100),
      budget: budget,
      timeRemaining: time,
      feedback: lang === Language.AR ? "ابدأ إجراءات التشخيص والتقييم..." : "Start diagnosis...",
      options: data.options,
      isGameOver: false,
      isVictory: false,
      gameOverReason: ""
    };

    setCache(cacheKey, newState);
    return newState;

  } catch (error: any) {
    console.error("Error starting game:", error);
    // Propagate the specific error message to the UI
    throw error;
  }
};

export const evaluateCustomAction = async (
  actionText: string,
  currentState: SimulationState,
  scenarioType: ScenarioType,
  lang: Language
): Promise<ActionEstimate> => {
  const cacheKey = `EVAL_${actionText.trim()}_${currentState.description.substring(0, 20)}`;
  const cached = getFromCache(cacheKey);
  if (cached) return cached;

  const langName = lang === Language.AR ? 'Arabic' : 'English';
  const prompt = `
    Ctx: ${scenarioType} Sim.
    Sit: ${currentState.description.substring(0, 500)}...
    Goal: ${currentState.goal}
    Stats: H=${currentState.health}, T=${currentState.timeRemaining}.
    Action: "${actionText}"
    
    Task: Analyze feasibility, cost, time, risk, outcome.
    Lang: ${langName}.
  `;

  try {
    const response = await callWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: estimationSchema,
        temperature: 0.3,
      },
    }));
    const result = JSON.parse(response.text || "{}");
    setCache(cacheKey, result);
    return result;
  } catch (error) {
    console.error(error);
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
  const contextSnippet = currentDesc.length > 800 ? currentDesc.substring(currentDesc.length - 800) : currentDesc;

  const prompt = `
    Ctx: ${scenarioType} Sim.
    Sit: ...${contextSnippet}
    Goal: ${currentState.goal}
    Stats: H=${currentState.health}, T=${currentState.timeRemaining}.
    Action: "${actionLabel}"
    
    Task:
    1. Apply action logic (scientific/technical).
    2. Check Victory/Game Over.
    3. Update desc (Immersive details).
    4. New imagePrompt (English).
    5. Update stats.
    
    Lang: ${langName} (except imagePrompt).
    For Coding/Cyber: Include updated logs/code if relevant.
    For LEGAL: Focus on judge's ruling, objection sustainability, and jury impact.
  `;

  try {
    const response = await callWithRetry<GenerateContentResponse>(() => ai.models.generateContent({
      model: MODEL_NAME,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: simulationSchema,
        temperature: 0.4,
      },
    }));

    const data = JSON.parse(response.text || "{}");
    return {
      description: data.description,
      goal: data.goal || currentState.goal,
      imagePrompt: data.imagePrompt,
      visualKeyword: "update",
      feedback: data.feedback,
      options: data.options,
      isGameOver: data.isGameOver,
      isVictory: data.isVictory,
      gameOverReason: data.gameOverReason,
      rawData: data 
    };

  } catch (error) {
    console.error("Error processing turn:", error);
    throw error;
  }
};