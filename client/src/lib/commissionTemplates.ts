/**
 * Commission Plan Templates
 * Pre-built templates for common commission structures
 */

import { CommissionPlan } from './commission';

export interface CommissionTemplate {
  id: string;
  name: string;
  description: string;
  category: 'standard' | 'highVolume' | 'newAgent' | 'custom';
  plan: Omit<CommissionPlan, 'id' | 'name'>;
}

export const DEFAULT_TEMPLATES: CommissionTemplate[] = [
  {
    id: 'template-standard-5050',
    name: 'Standard 50/50',
    description: 'Equal split between agent and brokerage. No cap. Best for established agents.',
    category: 'standard',
    plan: {
      splitPercentage: 50,
      capAmount: 0,
      postCapSplit: 50,
    },
  },
  {
    id: 'template-standard-6040',
    name: 'Standard 60/40',
    description: 'Agent gets 60%, brokerage gets 40%. No cap. Common for mid-level agents.',
    category: 'standard',
    plan: {
      splitPercentage: 60,
      capAmount: 0,
      postCapSplit: 60,
    },
  },
  {
    id: 'template-standard-7030',
    name: 'Standard 70/30',
    description: 'Agent gets 70%, brokerage gets 30%. No cap. For top performers.',
    category: 'standard',
    plan: {
      splitPercentage: 70,
      capAmount: 0,
      postCapSplit: 70,
    },
  },
  {
    id: 'template-standard-8020',
    name: 'Standard 80/20',
    description: 'Agent gets 80%, brokerage gets 20%. No cap. For elite agents.',
    category: 'standard',
    plan: {
      splitPercentage: 80,
      capAmount: 0,
      postCapSplit: 80,
    },
  },
  {
    id: 'template-highvolume-6040-cap',
    name: 'High-Volume 60/40 (Capped)',
    description: 'Agent gets 60% up to $20k cap, then 100% above cap. Incentivizes volume.',
    category: 'highVolume',
    plan: {
      splitPercentage: 60,
      capAmount: 20000,
      postCapSplit: 100,
    },
  },
  {
    id: 'template-highvolume-7030-cap',
    name: 'High-Volume 70/30 (Capped)',
    description: 'Agent gets 70% up to $25k cap, then 100% above cap. Strong incentive.',
    category: 'highVolume',
    plan: {
      splitPercentage: 70,
      capAmount: 25000,
      postCapSplit: 100,
    },
  },
  {
    id: 'template-highvolume-5050-cap',
    name: 'High-Volume 50/50 (Capped)',
    description: 'Agent gets 50% up to $15k cap, then 90% above cap. Balanced growth.',
    category: 'highVolume',
    plan: {
      splitPercentage: 50,
      capAmount: 15000,
      postCapSplit: 90,
    },
  },
  {
    id: 'template-newagent-7030',
    name: 'New Agent 70/30',
    description: 'Agent gets 70%, brokerage gets 30%. No cap. For new agents in first year.',
    category: 'newAgent',
    plan: {
      splitPercentage: 70,
      capAmount: 0,
      postCapSplit: 70,
    },
  },
  {
    id: 'template-newagent-6040',
    name: 'New Agent 60/40',
    description: 'Agent gets 60%, brokerage gets 40%. No cap. Conservative for new hires.',
    category: 'newAgent',
    plan: {
      splitPercentage: 60,
      capAmount: 0,
      postCapSplit: 60,
    },
  },
  {
    id: 'template-newagent-5050',
    name: 'New Agent 50/50',
    description: 'Equal split. No cap. Maximum brokerage support for new agents.',
    category: 'newAgent',
    plan: {
      splitPercentage: 50,
      capAmount: 0,
      postCapSplit: 50,
    },
  },
];

/**
 * Get all available templates
 */
export function getTemplates(): CommissionTemplate[] {
  return DEFAULT_TEMPLATES;
}

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: CommissionTemplate['category']): CommissionTemplate[] {
  return DEFAULT_TEMPLATES.filter(t => t.category === category);
}

/**
 * Get a template by ID
 */
export function getTemplateById(id: string): CommissionTemplate | undefined {
  return DEFAULT_TEMPLATES.find(t => t.id === id);
}

/**
 * Create a new plan from a template
 */
export function createPlanFromTemplate(
  template: CommissionTemplate,
  planName: string,
  planId: string
): CommissionPlan {
  return {
    id: planId,
    name: planName,
    ...template.plan,
  };
}

/**
 * Get template categories for UI grouping
 */
export function getTemplateCategories(): Array<{
  id: CommissionTemplate['category'];
  label: string;
  description: string;
}> {
  return [
    {
      id: 'standard',
      label: 'Standard Plans',
      description: 'Common commission structures without caps',
    },
    {
      id: 'highVolume',
      label: 'High-Volume Plans',
      description: 'Plans with caps to incentivize volume',
    },
    {
      id: 'newAgent',
      label: 'New Agent Plans',
      description: 'Supportive structures for new hires',
    },
    {
      id: 'custom',
      label: 'Custom Plans',
      description: 'Your custom plan configurations',
    },
  ];
}
