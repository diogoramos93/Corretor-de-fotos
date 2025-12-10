export enum JobStatus {
  PENDING = 'PENDING',
  ANALYZING = 'ANALYZING',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED'
}

export enum SportStyle {
  REALISTIC = 'REALISTIC',
  VIBRANT = 'VIBRANT',
  DRAMATIC = 'DRAMATIC'
}

export interface BoundingBox {
  ymin: number;
  xmin: number;
  ymax: number;
  xmax: number;
  label: string;
}

export interface SceneAttributes {
  brightness: 'LOW' | 'MEDIUM' | 'HIGH';
  dominantColors: string;
  lightSources: string;
}

export interface AnalysisResult {
  sportType: string;
  lightingCondition: 'OUTDOOR_DAY' | 'OUTDOOR_NIGHT' | 'INDOOR' | 'UNKNOWN';
  sceneAttributes: SceneAttributes;
  detectedAthletes: BoundingBox[];
  subjectDetected: boolean;
  suggestedEV: number;
  suggestedWB: number; // Kelvin offset or tint
  confidence: number;
}

export interface ImageJob {
  id: string;
  filename: string;
  url: string;
  thumbnailUrl: string;
  status: JobStatus;
  progress: number; // 0-100
  analysis?: AnalysisResult;
  settings: {
    evOffset: number;
    contrast: number;
    sharpness: number;
    style: SportStyle;
  };
}

export interface ProcessingStats {
  total: number;
  completed: number;
  averageTime: number; // seconds
}