import { PredictionResult, SampleItem, ModelStats, HealthStatus } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function checkBackendHealth(): Promise<HealthStatus> {
  try {
    const res = await fetch(`${API_BASE_URL}/health`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Health check failed with status ${res.status}`);
    return await res.json();
  } catch {
    return {
      status: 'offline',
      model_loaded: false,
      device: 'unknown',
      num_classes: 0,
    };
  }
}

export const DEFAULT_SAMPLES: SampleItem[] = [
  {
    id: 'sample-good',
    name: 'Clear Blue Sky',
    category: 'Good',
    city: 'Bengaluru, India',
    description: 'Crisp blue horizon with negligible particulate haze.',
    image_url: '/samples/sample_good.jpg',
  },
  {
    id: 'sample-moderate',
    name: 'Mild Hazy Horizon',
    category: 'Moderate',
    city: 'Dimapur, Nagaland',
    description: 'Slight ambient haze noticeable near the tree line.',
    image_url: '/samples/sample_moderate.jpg',
  },
  {
    id: 'sample-usg',
    name: 'Elevated Smog Layer',
    category: 'USG',
    city: 'Biratnagar, Nepal',
    description: 'Diffuse particulate scatter; visible contrast drop across skyline.',
    image_url: '/samples/sample_usg.jpg',
  },
  {
    id: 'sample-unhealthy',
    name: 'Dense Urban Haze',
    category: 'Unhealthy',
    city: 'Faridabad, India',
    description: 'Heavy particulate density obscuring distant background.',
    image_url: '/samples/sample_unhealthy.jpg',
  },
  {
    id: 'sample-very-unhealthy',
    name: 'Severe Atmospheric Fog',
    category: 'Very Unhealthy',
    city: 'Greater Noida, India',
    description: 'Thick photochemical smog with severe horizon loss.',
    image_url: '/samples/sample_very_unhealthy.jpg',
  },
  {
    id: 'sample-hazardous',
    name: 'Critical Smog Inversion',
    category: 'Hazardous',
    city: 'ITO, Delhi',
    description: 'Severe particulate canopy with extreme discoloration.',
    image_url: '/samples/sample_hazardous.jpg',
  },
];

export async function fetchSampleList(): Promise<SampleItem[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/samples`, { cache: 'no-store' });
    if (!res.ok) return DEFAULT_SAMPLES;
    const samples: SampleItem[] = await res.json();
    if (!samples || samples.length === 0) return DEFAULT_SAMPLES;
    return samples.map((s) => ({
      ...s,
      image_url: `/samples/${s.id.replaceAll('-', '_')}.jpg`,
    }));
  } catch (err) {
    return DEFAULT_SAMPLES;
  }
}

export async function fetchModelBenchmarks(): Promise<ModelStats | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/model-stats`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Failed to fetch model stats');
    return await res.json();
  } catch (err) {
    console.error('Error loading model stats:', err);
    return null;
  }
}

export async function predictSkyPhoto(
  fileOrBlob: File | Blob,
  fileName: string = 'sky_photo.jpg',
  withGradCAM: boolean = false
): Promise<PredictionResult> {
  const formData = new FormData();
  formData.append('file', fileOrBlob, fileName);

  const endpoint = withGradCAM ? '/predict-explain' : '/predict';
  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const errorText = await res.text();
    let message = `Inference error (${res.status})`;
    try {
      const parsed = JSON.parse(errorText);
      message = parsed.detail || message;
    } catch {}
    throw new Error(message);
  }

  return await res.json();
}