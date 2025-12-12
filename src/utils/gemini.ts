import { GoogleGenAI } from "@google/genai";
import { AIResponse, EnergyLevel, Task } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Optimized History Context: Filters essential fields and calculates a summary
const getHistoryContext = () => {
  try {
    const tasksRaw = localStorage.getItem('focusFlow_tasks_v7');
    if (!tasksRaw) return "No recent history.";
    
    const parsed: Task[] = JSON.parse(tasksRaw);
    
    // 1. Calculate Stats
    const totalXP = parsed.reduce((sum, t) => sum + (t.completed ? t.xpReward : 0), 0);
    const completedCount = parsed.filter(t => t.completed).length;
    
    // 2. Filter & Map (Last 5 tasks only, minimal fields to save tokens)
    const recentHistory = parsed.slice(0, 5).map((t) => ({
      title: t.title,
      difficulty: t.difficulty,
      completed: t.completed,
      xp: t.xpReward,
    }));

    const summary = {
      stats: `User has ${totalXP} XP total. Completed ${completedCount}/${parsed.length} recent tasks.`,
      recentTasks: recentHistory
    };
    
    return JSON.stringify(summary);
  } catch (e) {
    return "Error reading history";
  }
};

// Retrieve Garden State
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

const FALLBACK_RESPONSE: AIResponse = {
  tasks: [{ id: "fallback", title: "Breathe & Reset", duration: "2 mins", completed: false, xpReward: 10, difficulty: 'easy', reasoning: "System fallback" }],
  message: "I heard you, but I'm having trouble processing the details. Let's start with a simple breath.",
  spokenResponse: "I'm having a little trouble connecting. Just breathe for a moment.",
  tone: "neutral",
  detectedEmotion: "neutral"
};

export const generateTasks = async (
  input: string,
  energyLevel: EnergyLevel,
  imageBase64?: string | null,
  audioBase64?: string | null
): Promise<AIResponse> => {
  
  // 1. Gather Context
  const history = getHistoryContext();
  const gardenState = getGardenContext();

  // 2. Construct Dynamic System Prompt (V13 Engine)
  const systemPrompt = `
    ROLE: You are **Focus Flow V13**, a multimodal productivity companion. You analyze Text, Audio (Voice), and Vision (Images) to break down tasks for ADHD brains.

    === CONTEXT ===
    - ENERGY: ${energyLevel.toUpperCase()}
    - GARDEN: ${gardenState}
    - HISTORY_SUMMARY: ${history}

    === PROTOCOLS ===
    1. **MULTIMODAL SENSING**:
       - **AUDIO**: Listen to the tone, speed, and pauses in the user's voice (if provided). Detect 'anxious', 'tired', or 'motivated' states.
       - **VISION**: If an image is present, identify clutter or work context.
    
    2. **TASK GENERATION**:
       - Create 3-5 concrete, actionable tasks.
       - Titles must start with VERBS.
       - Assign XP based on difficulty relative to user energy.

    3. **OUTPUT**:
       - Return valid JSON ONLY.
       - 'detectedEmotion' must be one of: 'anxious' | 'motivated' | 'exhausted' | 'neutral'.
  `;

  // Model Config: Gemini 3.0 Pro for superior multimodal reasoning
  const modelId = 'gemini-3-pro-preview';
  
  const parts: any[] = [];
  
  // A. Handle Image
  if (imageBase64) {
    const imageClean = imageBase64.split(',')[1] || imageBase64;
    parts.push({ inlineData: { data: imageClean, mimeType: 'image/jpeg' } });
    parts.push({ text: "Context Image included." });
  }

  // B. Handle Audio (Native Input)
  if (audioBase64) {
    // Determine mimeType (defaulting to webm for browser recording, or mp3 if converted)
    // The SDK handles base64 audio data.
    parts.push({ inlineData: { data: audioBase64, mimeType: 'audio/webm' } }); 
    parts.push({ text: "User voice recording included. Analyze tone and intent." });
  }

  // C. Handle Text Intent
  // Even if empty, we send a prompt to trigger generation based on context/audio
  const textPrompt = input || (audioBase64 ? "Analyze my audio and tell me what to do." : "What should I do next?");
  parts.push({ text: textPrompt });

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: { parts: parts },
      config: {
        systemInstruction: systemPrompt,
        tools: [{ googleSearch: {} }],
        // responseMimeType/Schema removed to allow googleSearch usage
      },
    });

    const rawText = response.text;
    
    if (rawText) {
      // Robust JSON Parsing: Extract JSON object using Regex to handle Markdown wrapping
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      const cleanJson = jsonMatch ? jsonMatch[0] : rawText;

      const data = JSON.parse(cleanJson) as AIResponse;
      
      const tasksWithIds = data.tasks.map(t => ({
        ...t, 
        id: t.id && t.id.length > 2 ? t.id : Math.random().toString(36).substr(2, 9), 
        completed: false
      }));
      return { ...data, tasks: tasksWithIds };
    }
    
    return FALLBACK_RESPONSE;

  } catch (error) {
    console.error("Gemini API Error:", error);
    return FALLBACK_RESPONSE;
  }
};