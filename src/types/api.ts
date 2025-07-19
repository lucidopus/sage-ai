// API Types
export interface ResearchQuery {
  query: string;
  max_hypotheses: number;
}

export interface Hypothesis {
  id?: string;
  title: string;
  description: string;
  confidence_score?: number;
  methodology?: string;
  expected_outcomes?: string[];
  resources_needed?: string[];
  timeline_estimate?: string;
}

export interface QueryResponse {
  hypotheses: Hypothesis[];
  query_id?: string;
  processing_time?: number;
  total_hypotheses: number;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: any;
} 