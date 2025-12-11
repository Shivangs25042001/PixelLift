import React, { useState } from "react";
import { Download, ArrowLeft, RefreshCw, CheckCircle2 } from "lucide-react";
import { Button } from "../ui/button";
import { ComparisonSlider } from "./ComparisonSlider";
import { EnhancementMode } from "./ConfigurationPanel";

interface ResultViewProps {
  originalUrl: string;
  enhancedUrl: string;
  mode: EnhancementMode;
  strength: number;
  onReset: () => void;
  onAdjust: () => void;
}

const MODE_LABELS: Record<EnhancementMode, string> = {
  "photo-enhancer": "Photo Enhancer",
  "smart-upscale": "Smart Upscale",
  "document-ocr": "Document / OCR",
  restoration: "Restoration",
  "product-clarity": "Product Clarity",
};

const MODE_FILTERS: Record<EnhancementMode, React.CSSProperties> = {
  "photo-enhancer": { filter: "contrast(1.2) saturate(1.3)" },
  "smart-upscale": { filter: "contrast(1.1) brightness(1.05)" }, // Upscale is hard to sim with CSS, just slight pop
  "document-ocr": { filter: "grayscale(1) contrast(1.5) brightness(1.1)" },
  restoration: { filter: "sepia(0.2) contrast(1.1) saturate(0.8)" },
  "product-clarity": { filter: "brightness(1.05) contrast(1.1)" },
};

export const ResultView: React.FC<ResultViewProps> = ({
  originalUrl,
  enhancedUrl,
  mode,
  strength,
  onReset,
  onAdjust,
}) => {
  // Simple local state to show "Downloaded" feedback after click
  const [downloaded, setDownloaded] = useState(false);

  // Generate a mock summary based on inputs (you can later replace this with backend summary)
  const getSummary = () => {
    const s = strength > 70 ? "Aggressive" : strength > 30 ? "Balanced" : "Subtle";
    switch (mode) {
      case "photo-enhancer":
        return `Applied ${s.toLowerCase()} color correction and dynamic range optimization. Boosted local contrast and vibrancy.`;
      case "smart-upscale":
        return `Upscaled resolution by 2x using ${s.toLowerCase()} generative fill. Sharpened fine details and removed compression artifacts.`;
      case "document-ocr":
        return `Binarized text for maximum readability with ${s.toLowerCase()} thresholding. Removed background shadows and noise.`;
      case "restoration":
        return `Restored faded colors and reduced grain using ${s.toLowerCase()} neural restoration. Inpainted scratches and defects.`;
      case "product-clarity":
        return `Isolated subject and enhanced edge definition with ${s.toLowerCase()} sharpening. Neutralized background color cast.`;
      default:
        return "Enhancement complete.";
    }
  };

  // Download enhanced image + show visual feedback on the button
  const handleDownload = () => {
    if (!enhancedUrl) return; // nothing to download yet

    const link = document.createElement("a");
    link.href = enhancedUrl; // data URL from backend
    link.download = "PixelLift-enhanced.png";
    document.body.appendChild(link);
    link.click();
    link.remove();

    // Show "Downloaded" state for a short time
    setDownloaded(true);
    setTimeout(() => {
      setDownloaded(false);
    }, 2000); // 2 seconds
  };

  return (
    <div className="flex flex-col h-full gap-6">
      {/* Header Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-emerald-500/10 text-emerald-500 p-2 rounded-full">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white transition-colors">
              Enhancement Complete
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm transition-colors">
              Processed with {MODE_LABELS[mode]} at {strength}% strength
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={onAdjust}
            className="border-slate-200 dark:border-slate-700 text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Adjust
          </Button>
          <Button
            variant="ghost"
            onClick={onReset}
            className="text-slate-500 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-white dark:hover:bg-slate-800 transition-colors"
          >
            Start Over
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row gap-6">
        {/* Left: Comparison Canvas */}
        <div className="flex-1 bg-slate-100 dark:bg-[#0f0f11] rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden relative p-4 flex items-center justify-center transition-colors duration-300">
          <ComparisonSlider
            beforeImage={originalUrl}
            afterImage={enhancedUrl}
            afterStyle={enhancedUrl === originalUrl ? MODE_FILTERS[mode] : undefined}
            className="h-full w-full max-h-[600px]"
          />
        </div>

        {/* Right: Summary & Download */}
        <div className="w-full lg:w-[320px] flex flex-col gap-6">
          <div className="bg-white dark:bg-slate-900/50 rounded-xl p-5 border border-slate-200 dark:border-slate-800 space-y-4 transition-colors">
            <h3 className="font-semibold text-slate-900 dark:text-white transition-colors">
              Result Summary
            </h3>
            <p className="text-slate-500 dark:text-slate-300 text-sm leading-relaxed transition-colors">
              {getSummary()}
            </p>

            <div className="space-y-2 pt-2">
              <div className="flex justify-between text-xs text-slate-500 dark:text-slate-500 transition-colors">
                <span>Resolution</span>
                <span className="text-slate-700 dark:text-slate-300 transition-colors">
                  Original (preserved)
                </span>
              </div>
              <div className="flex justify-between text-xs text-slate-500 dark:text-slate-500 transition-colors">
                <span>Format</span>
                <span className="text-slate-700 dark:text-slate-300 transition-colors">
                  JPG
                </span>
              </div>
            </div>
          </div>

          <div className="mt-auto">
            <Button
              className="w-full bg-emerald-500 hover:bg-emerald-600 text-white h-12 text-lg font-semibold shadow-lg shadow-emerald-500/20"
              onClick={handleDownload}
              disabled={!enhancedUrl}
            >
              {downloaded ? (
                <>
                  <CheckCircle2 className="w-5 h-5 mr-2" />
                  Downloaded
                </>
              ) : (
                <>
                  <Download className="w-5 h-5 mr-2" />
                  Download Result
                </>
              )}
            </Button>
            <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-3 transition-colors">
              Downloads are available for 24 hours.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
