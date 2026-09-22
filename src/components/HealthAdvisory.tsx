'use client';

import React from 'react';
import { Shield, Activity, Home, Wind, AlertCircle } from 'lucide-react';

interface HealthAdvisoryProps {
  maskRequired: boolean;
  outdoorExercise: string;
  windowsOpen: string;
  airPurifier: string;
  description: string;
  category: string;
  color: string;
}

export const HealthAdvisory: React.FC<HealthAdvisoryProps> = ({
  maskRequired,
  outdoorExercise,
  windowsOpen,
  airPurifier,
  description,
  category,
}) => {
  const isSevere = category.includes('Unhealthy') || category === 'Hazardous';

  const actionItems = [
    {
      title: 'Respiratory Protection',
      detail: maskRequired ? 'N95 / FFP2 mask recommended outdoors' : 'No mask required for general public',
      icon: Shield,
      alert: maskRequired,
    },
    {
      title: 'Physical Exertion & Exercise',
      detail: outdoorExercise,
      icon: Activity,
      alert: isSevere,
    },
    {
      title: 'Natural Ventilation',
      detail: windowsOpen,
      icon: Home,
      alert: windowsOpen.includes('Closed') || windowsOpen.includes('Seal'),
    },
    {
      title: 'Air Filtration',
      detail: airPurifier,
      icon: Wind,
      alert: airPurifier.includes('Essential') || airPurifier.includes('Advised'),
    },
  ];

  return (
    <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-5 shadow-sm">
      <div className="flex items-center gap-2 mb-3">
        <AlertCircle className="w-4 h-4 text-emerald-400" />
        <h3 className="text-sm font-semibold text-white">Public Health & Exposure Guidance</h3>
      </div>

      <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/80 p-3.5 rounded-lg border border-slate-800/80 mb-4">
        {description}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {actionItems.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className={`p-3 rounded-lg border flex items-start gap-3 transition-colors ${
                item.alert
                  ? 'bg-amber-500/5 border-amber-500/20 text-amber-200'
                  : 'bg-slate-900/60 border-slate-800 text-slate-300'
              }`}
            >
              <div
                className={`p-2 rounded-md shrink-0 ${
                  item.alert ? 'bg-amber-500/10 text-amber-400' : 'bg-slate-800 text-slate-400'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-semibold block text-slate-200">{item.title}</span>
                <span className="text-[11px] text-slate-400 mt-0.5 block leading-tight">
                  {item.detail}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
