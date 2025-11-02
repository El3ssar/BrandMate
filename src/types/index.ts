export interface User {
  id: string;
  username: string;
  email: string;
  displayName: string;
  createdAt: string;
}

export interface BrandColor {
  name: string;
  hex: string;
}

export interface FileData {
  data: string; // base64
  mimeType: string;
  name?: string;
}

export interface BrandSession {
  id: string;
  userId: string;
  name: string;
  description?: string;
  provider: 'gemini' | 'openai' | 'grok';
  brandColors: BrandColor[];
  textGuidelines: string;
  labelDescription: string;
  visualAnalysis: string;
  designSystemPdf: FileData[];
  fewShotImages: FileData[];
  correctLabelImages: FileData[];
  incorrectLabelImages: FileData[];
  createdAt: string;
  updatedAt: string;
}

export interface AuditReviewDetail {
  finding_type: 'CUMPLIMIENTO' | 'INFRACCION';
  module: string;
  description: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'N/A';
  feedback: string;
}

export interface AssetReview {
  asset_index: number;
  asset_name?: string;
  score: number;
  verdict: 'APROBADO' | 'REQUIERE_AJUSTES' | 'RECHAZADO';
  summary?: string;
  findings: AuditReviewDetail[];
}

export interface AuditResult {
  overall_score: number;
  overall_verdict: 'APROBADO' | 'REQUIERE_AJUSTES' | 'RECHAZADO';
  asset_reviews?: AssetReview[];  // New per-asset format
  review_details?: AuditReviewDetail[];  // Legacy format (backward compatible)
}

export interface AuditHistoryItem {
  id: string;
  sessionId: string;
  userId: string;
  auditResult: AuditResult;
  assetsCount: number;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

export interface AppState {
  auth: AuthState;
  currentSession: BrandSession | null;
  sessions: BrandSession[];
  reviewAssets: FileData[];
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  username: string;
  email: string;
  password: string;
  displayName: string;
}

export interface ApiResponse<T = any> {
  ok: boolean;
  data?: T;
  error?: string;
}

export interface DistillRequest {
  labelDescription: string;
  images: FileData[];
}

export interface ReviewRequest {
  brandGuidelines: string;
  visualAnalysis: string;
  labelDescription: string;
  reviewQuery: string;
  assets: FileData[];
  visualContext?: FileData[];  // PDF, examples, labels for full context
}

export interface SessionExport {
  version: string;
  exportDate: string;
  sessions: BrandSession[];
  user?: {
    username: string;
    displayName: string;
  };
}


