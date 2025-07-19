import { API_CONFIG, API_ENDPOINTS } from '../config/api';
import { ResearchQuery, QueryResponse, ApiError } from '../types/api';

class ApiService {
  private get baseUrl(): string {
    return API_CONFIG.BASE_URL;
  }

  private get apiKey(): string {
    return API_CONFIG.API_KEY;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'accept': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    // Add API key if available
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async submitResearchQuery(query: string, maxHypotheses: number = 5): Promise<QueryResponse> {
    const payload: ResearchQuery = {
      query,
      max_hypotheses: maxHypotheses,
    };

    return this.makeRequest<QueryResponse>(API_ENDPOINTS.QUERY, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Note: Configuration is now handled via environment variables only
}

export const apiService = new ApiService(); 