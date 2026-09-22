'use client';

import React from 'react';
import { MapPin, Building, Wind, Info } from 'lucide-react';

export const CityInsightsView: React.FC = () => {
  const stations = [
    {
      name: 'Central Delhi (ITO Station)',
      region: 'Delhi NCR, India',
      typicalAQI: '250–450+ (Severe to Hazardous)',
      sensorData: 'High PM2.5 & NO₂ from vehicular density and winter inversion trapping',
      terrain: 'Urban canyon with heavy particulate boundary layer',
      datasetRole: 'High-concentration calibration baseline',
    },
    {
      name: 'Bengaluru (Spice Garden Station)',
      region: 'Karnataka, India',
      typicalAQI: '20–75 (Good to Moderate)',
      sensorData: 'Low particulate load with diurnal traffic variations',
      terrain: 'Deccan plateau (920m altitude) with favorable atmospheric dispersion',
      datasetRole: 'Clean atmospheric visual reference',
    },
    {
      name: 'Biratnagar Station',
      region: 'Morang District, Nepal',
      typicalAQI: '120–220 (USG to Unhealthy)',
      sensorData: 'Transboundary aerosol transport, brick kiln PM10',
      terrain: 'Terai lowlands near Himalayan foothills',
      datasetRole: 'Cross-border Himalayan sub-basin monitoring',
    },
    {
      name: 'Faridabad (New Industrial Town)',
      region: 'Haryana, India',
      typicalAQI: '180–320 (Unhealthy to Hazardous)',
      sensorData: 'High industrial particulate matter (PM10) and sulfur compounds',
      terrain: 'Dense industrial manufacturing corridor',
      datasetRole: 'Industrial haze optical footprint',
    },
    {
      name: 'Greater Noida (Knowledge Park III)',
      region: 'Uttar Pradesh, India',
      typicalAQI: '150–280 (USG to Very Unhealthy)',
      sensorData: 'Coarse dust, ozone precursors, high aerosol optical depth',
      terrain: 'Rapid development perimeter with active construction suspension',
      datasetRole: 'Aerosol scattering profile benchmark',
    },
    {
      name: 'Dimapur Station',
      region: 'Nagaland, India',
      typicalAQI: '40–110 (Good to Moderate)',
      sensorData: 'Seasonal biomass smoke and localized valley aerosols',
      terrain: 'North-Eastern valley surrounded by forested hills',
      datasetRole: 'Topographic valley baseline',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <MapPin className="w-5 h-5 text-emerald-400" />
          <h2 className="text-lg font-semibold text-white tracking-tight">
            Continuous Ambient Monitoring Station Network
          </h2>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed mt-1">
          The SkyLens ResNet-34 model was trained on 12,240 labeled sky images captured synchronously with official CAAQMS telemetry across 8 monitoring stations in India and Nepal.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
          {stations.map((st, idx) => (
            <div
              key={idx}
              className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-semibold text-white flex items-center gap-1.5">
                    <Building className="w-4 h-4 text-emerald-400 shrink-0" />
                    {st.name}
                  </h4>
                  <span className="text-[10px] font-medium text-slate-400 bg-slate-800 px-2 py-0.5 rounded shrink-0">
                    {st.region}
                  </span>
                </div>

                <div className="mt-3.5 space-y-2 text-xs">
                  <div>
                    <span className="text-slate-400 font-medium">Historical AQI: </span>
                    <span className="text-slate-200 font-semibold">{st.typicalAQI}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Primary Telemetry: </span>
                    <span className="text-slate-300">{st.sensorData}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 font-medium">Topography: </span>
                    <span className="text-slate-400">{st.terrain}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                <Info className="w-3.5 h-3.5" />
                <span>{st.datasetRole}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
