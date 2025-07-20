// API Types - Updated to match backend Pydantic models exactly

export interface QueryRequest {
  query: string;
  max_hypotheses: number;
}

export interface Hypothesis {
  id: string;
  title: string;
  description: string;
  reasoning: string;
  novelty_score: number;
  feasibility_score: number;
  confidence_score: number;
  experimental_plan: string;
  citations: string[];
  
  // Optional fields that may be added during processing
  rank?: number;
  final_score?: number;
  criterion_scores?: {
    validity?: number;
    novelty?: number;
    feasibility?: number;
    impact?: number;
    clarity?: number;
  };
  ranking_justification?: string;
  ranking_confidence?: number;
  
  // Evolution/processing metadata (optional)
  original_id?: string;
  evolution_type?: string;
  improvements?: string[];
  evolution_justification?: string;
  evolution_round?: number;
  
  // Additional optional fields for enhanced features
  resource_requirements?: {
    personnel?: string[];
    equipment?: string[];
    funding?: string;
  };
  risk_factors?: string[];
  success_metrics?: string[];
}

export interface AgentOutput {
  agent_name: string;
  output: string;
  metadata: Record<string, any>;
}

export interface ProcessingStep {
  step_name: string;
  status: string;
  start_time: string; // ISO datetime string
  end_time: string; // ISO datetime string
  duration_seconds: number;
  agent_outputs: AgentOutput[];
}

export interface QueryResponse {
  query_id: string;
  original_query: string;
  hypotheses: Hypothesis[];
  processing_steps: ProcessingStep[];
  total_processing_time: number;
  summary: string;
  recommendations: string[];
}

export interface ErrorResponse {
  error: string;
  error_code: string;
  details: string;
}

export interface HealthResponse {
  status: string;
  version: string;
}

export interface SampleQueryResponse {
  generated_query: string;
}

// Legacy types for backward compatibility (can be removed later)
export interface ResearchQuery {
  query: string;
  max_hypotheses: number;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: any;
} 