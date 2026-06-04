export interface ApiClientConfig {
  baseUrl: string;
  getToken?: () => Promise<string | null>;
  getHeaders?: () => Promise<Record<string, string>>;
}

export class ApiError extends Error {
  constructor(public status: number, public data: any, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ApiClient {
  private config: ApiClientConfig;

  constructor(config?: Partial<ApiClientConfig>) {
    this.config = {
      baseUrl: config?.baseUrl || '/api',
      getToken: config?.getToken,
      getHeaders: config?.getHeaders,
    };
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const headers = new Headers(options.headers || {});
    
    if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
        headers.set('Content-Type', 'application/json');
    }

    if (this.config.getHeaders) {
        const customHeaders = await this.config.getHeaders();
        for (const [key, value] of Object.entries(customHeaders)) {
            headers.set(key, value);
        }
    }

    if (this.config.getToken) {
      const token = await this.config.getToken();
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
    }

    const response = await fetch(`${this.config.baseUrl}${path}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let data;
      const text = await response.text();
      try {
        data = text ? JSON.parse(text) : null;
      } catch (e) {
        data = text;
      }
      let errMessage = data?.message || data?.error;
      if (!errMessage) {
        if (typeof data === 'string' && data.trim().startsWith('<')) {
          if (response.status === 403) {
            errMessage = "Service Quota Exceeded or Forbidden";
          } else {
            errMessage = `API Error: ${response.status} ${response.statusText || 'HTML response'}`;
          }
        } else if (typeof data === 'string') {
          errMessage = data;
        } else {
          errMessage = `API Error: ${response.status} ${response.statusText}`;
        }
      }
      throw new ApiError(response.status, data, errMessage);
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return undefined as any;
    }

    const textInfo = await response.text();
    if (!textInfo) {
      return undefined as any;
    }
    try {
      return JSON.parse(textInfo);
    } catch (e) {
      return textInfo as any;
    }
  }

  async get<T>(path: string, options?: RequestInit): Promise<T> {
    return this.request<T>(path, { ...options, method: 'GET' });
  }

  async post<T>(path: string, data?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(path: string, data?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }
  
  async patch<T>(path: string, data?: any, options?: RequestInit): Promise<T> {
    return this.request<T>(path, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(path: string, options?: RequestInit): Promise<T> {
    return this.request<T>(path, { ...options, method: 'DELETE' });
  }
}
