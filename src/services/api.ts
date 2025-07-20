import { API_CONFIG, API_ENDPOINTS } from '../config/api';
import { QueryRequest, QueryResponse, ErrorResponse, SampleQueryResponse } from '../types/api';

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

    console.log('🌐 Making API request to:', url);
    console.log('📋 Headers:', headers);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));



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
          const errorText = await response.text();
          console.error('Failed to parse error response as JSON:', errorText);
          throw new Error(`HTTP ${response.status}: ${errorText}`);
        }
      }

      // Get response text first to debug
      const responseText = await response.text();
      console.log('📄 Response text (first 500 chars):', responseText.substring(0, 500));
      console.log('📄 Full response length:', responseText.length);

      // Try to parse as JSON
      let data;
      try {
        data = JSON.parse(responseText);
        console.log('✅ Successfully parsed JSON:', data);
      } catch (parseError) {
        console.error('❌ Failed to parse response as JSON:', parseError);
        console.error('❌ Response text was:', responseText);
        throw new Error(`Invalid JSON response: ${responseText.substring(0, 100)}...`);
      }
      
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

  async getSampleQuery(): Promise<SampleQueryResponse> {
    return this.makeRequest<SampleQueryResponse>(API_ENDPOINTS.SAMPLE, {
      method: 'GET',
    });
  }

  // Note: Configuration is now handled via environment variables only
}

export const apiService = new ApiService(); 