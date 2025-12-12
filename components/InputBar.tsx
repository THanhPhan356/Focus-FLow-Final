import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Mic, Send, X, Image as ImageIcon } from 'lucide-react';

interface InputBarProps {
  value: string;
  onChange: (val: string) => void;
  onSubmit: () => void;
  onImageSelect: (base64: string | null) => void;
  selectedImage: string | null;
  isLoading: boolean;
  isHighEnergy: boolean;
}

const InputBar: React.FC<InputBarProps> = ({ 
  value, onChange, onSubmit, onImageSelect, selectedImage, isLoading, isHighEnergy 
}) => {
  const [isListening, setIsListening] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [value]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => onImageSelect(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const toggleListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      alert("Voice input is not supported in this browser.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      onChange(value + (value ? ' ' : '') + transcript);
    };

    recognition.start();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
    }
  };

  return (
    <div className="w-full">
      <motion.div 
        layout
        className="bg-white rounded-3xl shadow-sm border border-slate-100 p-2 relative"
      >
        {selectedImage && (
          <div className="relative mx-2 mt-2 mb-2 group">
            <img src={selectedImage} className="h-32 w-full object-cover rounded-2xl opacity-90 grayscale-[20%]" />
            <button 
              type="button" 
              onClick={() => onImageSelect(null)} 
              className="absolute top-2 right-2 bg-white/80 text-slate-700 p-1.5 rounded-full hover:bg-white transition-colors"
            >
              <X size={14}/>
            </button>
          </div>
        )}

        <div className="flex items-end gap-2 p-2">
          <textarea 
            ref={textareaRef}
            value={value} 
            onChange={(e) => onChange(e.target.value)} 
            placeholder={isHighEnergy ? "What is your main focus today?" : "What feels difficult right now?"} 
            className="w-full bg-transparent resize-none outline-none text-slate-700 placeholder-slate-400 text-lg min-h-[44px] max-h-[150px] py-2 px-2"
            rows={1}
            onKeyDown={handleKeyDown}
          />
        </div>

        <div className="flex justify-between items-center px-2 pb-1 pt-2 border-t border-slate-50">
          <div className="flex items-center gap-1">
            <button 
              type="button" 
              onClick={() => fileInputRef.current?.click()} 
              className="p-3 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-all"
              title="Upload Image"
            >
              <Camera size={20} />
            </button>
            <button 
              type="button" 
              onClick={toggleListening}
              className={`p-3 rounded-full transition-all ${isListening ? 'text-red-500 bg-red-50 animate-pulse' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
              title="Voice Input"
            >
              <Mic size={20} />
            </button>
          </div>

          <button 
            onClick={onSubmit} 
            disabled={isLoading || (!value.trim() && !selectedImage)} 
            className={`px-6 py-2.5 rounded-full font-serif font-medium transition-all shadow-sm flex items-center gap-2
              ${isLoading 
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                : 'bg-slate-800 text-white hover:bg-slate-700 hover:shadow-md'
              }`}
          >
            {isLoading ? 'Reflecting...' : <span>Begin</span>}
            {!isLoading && <Send size={14} />}
          </button>
        </div>
        
        {/* Environment capture for mobile, generic file for desktop */}
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*" 
          capture="environment"
          onChange={handleImageUpload} 
        />
      </motion.div>
    </div>
  );
};

export default InputBar;