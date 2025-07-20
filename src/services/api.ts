import { API_CONFIG, API_ENDPOINTS } from '../config/api';
import { QueryRequest, QueryResponse, ErrorResponse } from '../types/api';

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
      headers['X-API-Key'] = this.apiKey;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        // Try to parse structured error response
        try {
          const errorData = await response.json();
          
          // Check if it's a structured ErrorResponse
          if (errorData && typeof errorData === 'object' && 'error' in errorData) {
            const errorResponse: ErrorResponse = {
              error: errorData.error || `HTTP ${response.status}`,
              error_code: errorData.error_code || response.status.toString(),
              details: errorData.details || `Request failed with status ${response.status}`
            };
            throw errorResponse;
          } else {
            // Fallback for non-structured errors
            throw new Error(`HTTP ${response.status}: ${JSON.stringify(errorData)}`);
          }
        } catch (parseError) {
          // If JSON parsing fails, fallback to text

          throw new Error(`AN ERROR OCCURED!`);
        }
      }

      const data = await response.json();
      
      // Validate that we received valid data
      if (!data) {
        throw new Error('No data received from server');
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async submitResearchQuery(query: string, maxHypotheses: number = 5): Promise<QueryResponse> {
    const payload: QueryRequest = {
      query,
      max_hypotheses: maxHypotheses,
    };

    return this.makeRequest<QueryResponse>(API_ENDPOINTS.QUERY, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async checkHealth(): Promise<{ status: string; version: string }> {
    return this.makeRequest('/health', {
      method: 'GET',
    });
  }

  // Note: Configuration is now handled via environment variables only
}

export const apiService = new ApiService(); 