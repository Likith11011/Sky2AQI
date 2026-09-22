export interface PollutantValues {
  pm25: number;
  pm10: number;
  no2: number;
  so2: number;
  co: number;
  o3: number;
}

export interface PredictionResult {
  aqi_category: string;
  confidence: number;
  all_probabilities: Record<string, number>;
  aqi_range: string;
  badge: string;
  color: string;
  description: string;
  mask_required: boolean;
  outdoor_exercise: string;
  windows_open: string;
  air_purifier: string;
  pollutants: PollutantValues;
  low_confidence?: boolean;
  gradcam_heatmap_base64?: string;
  gradcam_overlay_base64?: string;
  attention_focus?: string;
}

export interface SampleItem {
  id: string;
  name: string;
  category: string;
  city: string;
  description: string;
  image_url: string;
}

export interface ClassMetric {
  precision: number;
  recall: number;
  'f1-score': number;
  support: number;
}

export interface ModelStats {
  model_architecture: string;
  accuracy: number;
  macro_f1: number;
  total_test_samples: number;
  classes: Record<string, ClassMetric | number>;
  device: string;
}

export interface HealthStatus {
  status: string;
  model_loaded: boolean;
  device: string;
  num_classes: number;
}
