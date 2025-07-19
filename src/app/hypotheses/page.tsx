'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Hypothesis } from '../../types/api';

interface HypothesesData {
  hypotheses: Hypothesis[];
  originalQuery: string;
  queryId?: string;
  processingTime?: number;
  totalHypotheses: number;
}

export default function HypothesesPage() {
  const [data, setData] = useState<HypothesesData | null>(null);
  const [selectedHypothesis, setSelectedHypothesis] = useState<number>(0);
  const router = useRouter();

  useEffect(() => {
    // Retrieve data from localStorage
    const storedData = localStorage.getItem('hypothesesData');
    if (storedData) {
      const parsedData = JSON.parse(storedData) as HypothesesData;
      setData(parsedData);
    } else {
      // If no data found, redirect back to home
      router.push('/');
    }
  }, [router]);

  const handleNewQuery = () => {
    // Clear stored data and go back to home
    localStorage.removeItem('hypothesesData');
    router.push('/');
  };

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-lg p-8 shadow-lg">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-center mt-4 text-gray-600">Loading hypotheses...</p>
        </div>
      </div>
    );
  }

  const currentHypothesis = data.hypotheses[selectedHypothesis];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Generated Hypotheses
              </h1>
              <p className="text-gray-600 text-lg">
                Research Goal: &quot;{data.originalQuery}&quot;
              </p>
            </div>
            <button
              onClick={handleNewQuery}
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-lg transition-colors duration-200"
            >
              New Query
            </button>
          </div>
          
          {/* Analytics Summary */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{data.totalHypotheses}</div>
              <div className="text-blue-700 text-sm">Hypotheses Generated</div>
            </div>
            {data.processingTime && (
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {(data.processingTime / 1000).toFixed(1)}s
                </div>
                <div className="text-green-700 text-sm">Processing Time</div>
              </div>
            )}
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {data.hypotheses.filter(h => h.confidence_score && h.confidence_score > 0.7).length}
              </div>
              <div className="text-purple-700 text-sm">High Confidence</div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Hypotheses List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                All Hypotheses
              </h2>
              <div className="space-y-2">
                {data.hypotheses.map((hypothesis, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedHypothesis(index)}
                    className={`w-full text-left p-3 rounded-lg transition-colors duration-200 ${
                      selectedHypothesis === index
                        ? 'bg-blue-100 border-2 border-blue-500'
                        : 'bg-gray-50 hover:bg-gray-100 border-2 border-transparent'
                    }`}
                  >
                    <div className="font-medium text-sm text-gray-900">
                      Hypothesis {index + 1}
                    </div>
                    <div className="text-xs text-gray-600 mt-1 truncate">
                      {hypothesis.title || hypothesis.description.substring(0, 50) + '...'}
                    </div>
                    {hypothesis.confidence_score && (
                      <div className="flex items-center mt-2">
                        <div className="text-xs text-gray-500">Confidence:</div>
                        <div className="ml-2 flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full"
                            style={{ width: `${hypothesis.confidence_score * 100}%` }}
                          ></div>
                        </div>
                        <div className="ml-2 text-xs text-gray-600">
                          {Math.round(hypothesis.confidence_score * 100)}%
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Detailed View */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-gray-900">
                    Hypothesis {selectedHypothesis + 1}
                    {currentHypothesis.title && `: ${currentHypothesis.title}`}
                  </h2>
                  {currentHypothesis.confidence_score && (
                    <div className="flex items-center bg-blue-50 px-3 py-1 rounded-full">
                      <span className="text-sm text-blue-700 font-medium">
                        Confidence: {Math.round(currentHypothesis.confidence_score * 100)}%
                      </span>
                    </div>
                  )}
                </div>
                
                <div className="prose max-w-none">
                  <div className="bg-gray-50 p-4 rounded-lg mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
                    <p className="text-gray-700 leading-relaxed">
                      {currentHypothesis.description}
                    </p>
                  </div>

                  {currentHypothesis.methodology && (
                    <div className="bg-blue-50 p-4 rounded-lg mb-6">
                      <h3 className="text-lg font-semibold text-blue-900 mb-2">
                        Proposed Methodology
                      </h3>
                      <p className="text-blue-800 leading-relaxed">
                        {currentHypothesis.methodology}
                      </p>
                    </div>
                  )}

                  {currentHypothesis.expected_outcomes && currentHypothesis.expected_outcomes.length > 0 && (
                    <div className="bg-green-50 p-4 rounded-lg mb-6">
                      <h3 className="text-lg font-semibold text-green-900 mb-2">
                        Expected Outcomes
                      </h3>
                      <ul className="list-disc list-inside text-green-800 space-y-1">
                        {currentHypothesis.expected_outcomes.map((outcome, index) => (
                          <li key={index}>{outcome}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {currentHypothesis.resources_needed && currentHypothesis.resources_needed.length > 0 && (
                    <div className="bg-yellow-50 p-4 rounded-lg mb-6">
                      <h3 className="text-lg font-semibold text-yellow-900 mb-2">
                        Resources Needed
                      </h3>
                      <ul className="list-disc list-inside text-yellow-800 space-y-1">
                        {currentHypothesis.resources_needed.map((resource, index) => (
                          <li key={index}>{resource}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {currentHypothesis.timeline_estimate && (
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <h3 className="text-lg font-semibold text-purple-900 mb-2">
                        Timeline Estimate
                      </h3>
                      <p className="text-purple-800">
                        {currentHypothesis.timeline_estimate}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Navigation */}
              <div className="flex justify-between pt-6 border-t border-gray-200">
                <button
                  onClick={() => setSelectedHypothesis(Math.max(0, selectedHypothesis - 1))}
                  disabled={selectedHypothesis === 0}
                  className="flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors duration-200"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Previous
                </button>
                
                <span className="flex items-center text-gray-600">
                  {selectedHypothesis + 1} of {data.hypotheses.length}
                </span>
                
                <button
                  onClick={() => setSelectedHypothesis(Math.min(data.hypotheses.length - 1, selectedHypothesis + 1))}
                  disabled={selectedHypothesis === data.hypotheses.length - 1}
                  className="flex items-center px-4 py-2 bg-gray-100 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed rounded-lg transition-colors duration-200"
                >
                  Next
                  <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 