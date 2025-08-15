import "./Splash.css"

import React, { useState, useEffect } from 'react';

// Main Splash Component
export const Splash: React.FC = () => {
    // The full text to be typed out
    const productName = "RouteThis";
    // State to hold the currently visible text
    const [typedText, setTypedText] = useState('');
    // State to control splash visibility and fade
    const [isVisible, setIsVisible] = useState(true);
    const [isFading, setIsFading] = useState(false);

    useEffect(() => {
        // Ensure we only run the typing effect once on mount
        if (typedText.length < productName.length) {
            const totalDuration = 1000; // Total duration for the typing animation in ms
            const interval = totalDuration / productName.length;

            const timer = setTimeout(() => {
                setTypedText(productName.slice(0, typedText.length + 1));
            }, interval);

            // Cleanup the timer on component unmount
            return () => clearTimeout(timer);
        }
    }, [typedText]); // Rerun the effect when typedText changes

    // Handle splash fade and removal timing
    useEffect(() => {
        // Start fade after 4 seconds
        const fadeTimer = setTimeout(() => {
            setIsFading(true);
        }, 2500);

        // Remove component after 5 seconds
        const removeTimer = setTimeout(() => {
            setIsVisible(false);
        }, 4000);

        // Cleanup timers on unmount
        return () => {
            clearTimeout(fadeTimer);
            clearTimeout(removeTimer);
        };
    }, []); // Run only once on mount

    // SVG circle properties for animation
    const radius = 80;
    const circumference = 2 * Math.PI * radius;

    // Don't render if not visible
    if (!isVisible) {
        return null;
    }

    return (
        <div className={`splash-wrapper ${isFading ? 'fading' : ''}`} style={{position:"absolute", top: 0, left: 0, right: 0, bottom: 0, zIndex:"999"}}>
            
            <style>
                {`:root { --circumference: ${circumference}; }`}
            </style>

            {/* Main container */}
            <main className="splash-container">
                
                {/* Logo Placeholder - Animated Circle */}
                <div className="logo-container">
                    <svg 
                        className="logo-svg" 
                        viewBox="0 0 200 200"
                    >
                        {/* Background circle (optional, for a subtle base) */}
                        <circle
                            cx="100"
                            cy="100"
                            r={radius}
                            className="background-circle"
                        />
                        {/* Animated foreground circle */}
                        <circle
                            className="animated-circle"
                            cx="100"
                            cy="100"
                            r={radius}
                            strokeDasharray={circumference}
                            strokeDashoffset={circumference}
                        />
                    </svg>
                    {/* RouteThis Logo */}
                    <img 
                        src="/RT/RouteThis_logo_wht.png" 
                        alt="RouteThis Logo" 
                        className="center-logo"
                    />
                </div>

                {/* Typing Animation Text */}
                <div className="text-container">
                    <p className="typing-text">
                        {typedText}
                        {/* Blinking cursor effect */}
                        {typedText.length < productName.length && (
                             <span className="cursor-blink">|</span>
                        )}
                    </p>
                </div>
            </main>

        </div>
    );
};

