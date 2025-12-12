import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AIResponse, EnergyLevel } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const taskSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    id: { type: Type.STRING },
    title: { type: Type.STRING },
    duration: { type: Type.STRING },
    completed: { type: Type.BOOLEAN },
    xpReward: { type: Type.NUMBER },
    difficulty: { type: Type.STRING },
    reasoning: { type: Type.STRING },
  },
  required: ["title", "duration", "xpReward"],
};

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    tasks: { type: Type.ARRAY, items: taskSchema },
    message: { type: Type.STRING },
    spokenResponse: { type: Type.STRING },
    tone: { type: Type.STRING },
    detectedEmotion: { type: Type.STRING },
  },
  required: ["tasks", "message", "tone", "spokenResponse"],
};

// Retrieve recent task history to provide context-aware suggestions
const getHistoryContext = () => {
  try {
    const tasks = localStorage.getItem('focusFlow_tasks_v7');
    if (!tasks) return "No recent history.";
    const parsed = JSON.parse(tasks);
    // Limit to 5 recent tasks to save tokens
    return JSON.stringify(parsed.slice(0, 5));
  } catch (e) {
    return "Error reading history";
  }
};

// Retrieve Garden State to gamify the response
const getGardenContext = () => {
  try {
    const garden = localStorage.getItem('focusFlow_gardenState_v7');
    if (!garden) return "Stage: Seed, XP: 0";
    const parsed = JSON.parse(garden);
    const stages = ["Hạt Giống (Seed)", "Nảy Mầm (Sprout)", "Cây Non (Sapling)", "Cây Trưởng Thành (Tree)", "Ra Hoa (Bloom)"];
    return `Stage: ${stages[parsed.stage] || 'Unknown'}, XP: ${parsed.xp}`;
  } catch (e) {
    return "Stage: Seed, XP: 0";
  }
};

export const generateTasks = async (
  input: string,
  energyLevel: EnergyLevel,
  imageBase64?: string | null
): Promise<AIResponse> => {
  
  // 1. Gather Context
  const history = getHistoryContext();
  const gardenState = getGardenContext();

  // 2. Construct Dynamic System Prompt (V8 Engine)
  const systemPrompt = `
    ROLE: You are Focus Flow V8, the ultimate ADHD productivity companion and "Game Master" of the Zen Garden. Your mission is to transform the user's chaos, procrastination, and overwhelm into manageable, engaging missions.

    === INPUT CONTEXT ===
    - ENERGY_LEVEL: ${energyLevel.toUpperCase()}
    - GARDEN_STATE: ${gardenState}
    - HISTORY: ${history}

    === CORE OBJECTIVES & LOGIC (V8 ENGINE) ===

    1. MULTIMODAL EMPATHY:
       - Analyze tone/emotion from input.
       - IF "Panic" or "Fast Paced": Switch to "Calm Down" mode (1-2 very simple tasks).
       - IF "Exhausted": Switch to "Survival" mode (Self-care first).
       - IF IMAGE PROVIDED: Identify the "Visual Clutter Core" (the one item causing stress) and instruct to clear that first.

    2. AI-DRIVEN GAMIFICATION (DYNAMIC XP):
       - You control the reward system.
       - Calculate 'xpReward' (integer 10-100) for each task based on Relative Difficulty.
       - High Difficulty Task + Low Energy User = SUPER XP (Reward overcoming paralysis).
       - Low Difficulty Task + High Energy User = Standard XP.
       - Maximize Dopamine.

    3. INTELLIGENT BREAKDOWN STRATEGY:
       - Low Energy: "Micro-dosing" (3 steps, 1-3 mins). E.g., "Pick up exactly one sock."
       - High Energy: "Sprinting" (5-8 steps, fast-paced).
       - Task titles MUST start with a strong VERB.

    4. LANGUAGE RULE:
       - Analyze the input instructions in English/Vietnamese, BUT generate the output content (tasks, message, spokenResponse) in the SAME LANGUAGE as the user's input.
       - Use a natural, supportive tone suitable for an ADHD coach.

    5. OUTPUT SCHEMA:
       - JSON with 'tasks' (including xpReward), 'message', 'spokenResponse' (conversational TTS text), 'tone', 'detectedEmotion'.
  `;

  // Using gemini-2.5-flash as the stable model for text tasks
  const modelId = 'gemini-2.5-flash';
  const parts: any[] = [];
  
  if (imageBase64) {
    const base64Data = imageBase64.split(',')[1] || imageBase64;
    parts.push({ inlineData: { data: base64Data, mimeType: 'image/jpeg' } });
    parts.push({ text: "\n\nAnalyze this image for clutter and create a cleanup plan." });
  }
  
  // If input is empty, use a default prompt that relies on context
  parts.push({ text: input || `I am ready. My energy is ${energyLevel}. Look at my garden and history, what should I do next?` });

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: { parts: parts },
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    if (response.text) {
      const data = JSON.parse(response.text) as AIResponse;
      const tasksWithIds = data.tasks.map(t => ({
        ...t, id: Math.random().toString(36).substr(2, 9), completed: false
      }));
      return { ...data, tasks: tasksWithIds };
    }
    throw new Error("No response text");
  } catch (error) {
    console.error("Gemini API Error:", error);
    return {
      message: "Đang gặp sự cố kết nối. Hãy hít thở sâu và thử lại nhé.",
      tone: "neutral",
      spokenResponse: "Có lỗi kết nối, bạn hãy thử lại sau nhé.",
      detectedEmotion: "neutral",
      tasks: [{ id: "err", title: "Hít thở sâu", duration: "1 phút", completed: false, xpReward: 10, difficulty: 'easy' }]
    };
  }
};