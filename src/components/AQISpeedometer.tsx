'use client';

import React from 'react';
import { ShieldCheck, Info, CheckCircle2 } from 'lucide-react';

interface AQISpeedometerProps {
  category: string;
  confidence: number;
  aqiRange: string;
  badge: string;
  color: string;
  lowConfidence?: boolean;
}

const AQI_TIERS = [
  { name: 'Good', range: '0–50', color: '#10B981', bg: 'bg-emerald-500' },
  { name: 'Moderate', range: '51–100', color: '#F59E0B', bg: 'bg-amber-500' },
  { name: 'USG', range: '101–150', color: '#F97316', bg: 'bg-orange-500' },
  { name: 'Unhealthy', range: '151–200', color: '#EF4444', bg: 'bg-red-500' },
  { name: 'Very Unhealthy', range: '201–300', color: '#9333EA', bg: 'bg-purple-600' },
  { name: 'Hazardous', range: '301+', color: '#881337', bg: 'bg-rose-950' },
];

export const AQISpeedometer: React.FC<AQISpeedometerProps> = ({
  category,
  confidence,
  aqiRange,
  badge,
  color,
  lowConfidence = false,
}) => {
  const activeIndex = AQI_TIERS.findIndex(
    (t) => t.name.toLowerCase() === category.toLowerCase()
  );

  return (
    <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-6 shadow-sm flex flex-col justify-between">
      {/* Header Info */}
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Air Quality Classification
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {lowConfidence && (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-amber-950/70 border border-amber-600/70 text-amber-300">
                Low Confidence
              </span>
            )}
            <span
              className="text-xs font-medium px-2.5 py-1 rounded-md text-white shadow-xs"
              style={{ backgroundColor: color }}
            >
              {badge}
            </span>
          </div>
        </div>

        {/* Primary Classification Reading */}
        <div className="flex items-baseline gap-3 my-1">
          <h2
            className="text-3xl sm:text-4xl font-bold tracking-tight"
            style={{ color }}
          >
            {category}
          </h2>
          <span className="text-sm font-medium text-slate-400">
            AQI {aqiRange}
          </span>
        </div>

        <p className="text-xs text-slate-400 mt-1 mb-5">
          Confidence level: <strong className={lowConfidence ? 'text-amber-300' : 'text-slate-200'}>{(confidence * 100).toFixed(1)}%</strong> based on ResNet-34 visual optical estimation.
        </p>
      </div>

      {/* Multi-Segment EPA AQI Spectrum Bar */}
      <div className="space-y-2 my-2">
        <div className="grid grid-cols-6 gap-1 h-3 rounded-full overflow-hidden bg-slate-900 p-0.5 border border-slate-800">
          {AQI_TIERS.map((tier, idx) => {
            const isActive = idx === activeIndex;
            return (
              <div
                key={tier.name}
                className={`h-full rounded-sm transition-all relative ${tier.bg} ${
                  isActive ? 'opacity-100 ring-2 ring-white ring-offset-1 ring-offset-[#0F172A]' : 'opacity-40'
                }`}
                title={`${tier.name} (${tier.range})`}
              />
            );
          })}
        </div>

        {/* Spectrum Range Labels */}
        <div className="grid grid-cols-6 text-[10px] text-slate-400 font-medium text-center">
          <span>0–50</span>
          <span>51–100</span>
          <span>101–150</span>
          <span>151–200</span>
          <span>201–300</span>
          <span>301+</span>
        </div>
      </div>

      {/* Key Diagnostic Indicators */}
      <div className="mt-5 pt-4 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60">
          <span className="text-[10px] text-slate-400 font-medium block">Optical Density</span>
          <span className="text-xs font-semibold text-slate-200 mt-0.5 block">
            {activeIndex <= 1 ? 'Clear / Low' : activeIndex <= 3 ? 'Moderate Haze' : 'Severe Extinction'}
          </span>
        </div>
        <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60">
          <span className="text-[10px] text-slate-400 font-medium block">Atmospheric Risk</span>
          <span className="text-xs font-semibold text-slate-200 mt-0.5 block">
            {activeIndex === 0 ? 'Minimal' : activeIndex <= 2 ? 'Low–Moderate' : 'High Alert'}
          </span>
        </div>
        <div className="bg-slate-900/60 p-2.5 rounded-lg border border-slate-800/60 col-span-2 sm:col-span-1">
          <span className="text-[10px] text-slate-400 font-medium block">Verification</span>
          <span className="text-xs font-semibold text-emerald-400 mt-0.5 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> Ground-Calibrated
          </span>
        </div>
      </div>
    </div>
  );
};
