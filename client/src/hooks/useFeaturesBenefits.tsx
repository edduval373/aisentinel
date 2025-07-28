import { useState, useEffect } from "react";

export function useFeaturesBenefits(isDemoMode: boolean = false) {
  const [showDialog, setShowDialog] = useState(false);
  const [hasShownOnce, setHasShownOnce] = useState(false);

  // Check if dialog has been shown before
  useEffect(() => {
    if (isDemoMode) {
      // For demo users, always show the features dialog after a short delay
      // Clear any previous session storage to ensure it shows every time
      const sessionKey = 'ai-sentinel-demo-features-shown-session';
      sessionStorage.removeItem(sessionKey);
      
      const timer = setTimeout(() => {
        setShowDialog(true);
        setHasShownOnce(true);
      }, 2000); // Show after 2 seconds for demo users

      return () => clearTimeout(timer);
    } else {
      // For regular users, NEVER show automatically
      // The dialog should only be shown manually via the button click
      setHasShownOnce(true); // Mark as shown to prevent auto-display
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