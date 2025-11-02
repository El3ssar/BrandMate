import type {
  ApiResponse,
  User,
  BrandSession,
  LoginCredentials,
  RegisterData,
  DistillRequest,
  ReviewRequest,
  AuditResult,
  SessionExport,
} from '@/types';

const API_BASE = '/api';

class ApiClient {
  private token: string | null = null;

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  }

  getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('auth_token');
    }
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = this.getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        return {
          ok: false,
          error: data.error || `HTTP ${response.status}`,
        };
      }

      return {
        ok: true,
        data: data.data || data,
      };
    } catch (error) {
      return {
        ok: false,
        error: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  // Auth endpoints
  async register(data: RegisterData): Promise<ApiResponse<{ user: User; token: string }>> {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(credentials: LoginCredentials): Promise<ApiResponse<{ user: User; token: string }>> {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    return this.request('/auth/me');
  }

  async updateProfile(data: Partial<User>): Promise<ApiResponse<User>> {
    return this.request('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Session endpoints
  async getSessions(): Promise<ApiResponse<BrandSession[]>> {
    return this.request('/sessions');
  }

  async getSession(id: string): Promise<ApiResponse<BrandSession>> {
    return this.request(`/sessions/${id}`);
  }

  async createSession(data: Partial<BrandSession>): Promise<ApiResponse<BrandSession>> {
    return this.request('/sessions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateSession(id: string, data: Partial<BrandSession>): Promise<ApiResponse<BrandSession>> {
    return this.request(`/sessions/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteSession(id: string): Promise<ApiResponse<{ message: string }>> {
    return this.request(`/sessions/${id}`, {
      method: 'DELETE',
    });
  }

  async exportSessions(): Promise<ApiResponse<SessionExport>> {
    return this.request('/sessions/export/all');
  }

  async importSessions(data: SessionExport): Promise<ApiResponse<{ message: string; sessions: BrandSession[] }>> {
    return this.request('/sessions/import', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // AI endpoints
  async distill(provider: string, data: DistillRequest): Promise<ApiResponse<{ text: string }>> {
    return this.request('/destill', {
      method: 'POST',
      body: JSON.stringify({ provider, ...data }),
    });
  }

  async review(provider: string, sessionId: string | undefined, data: ReviewRequest): Promise<ApiResponse<{ json: AuditResult }>> {
    return this.request('/review', {
      method: 'POST',
      body: JSON.stringify({ provider, sessionId, ...data }),
    });
  }

  // Audit history endpoints
  async getSessionAudits(sessionId: string): Promise<ApiResponse<any[]>> {
    return this.request(`/audits/session/${sessionId}`);
  }

  async getAudit(id: string): Promise<ApiResponse<any>> {
    return this.request(`/audits/${id}`);
  }

  async deleteAudit(id: string): Promise<ApiResponse<{ message: string }>> {
    return this.request(`/audits/${id}`, {
      method: 'DELETE',
    });
  }
}

export const api = new ApiClient();


