import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';

const TUTORIAL_STORAGE_KEY = 'ai-sentinel-tutorial-completed';

export function useTutorial() {
  const { user } = useAuth();
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    // Only show tutorial for demo users (role level 0)
    const isDemoUser = user?.roleLevel === 0;
    
    if (isDemoUser) {
      // Check if tutorial has been completed before
      const tutorialCompleted = localStorage.getItem(TUTORIAL_STORAGE_KEY);
      
      if (!tutorialCompleted) {
        // Wait a moment for the page to load, then show tutorial
        const timeout = setTimeout(() => {
          setShowTutorial(true);
        }, 1000);
        
        return () => clearTimeout(timeout);
      }
    }
  }, [user]);

  const completeTutorial = () => {
    setShowTutorial(false);
    localStorage.setItem(TUTORIAL_STORAGE_KEY, 'true');
  };

  return {
    showTutorial,
    completeTutorial
  };
}