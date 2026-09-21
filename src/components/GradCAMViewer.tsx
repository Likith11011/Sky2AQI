'use client';

import React, { useState } from 'react';
import { Eye, Layers, Sparkles, SlidersHorizontal, Info } from 'lucide-react';

interface GradCAMViewerProps {
  originalImage: string;
  heatmapImage?: string;
  overlayImage?: string;
  attentionFocus?: string;
}

export const GradCAMViewer: React.FC<GradCAMViewerProps> = ({
  originalImage,
  heatmapImage,
  overlayImage,
  attentionFocus,
}) => {
  const [viewMode, setViewMode] = useState<'split' | 'overlay' | 'heatmap' | 'original'>('split');
  const [splitPos, setSplitPos] = useState<number>(50);

  return (
    <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-5 shadow-sm flex flex-col justify-between">
      {/* Header with Title and Mode Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-white">
              Visual Attention Inspector (Grad-CAM)
            </h3>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
              Layer 4 Features
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Displays localized image regions that influenced the model classification
          </p>
        </div>

        {/* View Mode Controls */}
        <div className="flex items-center p-1 rounded-lg bg-slate-900 border border-slate-800">
          {[
            { id: 'split', label: 'Split Slider', icon: SlidersHorizontal },
            { id: 'overlay', label: 'Blended CAM', icon: Layers },
            { id: 'heatmap', label: 'Heatmap', icon: Sparkles },
            { id: 'original', label: 'Original', icon: Eye },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = viewMode === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setViewMode(tab.id as any)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                  active
                    ? 'bg-slate-800 text-white border border-slate-700 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Visual Canvas */}
      <div className="relative w-full aspect-[16/10] rounded-lg overflow-hidden bg-slate-950 border border-slate-800/80 flex items-center justify-center">
        {viewMode === 'original' && (
          <img src={originalImage} alt="Original Sky" className="w-full h-full object-cover" />
        )}

        {viewMode === 'heatmap' && heatmapImage && (
          <img src={heatmapImage} alt="Grad-CAM Heatmap" className="w-full h-full object-cover" />
        )}

        {viewMode === 'overlay' && (
          <img
            src={overlayImage || originalImage}
            alt="Grad-CAM Overlay"
            className="w-full h-full object-cover"
          />
        )}

        {viewMode === 'split' && (
          <div className="relative w-full h-full select-none overflow-hidden">
            {/* Background Image: Original Photo */}
            <img src={originalImage} alt="Original" className="absolute inset-0 w-full h-full object-cover" />

            {/* Foreground Image: Attention Overlay clipped by slider */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{ clipPath: `polygon(0 0, ${splitPos}% 0, ${splitPos}% 100%, 0 100%)` }}
            >
              <img
                src={overlayImage || originalImage}
                alt="Overlay"
                className="absolute inset-0 w-full h-full object-cover"
              />
            </div>

            {/* Split Divider Line */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-white shadow-sm cursor-ew-resize"
              style={{ left: `${splitPos}%` }}
            >
              <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-white text-slate-900 border border-slate-300 flex items-center justify-center shadow-md text-[10px] font-bold select-none">
                ⬌
              </div>
            </div>

            {/* Interactive Slider Input */}
            <input
              type="range"
              min="0"
              max="100"
              value={splitPos}
              onChange={(e) => setSplitPos(Number(e.target.value))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20"
              aria-label="Split view slider"
            />
          </div>
        )}

        {/* Legend Badge */}
        <div className="absolute bottom-2.5 right-2.5 px-2.5 py-1 rounded bg-slate-950/80 backdrop-blur-md border border-slate-700/60 flex items-center gap-2 text-[10px] text-slate-300">
          <span>Low Activation</span>
          <div className="w-12 h-1.5 rounded-full bg-gradient-to-r from-blue-500 via-amber-400 to-rose-500" />
          <span>High Focus</span>
        </div>
      </div>

      {/* Explanatory Attention Note */}
      {attentionFocus && (
        <div className="mt-3.5 p-3 rounded-lg bg-slate-900/80 border border-slate-800 flex items-start gap-2.5 text-xs text-slate-300">
          <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-slate-200">Dominant Visual Cue: </span>
            <span>{attentionFocus}</span>
          </div>
        </div>
      )}
    </div>
  );
};
