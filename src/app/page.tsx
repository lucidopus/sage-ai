'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { apiService } from '../services/api';
import { QueryResponse, ErrorResponse } from '../types/api';

export default function Home() {
  const [researchGoal, setResearchGoal] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const [showViewButton, setShowViewButton] = useState(false);
  const [queryResult, setQueryResult] = useState<QueryResponse | null>(null);
  const [maxHypotheses, setMaxHypotheses] = useState(5);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const router = useRouter();

  // Simple moving stars background (same as hypotheses page)
  const startLiveBackground = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const updateCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    updateCanvasSize();

    const stars: Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      size: number;
      brightness: number;
      twinkle: number;
      color: string;
    }> = [];

    for (let i = 0; i < 80; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2.5 + 1,
        brightness: Math.random() * 0.8 + 0.2,
        twinkle: Math.random() * Math.PI * 2,
        color: ['#ffffff', '#e0f2fe', '#f0f9ff', '#fefce8', '#f0fdf4'][Math.floor(Math.random() * 5)]
      });
    }

    let time = 0;

    const animate = () => {
      time += 0.01;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      stars.forEach((star, i) => {
        star.x += star.vx;
        star.y += star.vy;
        star.twinkle += 0.05;

        if (star.x < -10) star.x = canvas.width + 10;
        if (star.x > canvas.width + 10) star.x = -10;
        if (star.y < -10) star.y = canvas.height + 10;
        if (star.y > canvas.height + 10) star.y = -10;

        const twinkleEffect = Math.sin(star.twinkle) * 0.4 + 0.6;
        const alpha = star.brightness * twinkleEffect;
        const size = star.size * twinkleEffect;

        ctx.shadowBlur = 8;
        ctx.shadowColor = star.color;
        ctx.fillStyle = star.color + Math.floor(alpha * 180).toString(16).padStart(2, '0');
        ctx.beginPath();
        ctx.arc(star.x, star.y, size * 1.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.shadowBlur = 3;
        ctx.fillStyle = star.color;
        ctx.beginPath();
        ctx.arc(star.x, star.y, size * 0.8, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.shadowBlur = 0;

        if (star.size > 1.8 && twinkleEffect > 0.8) {
          ctx.strokeStyle = star.color + Math.floor(alpha * 120).toString(16).padStart(2, '0');
          ctx.lineWidth = 1;
          ctx.lineCap = 'round';
          
          const sparkleSize = size * 2;
          
          ctx.beginPath();
          ctx.moveTo(star.x, star.y - sparkleSize);
          ctx.lineTo(star.x, star.y + sparkleSize);
          ctx.stroke();
          
          ctx.beginPath();
          ctx.moveTo(star.x - sparkleSize, star.y);
          ctx.lineTo(star.x + sparkleSize, star.y);
          ctx.stroke();
        }
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    const handleResize = () => {
      updateCanvasSize();
      stars.forEach(star => {
        if (star.x > canvas.width) star.x = Math.random() * canvas.width;
        if (star.y > canvas.height) star.y = Math.random() * canvas.height;
      });
    };

    window.addEventListener('resize', handleResize);
    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const cleanup = startLiveBackground();
    return cleanup;
  }, [startLiveBackground]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!researchGoal.trim()) {
      setError('Please enter a research goal');
      setErrorDetails(null);
      return;
    }

    setIsLoading(true);
    setError(null);
    setErrorDetails(null);
    setShowViewButton(false);
    setQueryResult(null);

    try {
      const result = await apiService.submitResearchQuery(researchGoal, maxHypotheses);
      
      // Handle null/undefined response
      if (!result) {
        throw new Error('No response received from server');
      }

      // Validate required fields exist
      if (!result.hypotheses || !Array.isArray(result.hypotheses)) {
        throw new Error('Invalid response: missing or invalid hypotheses data');
      }

      setQueryResult(result);
      setShowViewButton(true);
      console.log('Research query successful:', result);
    } catch (err) {
      console.error('Research query failed:', err);
      
      // Handle structured error response
      if (err && typeof err === 'object' && 'error' in err) {
        const errorResponse = err as ErrorResponse;
        setError(errorResponse.error || 'An error occurred while processing your request');
        setErrorDetails(errorResponse.details || null);
      } else if (err instanceof Error) {
        setError(err.message);
        setErrorDetails(null);
      } else {
        setError('An unexpected error occurred while processing your request');
        setErrorDetails(null);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewHypotheses = () => {
    if (queryResult) {
      localStorage.setItem('hypothesesData', JSON.stringify(queryResult));
      router.push('/hypotheses');
    }
  };

  // Format processing time for display
  const formatProcessingTime = (seconds: number): string => {
    if (seconds < 1) return `${Math.round(seconds * 1000)}ms`;
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds.toFixed(1)}s`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Live Animated Background */}
      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0 opacity-40" />

      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-cyan-400/20 to-transparent rounded-full animate-pulse" />
        <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-to-tr from-purple-400/20 to-transparent rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="max-w-3xl w-full">
          {/* Header Section */}
          <div className="text-center mb-12">
            <div className="mb-8">
              <h1 className="text-7xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-6 leading-tight">
                Sage AI
              </h1>
              <div className="w-32 h-1 bg-gradient-to-r from-cyan-400 to-purple-400 mx-auto rounded-full mb-6"></div>
              <p className="text-2xl text-white/80 leading-relaxed max-w-2xl mx-auto">
                Describe your research goal and let Sage AI generate 
                <span className="text-cyan-300 font-semibold"> scientific hypotheses </span>
                for you
              </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              {[
                { icon: '🧬', label: 'AI-Generated', value: 'Hypotheses', color: 'from-cyan-400 to-blue-500' },
                { icon: '📚', label: 'Evidence', value: 'Based', color: 'from-purple-400 to-pink-500' },
                { icon: '🎯', label: 'Research', value: 'Focused', color: 'from-emerald-400 to-teal-500' }
              ].map((stat, index) => (
                <div key={index} className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:border-white/40 transition-all duration-300 group">
                  <div className="flex flex-col items-center space-y-3">
                    <div className={`w-16 h-16 bg-gradient-to-r ${stat.color} rounded-xl flex items-center justify-center text-3xl transform group-hover:scale-110 transition-transform duration-300`}>
                      {stat.icon}
                    </div>
                    <div className="text-center">
                      <div className="text-white/60 text-sm">{stat.label}</div>
                      <div className="text-white font-bold text-lg">{stat.value}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Gallery Button */}
            <div className="flex justify-center mb-8">
              <button
                onClick={() => router.push('/gallery')}
                className="bg-gradient-to-r from-slate-600/20 to-slate-700/20 hover:from-slate-600/30 hover:to-slate-700/30 text-white border border-slate-500/30 hover:border-slate-400/50 font-medium py-3 px-8 rounded-2xl transition-all duration-300 flex items-center space-x-3 transform hover:scale-105 shadow-lg backdrop-blur-sm"
              >
                <span className="text-xl">🖼️</span>
                <span>Browse Previous Research</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>

          {/* Main Form Card */}
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/5 via-transparent to-purple-400/5" />
            
            <div className="relative z-10">
              <form onSubmit={handleSubmit} className="space-y-8">
                <div>
                  <label htmlFor="research-goal" className="block text-xl font-semibold text-white mb-4 flex items-center">
                    <span className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full flex items-center justify-center text-sm mr-3">🔬</span>
                    Research Goal
                  </label>
                  <div className="relative">
                    <textarea
                      id="research-goal"
                      value={researchGoal}
                      onChange={(e) => setResearchGoal(e.target.value)}
                      placeholder="Describe your research objective in natural language. For example: 'I want to understand the relationship between social media usage and mental health in teenagers.'"
                      className="w-full h-40 p-6 bg-white/10 border border-white/20 rounded-2xl focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 backdrop-blur-sm text-white placeholder-white/50 text-lg leading-relaxed resize-none transition-all duration-300"
                      disabled={isLoading}
                    />
                    <div className="absolute bottom-4 right-4 text-white/40 text-sm">
                      {researchGoal.length}/1000
                    </div>
                  </div>
                </div>

                {/* Max Hypotheses Control */}
                <div>
                  <label className="block text-xl font-semibold text-white mb-4 flex items-center">
                    <span className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-sm mr-3">🎯</span>
                    Number of Hypotheses
                  </label>
                  <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-white/80 text-sm">Generate</span>
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                          {maxHypotheses}
                        </span>
                        <span className="text-white/80 text-sm">hypotheses</span>
                      </div>
                    </div>
                    
                    <div className="relative">
                      <input
                        type="range"
                        min="1"
                        max="10"
                        value={maxHypotheses}
                        onChange={(e) => setMaxHypotheses(parseInt(e.target.value))}
                        className="w-full h-3 bg-white/10 rounded-full outline-none appearance-none cursor-pointer slider"
                        disabled={isLoading}
                      />
                      <div className="flex justify-between text-xs text-white/60 mt-2">
                        <span>1</span>
                        <span>2</span>
                        <span>3</span>
                        <span>4</span>
                        <span>5</span>
                        <span>6</span>
                        <span>7</span>
                        <span>8</span>
                        <span>9</span>
                        <span>10</span>
                      </div>
                    </div>
                    
                    <div className="mt-4 text-center">
                      <p className="text-white/60 text-sm">
                        💡 More hypotheses = longer processing time, but more research options
                      </p>
                    </div>
                  </div>
                </div>

                {/* Error Message with Details */}
                {error && (
                  <div className="bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-400/30 rounded-2xl p-6 backdrop-blur-sm">
                    <div className="flex items-start space-x-3">
                      <span className="text-2xl mt-1 flex-shrink-0">⚠️</span>
                      <div className="flex-1">
                        <p className="text-red-200 font-medium">{error}</p>
                        {errorDetails && (
                          <details className="mt-3">
                            <summary className="text-red-300 text-sm cursor-pointer hover:text-red-200 transition-colors">
                              Show error details
                            </summary>
                            <div className="mt-2 p-3 bg-red-500/10 rounded-lg border border-red-400/20">
                              <p className="text-red-300 text-sm font-mono whitespace-pre-wrap">{errorDetails}</p>
                            </div>
                          </details>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading || !researchGoal.trim()}
                  className="w-full bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 disabled:from-gray-600 disabled:to-gray-700 disabled:cursor-not-allowed text-white font-bold py-4 px-8 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-cyan-500/25 text-lg flex items-center justify-center group"
                >
                  {isLoading ? (
                    <>
                      <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-r-2 border-transparent border-t-white border-r-white mr-4"></div>
                      <span>Generating Hypotheses...</span>
                      <div className="ml-4 flex space-x-1">
                        <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </>
                  ) : (
                    <>
                      <span className="text-2xl mr-3 group-hover:scale-110 transition-transform duration-200">🚀</span>
                      Generate Hypotheses
                      <span className="text-2xl ml-3 group-hover:scale-110 transition-transform duration-200">✨</span>
                    </>
                  )}
                </button>
              </form>

              {/* Enhanced Success Message & Results Preview */}
              {showViewButton && queryResult && (
                <div className="mt-8 space-y-6">
                  {/* Main Success Card */}
                  <div className="bg-gradient-to-r from-emerald-500/20 to-teal-500/20 border border-emerald-400/30 rounded-2xl p-6 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4">
                        <span className="text-4xl">🎉</span>
                        <div>
                          <p className="text-emerald-200 font-bold text-lg">
                            Successfully generated {queryResult.hypotheses?.length || 0} hypotheses!
                          </p>
                          <p className="text-emerald-300/80 text-sm mt-1">
                            Ready to explore your research possibilities
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={handleViewHypotheses}
                        className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-emerald-500/25 flex items-center space-x-2"
                      >
                        <span>View Hypotheses</span>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>

                    {/* Processing Info */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="bg-emerald-500/10 rounded-lg p-3 border border-emerald-400/20">
                        <div className="text-emerald-300 text-sm">Query ID</div>
                        <div className="text-emerald-100 font-mono text-xs mt-1 truncate" title={queryResult.query_id}>
                          {queryResult.query_id || 'N/A'}
                        </div>
                      </div>
                      <div className="bg-emerald-500/10 rounded-lg p-3 border border-emerald-400/20">
                        <div className="text-emerald-300 text-sm">Processing Time</div>
                        <div className="text-emerald-100 font-bold">
                          {queryResult.total_processing_time ? formatProcessingTime(queryResult.total_processing_time) : 'N/A'}
                        </div>
                      </div>
                      <div className="bg-emerald-500/10 rounded-lg p-3 border border-emerald-400/20">
                        <div className="text-emerald-300 text-sm">Processing Steps</div>
                        <div className="text-emerald-100 font-bold">
                          {queryResult.processing_steps?.length || 0} steps
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Summary Card */}
                  {queryResult.summary && (
                    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                      <div className="flex items-center space-x-3 mb-4">
                        <span className="text-2xl">📊</span>
                        <h3 className="text-white font-bold text-lg">Research Summary</h3>
                      </div>
                      <p className="text-white/80 leading-relaxed">{queryResult.summary}</p>
                    </div>
                  )}

                  {/* Recommendations Card */}
                  {queryResult.recommendations && queryResult.recommendations.length > 0 && (
                    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                      <div className="flex items-center space-x-3 mb-4">
                        <span className="text-2xl">💡</span>
                        <h3 className="text-white font-bold text-lg">Research Recommendations</h3>
                      </div>
                      <ul className="space-y-3">
                        {queryResult.recommendations.map((recommendation, index) => (
                          <li key={index} className="flex items-start space-x-3">
                            <span className="text-cyan-400 font-bold text-sm mt-1 flex-shrink-0">
                              {index + 1}.
                            </span>
                            <span className="text-white/80 leading-relaxed">{recommendation}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Hypotheses Preview */}
                  {queryResult.hypotheses && queryResult.hypotheses.length > 0 && (
                    <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <span className="text-2xl">🧬</span>
                          <h3 className="text-white font-bold text-lg">Hypotheses Preview</h3>
                        </div>
                        <span className="text-white/60 text-sm">
                          {queryResult.hypotheses.length} hypotheses generated
                        </span>
                      </div>
                      <div className="grid gap-3">
                        {queryResult.hypotheses.slice(0, 2).map((hypothesis, index) => (
                          <div key={hypothesis.id || index} className="bg-white/5 rounded-lg p-4 border border-white/10">
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="text-white font-semibold text-sm leading-tight flex-1 mr-3">
                                {hypothesis.title || `Hypothesis ${index + 1}`}
                              </h4>
                              <div className="flex space-x-2 flex-shrink-0">
                                {hypothesis.novelty_score !== undefined && (
                                  <span className="bg-cyan-500/20 text-cyan-300 text-xs px-2 py-1 rounded-full">
                                    N: {(hypothesis.novelty_score * 100).toFixed(0)}%
                                  </span>
                                )}
                                {hypothesis.feasibility_score !== undefined && (
                                  <span className="bg-purple-500/20 text-purple-300 text-xs px-2 py-1 rounded-full">
                                    F: {(hypothesis.feasibility_score * 100).toFixed(0)}%
                                  </span>
                                )}
                              </div>
                            </div>
                            <p className="text-white/70 text-sm leading-relaxed line-clamp-2">
                              {hypothesis.description || 'No description available'}
                            </p>
                          </div>
                        ))}
                        {queryResult.hypotheses.length > 2 && (
                          <div className="text-center">
                            <span className="text-white/60 text-sm">
                              +{queryResult.hypotheses.length - 2} more hypotheses...
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Footer */}
              <div className="mt-8 text-center">
                <p className="text-white/60 text-sm flex items-center justify-center space-x-2">
                  <span>⚡ Powered by Advanced AI</span>
                  <span>•</span>
                  <span>🧬 Generate 1-10 research hypotheses</span>
                  <span>•</span>
                  <span>🚀 Customizable results</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .animate-bounce {
          animation: bounce 1s infinite;
        }
        
        @keyframes bounce {
          0%, 20%, 53%, 80%, 100% {
            transform: translate3d(0,0,0);
          }
          40%, 43% {
            transform: translate3d(0,-8px,0);
          }
          70% {
            transform: translate3d(0,-4px,0);
          }
          90% {
            transform: translate3d(0,-2px,0);
          }
        }

        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, #a855f7, #ec4899);
          cursor: pointer;
          box-shadow: 0 0 20px rgba(168, 85, 247, 0.6);
          border: 2px solid rgba(255, 255, 255, 0.3);
          transition: all 0.2s ease;
        }

        .slider::-webkit-slider-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 0 30px rgba(168, 85, 247, 0.8);
        }

        .slider::-moz-range-thumb {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, #a855f7, #ec4899);
          cursor: pointer;
          box-shadow: 0 0 20px rgba(168, 85, 247, 0.6);
          border: 2px solid rgba(255, 255, 255, 0.3);
          transition: all 0.2s ease;
        }

        .slider::-moz-range-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 0 30px rgba(168, 85, 247, 0.8);
        }

        .slider::-webkit-slider-track {
          background: linear-gradient(to right, 
            rgba(168, 85, 247, 0.8) 0%, 
            rgba(168, 85, 247, 0.8) ${(maxHypotheses - 1) * 11.11}%, 
            rgba(255, 255, 255, 0.1) ${(maxHypotheses - 1) * 11.11}%, 
            rgba(255, 255, 255, 0.1) 100%);
          border-radius: 10px;
        }

        .slider::-moz-range-track {
          background: linear-gradient(to right, 
            rgba(168, 85, 247, 0.8) 0%, 
            rgba(168, 85, 247, 0.8) ${(maxHypotheses - 1) * 11.11}%, 
            rgba(255, 255, 255, 0.1) ${(maxHypotheses - 1) * 11.11}%, 
            rgba(255, 255, 255, 0.1) 100%);
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
