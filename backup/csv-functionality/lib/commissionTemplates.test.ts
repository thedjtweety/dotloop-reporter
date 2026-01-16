import { describe, it, expect } from 'vitest';
import {
  getTemplates,
  getTemplatesByCategory,
  getTemplateById,
  createPlanFromTemplate,
  getTemplateCategories,
  DEFAULT_TEMPLATES,
} from './commissionTemplates';

describe('Commission Templates', () => {
  describe('getTemplates', () => {
    it('should return all default templates', () => {
      const templates = getTemplates();
      expect(templates).toEqual(DEFAULT_TEMPLATES);
      expect(templates.length).toBeGreaterThan(0);
    });

    it('should include standard plans', () => {
      const templates = getTemplates();
      const standardPlans = templates.filter(t => t.category === 'standard');
      expect(standardPlans.length).toBeGreaterThan(0);
    });

    it('should include high-volume plans', () => {
      const templates = getTemplates();
      const highVolumePlans = templates.filter(t => t.category === 'highVolume');
      expect(highVolumePlans.length).toBeGreaterThan(0);
    });

    it('should include new agent plans', () => {
      const templates = getTemplates();
      const newAgentPlans = templates.filter(t => t.category === 'newAgent');
      expect(newAgentPlans.length).toBeGreaterThan(0);
    });
  });

  describe('getTemplatesByCategory', () => {
    it('should filter templates by category', () => {
      const standardPlans = getTemplatesByCategory('standard');
      expect(standardPlans.every(t => t.category === 'standard')).toBe(true);
    });

    it('should return empty array for non-existent category', () => {
      const customPlans = getTemplatesByCategory('custom');
      expect(customPlans.length).toBe(0);
    });

    it('should return all high-volume plans', () => {
      const highVolumePlans = getTemplatesByCategory('highVolume');
      expect(highVolumePlans.length).toBeGreaterThan(0);
      expect(highVolumePlans.every(t => t.category === 'highVolume')).toBe(true);
    });
  });

  describe('getTemplateById', () => {
    it('should find template by ID', () => {
      const template = getTemplateById('template-standard-5050');
      expect(template).toBeDefined();
      expect(template?.name).toBe('Standard 50/50');
    });

    it('should return undefined for non-existent ID', () => {
      const template = getTemplateById('non-existent-id');
      expect(template).toBeUndefined();
    });

    it('should find high-volume templates', () => {
      const template = getTemplateById('template-highvolume-6040-cap');
      expect(template).toBeDefined();
      expect(template?.category).toBe('highVolume');
      expect(template?.plan.capAmount).toBeGreaterThan(0);
    });
  });

  describe('createPlanFromTemplate', () => {
    it('should create plan from template', () => {
      const template = getTemplateById('template-standard-5050');
      expect(template).toBeDefined();

      const plan = createPlanFromTemplate(template!, 'My 50/50 Plan', 'plan-123');
      expect(plan.id).toBe('plan-123');
      expect(plan.name).toBe('My 50/50 Plan');
      expect(plan.splitPercentage).toBe(50);
      expect(plan.capAmount).toBe(0);
    });

    it('should preserve cap settings from template', () => {
      const template = getTemplateById('template-highvolume-6040-cap');
      expect(template).toBeDefined();

      const plan = createPlanFromTemplate(template!, 'High Volume Plan', 'plan-hv');
      expect(plan.capAmount).toBe(20000);
      expect(plan.postCapSplit).toBe(100);
    });

    it('should create unique plans from same template', () => {
      const template = getTemplateById('template-standard-6040');
      expect(template).toBeDefined();

      const plan1 = createPlanFromTemplate(template!, 'Agent 1 Plan', 'plan-1');
      const plan2 = createPlanFromTemplate(template!, 'Agent 2 Plan', 'plan-2');

      expect(plan1.id).not.toBe(plan2.id);
      expect(plan1.name).not.toBe(plan2.name);
      expect(plan1.splitPercentage).toBe(plan2.splitPercentage);
    });
  });

  describe('getTemplateCategories', () => {
    it('should return all categories', () => {
      const categories = getTemplateCategories();
      expect(categories.length).toBeGreaterThan(0);
    });

    it('should include standard category', () => {
      const categories = getTemplateCategories();
      const standard = categories.find(c => c.id === 'standard');
      expect(standard).toBeDefined();
      expect(standard?.label).toBe('Standard Plans');
    });

    it('should include high-volume category', () => {
      const categories = getTemplateCategories();
      const highVolume = categories.find(c => c.id === 'highVolume');
      expect(highVolume).toBeDefined();
      expect(highVolume?.label).toBe('High-Volume Plans');
    });

    it('should include new agent category', () => {
      const categories = getTemplateCategories();
      const newAgent = categories.find(c => c.id === 'newAgent');
      expect(newAgent).toBeDefined();
      expect(newAgent?.label).toBe('New Agent Plans');
    });

    it('should have descriptions for all categories', () => {
      const categories = getTemplateCategories();
      expect(categories.every(c => c.description)).toBe(true);
    });
  });

  describe('Template structure validation', () => {
    it('should have valid split percentages', () => {
      const templates = getTemplates();
      expect(templates.every(t => t.plan.splitPercentage > 0 && t.plan.splitPercentage <= 100)).toBe(true);
    });

    it('should have non-negative cap amounts', () => {
      const templates = getTemplates();
      expect(templates.every(t => t.plan.capAmount >= 0)).toBe(true);
    });

    it('should have valid post-cap splits', () => {
      const templates = getTemplates();
      expect(templates.every(t => t.plan.postCapSplit > 0 && t.plan.postCapSplit <= 100)).toBe(true);
    });

    it('should have unique template IDs', () => {
      const templates = getTemplates();
      const ids = templates.map(t => t.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have non-empty names and descriptions', () => {
      const templates = getTemplates();
      expect(templates.every(t => t.name && t.description)).toBe(true);
    });
  });
});
