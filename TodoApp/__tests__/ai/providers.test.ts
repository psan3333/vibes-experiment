import { AI_PROVIDERS, TIME_PERIODS } from '../../src/ai/providers';
import { generateYAMLData, convertToYAML } from '../../src/ai/yamlGenerator';
import { Todo } from '../../src/db/schema';

describe('AI Providers', () => {
  describe('AI_PROVIDERS', () => {
    it('should have at least 10 providers', () => {
      expect(AI_PROVIDERS.length).toBeGreaterThanOrEqual(10);
    });

    it('should have unique provider IDs', () => {
      const ids = AI_PROVIDERS.map(p => p.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });

    it('should have required fields for each provider', () => {
      AI_PROVIDERS.forEach(provider => {
        expect(provider.id).toBeDefined();
        expect(provider.name).toBeDefined();
        expect(provider.description).toBeDefined();
        expect(provider.baseUrl).toBeDefined();
        expect(typeof provider.apiKeyRequired).toBe('boolean');
        expect(typeof provider.supportsCustomModel).toBe('boolean');
      });
    });

    it('should have providers with and without API key requirement', () => {
      const withApiKey = AI_PROVIDERS.filter(p => p.apiKeyRequired);
      const withoutApiKey = AI_PROVIDERS.filter(p => !p.apiKeyRequired);
      
      expect(withApiKey.length).toBeGreaterThan(0);
      expect(withoutApiKey.length).toBeGreaterThan(0);
    });
  });

  describe('TIME_PERIODS', () => {
    it('should have all required periods', () => {
      const periodValues = TIME_PERIODS.map(p => p.value);
      expect(periodValues).toContain('week');
      expect(periodValues).toContain('month');
      expect(periodValues).toContain('quarter');
      expect(periodValues).toContain('year');
      expect(periodValues).toContain('all');
    });

    it('should have valid day counts', () => {
      TIME_PERIODS.forEach(period => {
        expect(typeof period.days).toBe('number');
        if (period.value !== 'all') {
          expect(period.days).toBeGreaterThan(0);
        }
      });
    });
  });
});

describe('YAML Generator', () => {
  const mockTodos: Todo[] = [
    {
      id: 1,
      title: 'Task 1',
      description: 'Description 1',
      metric: '5 hours',
      isCompleted: true,
      createdAt: new Date('2024-01-01'),
      completedAt: new Date('2024-01-02'),
    },
    {
      id: 2,
      title: 'Task 2',
      description: null,
      metric: null,
      isCompleted: false,
      createdAt: new Date('2024-01-15'),
      completedAt: null,
    },
    {
      id: 3,
      title: 'Task 3',
      description: 'Description 3',
      metric: '10 sessions',
      isCompleted: true,
      createdAt: new Date('2024-01-10'),
      completedAt: new Date('2024-01-20'),
    },
  ];

  describe('generateYAMLData', () => {
    it('should generate data for all period', () => {
      const result = generateYAMLData(mockTodos, 'all');
      
      expect(result.period.type).toBe('all');
      expect(result.period.label).toBe('All time');
      expect(result.summary).toBeDefined();
      expect(result.tasks).toBeDefined();
    });

    it('should calculate summary metrics correctly', () => {
      const result = generateYAMLData(mockTodos, 'all');
      
      expect(result.period.type).toBe('all');
      expect(result.period.label).toBe('All time');
      expect(result.summary.totalTasks).toBe(3);
    });

    it('should calculate completion rate correctly', () => {
      const result = generateYAMLData(mockTodos, 'all');
      
      expect(result.summary.completedTasks).toBe(2);
      expect(result.summary.pendingTasks).toBe(1);
      expect(result.summary.completionRate).toBe(67);
    });

    it('should handle empty todo list', () => {
      const result = generateYAMLData([], 'month');
      
      expect(result.summary.totalTasks).toBe(0);
      expect(result.summary.completedTasks).toBe(0);
      expect(result.summary.pendingTasks).toBe(0);
      expect(result.summary.completionRate).toBe(0);
      expect(result.tasks).toEqual([]);
    });

    it('should filter todos by period', () => {
      const oldTodos: Todo[] = [
        {
          id: 1,
          title: 'Old Task',
          description: null,
          metric: null,
          isCompleted: true,
          createdAt: new Date('2023-01-01'),
          completedAt: new Date('2023-01-02'),
        },
      ];
      
      const result = generateYAMLData(oldTodos, 'week');
      
      expect(result.tasks.length).toBe(0);
    });
  });

  describe('convertToYAML', () => {
    it('should convert data to YAML string', () => {
      const data = generateYAMLData(mockTodos, 'all');
      const yaml = convertToYAML(data);
      
      expect(yaml).toContain('summary:');
      expect(yaml).toContain('total_tasks:');
      expect(yaml).toContain('completed_tasks:');
      expect(yaml).toContain('pending_tasks:');
      expect(yaml).toContain('tasks:');
      expect(yaml).toContain('Task 1');
      expect(yaml).toContain('Task 2');
    });

    it('should handle null values in YAML', () => {
      const allTodosData = generateYAMLData(mockTodos, 'all');
      const yaml = convertToYAML(allTodosData);
      
      expect(yaml).toContain('description:');
      expect(yaml).toContain('metric:');
    });

    it('should escape quotes in strings', () => {
      const dataWithQuotes: Todo[] = [
        {
          id: 1,
          title: 'Task with "quotes"',
          description: "Description with 'single quotes'",
          metric: null,
          isCompleted: false,
          createdAt: new Date(),
          completedAt: null,
        },
      ];
      
      const data = generateYAMLData(dataWithQuotes, 'month');
      const yaml = convertToYAML(data);
      
      expect(yaml).toContain('Task with');
    });
  });
});
