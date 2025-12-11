import React, { useState, useEffect, useRef, useCallback } from "react";
import { MoveHorizontal } from "lucide-react";

interface ComparisonSliderProps {
  beforeImage: string;
  afterImage: string;
  className?: string;
  aspectRatio?: number; // Optional forced aspect ratio
  afterStyle?: React.CSSProperties;
}

export const ComparisonSlider: React.FC<ComparisonSliderProps> = ({
  beforeImage,
  afterImage,
  className = "",
  aspectRatio,
  afterStyle,
}) => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMove = useCallback(
    (clientX: number) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
      const percentage = (x / rect.width) * 100;
      setSliderPosition(percentage);
    },
    []
  );

  const onMouseDown = () => setIsDragging(true);
  const onTouchStart = () => setIsDragging(true);

  useEffect(() => {
    const handleMouseUp = () => setIsDragging(false);
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) handleMove(e.clientX);
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (isDragging) handleMove(e.touches[0].clientX);
    };

    if (isDragging) {
      document.addEventListener("mouseup", handleMouseUp);
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("touchend", handleMouseUp);
      document.addEventListener("touchmove", handleTouchMove);
    }

    return () => {
      document.removeEventListener("mouseup", handleMouseUp);
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("touchend", handleMouseUp);
      document.removeEventListener("touchmove", handleTouchMove);
    };
  }, [isDragging, handleMove]);

  // Handle click on container to jump to position
  const handleClick = (e: React.MouseEvent) => {
    handleMove(e.clientX);
  };

  return (
    <div
      className={`relative w-full overflow-hidden select-none group cursor-crosshair rounded-xl border border-white/10 dark:border-white/10 shadow-2xl ${className}`}
      ref={containerRef}
      onClick={handleClick}
      style={{
        aspectRatio: aspectRatio ? `${aspectRatio}` : "auto",
      }}
    >
      {/* After Image (Background/Underneath) */}
      <img
        src={afterImage}
        alt="After"
        className="absolute inset-0 w-full h-full object-contain bg-slate-100 dark:bg-[#0f0f11] transition-colors duration-300"
        draggable={false}
        style={afterStyle}
      />
      
      {/* Label - After (Right side usually) */}
      <div className="absolute top-4 right-4 bg-emerald-500/90 backdrop-blur-md text-white text-xs font-medium px-2 py-1 rounded shadow-lg shadow-emerald-500/20 z-10 pointer-events-none">
        Enhanced
      </div>

      {/* Before Image (Foreground/Top - Clipped) */}
      <div
        className="absolute inset-0 w-full h-full overflow-hidden"
        style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
      >
        <img
          src={beforeImage}
          alt="Before"
          className="absolute inset-0 w-full h-full object-contain bg-slate-100 dark:bg-[#0f0f11] transition-colors duration-300"
          draggable={false}
        />
        
        {/* Label - Before (Left side usually) */}
        <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-md text-white/90 text-xs font-medium px-2 py-1 rounded border border-white/10 z-10 pointer-events-none">
          Original
        </div>
      </div>

      {/* Slider Handle */}
      <div
        className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize z-20 shadow-[0_0_10px_rgba(0,0,0,0.5)]"
        style={{ left: `${sliderPosition}%` }}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
      >
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg transform transition-transform group-active:scale-110">
          <MoveHorizontal className="w-4 h-4 text-black" />
        </div>
      </div>
    </div>
  );
};
