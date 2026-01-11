/**
 * useOnboardingTour Hook
 * Manages onboarding tour state and localStorage persistence
 */

import { useState, useEffect } from 'react';
import { TourStep } from '@/components/OnboardingTour';

const TOUR_COMPLETED_KEY = 'dotloop-tour-completed';

export function useOnboardingTour() {
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    // Check if user has completed the tour
    const tourCompleted = localStorage.getItem(TOUR_COMPLETED_KEY);
    if (!tourCompleted) {
      // Delay showing tour slightly to let page load
      setTimeout(() => setShowTour(true), 1000);
    }
  }, []);

  const completeTour = () => {
    localStorage.setItem(TOUR_COMPLETED_KEY, 'true');
    setShowTour(false);
  };

  const skipTour = () => {
    localStorage.setItem(TOUR_COMPLETED_KEY, 'true');
    setShowTour(false);
  };

  const resetTour = () => {
    localStorage.removeItem(TOUR_COMPLETED_KEY);
    setShowTour(true);
  };

  return {
    showTour,
    completeTour,
    skipTour,
    resetTour,
  };
}

// Define tour steps for the upload screen
export const uploadTourSteps: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Dotloop Reporting Tool! 👋',
    description: 'Transform your Dotloop data into actionable insights. Let\'s show you how to get started.',
    target: 'main',
    position: 'bottom',
    highlight: false,
  },
  {
    id: 'upload',
    title: 'Upload Your CSV',
    description: 'Drag and drop your Dotloop export CSV file here, or click to browse. We\'ll validate and process it automatically.',
    target: '[data-tour="upload-zone"]',
    position: 'top',
    highlight: true,
  },
  {
    id: 'demo',
    title: 'Try Demo Mode',
    description: 'Not ready to upload? Click "Try Demo" to explore the dashboard with sample data and see all features in action.',
    target: '[data-tour="demo-button"]',
    position: 'left',
    highlight: true,
  },
];

// Define tour steps for the dashboard
export const dashboardTourSteps: TourStep[] = [
  {
    id: 'metrics',
    title: 'Key Metrics at a Glance',
    description: 'View your most important metrics here: total transactions, sales volume, closing rate, and average days to close. Click any metric to drill down.',
    target: '[data-tour="metrics"]',
    position: 'bottom',
    highlight: true,
  },
  {
    id: 'leaderboard',
    title: 'Agent Performance',
    description: 'Track agent performance with the leaderboard. Sort by any column, export individual reports, or view commission breakdowns.',
    target: '[data-tour="leaderboard"]',
    position: 'top',
    highlight: true,
  },
  {
    id: 'charts',
    title: 'Interactive Charts',
    description: 'Explore your data through various charts. Switch between tabs to see pipeline, timeline, lead sources, and more. Click any data point to drill down.',
    target: '[data-tour="charts"]',
    position: 'top',
    highlight: true,
  },
  {
    id: 'complete',
    title: 'You\'re All Set! 🎉',
    description: 'Explore the dashboard, export reports, and discover insights in your data. Upload new files anytime to update your analytics.',
    target: 'main',
    position: 'bottom',
    highlight: false,
  },
];
