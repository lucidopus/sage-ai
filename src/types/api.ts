// API Types
export interface ResearchQuery {
  query: string;
  max_hypotheses: number;
}

export interface ProcessingStep {
  step_name: string;
  status: string;
  start_time: string;
  end_time: string;
  duration_seconds: number;
  agent_outputs: {
    agent_name: string;
    output: string;
    metadata: any;
  }[];
}

export interface ExperimentalPlan {
  phase_1?: string;
  phase_2?: string;
  phase_3?: string;
  [key: string]: string | undefined;
}

export interface ResourceRequirements {
  personnel?: string[];
  equipment?: string[];
  funding?: string;
}

export interface Hypothesis {
  id: string;
  title: string;
  description: string;
  reasoning?: string;
  novelty_score?: number;
  feasibility_score?: number;
  confidence_score?: number;
  experimental_plan?: ExperimentalPlan | string;
  citations?: string[];
  methodology?: string;
  expected_outcomes?: string[];
  resources_needed?: string[];
  timeline_estimate?: string;
  // New fields from the evolved response
  original_id?: string;
  evolution_type?: string;
  improvements?: string[];
  evolution_justification?: string;
  evolution_round?: number;
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
  // Meta review fields
  final_assessment?: string;
  confidence_rating?: number;
  resource_requirements?: ResourceRequirements;
  timeline?: string;
  risk_factors?: string[];
  success_metrics?: string[];
  collaboration_recommendations?: string[];
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

export interface ApiError {
  message: string;
  code?: string;
  details?: any;
} 