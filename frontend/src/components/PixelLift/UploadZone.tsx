import React, { useRef, useState } from "react";
import { Upload, Image as ImageIcon, FileImage } from "lucide-react";
import { motion } from "motion/react";

interface UploadZoneProps {
  onFileSelect: (file: File) => void;
}

export const UploadZone: React.FC<UploadZoneProps> = ({ onFileSelect }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndUpload(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndUpload(e.target.files[0]);
    }
  };

  const validateAndUpload = (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file (PNG, JPG, WEBP).");
      return;
    }
    onFileSelect(file);
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <motion.div
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className={`
          relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-colors duration-300
          ${
            isDragOver
              ? "border-emerald-500 bg-emerald-500/10 dark:bg-emerald-500/10"
              : "border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-500 bg-white/50 dark:bg-slate-900/50 hover:bg-white dark:hover:bg-slate-900"
          }
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
      >
        <input
          type="file"
          ref={inputRef}
          className="hidden"
          accept="image/*"
          onChange={handleChange}
        />
        
        <div className="flex flex-col items-center gap-4">
          <div className={`p-4 rounded-full transition-colors ${isDragOver ? 'bg-emerald-500/20 text-emerald-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
            <Upload className="w-8 h-8" />
          </div>
          
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-slate-900 dark:text-white transition-colors">
              Click or drag image here
            </h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm max-w-[280px] mx-auto transition-colors">
              Supports JPG, PNG, WEBP. Up to 10MB.
            </p>
          </div>
        </div>

        {/* Decorative background icons */}
        <ImageIcon className="absolute top-6 left-6 w-12 h-12 text-slate-200/50 dark:text-slate-800/50 -rotate-12 pointer-events-none transition-colors" />
        <FileImage className="absolute bottom-6 right-6 w-12 h-12 text-slate-200/50 dark:text-slate-800/50 rotate-12 pointer-events-none transition-colors" />
      </motion.div>
      
      <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
        {[
          { label: "Smart Upscaling", desc: "Up to 4x resolution" },
          { label: "Restoration", desc: "Fix old photos" },
          { label: "Detail Recovery", desc: "Sharpen & clarify" }
        ].map((item, i) => (
          <div key={i} className="bg-white/50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-3 rounded-lg transition-colors">
            <div className="text-emerald-500 dark:text-emerald-400 font-medium text-sm">{item.label}</div>
            <div className="text-slate-500 dark:text-slate-500 text-xs">{item.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
};
