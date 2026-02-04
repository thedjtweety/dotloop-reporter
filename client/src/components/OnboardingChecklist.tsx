import { useState, useEffect } from 'react';
import { CheckCircle2, Circle, Zap, TrendingUp, BarChart3, Download } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface ChecklistStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  completed: boolean;
}

export function OnboardingChecklist() {
  const [steps, setSteps] = useState<ChecklistStep[]>([
    {
      id: 'upload',
      title: 'Upload CSV File',
      description: 'Upload your Dotloop export to get started with instant analysis',
      icon: <Zap className="w-5 h-5" />,
      completed: false,
    },
    {
      id: 'dashboard',
      title: 'Review Dashboard',
      description: 'Explore metrics, charts, and key insights from your data',
      icon: <TrendingUp className="w-5 h-5" />,
      completed: false,
    },
    {
      id: 'commission',
      title: 'Assign Commission Plan',
      description: 'Set up and apply commission structures to your transactions',
      icon: <BarChart3 className="w-5 h-5" />,
      completed: false,
    },
    {
      id: 'export',
      title: 'Export Report',
      description: 'Generate and download professional reports for your team',
      icon: <Download className="w-5 h-5" />,
      completed: false,
    },
  ]);

  const [dismissed, setDismissed] = useState(false);

  // Load progress from localStorage on mount
  useEffect(() => {
    const savedProgress = localStorage.getItem('onboarding_progress');
    const savedDismissed = localStorage.getItem('onboarding_dismissed');
    
    if (savedProgress) {
      try {
        const progress = JSON.parse(savedProgress);
        setSteps(prev => prev.map(step => ({
          ...step,
          completed: progress[step.id] || false,
        })));
      } catch (e) {
        console.error('Failed to load onboarding progress', e);
      }
    }

    if (savedDismissed) {
      setDismissed(true);
    }
  }, []);

  // Save progress to localStorage whenever it changes
  useEffect(() => {
    const progress: Record<string, boolean> = {};
    steps.forEach(step => {
      progress[step.id] = step.completed;
    });
    localStorage.setItem('onboarding_progress', JSON.stringify(progress));
  }, [steps]);

  const handleToggleStep = (stepId: string) => {
    setSteps(prev => prev.map(step =>
      step.id === stepId ? { ...step, completed: !step.completed } : step
    ));
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('onboarding_dismissed', 'true');
  };

  const completedCount = steps.filter(s => s.completed).length;
  const progressPercentage = (completedCount / steps.length) * 100;

  if (dismissed) {
    return null;
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-emerald-500/10 to-blue-500/10 border-emerald-500/20 mb-8">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-foreground mb-1">
              Welcome! Let's Get You Started
            </h3>
            <p className="text-sm text-foreground/70">
              Complete these steps to master the Dotloop Reporting Tool
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="text-foreground/50 hover:text-foreground/70 transition-colors"
            aria-label="Dismiss onboarding"
          >
            ✕
          </button>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-foreground/70">Progress</span>
            <span className="font-semibold text-emerald-500">
              {completedCount} of {steps.length} completed
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {steps.map((step) => (
            <button
              key={step.id}
              onClick={() => handleToggleStep(step.id)}
              className="group flex items-start gap-3 p-3 rounded-lg border border-border/50 hover:border-emerald-500/30 hover:bg-card/50 transition-all text-left"
            >
              {/* Checkbox */}
              <div className="flex-shrink-0 mt-0.5">
                {step.completed ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                ) : (
                  <Circle className="w-5 h-5 text-foreground/30 group-hover:text-foreground/50 transition-colors" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-foreground/50 group-hover:text-foreground/70 transition-colors">
                    {step.icon}
                  </span>
                  <h4 className={`font-medium text-sm ${
                    step.completed ? 'text-foreground/50 line-through' : 'text-foreground'
                  }`}>
                    {step.title}
                  </h4>
                </div>
                <p className="text-xs text-foreground/50 mt-1">
                  {step.description}
                </p>
              </div>
            </button>
          ))}
        </div>

        {/* Completion Message */}
        {completedCount === steps.length && (
          <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
            <p className="text-sm text-emerald-600 font-medium">
              🎉 Great job! You've completed all onboarding steps. You're ready to explore advanced features!
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSteps(prev => prev.map(s => ({ ...s, completed: false })))}
            className="text-xs"
          >
            Reset Progress
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDismiss}
            className="text-xs ml-auto"
          >
            Hide for Now
          </Button>
        </div>
      </div>
    </Card>
  );
}
