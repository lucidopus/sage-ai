'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiService } from '../services/api';
import { QueryResponse } from '../types/api';

export default function Home() {
  const [researchGoal, setResearchGoal] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showViewButton, setShowViewButton] = useState(false);
  const [queryResult, setQueryResult] = useState<QueryResponse | null>(null);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!researchGoal.trim()) {
      setError('Please enter a research goal');
      return;
    }

    setIsLoading(true);
    setError(null);
    setShowViewButton(false);

    try {
      const result = await apiService.submitResearchQuery(researchGoal, 5);
      setQueryResult(result);
      setShowViewButton(true);
      console.log('Research query successful:', result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while processing your request');
      console.error('Research query failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewHypotheses = () => {
    if (queryResult) {
      // Store the result in localStorage for the hypotheses page
      localStorage.setItem('hypothesesData', JSON.stringify({
        hypotheses: queryResult.hypotheses,
        originalQuery: researchGoal,
        queryId: queryResult.query_id,
        processingTime: queryResult.processing_time,
        totalHypotheses: queryResult.total_hypotheses
      }));
      router.push('/hypotheses');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            AI Co-Scientist
          </h1>
          <p className="text-lg text-gray-600">
            Describe your research goal and let AI generate scientific hypotheses for you
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="research-goal" className="block text-sm font-medium text-grey-700 mb-2">
              Research Goal
            </label>
            <textarea
              id="research-goal"
              value={researchGoal}
              onChange={(e) => setResearchGoal(e.target.value)}
              placeholder="Describe your research objective in natural language. For example: 'I want to understand the relationship between social media usage and mental health in teenagers.'"
              className="w-full h-32 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-900 placeholder-gray-400"
              disabled={isLoading}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading || !researchGoal.trim()}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating Hypotheses...
              </>
            ) : (
              'Generate Hypotheses'
            )}
          </button>
        </form>

        {/* Success Message & View Button */}
        {showViewButton && queryResult && (
          <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-700 font-medium">
                  🎉 Successfully generated {queryResult.total_hypotheses} hypotheses!
                </p>
                <p className="text-green-600 text-sm mt-1">
                  Ready to explore your research possibilities
                </p>
              </div>
              <button
                onClick={handleViewHypotheses}
                className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200"
              >
                View Hypotheses
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>Powered by AI • Generate up to 5 research hypotheses</p>
        </div>
      </div>
    </div>
  );
}
