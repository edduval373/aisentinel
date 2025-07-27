import { useState, useEffect } from "react";

export function useFeaturesBenefits() {
  const [showDialog, setShowDialog] = useState(false);
  const [hasShownOnce, setHasShownOnce] = useState(false);

  // Check if dialog has been shown before
  useEffect(() => {
    const hasShown = localStorage.getItem('ai-sentinel-features-shown');
    if (hasShown === 'true') {
      setHasShownOnce(true);
    } else {
      // Show automatically for first-time demo users
      const timer = setTimeout(() => {
        setShowDialog(true);
        setHasShownOnce(true);
        localStorage.setItem('ai-sentinel-features-shown', 'true');
      }, 3000); // Show after 3 seconds

      return () => clearTimeout(timer);
    }
  }, []);

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