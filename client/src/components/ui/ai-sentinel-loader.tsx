import React from 'react';

interface AISentinelLoaderProps {
  size?: number;
  message?: string;
  showMessage?: boolean;
}

export function AISentinelLoader({ 
  size = 20, 
  message = "Loading...", 
  showMessage = true 
}: AISentinelLoaderProps) {
  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'center', 
      gap: '12px', 
      padding: '20px' 
    }}>
      <div style={{
        width: `${size}px`,
        height: `${size}px`,
        animation: 'spin 1s linear infinite'
      }}>
        <img 
          src="/ai-sentinel-logo.png" 
          alt="AI Sentinel Loading..." 
          style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'contain',
            filter: 'brightness(1.2) saturate(1.4) contrast(1.1)'
          }} 
        />
      </div>
      {showMessage && (
        <span style={{ 
          color: '#6b7280', 
          fontSize: '16px',
          fontWeight: '500'
        }}>
          {message}
        </span>
      )}
    </div>
  );
}