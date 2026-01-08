import { useState, useEffect } from 'react';
import { CommissionPlan, getCommissionPlans, saveCommissionPlans } from '@/lib/commission';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Save, Edit2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function CommissionPlansManager() {
  const [plans, setPlans] = useState<CommissionPlan[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<Partial<CommissionPlan>>({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    setPlans(getCommissionPlans());
  }, []);

  const handleSavePlan = () => {
    if (!currentPlan.name || currentPlan.splitPercentage === undefined) return;

    const newPlan: CommissionPlan = {
      id: currentPlan.id || Math.random().toString(36).substr(2, 9),
      name: currentPlan.name,
      splitPercentage: Number(currentPlan.splitPercentage),
      capAmount: Number(currentPlan.capAmount || 0),
      postCapSplit: Number(currentPlan.postCapSplit || 100),
      royaltyPercentage: Number(currentPlan.royaltyPercentage || 0),
      royaltyCap: Number(currentPlan.royaltyCap || 0),
    };

    let updatedPlans;
    if (currentPlan.id) {
      updatedPlans = plans.map(p => p.id === currentPlan.id ? newPlan : p);
    } else {
      updatedPlans = [...plans, newPlan];
    }

    setPlans(updatedPlans);
    saveCommissionPlans(updatedPlans);
    setIsDialogOpen(false);
    setCurrentPlan({});
  };

  const handleDeletePlan = (id: string) => {
    if (confirm('Are you sure you want to delete this plan?')) {
      const updatedPlans = plans.filter(p => p.id !== id);
      setPlans(updatedPlans);
      saveCommissionPlans(updatedPlans);
    }
  };

  const openEditDialog = (plan: CommissionPlan) => {
    setCurrentPlan(plan);
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const openNewDialog = () => {
    setCurrentPlan({
      splitPercentage: 80,
      capAmount: 18000,
      postCapSplit: 100,
      royaltyPercentage: 0,
      royaltyCap: 0
    });
    setIsEditing(false);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Commission Plans</h3>
          <p className="text-sm text-muted-foreground">Define your brokerage's split structures and caps.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNewDialog} className="gap-2">
              <Plus className="h-4 w-4" /> Add Plan
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{isEditing ? 'Edit Plan' : 'Create New Plan'}</DialogTitle>
              <DialogDescription>
                Configure the split percentage, cap amount, and post-cap rules.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Plan Name</Label>
                <Input
                  id="name"
                  value={currentPlan.name || ''}
                  onChange={(e) => setCurrentPlan({ ...currentPlan, name: e.target.value })}
                  placeholder="e.g. Standard 80/20"
                />
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
              <div className="border-t pt-4 mt-2">
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
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={handleSavePlan}>Save Plan</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <Card key={plan.id} className="relative group hover:border-primary/50 transition-colors">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex justify-between items-start">
                {plan.name}
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(plan)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => handleDeletePlan(plan.id)}>
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
                  <span className="text-muted-foreground">Cap Amount:</span>
                  <span className="font-medium">
                    {plan.capAmount > 0 ? `$${plan.capAmount.toLocaleString()}` : 'No Cap'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Post-Cap Split:</span>
                  <span className="font-medium">{plan.postCapSplit}%</span>
                </div>
                {plan.royaltyPercentage ? (
                  <div className="flex justify-between text-xs text-muted-foreground pt-2 border-t">
                    <span>Royalty: {plan.royaltyPercentage}%</span>
                    <span>Cap: ${plan.royaltyCap?.toLocaleString()}</span>
                  </div>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
