import React, { useState, useEffect } from "react";
import { UploadZone } from "./components/PixelLift/UploadZone";
import { ConfigurationPanel, EnhancementMode } from "./components/PixelLift/ConfigurationPanel";
import { ResultView } from "./components/PixelLift/ResultView";
import { Layers, Sun, Moon } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "./components/ui/button";
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
function mapModeToBackend(mode: EnhancementMode): string {
  switch (mode) {
    case "photo-enhancer":
      return "photo";      // normal photo enhancement
    case "smart-upscale":
      return "print";      // print / upscaling mode
    case "document-ocr":
      return "doc";        // document / OCR mode
    case "restoration":
      return "old";        // old photo restoration
    case "product-clarity":
      return "product";    // product / e-commerce
    default:
      return "photo";
  }
}


type Step = 'upload' | 'configure' | 'result';

export default function App() {
  const [step, setStep] = useState<Step>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  
  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Enhancement Settings
  const [mode, setMode] = useState<EnhancementMode>('photo-enhancer');
  const [strength, setStrength] = useState<number>(50);
  
  // Processing State
  const [isProcessing, setIsProcessing] = useState(false);
  const [resultUrl, setResultUrl] = useState<string>("");

  // Metadata
  const [dimensions, setDimensions] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  
  const [resultSummary, setResultSummary] = useState<string>("");

  // Handle File Upload
  const handleFileSelect = (selectedFile: File) => {
    const url = URL.createObjectURL(selectedFile);
    setFile(selectedFile);
    setPreviewUrl(url);
    
    // Get dimensions
    const img = new Image();
    img.onload = () => {
      setDimensions({ width: img.width, height: img.height });
    };
    img.src = url;
    
    setStep('configure');
  };

  // Cleanup URLs
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleStartEnhancement = async () => {
  // If no file is loaded, do nothing
  if (!file || !previewUrl) {
    console.warn("No file to enhance");
    return;
  }

  setIsProcessing(true);

  try {
    // Build form-data payload for FastAPI
    const formData = new FormData();
    formData.append("file", file);                          // the image
    formData.append("mode", mapModeToBackend(mode));        // convert UI mode to backend mode
    formData.append("strength", String(strength));          // 0–100

    // TALK TO PYTHON BACKEND HERE:
   const resp = await fetch(`${API_BASE_URL}/api/enhance`, {
  method: "POST",
  body: formData,
});


    if (!resp.ok) {
      throw new Error("Server error");
    }

    // Backend returns JSON: { image_data, width, height, summary }
    const data = await resp.json() as {
      image_data: string;
      width: number;
      height: number;
      summary: string;
    };

    // Save enhanced image URL and summary
    setResultUrl(data.image_data);          // data:image/png;base64,....
    setResultSummary(data.summary || "");
    // if you track dimensions somewhere, you can set them too

    // Move to Result screen
    setStep("result");
  } catch (error) {
    console.error(error);
    alert("Failed to enhance image. Please try again in a moment.");
  } finally {
    setIsProcessing(false);
  }
};


  const handleAdjust = () => {
    setStep('configure');
  };

  const handleReset = () => {
    setFile(null);
    setPreviewUrl("");
    setResultUrl("");
    setMode('photo-enhancer');
    setStrength(50);
    setStep('upload');
  };

  return (
    <div className={isDarkMode ? "dark" : ""}>
      <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-black dark:text-slate-200 font-sans selection:bg-emerald-500/30 transition-colors duration-300">
        {/* Navbar */}
        <header className="fixed top-0 left-0 right-0 h-16 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-black/60 backdrop-blur-md z-50 transition-colors duration-300">
  <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
    {/* Logo + Brand */}
    <button
      onClick={handleReset}
      className="flex items-center gap-2 cursor-pointer group"
    >
      <div className="bg-emerald-500 rounded-lg p-1.5 shadow-sm">
        <Layers className="w-5 h-5 text-white dark:text-black" />
      </div>
      <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
        PixelLift
      </span>
    </button>

    {/* Right side: tiny label + theme toggle */}
    <div className="flex items-center gap-3">
      <span className="hidden sm:inline text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
        AI Image Enhancer
      </span>

      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsDarkMode(!isDarkMode)}
        className="text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-white/10 rounded-full w-9 h-9"
      >
        {isDarkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </Button>
    </div>
  </div>
</header>


        {/* Main Content */}
        <main className="pt-24 pb-12 px-6 min-h-screen flex flex-col">
          <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col">
            
            <AnimatePresence mode="wait">
              {step === 'upload' && (
                <motion.div 
                  key="upload"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="flex flex-col items-center justify-center flex-1 py-12"
                >
                  <div className="text-center mb-12 space-y-4">
                    <h1 className="text-4xl md:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-slate-900 to-slate-500 dark:from-white dark:to-slate-400 pb-2">
                      Transform your photos<br />with AI precision.
                    </h1>
                    <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                      Upscale, restore, and enhance your images intelligently. <br className="hidden md:block"/>
                      Drag and drop to get started instantly.
                    </p>
                  </div>
                  
                  <UploadZone onFileSelect={handleFileSelect} />
                </motion.div>
              )}

              {step === 'configure' && file && (
                <motion.div
                  key="configure"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex-1 h-full"
                >
                  <ConfigurationPanel 
                    file={file}
                    previewUrl={previewUrl}
                    imageDimensions={dimensions}
                    mode={mode}
                    strength={strength}
                    onModeChange={setMode}
                    onStrengthChange={setStrength}
                    onStart={handleStartEnhancement}
                    isProcessing={isProcessing}
                    onCancel={handleReset}
                  />
                </motion.div>
              )}

              {step === 'result' && (
                <motion.div
                  key="result"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="flex-1 h-full"
                >
                  <ResultView 
                    originalUrl={previewUrl}
                    enhancedUrl={resultUrl}
                    mode={mode}
                    strength={strength}
                    onReset={handleReset}
                    onAdjust={handleAdjust}
                    summary={resultSummary}
                  />
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </main>
      </div>
    </div>
  );
}
