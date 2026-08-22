import { useState } from 'react';
import { ArrowRight, BarChart3, CheckCircle2, ChevronRight, ClipboardCheck, FileText, PlayCircle, Share2, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  BrokerQuickStartState,
  BrokerWorkflowId,
  hasQuickAccess,
  readBrokerQuickStartState,
  writeBrokerQuickStartState,
} from '@/lib/brokerQuickStart';

type WorkflowStep = {
  title: string;
  detail: string;
  actionLabel: string;
  onAction: () => void;
};

type BrokerQuickStartProps = {
  agentCount: number;
  transactionCount: number;
  onNavigate: (path: string) => void;
  onOpenHealth: () => void;
};

type WorkflowDefinition = {
  id: BrokerWorkflowId;
  eyebrow: string;
  title: string;
  description: string;
  quickLabel: string;
  icon: typeof Share2;
  iconClassName: string;
};

const WORKFLOWS: WorkflowDefinition[] = [
  {
    id: 'share-metrics',
    eyebrow: 'Agent delivery',
    title: 'Calculate & share agent metrics',
    description: 'Apply plans, review each agent’s results, and send private performance links.',
    quickLabel: 'Open sharing workspace',
    icon: Share2,
    iconClassName: 'bg-emerald-500/15 text-emerald-500',
  },
  {
    id: 'brokerage-health',
    eyebrow: 'Leadership view',
    title: 'Review brokerage health',
    description: 'Scope pipeline, closings, volume, data quality, and the next operational priorities.',
    quickLabel: 'View health snapshot',
    icon: BarChart3,
    iconClassName: 'bg-blue-500/15 text-blue-500',
  },
  {
    id: 'create-cda',
    eyebrow: 'Closing operations',
    title: 'Create a commission-aware CDA',
    description: 'Start from a transaction, confirm its commission plan, and produce a closing disclosure.',
    quickLabel: 'Open CDA Builder',
    icon: FileText,
    iconClassName: 'bg-violet-500/15 text-violet-500',
  },
];

