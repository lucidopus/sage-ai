'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { RequestDocument } from '@/lib/mongodb';

interface GalleryStats {
  totalRequests: number;
  totalHypotheses: number;
  avgProcessingTime: number;
  avgConfidence: number;
}

export default function GalleryPage() {
  const [requests, setRequests] = useState<RequestDocument[]>([]);
  const [stats, setStats] = useState<GalleryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<RequestDocument | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const router = useRouter();

  const startLiveBackground = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const updateCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    updateCanvasSize();

    // Star system
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

    // Initialize stars
    for (let i = 0; i < 120; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 3 + 1,
        brightness: Math.random() * 0.8 + 0.2,
        twinkle: Math.random() * Math.PI * 2,
        color: ['#ffffff', '#e0f2fe', '#f0f9ff', '#fefce8', '#f0fdf4'][Math.floor(Math.random() * 5)]
      });
    }

    let time = 0;

    const animate = () => {
      time += 0.01;
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Update and draw stars
      stars.forEach((star, i) => {
        // Update star position
        star.x += star.vx;
        star.y += star.vy;
        star.twinkle += 0.05;

        // Wrap around screen
        if (star.x < -10) star.x = canvas.width + 10;
        if (star.x > canvas.width + 10) star.x = -10;
        if (star.y < -10) star.y = canvas.height + 10;
        if (star.y > canvas.height + 10) star.y = -10;

        // Calculate twinkling effect
        const twinkleEffect = Math.sin(star.twinkle) * 0.4 + 0.6;
        const alpha = star.brightness * twinkleEffect;
        const size = star.size * twinkleEffect;

        // Draw star glow
        ctx.shadowBlur = 8;
        ctx.shadowColor = star.color;
        ctx.fillStyle = star.color + Math.floor(alpha * 180).toString(16).padStart(2, '0');
        ctx.beginPath();
        ctx.arc(star.x, star.y, size * 1.5, 0, Math.PI * 2);
        ctx.fill();

        // Draw star core
        ctx.shadowBlur = 3;
        ctx.fillStyle = star.color;
        ctx.beginPath();
        ctx.arc(star.x, star.y, size * 0.8, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.shadowBlur = 0;

        // Add cross sparkle effect for larger stars
        if (star.size > 1.5 && twinkleEffect > 0.8) {
          ctx.strokeStyle = star.color + Math.floor(alpha * 120).toString(16).padStart(2, '0');
          ctx.lineWidth = 1;
          ctx.lineCap = 'round';
          
          const sparkleSize = size * 2;
          
          // Vertical line
          ctx.beginPath();
          ctx.moveTo(star.x, star.y - sparkleSize);
          ctx.lineTo(star.x, star.y + sparkleSize);
          ctx.stroke();
          
          // Horizontal line
          ctx.beginPath();
          ctx.moveTo(star.x - sparkleSize, star.y);
          ctx.lineTo(star.x + sparkleSize, star.y);
          ctx.stroke();
        }
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    // Handle resize
    const handleResize = () => {
      updateCanvasSize();
      // Redistribute stars on resize
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

  // Control live background
  useEffect(() => {
    const cleanup = startLiveBackground();
    return cleanup;
  }, [startLiveBackground]);

  const formatProcessingTime = (seconds: number): string => {
    if (seconds < 1) {
      return `${Math.round(seconds * 1000)}ms`;
    }
    if (seconds < 60) {
      return `${seconds.toFixed(1)}s`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds.toFixed(0)}s`;
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Unknown date';
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch both requests and stats in parallel
        const [requestsResponse, statsResponse] = await Promise.all([
          fetch('/api/queries'),
          fetch('/api/queries?stats=true')
        ]);

        if (!requestsResponse.ok) {
          throw new Error(`Failed to fetch requests: ${requestsResponse.status}`);
        }
        if (!statsResponse.ok) {
          throw new Error(`Failed to fetch stats: ${statsResponse.status}`);
        }

        const requestsData = await requestsResponse.json();
        const statsData = await statsResponse.json();

        setRequests(requestsData);
        setStats(statsData);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredRequests = requests.filter(request => {
    const query = request.response?.original_query || request.query || '';
    return query.toLowerCase().includes(searchTerm.toLowerCase()) ||
           request.response?.hypotheses?.some(h => 
             h.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
             h.description.toLowerCase().includes(searchTerm.toLowerCase())
           );
  });

  const openModal = (request: RequestDocument) => {
    setSelectedRequest(request);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedRequest(null);
  };

  const viewHypotheses = (request: RequestDocument) => {
    // Store the request data in localStorage and navigate to hypotheses page
    localStorage.setItem('hypothesesData', JSON.stringify(request.response));
    router.push('/hypotheses');
  };

  const handleDelete = async (requestId: string) => {
    try {
      console.log('Attempting to delete request with ID:', requestId);
      
      const response = await fetch(`/api/queries?id=${encodeURIComponent(requestId)}`, {
        method: 'DELETE'
      });

      console.log('Delete response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Delete failed:', errorData);
        throw new Error(`Failed to delete request: ${errorData.error || response.statusText}`);
      }

      // Refresh the data after successful deletion
      const [requestsResponse, statsResponse] = await Promise.all([
        fetch('/api/queries'),
        fetch('/api/queries?stats=true')
      ]);

      if (requestsResponse.ok && statsResponse.ok) {
        const requestsData = await requestsResponse.json();
        const statsData = await statsResponse.json();
        setRequests(requestsData);
        setStats(statsData);
      }

      setDeleteConfirm(null);
    } catch (err) {
      console.error('Error deleting request:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete request');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-r-2 border-transparent border-t-cyan-400 border-r-purple-400 mx-auto"></div>
          <p className="text-center mt-6 text-white/90 text-lg font-medium">
            Loading hypothesis gallery...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="bg-red-500/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-red-500/20 max-w-md">
          <div className="text-red-400 text-center text-6xl mb-4">⚠️</div>
          <h2 className="text-center text-white text-xl font-semibold mb-4">Failed to Load</h2>
          <p className="text-center text-white/80 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-400 hover:to-orange-400 text-white font-medium py-3 px-6 rounded-xl transition-all duration-300"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Live Animated Background */}
      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0 opacity-40" />

      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/2 -right-1/2 w-full h-full bg-gradient-to-br from-cyan-400/20 to-transparent rounded-full animate-pulse" />
        <div className="absolute -bottom-1/2 -left-1/2 w-full h-full bg-gradient-to-tr from-purple-400/20 to-transparent rounded-full animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 p-6 max-w-[1800px] mx-auto">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 mb-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/10 via-transparent to-purple-400/10" />
          
          <div className="relative z-10 flex items-center justify-between mb-8">
            <div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
                Hypothesis Gallery
              </h1>
              <p className="text-white/80 text-xl">
                Explore all generated hypotheses and research insights
              </p>
            </div>
            <div className="text-right space-y-4">
              <button
                onClick={() => router.push('/')}
                className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white font-medium py-3 px-8 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-cyan-500/25"
              >
                New Query
              </button>
            </div>
          </div>

          {/* Stats Cards */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[
                { value: stats.totalRequests, label: 'Total Queries', icon: '🔍', color: 'from-cyan-400 to-blue-500' },
                { value: stats.totalHypotheses, label: 'Hypotheses', icon: '🧬', color: 'from-purple-400 to-pink-500' },
                { value: formatProcessingTime(stats.avgProcessingTime), label: 'Avg Processing', icon: '⚡', color: 'from-emerald-400 to-teal-500' },
                { value: `${Math.round(stats.avgConfidence * 100)}%`, label: 'Avg Confidence', icon: '🎯', color: 'from-orange-400 to-red-500' }
              ].map((stat, index) => (
                <div key={index} className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:border-white/40 transition-all duration-300 group">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-xl flex items-center justify-center text-2xl transform group-hover:scale-110 transition-transform duration-300`}>
                      {stat.icon}
                    </div>
                    <div>
                      <div className="text-3xl font-bold text-white">{stat.value}</div>
                      <div className="text-white/60 text-sm">{stat.label}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Search Bar */}
        <div className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 p-6 mb-8">
          <div className="relative max-w-2xl mx-auto">
            <input
              type="text"
              placeholder="Search queries and hypotheses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-6 py-4 pl-14 text-white placeholder-white/50 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 backdrop-blur-sm text-lg"
            />
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/40 text-xl">
              🔍
            </div>
          </div>
          <div className="text-center mt-4 text-white/60">
            Found {filteredRequests.length} queries
          </div>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredRequests.map((request, index) => {
            const hypothesesCount = request.response?.hypotheses?.length || 0;
            const avgConfidence = hypothesesCount > 0 
              ? request.response.hypotheses.reduce((sum, h) => sum + (h.confidence_score || 0), 0) / hypothesesCount 
              : 0;
            const topHypothesis = request.response?.hypotheses?.[0];

            return (
              <div
                key={request._id}
                className="bg-white/10 backdrop-blur-xl rounded-2xl shadow-xl border border-white/20 hover:border-cyan-400/50 transition-all duration-300 transform hover:scale-105 hover:shadow-2xl hover:shadow-cyan-500/20 overflow-hidden group cursor-pointer"
                onClick={() => openModal(request)}
              >
                {/* Card Header */}
                <div className="p-6 border-b border-white/10">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-white font-semibold text-lg mb-2 line-clamp-2">
                        {request.response?.original_query || request.query || 'Untitled Query'}
                      </h3>
                      <p className="text-white/60 text-sm">
                        {formatDate(request.created_at || request.timestamp)}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <div className="bg-gradient-to-r from-cyan-400 to-purple-400 text-white px-3 py-1 rounded-full text-xs font-bold">
                        {hypothesesCount} hypotheses
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteConfirm(request._id);
                        }}
                        className="w-8 h-8 bg-red-500/20 hover:bg-red-500/40 text-red-300 hover:text-red-200 rounded-full flex items-center justify-center transition-all duration-200 border border-red-500/30 hover:border-red-500/60 group"
                        title="Delete this query"
                      >
                        <svg
                          className="w-4 h-4 group-hover:scale-110 transition-transform duration-200"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                          xmlns="http://www.w3.org/2000/svg"
                        >
                          <path
                            fillRule="evenodd"
                            d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Top Hypothesis Preview */}
                  {topHypothesis && (
                    <div className="bg-white/5 rounded-xl p-4 mb-4">
                      <h4 className="text-white/90 font-medium text-sm mb-2 line-clamp-1">
                        🏆 {topHypothesis.title}
                      </h4>
                      <p className="text-white/70 text-xs line-clamp-2">
                        {topHypothesis.description.replace(/\*[^*]+\*/g, '').substring(0, 100)}...
                      </p>
                    </div>
                  )}

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="flex justify-between">
                      <span className="text-white/60">Confidence</span>
                      <span className="text-cyan-300 font-bold">
                        {Math.round(avgConfidence * 100)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-white/60">Processing</span>
                      <span className="text-purple-300 font-bold">
                        {formatProcessingTime(request.response?.total_processing_time || 0)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Footer */}
                <div className="p-4 bg-gradient-to-r from-white/5 to-transparent">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      viewHypotheses(request);
                    }}
                    className="w-full bg-gradient-to-r from-cyan-500/20 to-purple-500/20 hover:from-cyan-500/40 hover:to-purple-500/40 text-white border border-cyan-400/30 hover:border-cyan-400/60 py-2 px-4 rounded-xl transition-all duration-300 text-sm font-medium group-hover:scale-105"
                  >
                    View Hypotheses →
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filteredRequests.length === 0 && (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-white text-xl font-semibold mb-2">No results found</h3>
            <p className="text-white/60">Try adjusting your search terms</p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-red-500/30 max-w-md w-full">
            <div className="p-8 text-center">
              <div className="text-6xl mb-4">⚠️</div>
              <h2 className="text-2xl font-bold text-white mb-4">Delete Query?</h2>
              <p className="text-white/80 mb-6">
                Are you sure you want to delete this query and all its hypotheses? This action cannot be undone.
              </p>
              <div className="flex space-x-4">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  className="flex-1 bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-white/40 font-medium py-3 px-6 rounded-xl transition-all duration-300"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  className="flex-1 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-400 hover:to-red-500 text-white font-medium py-3 px-6 rounded-xl transition-all duration-300"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && selectedRequest && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
          <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-8">
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <h2 className="text-3xl font-bold text-white mb-4">
                    {selectedRequest.response?.original_query || selectedRequest.query}
                  </h2>
                  <div className="flex items-center space-x-4 text-sm text-white/60">
                    <span>📅 {formatDate(selectedRequest.created_at || selectedRequest.timestamp)}</span>
                    <span>🧬 {selectedRequest.response?.hypotheses?.length || 0} hypotheses</span>
                    <span>⚡ {formatProcessingTime(selectedRequest.response?.total_processing_time || 0)}</span>
                  </div>
                </div>
                <button
                  onClick={closeModal}
                  className="text-white/60 hover:text-white text-3xl font-light"
                >
                  ×
                </button>
              </div>

              {/* Hypotheses List */}
              <div className="space-y-4 mb-6">
                <h3 className="text-xl font-semibold text-white mb-4">Generated Hypotheses</h3>
                {selectedRequest.response?.hypotheses?.slice(0, 3).map((hypothesis, index) => (
                  <div key={hypothesis.id} className="bg-white/5 rounded-2xl p-6 border border-white/10">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="text-white font-semibold flex-1 mr-4">
                        {index + 1}. {hypothesis.title}
                      </h4>
                      {hypothesis.confidence_score && (
                        <div className="bg-gradient-to-r from-cyan-400 to-purple-400 text-white px-3 py-1 rounded-full text-xs font-bold">
                          {Math.round(hypothesis.confidence_score * 100)}%
                        </div>
                      )}
                    </div>
                    <p className="text-white/80 text-sm leading-relaxed">
                      {hypothesis.description.replace(/\*[^*]+\*/g, '').substring(0, 200)}...
                    </p>
                  </div>
                ))}
                {(selectedRequest.response?.hypotheses?.length || 0) > 3 && (
                  <div className="text-center text-white/60 text-sm">
                    ... and {(selectedRequest.response?.hypotheses?.length || 0) - 3} more hypotheses
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-4">
                <button
                  onClick={() => viewHypotheses(selectedRequest)}
                  className="flex-1 bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white font-medium py-3 px-6 rounded-xl transition-all duration-300"
                >
                  View Full Analysis
                </button>
                <button
                  onClick={closeModal}
                  className="bg-white/10 hover:bg-white/20 text-white border border-white/20 hover:border-white/40 font-medium py-3 px-6 rounded-xl transition-all duration-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .line-clamp-1 {
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}