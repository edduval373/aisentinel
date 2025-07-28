import { useState, useEffect } from "react";

export function useFeaturesBenefits(isDemoMode: boolean = false) {
  const [showDialog, setShowDialog] = useState(false);
  const [hasShownOnce, setHasShownOnce] = useState(false);

  // Check if dialog has been shown before
  useEffect(() => {
    if (isDemoMode) {
      // Check if Features & Benefits has been shown in this demo session
      const sessionKey = 'ai-sentinel-demo-features-shown-session';
      const hasShownThisSession = sessionStorage.getItem(sessionKey);
      
      if (!hasShownThisSession) {
        // For demo users, show the features dialog after a short delay on first visit
        const timer = setTimeout(() => {
          setShowDialog(true);
          setHasShownOnce(true);
          // Mark as shown for this session only
          sessionStorage.setItem(sessionKey, 'true');
        }, 2000); // Show after 2 seconds for demo users

        return () => clearTimeout(timer);
      }
    } else {
      // For regular users, check localStorage
      const hasShown = localStorage.getItem('ai-sentinel-features-shown');
      if (hasShown === 'true') {
        setHasShownOnce(true);
      } else {
        // Show automatically for first-time users
        const timer = setTimeout(() => {
          setShowDialog(true);
          setHasShownOnce(true);
          localStorage.setItem('ai-sentinel-features-shown', 'true');
        }, 3000); // Show after 3 seconds

        return () => clearTimeout(timer);
      }
    }
  }, [isDemoMode]);

  const openDialog = () => {
    setShowDialog(true);
  };

  const closeDialog = () => {
    setShowDialog(false);
  };

  return {
    showDialog,
    hasShownOnce,
    openDialog,
    closeDialog
  };
}