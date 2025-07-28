import { useState, useEffect } from "react";

export function useFeaturesBenefits(isDemoMode: boolean = false) {
  const [showDialog, setShowDialog] = useState(false);
  const [hasShownOnce, setHasShownOnce] = useState(false);

  // Check if dialog has been shown before
  useEffect(() => {
    if (isDemoMode) {
      // For demo users, check if they've seen the features dialog before
      const demoFeaturesShown = localStorage.getItem('ai-sentinel-demo-features-shown');
      if (demoFeaturesShown === 'true') {
        setHasShownOnce(true);
        // Don't show the dialog again for this demo session
      } else {
        // Show automatically for first-time demo users only
        const timer = setTimeout(() => {
          setShowDialog(true);
          setHasShownOnce(true);
          localStorage.setItem('ai-sentinel-demo-features-shown', 'true');
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