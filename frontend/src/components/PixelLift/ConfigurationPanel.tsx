import React from "react";
import { 
  Wand2, 
  Maximize, 
  FileText, 
  History, 
  ShoppingBag, 
  Info
} from "lucide-react";
import { Slider } from "../ui/slider";
import { Button } from "../ui/button";
import { motion } from "motion/react";

export type EnhancementMode = 
  | 'photo-enhancer' 
  | 'smart-upscale' 
  | 'document-ocr' 
  | 'restoration' 
  | 'product-clarity';

interface ConfigurationPanelProps {
  file: File;
  previewUrl: string;
  imageDimensions: { width: number; height: number };
  mode: EnhancementMode;
  strength: number;
  onModeChange: (mode: EnhancementMode) => void;
  onStrengthChange: (val: number) => void;
  onStart: () => void;
  isProcessing: boolean;
  onCancel: () => void;
}

const MODES: { id: EnhancementMode; label: string; desc: string; icon: React.ReactNode }[] = [
  { 
    id: 'photo-enhancer', 
    label: 'Photo Enhancer', 
    desc: 'Better contrast, color & detail',
    icon: <Wand2 className="w-5 h-5" />
  },
  { 
    id: 'smart-upscale', 
    label: 'Smart Upscale', 
    desc: 'High-res print quality',
    icon: <Maximize className="w-5 h-5" />
  },
  { 
    id: 'document-ocr', 
    label: 'Document / OCR', 
    desc: 'Clean text & remove shadows',
    icon: <FileText className="w-5 h-5" />
  },
  { 
    id: 'restoration', 
    label: 'Restoration', 
    desc: 'Fix noise & faded tones',
    icon: <History className="w-5 h-5" />
  },
  { 
    id: 'product-clarity', 
    label: 'Product Clarity', 
    desc: 'Sharp edges for e-commerce',
    icon: <ShoppingBag className="w-5 h-5" />
  },
];

export const ConfigurationPanel: React.FC<ConfigurationPanelProps> = ({
  file,
  previewUrl,
  imageDimensions,
  mode,
  strength,
  onModeChange,
  onStrengthChange,
  onStart,
  isProcessing,
  onCancel
}) => {
  return (
    <div className="flex flex-col lg:flex-row h-full gap-6">
      {/* Left: Preview */}
      <div className="flex-1 min-h-[400px] lg:h-auto bg-slate-100 dark:bg-[#0f0f11] rounded-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden relative group transition-colors duration-300">
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <img 
            src={previewUrl} 
            alt="Preview" 
            className="max-w-full max-h-full object-contain shadow-2xl"
          />
        </div>
        
        {/* File Info Overlay */}
        <div className="absolute top-4 left-4 bg-white/60 dark:bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-black/10 dark:border-white/10 text-xs text-slate-900/80 dark:text-white/80 flex items-center gap-2">
          <span className="font-medium text-slate-900 dark:text-white">{file.name}</span>
          <span className="w-1 h-1 bg-black/30 dark:bg-white/30 rounded-full" />
          <span>{imageDimensions.width || '...'} x {imageDimensions.height || '...'} px</span>
          <span className="w-1 h-1 bg-black/30 dark:bg-white/30 rounded-full" />
          <span>{(file.size / 1024 / 1024).toFixed(2)} MB</span>
        </div>

        {/* Change Image Button */}
        <button 
          onClick={onCancel}
          className="absolute top-4 right-4 bg-black/5 hover:bg-black/10 dark:bg-white/10 dark:hover:bg-white/20 text-slate-900 dark:text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors backdrop-blur-md"
        >
          Change Image
        </button>
      </div>

      {/* Right: Controls */}
      <div className="w-full lg:w-[400px] flex flex-col gap-6">
        <div className="space-y-1">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white transition-colors">Configure Enhancement</h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm transition-colors">Select the best AI model for your image.</p>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 space-y-6 custom-scrollbar">
          {/* Mode Selection */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300 transition-colors">AI Mode</label>
            <div className="grid grid-cols-1 gap-2">
              {MODES.map((m) => (
                <motion.button
                  key={m.id}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => onModeChange(m.id)}
                  className={`
                    relative flex items-center gap-3 p-3 rounded-xl border text-left transition-all duration-200
                    ${mode === m.id 
                      ? 'bg-emerald-500/10 border-emerald-500/50 ring-1 ring-emerald-500/50' 
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 dark:bg-slate-900/50 dark:border-slate-800 dark:hover:border-slate-700 dark:hover:bg-slate-800/50'
                    }
                  `}
                >
                  <div className={`
                    p-2 rounded-lg 
                    ${mode === m.id ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}
                  `}>
                    {m.icon}
                  </div>
                  <div>
                    <div className={`font-medium ${mode === m.id ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-200'}`}>
                      {m.label}
                    </div>
                    <div className="text-xs text-slate-500">
                      {m.desc}
                    </div>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>

          {/* Strength Slider */}
          <div className="space-y-4 pt-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-slate-700 dark:text-slate-300 flex items-center gap-2 transition-colors">
                Enhancement Strength
                <Info className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              </label>
              <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                {strength}%
              </span>
            </div>
            
            <Slider
              value={[strength]}
              min={0}
              max={100}
              step={1}
              onValueChange={(vals) => onStrengthChange(vals[0])}
              className="py-4"
            />
            
            <div className="flex justify-between text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-medium px-1">
              <span>Subtle</span>
              <span>Balanced</span>
              <span>Aggressive</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 transition-colors">
          <Button 
            size="lg" 
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold h-12 shadow-lg shadow-emerald-500/20 transition-all hover:shadow-emerald-500/40"
            onClick={onStart}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Processing...</span>
              </div>
            ) : (
              "Start Enhancement"
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
