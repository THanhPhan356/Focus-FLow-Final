import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, RotateCcw, Feather } from 'lucide-react';
import confetti from 'canvas-confetti';
import { generateTasks } from './utils/gemini';
import { EnergyLevel, Task } from './types';
import EnergyToggle from './components/EnergyToggle';
import TaskCard from './components/TaskCard';
import ZenGarden from './components/ZenGarden';
import InputBar from './components/InputBar';

const XP_TO_LEVEL_UP = 300; 
const STORAGE_KEY_TASKS = 'focusFlow_tasks_v7';
const STORAGE_KEY_GARDEN = 'focusFlow_gardenState_v7';

const App: React.FC = () => {
  const [energyLevel, setEnergyLevel] = useState<EnergyLevel>('high');
  const [inputValue, setInputValue] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [recordedAudio, setRecordedAudio] = useState<string | null>(null); // New Audio State
  
  const [isLoading, setIsLoading] = useState(false);
  const [aiMessage, setAiMessage] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [detectedEmotion, setDetectedEmotion] = useState<string>('neutral');
  
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY_TASKS);
    return saved ? JSON.parse(saved) : [];
  });
  
  const [gardenState, setGardenState] = useState(() => {
    const saved = localStorage.getItem(STORAGE_KEY_GARDEN);
    return saved ? JSON.parse(saved) : { stage: 0, xp: 0, cycle: 0 };
  });

  const gardenRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(tasks)); }, [tasks]);
  useEffect(() => { localStorage.setItem(STORAGE_KEY_GARDEN, JSON.stringify(gardenState)); }, [gardenState]);
  useEffect(() => {
    if (tasks.length > 0) {
      setProgress((tasks.filter(t => t.completed).length / tasks.length) * 100);
    } else { setProgress(0); }
  }, [tasks]);

  // Effect to trigger confetti when motivated emotion is detected
  useEffect(() => {
    if (detectedEmotion === 'motivated') {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FCD34D', '#F87171', '#60A5FA']
      });
    }
  }, [detectedEmotion]);

  const handleSubmit = async () => {
    // Check if we have ANY input (Text, Image, OR Audio)
    if ((!inputValue.trim() && !selectedImage && !recordedAudio) || isLoading) return;
    
    setIsLoading(true); setTasks([]); setAiMessage(null);
    try {
      // Pass recorded audio to Gemini
      const response = await generateTasks(inputValue, energyLevel, selectedImage, recordedAudio);
      
      setTasks(response.tasks);
      setAiMessage(response.message);
      
      if (response.detectedEmotion) {
        setDetectedEmotion(response.detectedEmotion);
      } else {
        setDetectedEmotion('neutral');
      }

      setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    } catch (err) { console.error(err); } 
    finally { 
      setIsLoading(false); 
      setInputValue(''); 
      setSelectedImage(null); 
      setRecordedAudio(null); // Clear audio after send
    }
  };

  const addGardenXp = (amount: number) => {
    setGardenState(prev => {
      let newXp = prev.xp + amount;
      let newStage = prev.stage;
      let newCycle = prev.cycle;
      
      while (newXp >= XP_TO_LEVEL_UP) {
        newXp -= XP_TO_LEVEL_UP;
        newStage++;
        if (newStage > 4) { 
          newStage = 0; 
          newCycle++; 
        }
      }
      return { xp: newXp, stage: newStage, cycle: newCycle };
    });
  };

  const handleTaskComplete = (id: string) => {
    const task = tasks.find(t => t.id === id);
    setTasks(prev => prev.map(t => t.id === id ? { ...t, completed: true } : t));
    
    if (task && !task.completed) {
       setTimeout(() => addGardenXp(task.xpReward || 20), 600);
    }
  };

  const handleReset = () => {
    setTasks([]); 
    setInputValue(''); 
    setSelectedImage(null); 
    setRecordedAudio(null);
    setAiMessage(null);
    setDetectedEmotion('neutral');
    localStorage.removeItem(STORAGE_KEY_TASKS);
  };

  const isHigh = energyLevel === 'high';

  // Dynamic Background and Text Color Logic
  const getThemeColors = () => {
    switch(detectedEmotion) {
      case 'anxious': // Calm Blue
        return { bg: 'bg-[#E0F2FE]', text: 'text-slate-800', accent: 'text-blue-600' };
      case 'motivated': // Energetic Warmth
        return { bg: 'bg-[#FFF7ED]', text: 'text-slate-900', accent: 'text-orange-600' };
      case 'exhausted': // Dark Mode / Gentle
        return { bg: 'bg-[#1E293B]', text: 'text-slate-100', accent: 'text-indigo-300' };
      default: // Neutral Cream
        return { bg: 'bg-[#FDFBF7]', text: 'text-slate-800', accent: 'text-slate-600' };
    }
  };

  const theme = getThemeColors();

  return (
    <div className={`min-h-screen transition-colors duration-1000 ${theme.bg} flex flex-col relative pb-40`}>
      <header className={`sticky top-0 z-40 ${theme.bg}/80 backdrop-blur-md px-6 py-6 flex justify-center items-center transition-colors duration-1000`}>
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm border border-white/10">
            <Feather size={18} className={theme.accent} />
          </div>
          <h1 className={`serif font-bold text-2xl tracking-tight ${theme.text} transition-colors duration-1000`}>Focus Flow</h1>
        </div>
      </header>
      
      <main className="flex-1 max-w-xl w-full mx-auto px-6 pt-6">
        <EnergyToggle level={energyLevel} onToggle={setEnergyLevel} />
        
        <div className="mb-12">
          <InputBar 
            value={inputValue}
            onChange={setInputValue}
            onSubmit={handleSubmit}
            onImageSelect={setSelectedImage}
            onAudioCapture={setRecordedAudio}
            selectedImage={selectedImage}
            isLoading={isLoading}
            isHighEnergy={isHigh}
          />
        </div>
        
        <div ref={messagesEndRef}>
           {aiMessage && (
             <motion.div 
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               className="mb-8 p-6 rounded-3xl bg-white/90 backdrop-blur-sm border border-white/20 shadow-sm"
              >
               <h3 className={`serif text-xl leading-relaxed text-center italic ${theme.text}`}>
                 "{aiMessage}"
               </h3>
             </motion.div>
           )}
           
           <div className="space-y-4">
             <AnimatePresence>
               {tasks.filter(t => !t.completed).map((task, idx) => (
                 <TaskCard key={task.id} task={task} index={idx} onComplete={handleTaskComplete} onWater={() => {}} />
               ))}
             </AnimatePresence>
             
             {tasks.length > 0 && tasks.every(t => t.completed) && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center mt-12 p-8 rounded-3xl bg-white border border-slate-100 shadow-sm"
                >
                  <div className="inline-flex p-4 rounded-full bg-yellow-50 mb-4">
                    <Trophy size={40} className="text-yellow-600" />
                  </div>
                  <h3 className="serif text-2xl font-bold text-slate-800 mb-2">Moment of Clarity</h3>
                  <p className="text-slate-500 mb-6">You've cleared your path. Take a deep breath.</p>
                  <button onClick={handleReset} className="px-8 py-3 bg-slate-800 text-white rounded-full font-medium hover:bg-slate-700 transition-colors inline-flex items-center">
                    <RotateCcw size={16} className="mr-2"/> Begin Anew
                  </button>
                </motion.div>
             )}
           </div>
        </div>

        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 w-full max-w-sm px-4 z-50">
           <ZenGarden ref={gardenRef} stage={gardenState.stage} xp={gardenState.xp} maxXp={XP_TO_LEVEL_UP} cycle={gardenState.cycle} isHighEnergy={isHigh} onDevGrow={() => addGardenXp(50)} />
        </div>
      </main>
    </div>
  );
};

export default App;