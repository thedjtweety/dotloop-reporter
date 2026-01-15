/**
 * Commission Management Panel
 * 
 * Dedicated card/panel for commission management features
 * Appears below Agent Performance Leaderboard on Analytics page
 * Contains: Plans, Teams, Assignments, and Automatic Calculation
 */

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DollarSign, Users, UserCheck, Calculator } from 'lucide-react';
import CommissionPlansManager from '@/components/CommissionPlansManager';
import TeamManager from '@/components/TeamManager';
import AgentAssignment from '@/components/AgentAssignment';
import CommissionCalculator from '@/components/CommissionCalculator';
import type { DotloopRecord } from '@/lib/csvParser';

interface CommissionManagementPanelProps {
  records: DotloopRecord[];
  hasData: boolean;
}

export default function CommissionManagementPanel({ records, hasData }: CommissionManagementPanelProps) {
  const [activeTab, setActiveTab] = useState('plans');

  return (
    <Card className="p-6 border-primary/20">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <DollarSign className="h-5 w-5 text-primary" />
          </div>
          <h3 className="text-lg font-semibold">Commission Management</h3>
        </div>
        <p className="text-sm text-muted-foreground">
          Configure commission plans, manage teams, assign agents, and calculate commissions automatically.
        </p>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 mb-6 h-auto">
          <TabsTrigger value="plans" className="gap-2">
            <DollarSign className="h-4 w-4" />
            <span className="hidden sm:inline">Plans</span>
          </TabsTrigger>
          <TabsTrigger value="teams" className="gap-2">
            <Users className="h-4 w-4" />
            <span className="hidden sm:inline">Teams</span>
          </TabsTrigger>
          <TabsTrigger value="assignments" className="gap-2">
            <UserCheck className="h-4 w-4" />
            <span className="hidden sm:inline">Agents</span>
          </TabsTrigger>
          <TabsTrigger value="calculate" className="gap-2">
            <Calculator className="h-4 w-4" />
            <span className="hidden sm:inline">Calculate</span>
          </TabsTrigger>
        </TabsList>

        {/* Commission Plans Tab */}
        <TabsContent value="plans" className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
          <CommissionPlansManager />
        </TabsContent>

        {/* Team Management Tab */}
        <TabsContent value="teams" className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
          <TeamManager />
        </TabsContent>

        {/* Agent Assignments Tab */}
        <TabsContent value="assignments" className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
          <AgentAssignment records={records} />
        </TabsContent>

        {/* Automatic Calculation Tab */}
        <TabsContent value="calculate" className="space-y-4 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
          <CommissionCalculator records={records} />
        </TabsContent>
      </Tabs>
    </Card>
  );
}
