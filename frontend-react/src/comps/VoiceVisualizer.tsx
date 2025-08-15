import React, { useEffect, useRef, useState } from 'react';
import './VoiceVisualizer.css';

interface VoiceVisualizerProps {
  isActive: boolean;
  amplitude?: number; // 0 to 1, representing voice intensity
  className?: string;
  isLoading?: boolean; // Loading state for backend requests
}

export const VoiceVisualizer: React.FC<VoiceVisualizerProps> = ({ 
  isActive, 
  amplitude = 0.5, 
  className = '',
  isLoading = false
}) => {
  const [animationPhase, setAnimationPhase] = useState(0);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (isActive) {
      // Create smooth, rhythmic animation when voice is active
      const animate = () => {
        setAnimationPhase(prev => prev + 0.1);
        animationRef.current = requestAnimationFrame(animate);
      };
      animationRef.current = requestAnimationFrame(animate);
    } else {
      // Stop animation when voice is inactive
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      setAnimationPhase(0);
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive]);

  // Calculate bounce based on animation phase and amplitude
  const bounceOffset = isActive 
    ? Math.sin(animationPhase) * (20 + amplitude * 30) 
    : 0;

  // Calculate glow intensity based on activity and amplitude
  const glowIntensity = isActive ? 0.6 + amplitude * 0.4 : 0.2;
  
  // Calculate scale based on amplitude
  const scale = isActive ? 1 + amplitude * 0.3 : 1;

  return (
    <div className={`voice-visualizer ${className}`}>
      <div className="visualizer-container">
        {/* Loading circle */}
        {isLoading && (
          <div className="loading-circle">
            <svg className="loading-spinner" viewBox="0 0 50 50">
              <circle
                className="loading-path"
                cx="25"
                cy="25"
                r="20"
                fill="none"
                stroke="rgba(167, 255, 231, 0.8)"
                strokeWidth="0.5"
                strokeLinecap="round"
                strokeDasharray="31.416"
                strokeDashoffset="31.416"
              />
            </svg>
          </div>
        )}
        
        <div 
          className={`voice-sphere ${isActive ? 'active' : ''} ${isLoading ? 'loading' : ''}`}
          style={{
            transform: `translateY(${bounceOffset}px) scale(${scale})`,
            boxShadow: `
              0 0 ${20 + glowIntensity * 40}px rgba(167, 255, 231, ${glowIntensity}),
              0 0 ${40 + glowIntensity * 80}px rgba(167, 255, 231, ${glowIntensity * 0.6}),
              inset 0 0 20px rgba(255, 255, 255, ${glowIntensity * 0.3})
            `,
            background: `
              radial-gradient(
                circle at 30% 30%, 
                rgba(255, 255, 255, ${0.3 + glowIntensity * 0.4}), 
                rgba(44, 207, 125, ${0.8 + glowIntensity * 0.2})
              )
            `
          }}
        />
        
        {/* Secondary glow ring */}
        <div 
          className="glow-ring"
          style={{
            transform: `translate(-50%, -50%) scale(${1 + amplitude * 0.2})`,
            opacity: isActive ? glowIntensity * 0.5 : 0
          }}
        />
      </div>
    </div>
  );
};