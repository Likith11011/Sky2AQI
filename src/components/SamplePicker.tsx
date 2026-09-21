'use client';

import React from 'react';
import { SampleItem } from '@/lib/types';
import { MapPin, ArrowRight, Check } from 'lucide-react';

interface SamplePickerProps {
  samples: SampleItem[];
  activeSampleId?: string;
  onSelectSample: (sample: SampleItem) => void;
  isLoading: boolean;
}

const TIER_BADGES: Record<string, { label: string; style: string }> = {
  Good: { label: 'Good (0–50)', style: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  Moderate: { label: 'Moderate (51–100)', style: 'bg-amber-500/10 text-amber-400 border-amber-500/20' },
  USG: { label: 'USG (101–150)', style: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
  Unhealthy: { label: 'Unhealthy (151–200)', style: 'bg-red-500/10 text-red-400 border-red-500/20' },
  'Very Unhealthy': { label: 'Very Unhealthy (201–300)', style: 'bg-purple-500/10 text-purple-400 border-purple-500/20' },
  Hazardous: { label: 'Hazardous (301+)', style: 'bg-rose-950 text-rose-300 border-rose-800' },
};

export const SamplePicker: React.FC<SamplePickerProps> = ({
  samples,
  activeSampleId,
  onSelectSample,
  isLoading,
}) => {
  return (
    <div className="space-y-6">
      {/* Overview Intro */}
      <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="max-w-3xl">
          <h2 className="text-lg font-semibold text-white tracking-tight">
            Observation Library & Validation Test Bench
          </h2>
          <p className="text-xs text-slate-400 mt-1 leading-relaxed">
            Select an atmospheric photo collected synchronously alongside continuous ambient air quality monitoring stations (CAAQMS) across India and Nepal.
          </p>
        </div>
      </div>

      {/* Grid of Samples */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {samples.map((sample) => {
          const isActive = activeSampleId === sample.id;
          const badge = TIER_BADGES[sample.category] || {
            label: sample.category,
            style: 'bg-slate-800 text-slate-300 border-slate-700',
          };

          return (
            <div
              key={sample.id}
              onClick={() => !isLoading && onSelectSample(sample)}
              className={`bg-[#0F172A] border rounded-xl overflow-hidden transition-all duration-200 cursor-pointer flex flex-col justify-between ${
                isActive
                  ? 'border-emerald-500/80 ring-1 ring-emerald-500/40 shadow-sm'
                  : 'border-slate-800 hover:border-slate-700 hover:bg-slate-900/60'
              }`}
            >
              {/* Photo Thumbnail */}
              <div className="relative aspect-[16/10] overflow-hidden bg-slate-950">
                <img
                  src={sample.image_url}
                  alt=""
                  onError={(e) => {
                    const fallback = `/samples/${sample.id.replaceAll('-', '_')}.jpg`;
                    if (e.currentTarget.src !== fallback) {
                      e.currentTarget.src = fallback;
                    }
                  }}
                  className="w-full h-full object-cover"
                />
                <span
                  className={`absolute top-2.5 right-2.5 z-10 text-[10px] font-semibold px-2 py-0.5 rounded border backdrop-blur-md pointer-events-none ${badge.style}`}
                >
                  {badge.label}
                </span>
                {isActive && (
                  <span className="absolute top-2.5 left-2.5 z-10 text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500 text-white flex items-center gap-1 shadow-sm pointer-events-none">
                    <Check className="w-3 h-3" /> Active
                  </span>
                )}
              </div>

              {/* Station & Description Details */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-white">{sample.name}</h4>
                  <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{sample.city}</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-2.5 leading-relaxed line-clamp-2">
                    {sample.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400">Ground-Truth Reference</span>
                  <span className="font-medium text-emerald-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    {isActive ? 'Currently Inferred' : 'Load Observation'}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
