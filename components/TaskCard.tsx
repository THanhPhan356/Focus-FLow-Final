import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Clock } from 'lucide-react';
import confetti from 'canvas-confetti';
import { Task } from '../types';

interface TaskCardProps {
  task: Task;
  onComplete: (id: string) => void;
  onWater: (rect: DOMRect) => void;
  index: number;
}

const TaskCard: React.FC<TaskCardProps> = ({ task, onComplete, onWater, index }) => {
  const [isExiting, setIsExiting] = useState(false);

  const handleCheck = (e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    onWater(rect);
    const x = (rect.left + rect.width / 2) / window.innerWidth;
    const y = (rect.top + rect.height / 2) / window.innerHeight;
    
    // Softer confetti colors
    confetti({ origin: { x, y }, particleCount: 30, spread: 60, colors: ['#4ade80', '#94a3b8', '#f1f5f9'], startVelocity: 25, disableForReducedMotion: true });
    
    setIsExiting(true);
    setTimeout(() => onComplete(task.id), 500);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.1, ease: "easeOut" }}
      className={`group relative bg-white rounded-3xl p-5 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] transition-all duration-500 border border-transparent hover:border-slate-100 ${isExiting ? 'opacity-0 scale-95' : ''}`}
    >
      <div className="flex items-start gap-4">
        <button 
          onClick={handleCheck} 
          disabled={isExiting} 
          className={`mt-1 flex-shrink-0 w-6 h-6 rounded-full border border-slate-300 flex items-center justify-center transition-all duration-300 hover:border-slate-400 hover:bg-slate-50 cursor-pointer ${isExiting ? 'bg-green-100 border-green-200' : ''}`}
        >
          {isExiting && <Check size={14} className="text-green-600" />}
        </button>
        
        <div className="flex flex-col flex-1">
          <span className={`serif text-slate-800 font-medium text-lg leading-snug transition-colors duration-300 ${isExiting ? 'line-through text-slate-300' : ''}`}>
            {task.title}
          </span>
          <div className="flex items-center text-xs text-slate-400 mt-2 font-sans tracking-wide">
            <Clock size={12} className="mr-1.5" />
            {task.duration}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
export default TaskCard;