export default function BrokerQuickStart({ agentCount, transactionCount, onNavigate, onOpenHealth }: BrokerQuickStartProps) {
  const [progress, setProgress] = useState<BrokerQuickStartState>(() =>
    readBrokerQuickStartState(typeof window === 'undefined' ? null : window.localStorage),
  );
  const [activeWorkflowId, setActiveWorkflowId] = useState<BrokerWorkflowId | null>(null);

  const persist = (next: BrokerQuickStartState) => {
    setProgress(next);
    writeBrokerQuickStartState(typeof window === 'undefined' ? null : window.localStorage, next);
  };

  const getSteps = (workflowId: BrokerWorkflowId): WorkflowStep[] => {
    switch (workflowId) {
      case 'share-metrics':
        return [
          {
            title: 'Review the agents in this data set',
            detail: `${agentCount || 'Your'} agents and ${transactionCount.toLocaleString()} transactions are ready for reporting. Review the leaderboard before delivery.`,
            actionLabel: 'Open Agent Leaderboard',
            onAction: () => onNavigate('/agents'),
          },
          {
            title: 'Apply the right commission plans',
            detail: 'Create or update plans, then assign them to the appropriate agents. Calculations update from the active data set.',
            actionLabel: 'Open Commission Management',
            onAction: () => onNavigate('/commission'),
          },
          {
            title: 'Create private agent links',
            detail: 'Prepare the current data set, choose an agent and recipient email, then create a revocable private link with delivery tracking.',
            actionLabel: 'Open Sharing Workspace',
            onAction: () => onNavigate('/preview-agent'),
          },
        ];
      case 'brokerage-health':
        return [
          {
            title: 'Start with the health snapshot',
            detail: 'Use the headline metrics to scope transaction volume, sales volume, closing rate, and current pipeline at a glance.',
            actionLabel: 'View Health Snapshot',
            onAction: onOpenHealth,
          },
          {
            title: 'Check data quality before acting',
            detail: 'Review the data-quality guidance when a field is incomplete so you know which conclusions need a follow-up export.',
            actionLabel: 'Review Dashboard Health',
            onAction: onOpenHealth,
          },
          {
            title: 'Turn the view into next steps',
            detail: 'Use trends and pipeline detail to prioritize active deals, contracts, closed production, and coaching opportunities.',
            actionLabel: 'Explore Trends',
            onAction: () => onNavigate('/trends'),
          },
        ];
      case 'create-cda':
        return [
          {
            title: 'Choose the transaction',
            detail: 'Select an active data-set transaction in the CDA Builder to prefill its property and closing information.',
            actionLabel: 'Open CDA Builder',
            onAction: () => onNavigate('/cda-builder'),
          },
          {
            title: 'Confirm the applied commission plan',
            detail: 'Verify the agent’s plan, split, cap progress, and company dollar before preparing the final disbursement.',
            actionLabel: 'Review Commission Plans',
            onAction: () => onNavigate('/commission'),
          },
          {
            title: 'Preview and produce the CDA',
            detail: 'Use the built-in waterfall preview to check the calculation, then generate the CDA when the closing details are ready.',
            actionLabel: 'Return to CDA Builder',
            onAction: () => onNavigate('/cda-builder'),
          },
        ];
    }
  };

  const activeWorkflow = WORKFLOWS.find((workflow) => workflow.id === activeWorkflowId) ?? null;
  const activeSteps = activeWorkflowId ? getSteps(activeWorkflowId) : [];
  const activeProgress = activeWorkflowId ? progress[activeWorkflowId] : null;
  const activeStepIndex = activeProgress ? Math.min(activeProgress.lastStep, Math.max(activeSteps.length - 1, 0)) : 0;
  const activeStep = activeSteps[activeStepIndex];

  const quickAction = (workflowId: BrokerWorkflowId) => {
    if (workflowId === 'share-metrics') onNavigate('/preview-agent');
    if (workflowId === 'brokerage-health') onOpenHealth();
    if (workflowId === 'create-cda') onNavigate('/cda-builder');
  };

  const startWorkflow = (workflowId: BrokerWorkflowId) => {
    if (hasQuickAccess(progress[workflowId])) {
      quickAction(workflowId);
      return;
    }
    setActiveWorkflowId(workflowId);
  };

  const updateActiveProgress = (changes: Partial<BrokerQuickStartState[BrokerWorkflowId]>) => {
    if (!activeWorkflowId) return;
    persist({
      ...progress,
      [activeWorkflowId]: { ...progress[activeWorkflowId], ...changes },
    });
  };

  const runActiveStep = () => {
    if (!activeWorkflowId || !activeStep) return;
    updateActiveProgress({ lastStep: activeStepIndex });
    setActiveWorkflowId(null);
    activeStep.onAction();
  };

  const moveStep = (direction: -1 | 1) => {
    if (!activeWorkflowId) return;
    const nextStep = Math.max(0, Math.min(activeStepIndex + direction, activeSteps.length - 1));
    updateActiveProgress({ lastStep: nextStep });
  };

  const finishWorkflow = () => {
    if (!activeWorkflowId) return;
    updateActiveProgress({ completed: true, skipped: false, lastStep: Math.max(activeSteps.length - 1, 0) });
    setActiveWorkflowId(null);
  };

  const skipTutorial = () => {
    if (!activeWorkflowId) return;
    const workflowId = activeWorkflowId;
    updateActiveProgress({ skipped: true });
    setActiveWorkflowId(null);
    quickAction(workflowId);
  };

  return (
    <section aria-labelledby="broker-quick-start-title" className="mb-10 overflow-hidden rounded-2xl border border-primary/25 bg-card shadow-sm">
      <div className="flex flex-col gap-4 border-b border-border bg-gradient-to-r from-primary/12 via-primary/5 to-transparent px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">Broker quick-start</p>
            <h2 id="broker-quick-start-title" className="mt-1 text-xl font-semibold text-foreground">Complete your most important broker tasks</h2>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Guided the first time. Direct access after that.</p>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-border bg-background/70 px-3 py-2 text-xs text-muted-foreground">
          <Users className="h-4 w-4 text-primary" />
          <span>{agentCount} agents · {transactionCount.toLocaleString()} transactions in view</span>
        </div>
      </div>

      <div className="grid gap-4 p-5 md:grid-cols-3 sm:p-6">
        {WORKFLOWS.map((workflow) => {
          const Icon = workflow.icon;
          const quickAccess = hasQuickAccess(progress[workflow.id]);
          return (
            <Card key={workflow.id} className="group flex min-h-[250px] flex-col border-border bg-background/45 p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/45 hover:shadow-md">
              <div className="flex items-start justify-between gap-3">
                <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${workflow.iconClassName}`}>
                  <Icon className="h-5 w-5" />
                </div>
                {quickAccess ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/12 px-2.5 py-1 text-xs font-medium text-emerald-600 dark:text-emerald-400"><CheckCircle2 className="h-3.5 w-3.5" /> Quick access</span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"><PlayCircle className="h-3.5 w-3.5" /> Guided</span>
                )}
              </div>
              <p className="mt-5 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">{workflow.eyebrow}</p>
              <h3 className="mt-2 text-lg font-semibold leading-snug text-foreground">{workflow.title}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{workflow.description}</p>
              <Button className="mt-5 w-full justify-between" onClick={() => startWorkflow(workflow.id)}>
                <span>{quickAccess ? workflow.quickLabel : 'Start guided workflow'}</span>
                {quickAccess ? <ArrowRight className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
              {quickAccess && (
                <button type="button" className="mt-3 text-center text-xs font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline" onClick={() => setActiveWorkflowId(workflow.id)}>
                  Review the guided steps again
                </button>
              )}
            </Card>
          );
        })}
      </div>

      <Dialog open={Boolean(activeWorkflow)} onOpenChange={(open) => !open && setActiveWorkflowId(null)}>
        <DialogContent className="max-w-2xl">
          {activeWorkflow && activeStep && activeProgress && (
            <>
              <DialogHeader>
                <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-primary"><ClipboardCheck className="h-4 w-4" /> Guided broker workflow</div>
                <DialogTitle>{activeWorkflow.title}</DialogTitle>
                <DialogDescription>{activeWorkflow.description}</DialogDescription>
              </DialogHeader>

              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                {activeSteps.map((step, index) => {
                  const isCurrent = index === activeStepIndex;
                  const isComplete = index < activeStepIndex || activeProgress.completed;
                  return (
                    <button key={step.title} type="button" onClick={() => updateActiveProgress({ lastStep: index })} className={`rounded-lg border p-3 text-left transition-colors ${isCurrent ? 'border-primary bg-primary/8' : 'border-border bg-muted/25 hover:bg-muted/45'}`}>
                      <div className="flex items-center gap-2 text-xs font-medium"><span className={`flex h-5 w-5 items-center justify-center rounded-full ${isComplete ? 'bg-emerald-500 text-white' : isCurrent ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>{isComplete ? <CheckCircle2 className="h-3.5 w-3.5" /> : index + 1}</span><span className={isCurrent ? 'text-foreground' : 'text-muted-foreground'}>Step {index + 1}</span></div>
                      <p className="mt-2 text-xs font-medium leading-snug text-foreground">{step.title}</p>
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 rounded-xl border border-border bg-muted/30 p-5">
                <p className="text-sm font-semibold text-foreground">{activeStep.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{activeStep.detail}</p>
                <Button className="mt-5" onClick={runActiveStep}><ArrowRight className="mr-2 h-4 w-4" />{activeStep.actionLabel}</Button>
              </div>

              <DialogFooter className="mt-2 flex-col-reverse gap-3 sm:flex-row sm:justify-between">
                <Button variant="ghost" onClick={skipTutorial}>Skip tutorial — use quick access</Button>
                <div className="flex gap-2">
                  <Button variant="outline" disabled={activeStepIndex === 0} onClick={() => moveStep(-1)}>Back</Button>
                  {activeStepIndex < activeSteps.length - 1 ? (
                    <Button onClick={() => moveStep(1)}>Next step</Button>
                  ) : (
                    <Button onClick={finishWorkflow}><CheckCircle2 className="mr-2 h-4 w-4" />Finish &amp; save quick access</Button>
                  )}
                </div>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
