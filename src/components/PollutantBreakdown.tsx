'use client';

import React from 'react';
import { PollutantValues } from '@/lib/types';

interface PollutantBreakdownProps {
  pollutants: PollutantValues;
  aqiCategory: string;
}

export const PollutantBreakdown: React.FC<PollutantBreakdownProps> = ({ pollutants }) => {
  const cards = [
    {
      id: 'pm25',
      name: 'PM2.5',
      subname: 'Fine Inhalable Particles (<2.5 µm)',
      value: pollutants.pm25,
      unit: 'µg/m³',
      guideline: '15 µg/m³ (WHO 24h)',
      threshold: 35,
    },
    {
      id: 'pm10',
      name: 'PM10',
      subname: 'Coarse Particulates (<10 µm)',
      value: pollutants.pm10,
      unit: 'µg/m³',
      guideline: '45 µg/m³ (WHO 24h)',
      threshold: 100,
    },
    {
      id: 'no2',
      name: 'NO₂',
      subname: 'Nitrogen Dioxide',
      value: pollutants.no2,
      unit: 'ppb',
      guideline: '25 µg/m³ (WHO 24h)',
      threshold: 53,
    },
    {
      id: 'so2',
      name: 'SO₂',
      subname: 'Sulfur Dioxide',
      value: pollutants.so2,
      unit: 'ppb',
      guideline: '40 µg/m³ (WHO 24h)',
      threshold: 35,
    },
    {
      id: 'co',
      name: 'CO',
      subname: 'Carbon Monoxide',
      value: pollutants.co,
      unit: 'ppm',
      guideline: '4 mg/m³ (WHO 24h)',
      threshold: 2.0,
    },
    {
      id: 'o3',
      name: 'O₃',
      subname: 'Ground-Level Ozone',
      value: pollutants.o3,
      unit: 'ppb',
      guideline: '100 µg/m³ (WHO 8h)',
      threshold: 70,
    },
  ];

  return (
    <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-sm font-semibold text-white">Atmospheric Pollutant Estimates</h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Empirically correlated against continuous ambient monitoring station data
          </p>
        </div>
        <span className="text-[11px] font-medium text-slate-400 bg-slate-900 px-2.5 py-1 rounded border border-slate-800">
          EPA & WHO Reference Standards
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {cards.map((card) => {
          const isElevated = card.value > card.threshold;
          const ratio = Math.min((card.value / (card.threshold * 2)) * 100, 100);

          return (
            <div
              key={card.id}
              className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800/80 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white tracking-wide">{card.name}</span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                      isElevated
                        ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}
                  >
                    {isElevated ? 'Elevated' : 'Within Limit'}
                  </span>
                </div>
                <span className="text-[11px] text-slate-400 block mt-0.5 leading-tight">
                  {card.subname}
                </span>
              </div>

              <div className="my-3">
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold text-slate-100">{card.value}</span>
                  <span className="text-xs text-slate-400 font-medium">{card.unit}</span>
                </div>

                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-2">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      isElevated ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${ratio}%` }}
                  />
                </div>
              </div>

              <div className="text-[10px] text-slate-400 pt-2 border-t border-slate-800/60 flex items-center justify-between">
                <span>Guideline:</span>
                <span className="font-medium text-slate-300">{card.guideline}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
