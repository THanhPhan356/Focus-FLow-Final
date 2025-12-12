import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Camera, Mic, Send, X, Square } from 'lucide-react';

interface InputBarProps {
  value: string;
  onChange: (val: string) => void;
  onSubmit: () => void;
  onImageSelect: (base64: string | null) => void;
  onAudioCapture: (base64: string | null) => void;
  selectedImage: string | null;
  isLoading: boolean;
  isHighEnergy: boolean;
}

const InputBar: React.FC<InputBarProps> = ({ 
  value, onChange, onSubmit, onImageSelect, onAudioCapture, selectedImage, isLoading, isHighEnergy 
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [hasAudio, setHasAudio] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
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

  const handleToggleRecording = async () => {
    if (isRecording) {
      // STOP RECORDING
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    } else {
      // START RECORDING
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = () => {
            const base64String = (reader.result as string).split(',')[1];
            onAudioCapture(base64String);
            setHasAudio(true);
          };
          // Stop all tracks to release mic
          stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        setIsRecording(true);
        setHasAudio(false);
      } catch (err) {
        console.error("Error accessing microphone:", err);
        alert("Could not access microphone.");
      }
    }
  };

  const handleClearAudio = () => {
    onAudioCapture(null);
    setHasAudio(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSubmit();
      // Clear audio state after submit if desired, but parent handles data reset usually
      setHasAudio(false);
    }
  };

  const manualSubmit = () => {
    onSubmit();
    setHasAudio(false);
  };

  return (
    <div className="w-full">
      <motion.div 
        layout
        className={`bg-white rounded-3xl shadow-sm border p-2 relative transition-colors duration-300 ${isRecording ? 'border-red-200 shadow-red-50' : 'border-slate-100'}`}
      >
        {/* Preview Image */}
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

        {/* Audio Active Indicator */}
        {hasAudio && !isRecording && (
           <div className="mx-2 mt-2 mb-1 flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
             <div className="w-2 h-2 rounded-full bg-blue-500"></div>
             <span className="text-xs text-slate-500 font-medium">Audio recorded</span>
             <button onClick={handleClearAudio} className="ml-auto text-slate-400 hover:text-red-500"><X size={14}/></button>
           </div>
        )}

        <div className="flex items-end gap-2 p-2">
          {isRecording ? (
             <div className="w-full h-[44px] flex items-center justify-center gap-1">
               <span className="flex h-3 w-3 relative">
                 <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                 <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
               </span>
               <span className="text-slate-500 text-sm font-medium ml-2">Listening...</span>
             </div>
          ) : (
            <textarea 
              ref={textareaRef}
              value={value} 
              onChange={(e) => onChange(e.target.value)} 
              placeholder={isHighEnergy ? "What is your main focus today?" : "What feels difficult right now?"} 
              className="w-full bg-transparent resize-none outline-none text-slate-700 placeholder-slate-400 text-lg min-h-[44px] max-h-[150px] py-2 px-2"
              rows={1}
              onKeyDown={handleKeyDown}
            />
          )}
        </div>

        <div className="flex justify-between items-center px-2 pb-1 pt-2 border-t border-slate-50">
          <div className="flex items-center gap-1">
            <button 
              type="button" 
              onClick={() => fileInputRef.current?.click()} 
              className="p-3 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-full transition-all"
              title="Upload Image"
              disabled={isRecording}
            >
              <Camera size={20} />
            </button>
            <button 
              type="button" 
              onClick={handleToggleRecording}
              className={`p-3 rounded-full transition-all ${isRecording ? 'text-white bg-red-500 shadow-md hover:bg-red-600' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
              title={isRecording ? "Stop Recording" : "Record Audio"}
            >
              {isRecording ? <Square size={16} fill="currentColor" /> : <Mic size={20} />}
            </button>
          </div>

          <button 
            onClick={manualSubmit} 
            disabled={isLoading || (!value.trim() && !selectedImage && !hasAudio) || isRecording} 
            className={`px-6 py-2.5 rounded-full font-serif font-medium transition-all shadow-sm flex items-center gap-2
              ${(isLoading || isRecording)
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                : 'bg-slate-800 text-white hover:bg-slate-700 hover:shadow-md'
              }`}
          >
            {isLoading ? 'Thinking...' : <span>Begin</span>}
            {!isLoading && <Send size={14} />}
          </button>
        </div>
        
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