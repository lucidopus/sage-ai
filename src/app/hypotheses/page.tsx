'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { QueryResponse } from '../../types/api';

export default function HypothesesPage() {
  const [data, setData] = useState<QueryResponse | null>(null);
  const [selectedHypothesis, setSelectedHypothesis] = useState<number>(0);
  const [activeTab, setActiveTab] = useState<'overview' | 'plan' | 'analytics' | 'compare'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'rank' | 'confidence' | 'novelty' | 'feasibility'>('rank');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const router = useRouter();

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
        return (b.criterion_scores?.novelty || 0) - (a.criterion_scores?.novelty || 0);
      case 'feasibility':
        return (b.criterion_scores?.feasibility || 0) - (a.criterion_scores?.feasibility || 0);
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
      return (
        <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-6 border border-white/10">
          <p className="text-white/90 leading-relaxed">{plan}</p>
        </div>
      );
    }
    
    if (typeof plan === 'object' && plan) {
      return (
        <div className="space-y-4">
          {Object.entries(plan).map(([phase, description], index) => (
            <div key={phase} 
                 className="bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-cyan-400/30 transition-all duration-300 group">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full flex items-center justify-center text-sm font-bold text-white">
                  {index + 1}
                </div>
                <h4 className="font-semibold text-white capitalize text-lg">
                  {phase.replace('_', ' ')}
                </h4>
              </div>
              <p className="text-white/80 leading-relaxed ml-11">{String(description)}</p>
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
            <button
              onClick={handleNewQuery}
              className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-400 hover:to-purple-400 text-white font-medium py-3 px-8 rounded-2xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-cyan-500/25"
            >
              New Query
            </button>
          </div>
          
          {/* Glassmorphic Analytics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              { value: data.hypotheses.length, label: 'Hypotheses', icon: '🧬', color: 'from-cyan-400 to-blue-500' },
              { value: `${(data.total_processing_time / 1000).toFixed(1)}s`, label: 'Processing', icon: '⚡', color: 'from-purple-400 to-pink-500' },
              { value: data.hypotheses.filter(h => h.confidence_score && h.confidence_score > 0.7).length, label: 'High Confidence', icon: '🎯', color: 'from-emerald-400 to-teal-500' },
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
                        {hypothesis.description.substring(0, 100)}...
                      </p>
                      
                      {/* Quick Stats */}
                      {hypothesis.criterion_scores && (
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-white/60">Novelty</span>
                            <span className="text-cyan-300 font-bold">
                              {Math.round((hypothesis.criterion_scores.novelty || 0) * 100)}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-white/60">Feasible</span>
                            <span className="text-purple-300 font-bold">
                              {Math.round((hypothesis.criterion_scores.feasibility || 0) * 100)}%
                            </span>
                          </div>
                        </div>
                      )}
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
                      <p className="text-white/90 leading-relaxed text-lg">{currentHypothesis.description}</p>
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
                    {currentHypothesis.criterion_scores && (
                      <div className="bg-gradient-to-r from-purple-500/10 to-pink-500/10 backdrop-blur-sm rounded-3xl p-8 border border-purple-400/20">
                        <h3 className="text-2xl font-semibold text-white mb-6 flex items-center">
                          <span className="w-8 h-8 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full flex items-center justify-center text-sm mr-3">⚡</span>
                          Performance Metrics
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {Object.entries(currentHypothesis.criterion_scores).map(([key, value]) => {
                            if (value === undefined) return null;
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
                    )}
                  </div>
                )}

                {/* Research Plan Tab */}
                {activeTab === 'plan' && (
                  <div className="space-y-8">
                    <h2 className="text-4xl font-bold text-white mb-8">{currentHypothesis.title}</h2>
                    
                    {currentHypothesis.experimental_plan && (
                      <div>
                        <h3 className="text-2xl font-semibold text-white mb-6 flex items-center">
                          <span className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-purple-400 rounded-full flex items-center justify-center text-sm mr-3">🧪</span>
                          Experimental Design
                        </h3>
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
                                  <span className="text-xs text-purple-300">
                                    {step.agent_outputs.length} agents
                                  </span>
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
                              {hypothesis.description}
                            </p>
                          </div>
                          
                          {hypothesis.criterion_scores && (
                            <div className="space-y-3">
                              {Object.entries(hypothesis.criterion_scores).map(([key, value]) => (
                                value !== undefined && (
                                  <div key={key} className="flex items-center justify-between">
                                    <span className="text-white/80 text-sm capitalize">{key}</span>
                                    <div className="flex items-center space-x-2">
                                      <div className="w-16 h-2 bg-white/20 rounded-full overflow-hidden">
                                        <div 
                                          className={`h-full rounded-full ${
                                            index === 0 ? 'bg-gradient-to-r from-yellow-400 to-orange-400' :
                                            index === 1 ? 'bg-gradient-to-r from-cyan-400 to-blue-400' :
                                            'bg-gradient-to-r from-purple-400 to-pink-400'
                                          }`}
                                          style={{ width: `${value * 100}%` }}
                                        />
                                      </div>
                                      <span className="text-white text-xs font-bold w-8">
                                        {Math.round(value * 100)}%
                                      </span>
                                    </div>
                                  </div>
                                )
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
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