export interface ReviewJob {
  id: string;
  sessionId: string;
  assets: any[];
  status: 'pending' | 'running' | 'complete' | 'error';
  result?: any;
  error?: string;
  createdAt: string;
  completedAt?: string;
  assetsCount: number;
}

