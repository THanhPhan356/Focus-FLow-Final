import React, { forwardRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sprout, Flower, TreeDeciduous, Leaf, CircleDashed } from 'lucide-react';

interface ZenGardenProps {
  stage: number; xp: number; maxXp: number; cycle: number; isHighEnergy: boolean; onDevGrow: () => void;
}

const ZenGarden = forwardRef<HTMLDivElement, ZenGardenProps>(({ stage, xp, maxXp, cycle, isHighEnergy, onDevGrow }, ref) => {
  const [prevStage, setPrevStage] = useState(stage);
  useEffect(() => {
    setPrevStage(stage);
  }, [stage, prevStage]);

  const getPlantIcon = () => {
    switch (stage) {
      case 0: return <CircleDashed size={28} className="text-slate-300" />;
      case 1: return <Sprout size={28} className="text-[#84a59d]" />; // Sage
      case 2: return <Leaf size={32} className="text-[#588157]" />; // Forest Green
      case 3: return <TreeDeciduous size={36} className="text-[#3a5a40]" />; // Deep Green
      case 4: return <Flower size={34} className="text-[#f4a261]" />; // Soft Orange
      default: return <Sprout size={28} />;
    }
  };
  
  return (
    <div ref={ref} className="relative flex items-center gap-4 p-4 rounded-3xl bg-white shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-50">
       <div className="relative flex-shrink-0 w-14 h-14 rounded-full bg-[#FDFBF7] flex items-center justify-center shadow-inner border border-slate-100 overflow-hidden">
          <AnimatePresence mode="wait">
            <motion.div 
              key={`${stage}-${cycle}`} 
              initial={{ scale: 0.5, opacity: 0, rotate: -20 }} 
              animate={{ scale: 1, opacity: 1, rotate: 0 }} 
              exit={{ scale: 0.5, opacity: 0 }} 
              transition={{ type: "spring", bounce: 0.5 }}
              className="relative z-10"
            >
              {getPlantIcon()}
            </motion.div>
          </AnimatePresence>
       </div>
       <div className="flex flex-col flex-1 pr-2">
          <div className="flex justify-between items-baseline mb-2">
            <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400">Garden</span>
            <span className="text-xs font-serif font-bold text-slate-600">Level {cycle * 5 + stage + 1}</span>
          </div>
          <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
             <motion.div 
               className="h-full bg-slate-600"
               initial={{ width: 0 }} 
               animate={{ width: `${(xp / maxXp) * 100}%` }} 
               transition={{ duration: 0.5 }}
             />
          </div>
       </div>
    </div>
  );
});
export default ZenGarden;