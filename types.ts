export type EnergyLevel = 'high' | 'low';

export interface Task {
  id: string;
  title: string;
  duration: string;
  completed: boolean;
  xpReward: number;
  difficulty: 'easy' | 'medium' | 'hard';
  reasoning?: string;
}

export interface AIResponse {
  tasks: Task[];
  message: string;
  tone: string;
  spokenResponse: string;
  detectedEmotion?: string;
}

export interface SimulationParams {
  input: string;
  energyLevel: EnergyLevel;
  hasImage: boolean;
}