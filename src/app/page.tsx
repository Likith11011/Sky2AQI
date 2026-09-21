'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Upload, Camera, AlertCircle, AlertTriangle, RefreshCw, CheckCircle2, Image as ImageIcon } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { AQISpeedometer } from '@/components/AQISpeedometer';
import { GradCAMViewer } from '@/components/GradCAMViewer';
import { PollutantBreakdown } from '@/components/PollutantBreakdown';
import { HealthAdvisory } from '@/components/HealthAdvisory';
import { ProbabilityBarChart } from '@/components/ProbabilityBarChart';
import { SamplePicker } from '@/components/SamplePicker';
import { LiveCameraModal } from '@/components/LiveCameraModal';
import { CityInsightsView } from '@/components/CityInsightsView';

import { checkBackendHealth, fetchSampleList, predictSkyPhoto, DEFAULT_SAMPLES } from '@/lib/api';
import { HealthStatus, SampleItem, PredictionResult } from '@/lib/types';

export default function Home() {
  const [activeTab, setActiveTab] = useState<string>('scanner');
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [samples, setSamples] = useState<SampleItem[]>(DEFAULT_SAMPLES);
  const [activeSampleId, setActiveSampleId] = useState<string>('sample-good');

  const [previewUrl, setPreviewUrl] = useState<string | null>('/samples/sample_good.jpg');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function init() {
      const h = await checkBackendHealth();
      setHealth(h);
      const s = await fetchSampleList();
      if (s && s.length > 0) {
        setSamples(s);
        handleSampleSelect(s[0]);
      } else {
        handleSampleSelect(DEFAULT_SAMPLES[0]);
      }
    }
    init();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setActiveSampleId('');
      processImageFile(file, file.name);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setActiveSampleId('');
      processImageFile(file, file.name);
    }
  };

  const processImageFile = async (fileOrBlob: File | Blob, fileName: string) => {
    try {
      setErrorMsg(null);
      setIsLoading(true);

      const url = URL.createObjectURL(fileOrBlob);
      setPreviewUrl(url);

      const result = await predictSkyPhoto(fileOrBlob, fileName, true);
      setPrediction(result);
    } catch (err: any) {
      setErrorMsg(err.message || 'Analysis could not be completed. Ensure backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSampleSelect = async (sample: SampleItem) => {
    try {
      setIsLoading(true);
      setErrorMsg(null);
      setActiveSampleId(sample.id);

      const imgPath = sample.image_url.startsWith('http') || sample.image_url.startsWith('/')
        ? sample.image_url
        : `/samples/${sample.image_url}`;

      const res = await fetch(imgPath);
      if (!res.ok) {
        throw new Error(`Could not load image file from ${imgPath}`);
      }
      const blob = await res.blob();
      setPreviewUrl(imgPath);

      const result = await predictSkyPhoto(blob, `${sample.id}.jpg`, true);
      setPrediction(result);
    } catch (err: any) {
      console.error('Error in handleSampleSelect:', err);
      setErrorMsg(err.message || 'Failed to load observation sample');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#090D16] text-slate-100 flex flex-col font-sans">
      {/* Navigation Header */}
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} health={health} />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activeTab === 'scanner' && (
          <div className="space-y-8">
            {/* Input & Control Card */}
            <div className="bg-[#0F172A] border border-slate-800 rounded-xl p-6 sm:p-7 shadow-sm">
              <div className="max-w-3xl mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                  Visual Air Quality Estimator
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 mt-1.5 leading-relaxed">
                  Upload an outdoor sky photo or capture a live frame. The ResNet-34 neural model estimates atmospheric particulate density, classifies EPA AQI levels, and generates Grad-CAM attention maps.
                </p>
              </div>

              {/* Upload Dropzone and Camera Controls */}
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full sm:flex-1 p-6 rounded-lg border border-dashed border-slate-700 hover:border-slate-500 bg-slate-900/60 hover:bg-slate-900 transition-colors cursor-pointer flex flex-col items-center justify-center text-center group"
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="w-10 h-10 rounded-lg bg-slate-800 text-slate-300 flex items-center justify-center mb-2">
                    <Upload className="w-5 h-5" />
                  </div>
                  <span className="text-xs font-semibold text-slate-200">
                    Upload a sky image or drop file here
                  </span>
                  <span className="text-[11px] text-slate-400 mt-0.5">
                    JPEG, PNG, or WebP formats from smartphones or cameras
                  </span>
                </div>

                <div className="flex sm:flex-col gap-2.5 w-full sm:w-auto">
                  <button
                    onClick={() => setIsCameraOpen(true)}
                    className="flex-1 sm:flex-none px-4 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    Live Camera
                  </button>

                  <button
                    onClick={() => setActiveTab('samples')}
                    className="flex-1 sm:flex-none px-4 py-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium border border-slate-700 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ImageIcon className="w-4 h-4 text-slate-400" />
                    Observation Library
                  </button>
                </div>
              </div>

              {/* Station Presets Bar */}
              <div className="mt-6 pt-5 border-t border-slate-800">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-semibold text-slate-300">
                    Observation Station Benchmarks:
                  </span>
                  <span className="text-[11px] text-slate-400 hidden sm:inline">
                    Select a reference station to inspect
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {samples.map((s) => {
                    const isActive = activeSampleId === s.id;
                    return (
                      <button
                        key={s.id}
                        disabled={isLoading}
                        onClick={() => handleSampleSelect(s)}
                        className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-all flex items-center gap-1.5 cursor-pointer ${
                          isActive
                            ? 'bg-slate-800 text-white border-emerald-500/70 shadow-xs'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
                        }`}
                      >
                        {isActive && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                        <span>{s.category}</span>
                        <span className="text-[11px] text-slate-400 hidden md:inline">({s.city})</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Error Box */}
              {errorMsg && (
                <div className="mt-4 p-3.5 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
            </div>

            {/* Inference Status / Output Panels */}
            {isLoading ? (
              <div className="p-16 rounded-xl bg-[#0F172A] border border-slate-800 flex flex-col items-center justify-center text-center">
                <RefreshCw className="w-7 h-7 text-emerald-400 animate-spin mb-3" />
                <h3 className="text-sm font-semibold text-white">Analyzing Atmospheric Scattering</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-sm">
                  Calculating layer-4 activation gradients, softmax distribution, and estimated ambient particulate metrics...
                </p>
              </div>
            ) : prediction && previewUrl ? (
              <div className="space-y-6">
                {/* Low Confidence Warning Banner */}
                {prediction.low_confidence && (
                  <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-800/60 text-amber-200 flex items-start gap-3 shadow-xs">
                    <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                    <div className="text-xs space-y-1">
                      <div className="font-semibold text-amber-300 text-sm">
                        Low Confidence Classification ({(prediction.confidence * 100).toFixed(1)}%)
                      </div>
                      <p className="text-amber-200/80 leading-relaxed">
                        The visual features in this photo exhibit elevated ambiguity, overcast cloud cover, or partial horizon obstruction. For higher optical certainty, capture a clear photo with an unobstructed horizon line and broader sky view.
                      </p>
                    </div>
                  </div>
                )}

                {/* 2-Column Analytics Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  {/* Left Column: Metric Status & Class Probabilities */}
                  <div className="lg:col-span-5 flex flex-col gap-6">
                    <AQISpeedometer
                      category={prediction.aqi_category}
                      confidence={prediction.confidence}
                      aqiRange={prediction.aqi_range}
                      badge={prediction.badge}
                      color={prediction.color}
                      lowConfidence={prediction.low_confidence}
                    />

                    <ProbabilityBarChart
                      probabilities={prediction.all_probabilities}
                      activeCategory={prediction.aqi_category}
                    />
                  </div>

                  {/* Right Column: Visual Attention Map & Health Guidance */}
                  <div className="lg:col-span-7 flex flex-col gap-6">
                    <GradCAMViewer
                      originalImage={previewUrl}
                      heatmapImage={prediction.gradcam_heatmap_base64}
                      overlayImage={prediction.gradcam_overlay_base64}
                      attentionFocus={prediction.attention_focus}
                    />

                    <HealthAdvisory
                      maskRequired={prediction.mask_required}
                      outdoorExercise={prediction.outdoor_exercise}
                      windowsOpen={prediction.windows_open}
                      airPurifier={prediction.air_purifier}
                      description={prediction.description}
                      category={prediction.aqi_category}
                      color={prediction.color}
                    />
                  </div>
                </div>

                {/* Bottom Row: Comprehensive Pollutant Breakdown */}
                <PollutantBreakdown
                  pollutants={prediction.pollutants}
                  aqiCategory={prediction.aqi_category}
                />
              </div>
            ) : null}
          </div>
        )}

        {/* Tab 2: Sample Observations Library */}
        {activeTab === 'samples' && (
          <SamplePicker
            samples={samples}
            activeSampleId={activeSampleId}
            onSelectSample={(sample) => {
              handleSampleSelect(sample);
              setActiveTab('scanner');
            }}
            isLoading={isLoading}
          />
        )}

        {/* Tab 3: Continuous Monitoring Stations */}
        {activeTab === 'cities' && <CityInsightsView />}
      </main>

      {/* Live Camera Viewfinder Modal */}
      <LiveCameraModal
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onCapture={(blob) => processImageFile(blob, 'camera_capture.jpg')}
      />

      {/* Footer */}
      <footer className="mt-16 border-t border-slate-800/80 bg-[#090D16] py-8 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-300">SkyLens AQI</span>
            <span>•</span>
            <span>ResNet-34 Atmospheric Optical Classifier</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
