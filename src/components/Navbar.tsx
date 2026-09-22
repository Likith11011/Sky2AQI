'use client';

import React from 'react';
import { Wind, Radio, Database, MapPin } from 'lucide-react';
import { HealthStatus } from '@/lib/types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  health: HealthStatus | null;
}

export const Navbar: React.FC<NavbarProps> = ({ activeTab, setActiveTab, health }) => {
  const isOnline = health?.status === 'ok' && health?.model_loaded;

  const navItems = [
    { id: 'scanner', label: 'Sky Estimator', icon: Wind },
    { id: 'samples', label: 'Observation Library', icon: Database },
    { id: 'cities', label: 'Ground Stations', icon: MapPin },
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#090D16]/90 backdrop-blur-md border-b border-slate-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Tagline */}
          <div
            className="flex items-center gap-3 cursor-pointer select-none"
            onClick={() => setActiveTab('scanner')}
          >
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Wind className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-semibold text-white tracking-tight">
                  SkyLens
                </span>
                <span className="text-[11px] font-medium text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded border border-slate-700/60">
                  AQI Vision
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-normal hidden sm:block">
                Atmospheric aerosol estimation via visual cues
              </p>
            </div>
          </div>

          {/* Nav Tabs */}
          <nav className="flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-slate-800 text-white border border-slate-700 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
};
