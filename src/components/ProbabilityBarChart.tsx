'use client';

import React from 'react';

interface ProbabilityBarChartProps {
  probabilities: Record<string, number>;
  activeCategory: string;
}

const TIER_COLORS: Record<string, string> = {
  Good: '#10B981',
  Moderate: '#F59E0B',
  USG: '#F97316',
  Unhealthy: '#EF4444',
  'Very Unhealthy': '#9333EA',
  Hazardous: '#881337',
};

export const ProbabilityBarChart: React.FC<ProbabilityBarChartProps> = ({
  probabilities,
  activeCategory,
}) => {
  const entries = Object.entries(probabilities).sort((a, b) => b[1] - a[1]);

  return (
    <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-5 shadow-sm">
      <div className="flex items-center justify-between mb-3.5 pb-2.5 border-b border-slate-800">
        <div>
          <h3 className="text-sm font-semibold text-white">Class Probability Distribution</h3>
          <p className="text-xs text-slate-400 mt-0.5">Model softmax confidence score across all 6 AQI tiers</p>
        </div>
        <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
          Softmax Output
        </span>
      </div>

      <div className="space-y-2.5">
        {entries.map(([cat, prob]) => {
          const percentage = (prob * 100).toFixed(1);
          const isWinner = cat.toLowerCase() === activeCategory.toLowerCase();
          const color = TIER_COLORS[cat] || '#3B82F6';

          return (
            <div key={cat} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className={`flex items-center gap-1.5 font-medium ${isWinner ? 'text-white font-semibold' : 'text-slate-400'}`}>
                  {isWinner && (
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                  )}
                  {cat}
                </span>
                <span className={`font-mono text-xs ${isWinner ? 'text-slate-200 font-bold' : 'text-slate-400'}`}>
                  {percentage}%
                </span>
              </div>
              <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden border border-slate-800/80">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${percentage}%`,
                    backgroundColor: color,
                    opacity: isWinner ? 1 : 0.6,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
