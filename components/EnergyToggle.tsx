import React from 'react';
import { motion } from 'framer-motion';
import { Leaf, Zap } from 'lucide-react';
import { EnergyLevel } from '../types';

interface EnergyToggleProps {
  level: EnergyLevel;
  onToggle: (level: EnergyLevel) => void;
}

const EnergyToggle: React.FC<EnergyToggleProps> = ({ level, onToggle }) => {
  const isHigh = level === 'high';
  return (
    <div className="flex flex-col items-center space-y-3 mb-8">
      <div 
        className="relative w-full max-w-[200px] h-12 bg-white rounded-full p-1 cursor-pointer shadow-sm border border-slate-100" 
        onClick={() => onToggle(isHigh ? 'low' : 'high')}
      >
        <div className="absolute inset-0 flex justify-between items-center px-5 pointer-events-none">
          <span className={`text-[10px] font-bold tracking-widest uppercase transition-opacity duration-300 ${!isHigh ? 'opacity-0' : 'text-slate-400'}`}>Gentle</span>
          <span className={`text-[10px] font-bold tracking-widest uppercase transition-opacity duration-300 ${isHigh ? 'opacity-0' : 'text-slate-400'}`}>Active</span>
        </div>
        
        <motion.div 
          className={`absolute top-1 bottom-1 w-[calc(50%-4px)] rounded-full shadow-sm flex items-center justify-center gap-2 ${isHigh ? 'bg-slate-800 text-white' : 'bg-[#E2DED5] text-slate-600'}`} 
          initial={false} 
          animate={{ x: isHigh ? '100%' : '0%', translateX: isHigh ? '0px' : '0px' }} 
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
        >
          {isHigh ? (
            <><Zap size={14} /><span className="text-xs font-medium">Focus</span></> 
          ) : (
            <><Leaf size={14} /><span className="text-xs font-medium">Flow</span></>
          )}
        </motion.div>
      </div>
    </div>
  );
};
export default EnergyToggle;