export enum ScenarioType {
  MEDICAL = 'MEDICAL',
  ENGINEERING = 'ENGINEERING',
  PROGRAMMING = 'PROGRAMMING',
  CYBERSECURITY = 'CYBERSECURITY'
}

export enum GameStatus {
  INTRO = 'INTRO',
  SETUP = 'SETUP',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER',
  VICTORY = 'VICTORY'
}

export enum Language {
  AR = 'AR',
  EN = 'EN'
}

export interface SimulationOption {
  id: string;
  label: string;
  cost: number;
  timeCost: number; // in minutes
  risk: string; // "Low", "Medium", "High" (localized in UI if needed, but AI returns string)
}

export interface ActionEstimate {
  predictedOutcome: string; // Short summary
  estimatedCost: number;
  estimatedTime: number;
  estimatedRisk: string;
  recommendation: string;
}

export interface SimulationState {
  description: string;
  goal: string; // Specific winning condition
  visualKeyword: string; // Used to seed the placeholder image (English)
  imagePrompt: string; // Detailed English prompt for image generation
  health: number; // 0-100 (Patient Vitals or Machine Integrity)
  budget: number; // Remaining funds
  timeRemaining: number; // Minutes remaining
  feedback: string; // Immediate feedback from previous action
  options: SimulationOption[];
  isGameOver: boolean;
  isVictory: boolean;
  gameOverReason?: string;
}

export interface LogEntry {
  turn: number;
  actionTaken: string;
  feedback: string;
  timestamp: string;
}

export interface SetupConfig {
  type: ScenarioType;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
}