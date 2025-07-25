import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

interface TutorialArrowProps {
  targetId: string;
  message: string;
  onComplete: () => void;
}

export default function TutorialArrow({ targetId, message, onComplete }: TutorialArrowProps) {
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updatePosition = () => {
      const targetElement = document.getElementById(targetId);
      if (targetElement) {
        const rect = targetElement.getBoundingClientRect();
        setPosition({
          top: rect.bottom + 10,
          left: rect.left + rect.width / 2 - 100
        });
        setIsVisible(true);
      }
    };

    // Initial position update
    updatePosition();

    // Update position on resize
    window.addEventListener('resize', updatePosition);
    
    // Clean up
    return () => {
      window.removeEventListener('resize', updatePosition);
    };
  }, [targetId]);

  if (!isVisible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: `${position.top}px`,
        left: `${position.left}px`,
        zIndex: 1000,
        pointerEvents: 'none',
        transition: 'all 0.3s ease'
      }}
    >
      {/* Arrow pointing up */}
      <div
        style={{
          width: 0,
          height: 0,
          borderLeft: '15px solid transparent',
          borderRight: '15px solid transparent',
          borderBottom: '20px solid #3b82f6',
          margin: '0 auto 5px',
          animation: 'bounce 2s infinite'
        }}
      />
      
      {/* Message box */}
      <div
        style={{
          backgroundColor: '#3b82f6',
          color: 'white',
          padding: '8px 16px',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: 600,
          whiteSpace: 'nowrap',
          boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
          textAlign: 'center'
        }}
      >
        {message}
      </div>

      <style>{`
        @keyframes bounce {
          0%, 20%, 50%, 80%, 100% {
            transform: translateY(0);
          }
          40% {
            transform: translateY(-10px);
          }
          60% {
            transform: translateY(-5px);
          }
        }
      `}</style>
    </div>
  );
}