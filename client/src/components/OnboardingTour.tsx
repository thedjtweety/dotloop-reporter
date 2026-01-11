/**
 * OnboardingTour Component
 * Interactive first-time user guide with tooltips
 */

import { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export interface TourStep {
  id: string;
  title: string;
  description: string;
  target: string; // CSS selector for the target element
  position?: 'top' | 'bottom' | 'left' | 'right';
  highlight?: boolean;
}

interface OnboardingTourProps {
  steps: TourStep[];
  onComplete: () => void;
  onSkip: () => void;
}

export default function OnboardingTour({ steps, onComplete, onSkip }: OnboardingTourProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [isVisible, setIsVisible] = useState(true);

  const step = steps[currentStep];

  useEffect(() => {
    if (!step) return;

    const updatePosition = () => {
      const targetElement = document.querySelector(step.target);
      if (!targetElement) return;

      const rect = targetElement.getBoundingClientRect();
      const position = step.position || 'bottom';

      let top = 0;
      let left = 0;

      switch (position) {
        case 'top':
          top = rect.top - 20;
          left = rect.left + rect.width / 2;
          break;
        case 'bottom':
          top = rect.bottom + 20;
          left = rect.left + rect.width / 2;
          break;
        case 'left':
          top = rect.top + rect.height / 2;
          left = rect.left - 20;
          break;
        case 'right':
          top = rect.top + rect.height / 2;
          left = rect.right + 20;
          break;
      }

      setTooltipPosition({ top, left });

      // Add highlight to target element
      if (step.highlight) {
        targetElement.classList.add('tour-highlight');
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
      
      // Remove highlight
      const targetElement = document.querySelector(step.target);
      if (targetElement) {
        targetElement.classList.remove('tour-highlight');
      }
    };
  }, [currentStep, step]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    setIsVisible(false);
    onComplete();
  };

  const handleSkip = () => {
    setIsVisible(false);
    onSkip();
  };

  if (!isVisible || !step) return null;

  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-[9998] animate-in fade-in duration-300" />

      {/* Tooltip */}
      <Card
        className="fixed z-[9999] w-80 p-6 shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-300"
        style={{
          top: `${tooltipPosition.top}px`,
          left: `${tooltipPosition.left}px`,
          transform: 'translate(-50%, 0)',
        }}
      >
        {/* Close button */}
        <button
          onClick={handleSkip}
          className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Progress indicator */}
        <div className="mb-4">
          <div className="flex gap-1">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-1 flex-1 rounded-full transition-colors ${
                  index <= currentStep ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Step {currentStep + 1} of {steps.length}
          </p>
        </div>

        {/* Content */}
        <h3 className="text-lg font-display font-bold mb-2">{step.title}</h3>
        <p className="text-sm text-muted-foreground mb-6">{step.description}</p>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkip}
            className="text-muted-foreground"
          >
            Skip Tour
          </Button>

          <div className="flex gap-2">
            {!isFirstStep && (
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevious}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
            )}
            <Button
              size="sm"
              onClick={handleNext}
            >
              {isLastStep ? 'Finish' : 'Next'}
              {!isLastStep && <ChevronRight className="w-4 h-4 ml-1" />}
            </Button>
          </div>
        </div>
      </Card>

      {/* Highlight styles */}
      <style>{`
        .tour-highlight {
          position: relative;
          z-index: 9999;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5), 0 0 0 9999px rgba(0, 0, 0, 0.5);
          border-radius: 0.5rem;
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }

        @keyframes pulse {
          0%, 100% {
            box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.5), 0 0 0 9999px rgba(0, 0, 0, 0.5);
          }
          50% {
            box-shadow: 0 0 0 8px rgba(59, 130, 246, 0.3), 0 0 0 9999px rgba(0, 0, 0, 0.5);
          }
        }
      `}</style>
    </>
  );
}
