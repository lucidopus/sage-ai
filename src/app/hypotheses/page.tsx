'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { QueryResponse } from '../../types/api';

export default function HypothesesPage() {
  const [data, setData] = useState<QueryResponse | null>(null);
  const [selectedHypothesis, setSelectedHypothesis] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'overview' | 'plan' | 'analytics' | 'compare'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'rank' | 'confidence' | 'novelty' | 'feasibility'>('rank');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | null>(null);
  const router = useRouter();

  // Helper functions
  const formatProcessingTime = (seconds: number): string => {
    // Debug: log the raw value
    console.log('Raw processing time:', seconds, 'type:', typeof seconds);
    
    // Handle edge cases and different time units
    if (seconds < 1) {
      // If less than 1 second, show in milliseconds
      return `${Math.round(seconds * 1000)}ms`;
    }
    
    if (seconds < 60) {
      // If less than 1 minute, show in seconds
      return `${seconds.toFixed(1)}s`;
    }
    
    // If 1 minute or more, show in minutes and seconds
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds.toFixed(0)}s`;
  };

  const formatDescription = (description: string): string => {
    // Clean up the description with better formatting
    return description
      .replace(/\*([^*]+)\*/g, '$1') // Remove asterisks but keep the text
      .replace(/(\d+\))/g, '\n\n$1') // Add double line breaks before numbered items
      .replace(/([.!?])\s+([A-Z])/g, '$1\n\n$2') // Add line breaks between sentences
      .replace(/\n{3,}/g, '\n\n') // Limit consecutive line breaks
      .trim();
  };

  // Agent descriptions for tooltips
  const agentDescriptions: { [key: string]: string } = {
    'Research Agent': 'Conducts initial research and gathers relevant scientific literature and data sources',
    'Validation Agent': 'Validates hypotheses against existing knowledge and checks for scientific consistency',
    'Synthesis Agent': 'Synthesizes information from multiple sources to create coherent hypotheses',
    'Ranking Agent': 'Evaluates and ranks hypotheses based on multiple criteria and scientific merit',
    'Evolution Agent': 'Refines and evolves hypotheses through iterative improvement processes',
    'Meta Review Agent': 'Provides final assessment and quality control of the generated hypotheses',
    'Scoring Agent': 'Calculates detailed scores and confidence metrics for each hypothesis',
    'Analysis Agent': 'Performs deep analysis and reasoning for hypothesis development',
    'Literature Agent': 'Searches and analyzes relevant scientific literature and publications',
    'Feasibility Agent': 'Assesses the practical feasibility and resource requirements of hypotheses'
  };

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

  // Control live background - always enabled
  useEffect(() => {
    const cleanup = startLiveBackground();
    return cleanup;
  }, [startLiveBackground]);

  useEffect(() => {
    const storedData = localStorage.getItem('hypothesesData');
    if (storedData) {
      const parsedData = JSON.parse(storedData) as QueryResponse;
      setData(parsedData);
    } else {
      router.push('/');
    }
  }, [router]);

  const handleNewQuery = () => {
    localStorage.removeItem('hypothesesData');
    router.push('/');
  };

  const handleHypothesisSelect = (index: number) => {
    if (index === selectedHypothesis) return;
    
    setIsTransitioning(true);
    setTimeout(() => {
      setSelectedHypothesis(index);
      setIsTransitioning(false);
    }, 150);
  };

  if (!data) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-r-2 border-transparent border-t-cyan-400 border-r-purple-400 mx-auto"></div>
          <p className="text-center mt-6 text-white/90 text-lg font-medium">
            Loading revolutionary hypotheses...
          </p>
        </div>
      </div>
    );
  }

  const currentHypothesis = data.hypotheses[selectedHypothesis];
  const filteredHypotheses = data.hypotheses.filter(h => 
    h.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedHypotheses = [...filteredHypotheses].sort((a, b) => {
    switch (sortBy) {
      case 'confidence':
        return (b.confidence_score || 0) - (a.confidence_score || 0);
      case 'novelty':
        return (b.novelty_score || 0) - (a.novelty_score || 0);
      case 'feasibility':
        return (b.feasibility_score || 0) - (a.feasibility_score || 0);
      default:
        return (a.rank || 999) - (b.rank || 999);
    }
  });

  const ScoreVisualization = ({ score, label, color }: { score: number; label: string; color: string }) => (
    <div className="group cursor-pointer">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-white/80">{label}</span>
        <span className="text-sm font-bold text-white">{Math.round(score * 100)}%</span>
      </div>
      <div className="relative h-3 bg-white/10 rounded-full overflow-hidden">
        <div
          className={`h-full ${color} rounded-full transition-all duration-1000 ease-out shadow-lg`}
          style={{ 
            width: `${score * 100}%`,
            boxShadow: `0 0 20px ${color.includes('cyan') ? '#00d4aa' : color.includes('purple') ? '#a855f7' : '#f59e0b'}`
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
      </div>
    </div>
  );

  const renderExperimentalPlan = (plan: any) => {
    if (typeof plan === 'string') {
      // Parse string-based experimental plans with improved regex
      const phases = [];
      
      // Try multiple regex patterns to handle different formats
      let phaseRegex = /phase_(\d+):\s*([^phase_]+?)(?=phase_|$)/gi;
      let match;
      
      while ((match = phaseRegex.exec(plan)) !== null) {
        phases.push({
          phase: `Phase ${match[1]}`,
          description: match[2].trim()
        });
      }
      
      // If no matches found, try alternative pattern
      if (phases.length === 0) {
        phaseRegex = /phase\s*(\d+):\s*([^phase]+?)(?=phase|$)/gi;
        while ((match = phaseRegex.exec(plan)) !== null) {
          phases.push({
            phase: `Phase ${match[1]}`,
            description: match[2].trim()
          });
        }
      }
      
      // If still no matches, try splitting by common patterns
      if (phases.length === 0) {
        const parts = plan.split(/(?:phase_|phase\s*)\d+:/i);
        if (parts.length > 1) {
          parts.slice(1).forEach((part, index) => {
            phases.push({
              phase: `Phase ${index + 1}`,
              description: part.trim()
            });
          });
        }
      }
      
      // If we found structured phases, render them nicely
      if (phases.length > 0) {
        return (
          <div className="space-y-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full flex items-center justify-center text-lg font-bold text-white">
                🗺️
              </div>
              <h3 className="text-2xl font-semibold text-white">Research Roadmap</h3>
            </div>
            {phases.map((phase, index) => (
              <div key={index} 
                   className="bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-cyan-400/30 transition-all duration-300 group relative overflow-hidden">
                {/* Background gradient effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/5 via-transparent to-purple-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="relative z-10">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full flex items-center justify-center text-lg font-bold text-white shadow-lg">
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-xl">
                        {phase.phase}
                      </h4>
                      <div className="w-16 h-1 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full mt-2"></div>
                    </div>
                  </div>
                  <p className="text-white/90 leading-relaxed text-lg ml-16">{phase.description}</p>
                </div>
              </div>
            ))}
          </div>
        );
      }
      
      // Fallback for unstructured text with better formatting
      return (
        <div className="space-y-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full flex items-center justify-center text-lg font-bold text-white">
              🗺️
            </div>
            <h3 className="text-2xl font-semibold text-white">Research Roadmap</h3>
          </div>
          <div className="bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
            <p className="text-white/90 leading-relaxed text-lg">{plan}</p>
          </div>
        </div>
      );
    }
    
    if (typeof plan === 'object' && plan) {
      return (
        <div className="space-y-6">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full flex items-center justify-center text-lg font-bold text-white">
              🗺️
            </div>
            <h3 className="text-2xl font-semibold text-white">Research Roadmap</h3>
          </div>
          {Object.entries(plan).map(([phase, description], index) => (
            <div key={phase} 
                 className="bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-cyan-400/30 transition-all duration-300 group relative overflow-hidden">
              {/* Background gradient effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/5 via-transparent to-purple-400/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              
              <div className="relative z-10">
                <div className="flex items-center space-x-4 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full flex items-center justify-center text-lg font-bold text-white shadow-lg">
                    {index + 1}
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-xl capitalize">
                      {phase.replace('_', ' ')}
                    </h4>
                    <div className="w-16 h-1 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full mt-2"></div>
                  </div>
                </div>
                <p className="text-white/90 leading-relaxed text-lg ml-16">{String(description)}</p>
              </div>
            </div>
          ))}
        </div>
      );
    }
    
    return (
      <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
        <p className="text-white/60 italic">No experimental plan available</p>
      </div>
    );
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

      <div className="relative z-10 p-6 max-w-[1600px] mx-auto">
        {/* Futuristic Header */}
        <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-8 mb-8 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-cyan-400/10 via-transparent to-purple-400/10" />
          
          
          <div className="relative z-10 flex items-center justify-between mb-8">
            <div>
              <h1 className="text-5xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-4">
                AI Research Hypotheses
              </h1>
              <p className="text-white/80 text-xl mb-2">
                Query: <span className="text-cyan-300 font-medium">&quot;{data.original_query}&quot;</span>
              </p>
              <p className="text-white/60 text-sm font-mono">
                ID: {data.query_id}
              </p>
            </div>
            <div className="text-right space-y-4">
              <button
                onClick={handleNewQuery}
                className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white font-medium py-3 px-8 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-cyan-500/25"
              >
                New Query
              </button>
            </div>
          </div>
          
          {/* Glassmorphic Analytics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { value: data.hypotheses.length, label: 'Hypotheses', icon: '🧬', color: 'from-cyan-400 to-blue-500' },
              { value: formatProcessingTime(data.total_processing_time), label: 'Processing', icon: '⚡', color: 'from-purple-400 to-pink-500' },
              { value: `${Math.round((data.hypotheses.reduce((sum, h) => sum + (h.confidence_score || 0), 0) / data.hypotheses.length) * 100)}%`, label: 'Avg Confidence', icon: '🎯', color: 'from-emerald-400 to-teal-500' },
              { value: data.processing_steps.length, label: 'AI Steps', icon: '🤖', color: 'from-orange-400 to-red-500' }
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
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
          {/* Hypothesis Explorer Sidebar */}
          <div className="xl:col-span-1">
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-6 sticky top-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Hypotheses</h2>
                <div className="text-cyan-400 font-mono text-sm">
                  {sortedHypotheses.length} found
                </div>
              </div>
              
              {/* Search & Filter */}
              <div className="space-y-4 mb-6">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search hypotheses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/20 backdrop-blur-sm"
                  />
                  <div className="absolute right-3 top-3.5 text-white/40">
                    🔍
                  </div>
                </div>
                
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white focus:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-400/20 backdrop-blur-sm"
                >
                  <option value="rank">Sort by Rank</option>
                  <option value="confidence">Sort by Confidence</option>
                  <option value="novelty">Sort by Novelty</option>
                  <option value="feasibility">Sort by Feasibility</option>
                </select>
              </div>

              {/* Hypothesis Cards */}
              <div className="space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar">
                {sortedHypotheses.map((hypothesis, index) => {
                  const originalIndex = data.hypotheses.findIndex(h => h.id === hypothesis.id);
                  const isSelected = selectedHypothesis === originalIndex;
                  
                  return (
                    <button
                      key={hypothesis.id}
                      onClick={() => handleHypothesisSelect(originalIndex)}
                      className={`w-full text-left p-4 rounded-2xl transition-all duration-300 transform ${
                        isSelected
                          ? 'bg-gradient-to-r from-cyan-500/20 to-purple-500/20 border-2 border-cyan-400/50 scale-105 shadow-lg shadow-cyan-500/20'
                          : 'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/30 hover:scale-102'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                          isSelected ? 'bg-cyan-400 text-white' : 'bg-white/20 text-white/80'
                        }`}>
                          #{hypothesis.rank || index + 1}
                        </div>
                        {hypothesis.final_score && (
                          <div className="text-xs bg-gradient-to-r from-purple-400 to-pink-400 text-white px-2 py-1 rounded-full font-bold">
                            {Math.round(hypothesis.final_score * 100)}%
                          </div>
                        )}
                      </div>
                      
                      <h3 className="font-semibold text-white mb-2 text-sm leading-tight line-clamp-2">
                        {hypothesis.title}
                      </h3>
                      
                      <p className="text-white/70 text-xs mb-3 line-clamp-2">
                        {hypothesis.description.replace(/\*[^*]+\*/g, '').substring(0, 100)}...
                      </p>
                      
                      {/* Quick Stats */}
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-white/60">Novelty</span>
                          <span className="text-cyan-300 font-bold">
                            {hypothesis.novelty_score ? Math.round(hypothesis.novelty_score * 100) : '--'}%
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-white/60">Feasible</span>
                          <span className="text-purple-300 font-bold">
                            {hypothesis.feasibility_score ? Math.round(hypothesis.feasibility_score * 100) : '--'}%
                          </span>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="xl:col-span-3">
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
              {/* Futuristic Tab Navigation */}
              <div className="border-b border-white/20 p-6 bg-gradient-to-r from-white/5 to-transparent">
                <nav className="flex space-x-1 bg-white/10 p-1 rounded-2xl backdrop-blur-sm">
                  {[
                    { id: 'overview', label: 'Overview', icon: '🔍' },
                    { id: 'plan', label: 'Research Plan', icon: '🧪' },
                    { id: 'analytics', label: 'Analytics', icon: '📊' },
                    { id: 'compare', label: 'Compare', icon: '⚖️' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-xl font-medium text-sm transition-all duration-300 ${
                        activeTab === tab.id
                          ? 'bg-gradient-to-r from-cyan-500 to-purple-500 text-white shadow-lg transform scale-105'
                          : 'text-white/70 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <span>{tab.icon}</span>
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </nav>
              </div>

              {/* Tab Content */}
              <div className={`p-8 transition-all duration-300 ${isTransitioning ? 'opacity-0 transform scale-95' : 'opacity-100 transform scale-100'}`}>
                {/* Overview Tab */}
                {activeTab === 'overview' && (
                  <div className="space-y-8">
                    <div>
                      <h2 className="text-4xl font-bold text-white mb-4 leading-tight">
                        {currentHypothesis.title}
                      </h2>
                      {currentHypothesis.rank && (
                        <div className="inline-flex items-center bg-gradient-to-r from-cyan-500 to-purple-500 text-white px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                          🏆 Ranked #{currentHypothesis.rank}
                        </div>
                      )}
                    </div>

                    <div className="bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-sm rounded-3xl p-8 border border-white/10">
                      <h3 className="text-2xl font-semibold text-white mb-4 flex items-center">
                        <span className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full flex items-center justify-center text-sm mr-3">📝</span>
                        Description
                      </h3>
                      <div className="text-white/90 leading-relaxed text-lg whitespace-pre-line">
                        {formatDescription(currentHypothesis.description)}
                      </div>
                    </div>

                    {currentHypothesis.reasoning && (
                      <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 backdrop-blur-sm rounded-3xl p-8 border border-blue-400/20">
                        <h3 className="text-2xl font-semibold text-white mb-4 flex items-center">
                          <span className="w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full flex items-center justify-center text-sm mr-3">🧠</span>
                          Scientific Reasoning
                        </h3>
                        <p className="text-white/90 leading-relaxed text-lg">{currentHypothesis.reasoning}</p>
                      </div>
                    )}

                    {/* Advanced Scoring Visualization */}
                    <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 backdrop-blur-sm rounded-3xl p-8 border border-purple-400/20">
                      <h3 className="text-2xl font-semibold text-white mb-6 flex items-center">
                        <span className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-sm mr-3">⚡</span>
                        Performance Metrics
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Backend provided scores */}
                        {currentHypothesis.novelty_score !== undefined && (
                          <ScoreVisualization
                            score={currentHypothesis.novelty_score}
                            label="Novelty"
                            color="bg-gradient-to-r from-cyan-400 to-blue-500"
                          />
                        )}
                        {currentHypothesis.feasibility_score !== undefined && (
                          <ScoreVisualization
                            score={currentHypothesis.feasibility_score}
                            label="Feasibility"
                            color="bg-gradient-to-r from-purple-400 to-pink-500"
                          />
                        )}
                        {currentHypothesis.confidence_score !== undefined && (
                          <ScoreVisualization
                            score={currentHypothesis.confidence_score}
                            label="Confidence"
                            color="bg-gradient-to-r from-emerald-400 to-teal-500"
                          />
                        )}
                        
                        {/* Legacy criterion_scores for backward compatibility */}
                        {currentHypothesis.criterion_scores && Object.entries(currentHypothesis.criterion_scores).map(([key, value]) => {
                          if (value === undefined) return null;
                          // Skip if we already showed these as primary scores
                          if (key === 'novelty' && currentHypothesis.novelty_score !== undefined) return null;
                          if (key === 'feasibility' && currentHypothesis.feasibility_score !== undefined) return null;
                          
                          const colors = {
                            validity: 'bg-gradient-to-r from-emerald-400 to-teal-500',
                            novelty: 'bg-gradient-to-r from-cyan-400 to-blue-500',
                            feasibility: 'bg-gradient-to-r from-purple-400 to-pink-500',
                            impact: 'bg-gradient-to-r from-orange-400 to-red-500',
                            clarity: 'bg-gradient-to-r from-yellow-400 to-orange-500'
                          };
                          return (
                            <ScoreVisualization
                              key={key}
                              score={value}
                              label={key.charAt(0).toUpperCase() + key.slice(1)}
                              color={colors[key as keyof typeof colors] || 'bg-gradient-to-r from-gray-400 to-gray-500'}
                            />
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* Research Plan Tab */}
                {activeTab === 'plan' && (
                  <div className="space-y-8">
                    <h2 className="text-4xl font-bold text-white mb-8">{currentHypothesis.title}</h2>
                    
                    {currentHypothesis.experimental_plan && (
                      <div>
                        {renderExperimentalPlan(currentHypothesis.experimental_plan)}
                      </div>
                    )}

                    {/* Resource Requirements */}
                    {currentHypothesis.resource_requirements && (
                      <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/10 backdrop-blur-sm rounded-3xl p-8 border border-emerald-400/20">
                        <h3 className="text-2xl font-semibold text-white mb-6 flex items-center">
                          <span className="w-8 h-8 bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-sm mr-3">💼</span>
                          Resource Requirements
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {currentHypothesis.resource_requirements.personnel && (
                            <div className="bg-white/10 rounded-2xl p-6 border border-white/10">
                              <h4 className="font-semibold text-emerald-300 mb-4 flex items-center">
                                <span className="mr-2">👥</span> Personnel
                              </h4>
                              <ul className="space-y-2">
                                {currentHypothesis.resource_requirements.personnel.map((person, index) => (
                                  <li key={index} className="text-white/80 text-sm flex items-center">
                                    <span className="w-2 h-2 bg-emerald-400 rounded-full mr-3"></span>
                                    {person}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {currentHypothesis.resource_requirements.equipment && (
                            <div className="bg-white/10 rounded-2xl p-6 border border-white/10">
                              <h4 className="font-semibold text-cyan-300 mb-4 flex items-center">
                                <span className="mr-2">🔬</span> Equipment
                              </h4>
                              <ul className="space-y-2">
                                {currentHypothesis.resource_requirements.equipment.map((item, index) => (
                                  <li key={index} className="text-white/80 text-sm flex items-center">
                                    <span className="w-2 h-2 bg-cyan-400 rounded-full mr-3"></span>
                                    {item}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {currentHypothesis.resource_requirements.funding && (
                            <div className="bg-white/10 rounded-2xl p-6 border border-white/10">
                              <h4 className="font-semibold text-purple-300 mb-4 flex items-center">
                                <span className="mr-2">💰</span> Funding
                              </h4>
                              <div className="text-2xl font-bold text-white">
                                {currentHypothesis.resource_requirements.funding}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Additional Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {currentHypothesis.risk_factors && currentHypothesis.risk_factors.length > 0 && (
                        <div className="bg-gradient-to-r from-red-500/10 to-orange-500/10 backdrop-blur-sm rounded-2xl p-6 border border-red-400/20">
                          <h4 className="font-semibold text-red-300 mb-4 flex items-center">
                            <span className="mr-2">⚠️</span> Risk Factors
                          </h4>
                          <ul className="space-y-2">
                            {currentHypothesis.risk_factors.map((risk, index) => (
                              <li key={index} className="text-white/80 text-sm flex items-start">
                                <span className="w-2 h-2 bg-red-400 rounded-full mr-3 mt-2 flex-shrink-0"></span>
                                {risk}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {currentHypothesis.success_metrics && currentHypothesis.success_metrics.length > 0 && (
                        <div className="bg-gradient-to-r from-green-500/10 to-emerald-500/10 backdrop-blur-sm rounded-2xl p-6 border border-green-400/20">
                          <h4 className="font-semibold text-green-300 mb-4 flex items-center">
                            <span className="mr-2">🎯</span> Success Metrics
                          </h4>
                          <ul className="space-y-2">
                            {currentHypothesis.success_metrics.map((metric, index) => (
                              <li key={index} className="text-white/80 text-sm flex items-start">
                                <span className="w-2 h-2 bg-green-400 rounded-full mr-3 mt-2 flex-shrink-0"></span>
                                {metric}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Analytics Tab */}
                {activeTab === 'analytics' && (
                  <div className="space-y-8">
                    <h2 className="text-4xl font-bold text-white mb-8">Deep Analytics</h2>
                    
                    {/* Processing Pipeline */}
                    <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 backdrop-blur-sm rounded-3xl p-8 border border-indigo-400/20">
                      <h3 className="text-2xl font-semibold text-white mb-6 flex items-center">
                        <span className="w-8 h-8 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full flex items-center justify-center text-sm mr-3">🤖</span>
                        AI Processing Pipeline
                      </h3>
                      <div className="space-y-4">
                        {data.processing_steps.map((step, index) => (
                          <div key={index} className="relative">
                            <div className="flex items-center space-x-4 bg-white/5 rounded-2xl p-4 border border-white/10 hover:border-indigo-400/30 transition-all duration-300">
                              <div className="w-10 h-10 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full flex items-center justify-center text-sm font-bold text-white">
                                {index + 1}
                              </div>
                              <div className="flex-1">
                                <h4 className="font-semibold text-white capitalize mb-1">
                                  {step.step_name.replace('_', ' ')}
                                </h4>
                                <p className="text-white/70 text-sm">{step.status}</p>
                                <div className="flex items-center space-x-4 mt-2">
                                  <span className="text-xs text-indigo-300 font-mono">
                                    {step.duration_seconds.toFixed(2)}s
                                  </span>
                                  <div className="flex flex-wrap gap-2">
                                    {step.agent_outputs.map((agent, agentIndex) => (
                                      <div key={agentIndex} className="group relative">
                                        <div className="flex items-center space-x-2 text-xs bg-purple-500/20 text-purple-200 px-3 py-1.5 rounded-full border border-purple-400/30 hover:bg-purple-500/30 hover:border-purple-400/50 transition-all duration-200">
                                          <span className="font-medium">{agent.agent_name}</span>
                                          {agent.metadata?.model && (
                                            <>
                                              <span className="text-purple-300/60">•</span>
                                              <span className="text-purple-300/80 text-xs font-mono">
                                                {agent.metadata.model}
                                              </span>
                                            </>
                                          )}
                                        </div>
                                        
                                        {/* Tooltip */}
                                        {agentDescriptions[agent.agent_name] && (
                                          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50">
                                            <div className="bg-gray-900/95 backdrop-blur-sm text-white text-xs rounded-lg px-3 py-2 shadow-xl border border-white/20 max-w-[200px] text-center">
                                              {agentDescriptions[agent.agent_name]}
                                              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900/95"></div>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </div>
                            {index < data.processing_steps.length - 1 && (
                              <div className="w-0.5 h-4 bg-gradient-to-b from-indigo-400 to-purple-400 ml-5 my-2"></div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* System Recommendations */}
                    <div className="bg-gradient-to-r from-cyan-500/10 to-teal-500/10 backdrop-blur-sm rounded-3xl p-8 border border-cyan-400/20">
                      <h3 className="text-2xl font-semibold text-white mb-6 flex items-center">
                        <span className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-teal-400 rounded-full flex items-center justify-center text-sm mr-3">💡</span>
                        AI Recommendations
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {data.recommendations.map((rec, index) => (
                          <div key={index} className="bg-white/5 rounded-2xl p-4 border border-white/10 hover:border-cyan-400/30 transition-all duration-300">
                            <div className="flex items-start space-x-3">
                              <span className="w-6 h-6 bg-gradient-to-r from-cyan-400 to-teal-400 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 mt-0.5">
                                {index + 1}
                              </span>
                              <p className="text-white/90 text-sm leading-relaxed">{rec}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Compare Tab */}
                {activeTab === 'compare' && (
                  <div className="space-y-8">
                    <h2 className="text-4xl font-bold text-white mb-8">Hypothesis Comparison</h2>
                    
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {data.hypotheses.slice(0, 3).map((hypothesis, index) => (
                        <div key={hypothesis.id} className={`bg-gradient-to-br ${
                          index === 0 ? 'from-yellow-500/20 to-orange-500/20 border-yellow-400/30' :
                          index === 1 ? 'from-cyan-500/20 to-blue-500/20 border-cyan-400/30' :
                          'from-purple-500/20 to-pink-500/20 border-purple-400/30'
                        } backdrop-blur-sm rounded-3xl p-6 border relative overflow-hidden`}>
                          
                          {index === 0 && (
                            <div className="absolute top-4 right-4 bg-gradient-to-r from-yellow-400 to-orange-400 text-white px-3 py-1 rounded-full text-xs font-bold">
                              🏆 BEST
                            </div>
                          )}
                          
                          <div className="mb-4">
                            <h3 className="font-bold text-white text-lg mb-2 line-clamp-2">
                              {hypothesis.title}
                            </h3>
                            <p className="text-white/70 text-sm line-clamp-3">
                              {hypothesis.description.replace(/\*[^*]+\*/g, '')}
                            </p>
                          </div>
                          
                          {/* Display available scores */}
                          <div className="space-y-3">
                            {hypothesis.novelty_score !== undefined && (
                              <div className="flex items-center justify-between">
                                <span className="text-white/80 text-sm">Novelty</span>
                                <div className="flex items-center space-x-2">
                                  <div className="w-16 h-2 bg-white/20 rounded-full overflow-hidden">
                                    <div 
                                      className={`h-full rounded-full ${
                                        index === 0 ? 'bg-gradient-to-r from-yellow-400 to-orange-400' :
                                        index === 1 ? 'bg-gradient-to-r from-cyan-400 to-blue-400' :
                                        'bg-gradient-to-r from-purple-400 to-pink-400'
                                      }`}
                                      style={{ width: `${hypothesis.novelty_score * 100}%` }}
                                    />
                                  </div>
                                  <span className="text-white text-xs font-bold w-8">
                                    {Math.round(hypothesis.novelty_score * 100)}%
                                  </span>
                                </div>
                              </div>
                            )}
                            {hypothesis.feasibility_score !== undefined && (
                              <div className="flex items-center justify-between">
                                <span className="text-white/80 text-sm">Feasibility</span>
                                <div className="flex items-center space-x-2">
                                  <div className="w-16 h-2 bg-white/20 rounded-full overflow-hidden">
                                    <div 
                                      className={`h-full rounded-full ${
                                        index === 0 ? 'bg-gradient-to-r from-yellow-400 to-orange-400' :
                                        index === 1 ? 'bg-gradient-to-r from-cyan-400 to-blue-400' :
                                        'bg-gradient-to-r from-purple-400 to-pink-400'
                                      }`}
                                      style={{ width: `${hypothesis.feasibility_score * 100}%` }}
                                    />
                                  </div>
                                  <span className="text-white text-xs font-bold w-8">
                                    {Math.round(hypothesis.feasibility_score * 100)}%
                                  </span>
                                </div>
                              </div>
                            )}
                            {hypothesis.confidence_score !== undefined && (
                              <div className="flex items-center justify-between">
                                <span className="text-white/80 text-sm">Confidence</span>
                                <div className="flex items-center space-x-2">
                                  <div className="w-16 h-2 bg-white/20 rounded-full overflow-hidden">
                                    <div 
                                      className={`h-full rounded-full ${
                                        index === 0 ? 'bg-gradient-to-r from-yellow-400 to-orange-400' :
                                        index === 1 ? 'bg-gradient-to-r from-cyan-400 to-blue-400' :
                                        'bg-gradient-to-r from-purple-400 to-pink-400'
                                      }`}
                                      style={{ width: `${hypothesis.confidence_score * 100}%` }}
                                    />
                                  </div>
                                  <span className="text-white text-xs font-bold w-8">
                                    {Math.round(hypothesis.confidence_score * 100)}%
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Comprehensive Comparison Table */}
                    <div className="bg-gradient-to-r from-slate-500/10 to-gray-500/10 backdrop-blur-sm rounded-3xl p-8 border border-white/10">
                      <h3 className="text-2xl font-semibold text-white mb-6 flex items-center">
                        <span className="w-8 h-8 bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full flex items-center justify-center text-sm mr-3">📊</span>
                        Detailed Comparison Table
                      </h3>
                      
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="border-b border-white/20">
                              <th className="text-left text-white font-semibold py-4 px-4 min-w-[200px]">Hypothesis</th>
                              <th className="text-center text-white font-semibold py-4 px-3 min-w-[80px]">Rank</th>
                              <th className="text-center text-white font-semibold py-4 px-3 min-w-[90px]">Final Score</th>
                              <th className="text-center text-white font-semibold py-4 px-3 min-w-[80px]">Novelty</th>
                              <th className="text-center text-white font-semibold py-4 px-3 min-w-[90px]">Feasibility</th>
                              <th className="text-center text-white font-semibold py-4 px-3 min-w-[100px]">Confidence</th>
                            </tr>
                          </thead>
                          <tbody>
                            {data.hypotheses.map((hypothesis, index) => (
                              <tr key={hypothesis.id} 
                                  className={`border-b border-white/10 hover:bg-white/5 transition-colors duration-200 ${
                                    selectedHypothesis === index ? 'bg-gradient-to-r from-cyan-500/10 to-purple-500/10' : ''
                                  }`}
                                  onClick={() => handleHypothesisSelect(index)}
                                  style={{ cursor: 'pointer' }}>
                                <td className="py-4 px-4">
                                  <div className="flex items-center space-x-3">
                                    {hypothesis.rank === 1 && <span className="text-yellow-400">🏆</span>}
                                    <div>
                                      <div className="font-medium text-white text-sm line-clamp-2 max-w-[180px]">
                                        {hypothesis.title}
                                      </div>
                                      {hypothesis.rank && (
                                        <div className="text-xs text-white/60 mt-1">
                                          #{hypothesis.rank}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td className="text-center py-4 px-3">
                                  <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold ${
                                    hypothesis.rank === 1 ? 'bg-yellow-400/20 text-yellow-300 border border-yellow-400/50' :
                                    hypothesis.rank === 2 ? 'bg-cyan-400/20 text-cyan-300 border border-cyan-400/50' :
                                    hypothesis.rank === 3 ? 'bg-purple-400/20 text-purple-300 border border-purple-400/50' :
                                    'bg-white/10 text-white/70 border border-white/20'
                                  }`}>
                                    {hypothesis.rank || index + 1}
                                  </span>
                                </td>
                                <td className="text-center py-4 px-3">
                                  <div className="flex flex-col items-center space-y-1">
                                    <span className="text-white font-bold text-sm">
                                      {hypothesis.final_score ? Math.round(hypothesis.final_score * 100) : '--'}%
                                    </span>
                                    {hypothesis.final_score && (
                                      <div className="w-12 h-1.5 bg-white/20 rounded-full overflow-hidden">
                                        <div 
                                          className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full"
                                          style={{ width: `${hypothesis.final_score * 100}%` }}
                                        />
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="text-center py-4 px-3">
                                  <div className="flex flex-col items-center space-y-1">
                                    <span className="text-white/90 text-sm font-medium">
                                      {hypothesis.novelty_score 
                                        ? Math.round(hypothesis.novelty_score * 100) 
                                        : '--'}%
                                    </span>
                                    {hypothesis.novelty_score && (
                                      <div className="w-10 h-1 bg-white/20 rounded-full overflow-hidden">
                                        <div 
                                          className="h-full bg-gradient-to-r from-cyan-400 to-blue-400 rounded-full"
                                          style={{ width: `${hypothesis.novelty_score * 100}%` }}
                                        />
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="text-center py-4 px-3">
                                  <div className="flex flex-col items-center space-y-1">
                                    <span className="text-white/90 text-sm font-medium">
                                      {hypothesis.feasibility_score 
                                        ? Math.round(hypothesis.feasibility_score * 100) 
                                        : '--'}%
                                    </span>
                                    {hypothesis.feasibility_score && (
                                      <div className="w-10 h-1 bg-white/20 rounded-full overflow-hidden">
                                        <div 
                                          className="h-full bg-gradient-to-r from-purple-400 to-pink-400 rounded-full"
                                          style={{ width: `${hypothesis.feasibility_score * 100}%` }}
                                        />
                                      </div>
                                    )}
                                  </div>
                                </td>
                                <td className="text-center py-4 px-3">
                                  <div className="flex flex-col items-center space-y-1">
                                    <span className="text-white/90 text-sm font-medium">
                                      {hypothesis.confidence_score ? Math.round(hypothesis.confidence_score * 100) : '--'}%
                                    </span>
                                    {hypothesis.confidence_score && (
                                      <div className="w-10 h-1 bg-white/20 rounded-full overflow-hidden">
                                        <div 
                                          className="h-full bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full"
                                          style={{ width: `${hypothesis.confidence_score * 100}%` }}
                                        />
                                      </div>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      
                      <div className="mt-6 text-center">
                        <p className="text-white/60 text-sm">
                          💡 Click any row to view detailed information about that hypothesis
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Enhanced Navigation */}
              <div className="flex justify-between items-center p-6 border-t border-white/20 bg-gradient-to-r from-white/5 to-transparent">
                <button
                  onClick={() => handleHypothesisSelect(Math.max(0, selectedHypothesis - 1))}
                  disabled={selectedHypothesis === 0}
                  className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-white/10 to-white/5 hover:from-white/20 hover:to-white/10 disabled:from-white/5 disabled:to-white/5 disabled:text-white/40 disabled:cursor-not-allowed rounded-xl transition-all duration-300 border border-white/20 hover:border-white/40 transform hover:scale-105 backdrop-blur-sm"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <span className="text-white font-medium">Previous</span>
                </button>
                
                <div className="flex items-center space-x-4 bg-white/10 px-6 py-3 rounded-xl border border-white/20 backdrop-blur-sm">
                  <span className="text-white/80 text-sm">
                    {selectedHypothesis + 1} of {data.hypotheses.length}
                  </span>
                  <div className="w-32 h-2 bg-white/20 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full transition-all duration-300"
                      style={{ width: `${((selectedHypothesis + 1) / data.hypotheses.length) * 100}%` }}
                    />
                  </div>
                </div>
                
                <button
                  onClick={() => handleHypothesisSelect(Math.min(data.hypotheses.length - 1, selectedHypothesis + 1))}
                  disabled={selectedHypothesis === data.hypotheses.length - 1}
                  className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-white/10 to-white/5 hover:from-white/20 hover:to-white/10 disabled:from-white/5 disabled:to-white/5 disabled:text-white/40 disabled:cursor-not-allowed rounded-xl transition-all duration-300 border border-white/20 hover:border-white/40 transform hover:scale-105 backdrop-blur-sm"
                >
                  <span className="text-white font-medium">Next</span>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #06b6d4, #8b5cf6);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #0891b2, #7c3aed);
        }
      `}</style>
    </div>
  );
} 