'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function SystemDesignPage() {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isZoomed, setIsZoomed] = useState(false);
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

  const handleBackToHome = () => {
    router.push('/');
  };

  const handleImageLoad = () => {
    setIsImageLoaded(true);
  };

  const toggleZoom = () => {
    setIsZoomed(!isZoomed);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* Animated background */}
      <canvas
        ref={canvasRef}
        className="fixed inset-0 w-full h-full pointer-events-none"
        style={{ zIndex: 0 }}
      />

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header */}
        <header className="p-6">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBackToHome}
                className="group flex items-center space-x-2 text-white/80 hover:text-white transition-colors duration-200"
              >
                <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                <span className="font-medium">Back to Home</span>
              </button>
            </div>
            
            <div className="text-center">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                AI Co-Scientist System Design
              </h1>
              <p className="text-white/60 mt-2 text-sm">
                Multi-agent architecture for scientific research collaboration
              </p>
            </div>

            <div className="w-32"></div> {/* Spacer for centering */}
          </div>
        </header>

        {/* Main content area */}
        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            {/* System Overview */}
            <div className="mb-8">
              <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl">
                <h2 className="text-2xl font-bold text-white mb-4 flex items-center">
                  <svg className="w-6 h-6 mr-3 text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  System Overview
                </h2>
                <p className="text-white/80 leading-relaxed">
                  The AI co-scientist system is a sophisticated multi-agent architecture designed to collaborate with human scientists 
                  in generating, evaluating, and refining research hypotheses. The system operates through a series of specialized agents 
                  that work together to create a self-improving research ecosystem.
                </p>
              </div>
            </div>

            {/* System Design Image */}
            <div className="mb-8">
              <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-white flex items-center">
                    <svg className="w-6 h-6 mr-3 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    System Architecture Diagram
                  </h2>
                  <button
                    onClick={toggleZoom}
                    className="flex items-center space-x-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-white/80 hover:text-white transition-all duration-200"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={isZoomed ? "M6 18L18 6M6 6l12 12" : "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7"} />
                    </svg>
                    <span>{isZoomed ? 'Exit Fullscreen' : 'Fullscreen'}</span>
                  </button>
                </div>

                <div className={`relative ${isZoomed ? 'fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-4' : ''}`}>
                  {isZoomed && (
                    <button
                      onClick={toggleZoom}
                      className="absolute top-4 right-4 z-10 p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white transition-all duration-200"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                  
                  <div className={`relative ${isZoomed ? 'max-w-full max-h-full' : 'max-w-4xl mx-auto'}`}>
                    {!isImageLoaded && (
                      <div className="flex items-center justify-center h-64 bg-white/5 rounded-2xl">
                        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-r-2 border-transparent border-t-cyan-400 border-r-purple-400"></div>
                      </div>
                    )}
                    
                    <Image
                      src="/system-design.png"
                      alt="AI Co-Scientist System Design"
                      width={1200}
                      height={800}
                      className={`rounded-2xl shadow-2xl transition-all duration-300 ${
                        isImageLoaded ? 'opacity-100' : 'opacity-0'
                      } ${isZoomed ? 'max-w-full max-h-full object-contain' : 'w-full h-auto'}`}
                      onLoad={handleImageLoad}
                      priority
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Key Components */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-2xl">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
                  </svg>
                  Core Agents
                </h3>
                <ul className="space-y-3 text-white/80">
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-cyan-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span><strong>Generation Agent:</strong> Creates initial research hypotheses through literature exploration and simulated scientific debate</span>
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-purple-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span><strong>Ranking Agent:</strong> Evaluates and ranks hypotheses through tournament-style competitions</span>
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-pink-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span><strong>Reflection Agent:</strong> Performs comprehensive reviews with web search and deep verification</span>
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-yellow-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span><strong>Evolution Agent:</strong> Refines hypotheses through inspiration, simplification, and research extension</span>
                  </li>
                </ul>
              </div>

              <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-2xl">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  System Features
                </h3>
                <ul className="space-y-3 text-white/80">
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-blue-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span><strong>Self-Improving Loop:</strong> Continuous feedback between agents enables iterative hypothesis enhancement</span>
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-green-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span><strong>Tournament System:</strong> Competitive evaluation ensures high-quality research proposals</span>
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-purple-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span><strong>Tool Integration:</strong> Web search and additional tools enhance research capabilities</span>
                  </li>
                  <li className="flex items-start">
                    <span className="w-2 h-2 bg-yellow-400 rounded-full mt-2 mr-3 flex-shrink-0"></span>
                    <span><strong>Memory System:</strong> Persistent storage and retrieval of research data and insights</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Workflow Description */}
            <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 shadow-2xl">
              <h2 className="text-2xl font-bold text-white mb-6 flex items-center">
                <svg className="w-6 h-6 mr-3 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
                Research Workflow
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-white">1</span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Input & Configuration</h3>
                  <p className="text-white/70 text-sm">
                    Scientist provides research goals, preferences, and constraints. The system configures the research plan accordingly.
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-white">2</span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Multi-Agent Processing</h3>
                  <p className="text-white/70 text-sm">
                    Specialized agents work in sequence: Generation → Reflection → Evolution → Proximity Check → Meta-review.
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-teal-500 rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-2xl font-bold text-white">3</span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Output & Collaboration</h3>
                  <p className="text-white/70 text-sm">
                    Top-ranked hypotheses are presented to the scientist for review, discussion, and further refinement.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
} 