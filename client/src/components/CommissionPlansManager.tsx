// @ts-nocheck
import { useState, useEffect, useMemo } from 'react';
import { CommissionPlan } from '@/lib/commission';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Save, Edit2, X, Copy, Loader2, Users, History, CalendarDays, GitCompareArrows } from 'lucide-react';
import { Deduction } from '@/lib/commission';
import { SlidingScaleTierManager } from '@/components/SlidingScaleTierManager';
import { trpc } from '@/lib/trpc';
import { useTransactionData } from '@/contexts/TransactionDataContext';
import toast from 'react-hot-toast';
import FullScreenModal from '@/components/FullScreenModal';
import { countAssignedAgentsByPlan } from '@/lib/planAssignmentCounts';

export default function CommissionPlansManager({ createRequest = 0 }: { createRequest?: number }) {
  const { setCommissionData, agentAssignments, allRecords } = useTransactionData();
  const [plans, setPlans] = useState<CommissionPlan[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<Partial<CommissionPlan>>({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [historyPlanId, setHistoryPlanId] = useState<string | null>(null);

  // Fetch plans from database
  const { data: dbPlans, refetch, error: plansError } = trpc.commission.getPlans.useQuery(undefined, {
    retry: false,
  });
  const { data: dbAssignments = [], refetch: refetchAssignments } = trpc.commission.getAssignments.useQuery(undefined, {
    retry: false,
  });
  const savePlanMutation = trpc.commission.savePlan.useMutation();
  const deletePlanMutation = trpc.commission.deletePlan.useMutation();
  const { data: planVersions = [] } = trpc.brokerOperations.listPlanVersions.useQuery();

  useEffect(() => {
    // Use database plans
    if (dbPlans) {
      setPlans(dbPlans);
    }
  }, [dbPlans]);

  const handleSavePlan = async () => {
    if (!currentPlan.name || currentPlan.splitPercentage === undefined) return;

    try {
      setIsSaving(true);
      const newPlan: CommissionPlan = {
        id: currentPlan.id || Math.random().toString(36).substr(2, 9),
        name: currentPlan.name,
        splitPercentage: Number(currentPlan.splitPercentage),
        capAmount: Number(currentPlan.capAmount || 0),
        postCapSplit: Number(currentPlan.postCapSplit || 100),
        royaltyPercentage: Number(currentPlan.royaltyPercentage || 0),
        royaltyCap: Number(currentPlan.royaltyCap || 0),
        deductions: currentPlan.deductions || [],
        useSliding: currentPlan.useSliding || false,
        tiers: currentPlan.tiers || [],
      };

      // Save to database via tRPC
      await savePlanMutation.mutateAsync(newPlan);

      let updatedPlans;
      if (currentPlan.id) {
        updatedPlans = plans.map(p => p.id === currentPlan.id ? newPlan : p);
      } else {
        updatedPlans = [...plans, newPlan];
      }

      setPlans(updatedPlans);
      await refetch();
      // Sync updated plans to global context so all pages see the change immediately
      setCommissionData({ plans: updatedPlans, assignments: agentAssignments });
      setIsDialogOpen(false);
      setCurrentPlan({});
      toast.success('Commission plan saved successfully');
    } catch (error) {
      toast.error(`Failed to save plan: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePlan = async (id: string) => {
    if (confirm('Are you sure you want to delete this plan?')) {
      try {
        setIsSaving(true);
        // Delete from database via tRPC
        await deletePlanMutation.mutateAsync(id);
        
        const updatedPlans = plans.filter(p => p.id !== id);
        setPlans(updatedPlans);
        // Sync updated plans to global context
        setCommissionData({ plans: updatedPlans, assignments: agentAssignments });
        await refetch();
        toast.success('Commission plan deleted successfully');
      } catch (error) {
        toast.error(`Failed to delete plan: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setIsSaving(false);
      }
    }
  };

  const openEditDialog = (plan: CommissionPlan) => {
    setCurrentPlan({ ...plan, deductions: [...(plan.deductions || [])], tiers: [...(plan.tiers || [])] });
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const openCopyDialog = (plan: CommissionPlan) => {
    setCurrentPlan({
      ...plan,
      id: undefined,
      name: `${plan.name} Copy`,
      deductions: (plan.deductions || []).map((deduction) => ({
        ...deduction,
        id: Math.random().toString(36).slice(2, 11),
      })),
      tiers: (plan.tiers || []).map((tier) => ({
        ...tier,
        id: Math.random().toString(36).slice(2, 11),
      })),
    });
    setIsEditing(false);
    setIsDialogOpen(true);
  };

  const addDeduction = () => {
    const newDeduction: Deduction = {
      id: Math.random().toString(36).substr(2, 9),
      name: '',
      amount: 0,
      type: 'fixed',
      frequency: 'per_transaction'
    };
    setCurrentPlan({
      ...currentPlan,
      deductions: [...(currentPlan.deductions || []), newDeduction]
    });
  };

  const updateDeduction = (id: string, field: keyof Deduction, value: any) => {
    const updatedDeductions = (currentPlan.deductions || []).map(d => 
      d.id === id ? { ...d, [field]: value } : d
    );
    setCurrentPlan({ ...currentPlan, deductions: updatedDeductions });
  };

  const removeDeduction = (id: string) => {
    const updatedDeductions = (currentPlan.deductions || []).filter(d => d.id !== id);
    setCurrentPlan({ ...currentPlan, deductions: updatedDeductions });
  };

  const openNewDialog = () => {
    setCurrentPlan({
      splitPercentage: 80,
      capAmount: 18000,
      postCapSplit: 100,
      royaltyPercentage: 0,
      royaltyCap: 0,
      deductions: []
    });
    setIsEditing(false);
    setIsDialogOpen(true);
  };

  useEffect(() => {
    if (createRequest > 0) openNewDialog();
  }, [createRequest]);

  useEffect(() => {
    const refreshCounts = () => void refetchAssignments();
    window.addEventListener('commission-assignment-updated', refreshCounts);
    return () => window.removeEventListener('commission-assignment-updated', refreshCounts);
  }, [refetchAssignments]);

  const currentDataSetAgents = useMemo(() => {
    const names = new Set<string>();
    allRecords.forEach((record) => {
      record.agents?.split(',').forEach((name) => {
        const trimmedName = name.trim();
        if (trimmedName) names.add(trimmedName);
      });
    });
    return names;
  }, [allRecords]);

  const assignedAgentCounts = useMemo(
    () => countAssignedAgentsByPlan(dbAssignments, currentDataSetAgents),
    [dbAssignments, currentDataSetAgents],
  );

  const latestVersionByPlan = useMemo(() => {
    const latest: Record<string, any> = {};
    planVersions.forEach((version: any) => {
      if (!latest[version.planId] || version.versionNumber > latest[version.planId].versionNumber) latest[version.planId] = version;
    });
    return latest;
  }, [planVersions]);
  const historyPlan = plans.find((plan) => plan.id === historyPlanId);
  const historyVersions = planVersions.filter((version: any) => version.planId === historyPlanId);
  const priorPlan = currentPlan.id ? plans.find((plan) => plan.id === currentPlan.id) : undefined;
  const impactedAgents = currentPlan.id ? assignedAgentCounts[currentPlan.id] ?? 0 : 0;
  const splitDelta = priorPlan && currentPlan.splitPercentage !== undefined
    ? Number(currentPlan.splitPercentage) - priorPlan.splitPercentage
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Commission Plans</h3>
          <p className="text-sm text-foreground">Define your brokerage's split structures and caps.</p>
        </div>
        <Button 
          onClick={openNewDialog} 
          className="gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 font-bold px-6 py-2 border-2 border-primary-foreground/20"
        >
          <Plus className="h-4 w-4" /> New Plan
        </Button>
      </div>

      <FullScreenModal
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        title={isEditing ? 'Edit Plan' : 'Create New Plan'}
        subtitle="Configure the split percentage, cap amount, and post-cap rules."
        headerActions={
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => setIsDialogOpen(false)} 
              disabled={isSaving}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSavePlan} 
              disabled={isSaving} 
              className="gap-2"
            >
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {isSaving ? 'Saving...' : 'Save Plan'}
            </Button>
          </div>
        }
      >
        <div className="max-w-2xl mx-auto py-8">
          <div className="grid gap-6 overflow-y-auto max-h-[calc(100vh-200px)] pr-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Plan Name</Label>
              <Input
                id="name"
                value={currentPlan.name || ''}
                onChange={(e) => setCurrentPlan({ ...currentPlan, name: e.target.value })}
                placeholder="e.g. Standard 80/20"
              />
            </div>
            <div className="rounded-lg border border-primary/25 bg-primary/5 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold"><GitCompareArrows className="h-4 w-4 text-primary" /> Change impact preview</div>
              <p className="mt-1 text-xs text-muted-foreground">
                {currentPlan.id
                  ? `${impactedAgents} assigned agent${impactedAgents === 1 ? '' : 's'} will use the next immutable version after this plan is saved.`
                  : 'Saving this new plan creates version 1. It does not affect agents until you assign the plan.'}
              </p>
              {priorPlan && splitDelta !== 0 && <p className="mt-2 text-xs font-medium text-primary">Agent split will change {splitDelta > 0 ? '+' : ''}{splitDelta.toFixed(1)} percentage points from version {latestVersionByPlan[priorPlan.id]?.versionNumber ?? 0}.</p>}
            </div>
            <div className="border-t pt-4">
              <h4 className="mb-3 text-sm font-medium">Version & effective period</h4>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="grid gap-2"><Label htmlFor="lifecycle">Lifecycle</Label><select id="lifecycle" className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={(currentPlan as any).lifecycle || 'active'} onChange={(event) => setCurrentPlan({ ...currentPlan, lifecycle: event.target.value } as any)}><option value="draft">Draft</option><option value="active">Active</option><option value="archived">Archived</option></select></div>
                <div className="grid gap-2"><Label htmlFor="effective-start">Effective start</Label><Input id="effective-start" type="date" value={(currentPlan as any).effectiveStartDate || ''} onChange={(event) => setCurrentPlan({ ...currentPlan, effectiveStartDate: event.target.value } as any)} /></div>
                <div className="grid gap-2"><Label htmlFor="effective-end">Effective end</Label><Input id="effective-end" type="date" value={(currentPlan as any).effectiveEndDate || ''} onChange={(event) => setCurrentPlan({ ...currentPlan, effectiveEndDate: event.target.value } as any)} /></div>
              </div>
              <div className="mt-4 grid gap-2"><Label htmlFor="change-note">Change note</Label><textarea id="change-note" className="min-h-20 rounded-md border border-input bg-background px-3 py-2 text-sm" value={(currentPlan as any).changeNote || ''} onChange={(event) => setCurrentPlan({ ...currentPlan, changeNote: event.target.value } as any)} placeholder="Why is this plan version changing? This note appears in the audit history." /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="split">Agent Split %</Label>
                <Input
                  id="split"
                  type="number"
                  value={currentPlan.splitPercentage}
                  onChange={(e) => setCurrentPlan({ ...currentPlan, splitPercentage: Number(e.target.value) })}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cap">Cap Amount ($)</Label>
                <Input
                  id="cap"
                  type="number"
                  value={currentPlan.capAmount}
                  onChange={(e) => setCurrentPlan({ ...currentPlan, capAmount: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="postCap">Post-Cap Split %</Label>
                <Input
                  id="postCap"
                  type="number"
                  value={currentPlan.postCapSplit}
                  onChange={(e) => setCurrentPlan({ ...currentPlan, postCapSplit: Number(e.target.value) })}
                />
              </div>
            </div>
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium mb-3">Franchise Fees / Royalty (Optional)</h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="royalty">Royalty %</Label>
                  <Input
                    id="royalty"
                    type="number"
                    value={currentPlan.royaltyPercentage}
                    onChange={(e) => setCurrentPlan({ ...currentPlan, royaltyPercentage: Number(e.target.value) })}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="royaltyCap">Royalty Cap ($)</Label>
                  <Input
                    id="royaltyCap"
                    type="number"
                    value={currentPlan.royaltyCap}
                    onChange={(e) => setCurrentPlan({ ...currentPlan, royaltyCap: Number(e.target.value) })}
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <SlidingScaleTierManager
                tiers={currentPlan.tiers || []}
                onTiersChange={(tiers) => setCurrentPlan({ ...currentPlan, tiers })}
                useSliding={currentPlan.useSliding || false}
                onUseSlidingChange={(useSliding) => setCurrentPlan({ ...currentPlan, useSliding })}
              />
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-sm font-medium">Standard Deductions</h4>
                <Button type="button" variant="outline" size="sm" onClick={addDeduction} className="h-7 text-xs">
                  <Plus className="h-3 w-3 mr-1" /> Add Fee
                </Button>
              </div>
              
              <div className="space-y-3">
                {(currentPlan.deductions || []).map((deduction) => (
                  <div key={deduction.id} className="flex gap-2 items-start">
                    <div className="grid gap-1 flex-1">
                      <Input 
                        placeholder="Fee Name (e.g. Tech Fee)" 
                        className="h-8 text-sm"
                        value={deduction.name}
                        onChange={(e) => updateDeduction(deduction.id, 'name', e.target.value)}
                      />
                    </div>
                    <div className="grid gap-1 w-24">
                      <Input 
                        type="number" 
                        placeholder="Amount" 
                        className="h-8 text-sm"
                        value={deduction.amount}
                        onChange={(e) => updateDeduction(deduction.id, 'amount', Number(e.target.value))}
                      />
                    </div>
                    <div className="grid gap-1 w-24">
                       <select 
                          className="flex h-8 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm ring-offset-background placeholder:text-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                          value={deduction.type}
                          onChange={(e) => updateDeduction(deduction.id, 'type', e.target.value)}
                       >
                         <option value="fixed">$ Fixed</option>
                         <option value="percentage">% GCI</option>
                       </select>
                    </div>
                    <Button 
                      type="button" 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-foreground hover:text-destructive"
                      onClick={() => removeDeduction(deduction.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {(currentPlan.deductions || []).length === 0 && (
                  <p className="text-xs text-foreground italic text-center py-2">
                    No deductions configured.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </FullScreenModal>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <Card key={plan.id} className="relative hover:border-primary/50 transition-colors">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex justify-between items-start">
                {plan.name}
                <div className="relative z-10 flex shrink-0 gap-1" aria-label={`${plan.name} actions`}>
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={(event) => { event.stopPropagation(); openEditDialog(plan); }} disabled={isSaving} title={`Edit ${plan.name}`} aria-label={`Edit ${plan.name}`}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={(event) => { event.stopPropagation(); openCopyDialog(plan); }} disabled={isSaving} title={`Copy ${plan.name}`} aria-label={`Copy ${plan.name}`}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8" onClick={(event) => { event.stopPropagation(); setHistoryPlanId(plan.id); }} title={`View ${plan.name} version history`} aria-label={`View ${plan.name} version history`}>
                    <History className="h-4 w-4" />
                  </Button>
                  <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={(event) => { event.stopPropagation(); handleDeletePlan(plan.id); }} disabled={isSaving} title={`Delete ${plan.name}`} aria-label={`Delete ${plan.name}`}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardTitle>
              <CardDescription>
                {plan.splitPercentage}% / {100 - plan.splitPercentage}% Split
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-foreground">Cap Amount:</span>
                  <span className="font-medium">
                    {plan.capAmount > 0 ? `$${plan.capAmount.toLocaleString()}` : 'No Cap'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-foreground">Post-Cap Split:</span>
                  <span className="font-medium">{plan.postCapSplit}%</span>
                </div>
                <div className="flex items-center justify-between rounded-md bg-primary/10 px-2.5 py-2 text-xs font-medium text-foreground">
                  <span className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-primary" />
                    Assigned agents
                  </span>
                  <span aria-label={`${assignedAgentCounts[plan.id] ?? 0} agents assigned to ${plan.name}`}>
                    {assignedAgentCounts[plan.id] ?? 0}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><CalendarDays className="h-3.5 w-3.5" /> Version {latestVersionByPlan[plan.id]?.versionNumber ?? 0}{latestVersionByPlan[plan.id]?.effectiveStartDate ? ` · effective ${latestVersionByPlan[plan.id].effectiveStartDate}` : ' · current rules'}</div>
                {plan.royaltyPercentage ? (
                  <div className="flex justify-between text-xs text-foreground pt-2 border-t">
                    <span>Royalty: {plan.royaltyPercentage}%</span>
                    <span>Cap: ${plan.royaltyCap?.toLocaleString()}</span>
                  </div>
                ) : null}
                {plan.deductions && plan.deductions.length > 0 && (
                  <div className="pt-2 border-t mt-2">
                    <p className="text-xs font-medium text-foreground mb-1">Deductions:</p>
                    <div className="space-y-1">
                      {plan.deductions.map(d => (
                        <div key={d.id} className="flex justify-between text-xs text-foreground">
                          <span>{d.name}</span>
                          <span>{d.type === 'fixed' ? `$${d.amount}` : `${d.amount}%`}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      <FullScreenModal isOpen={Boolean(historyPlan)} onClose={() => setHistoryPlanId(null)} title={`${historyPlan?.name || 'Plan'} history`} subtitle="Each record is an immutable plan configuration used for audit and payout explanation.">
        <div className="mx-auto max-w-3xl space-y-4 py-8">
          {historyVersions.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-sm text-muted-foreground">No version history exists yet. The next save of this plan will create its first immutable version.</div>
          ) : historyVersions.map((version: any) => (
            <Card key={version.id}><CardContent className="p-5"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="font-semibold">Version {version.versionNumber} · {version.lifecycle}</p><p className="mt-1 text-sm text-muted-foreground">{version.effectiveStartDate || 'Immediately'}{version.effectiveEndDate ? ` through ${version.effectiveEndDate}` : ''} · saved {new Date(version.createdAt).toLocaleString()}</p>{version.changeNote && <p className="mt-3 text-sm">{version.changeNote}</p>}</div><div className="rounded-md bg-muted px-3 py-2 text-right text-xs"><div>{version.planSnapshot.splitPercentage}% agent split</div><div>${Number(version.planSnapshot.capAmount || 0).toLocaleString()} cap</div></div></div></CardContent></Card>
          ))}
        </div>
      </FullScreenModal>
    </div>
  );
}
