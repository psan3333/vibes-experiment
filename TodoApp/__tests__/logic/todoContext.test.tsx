import { Todo, NewTodo } from '../../src/db/schema';

describe('Todo Logic Tests', () => {
  test('should filter pending todos correctly', () => {
    const todos: Todo[] = [
      { id: 1, title: 'Task 1', description: null, metric: null, isCompleted: false, createdAt: new Date(), completedAt: null },
      { id: 2, title: 'Task 2', description: null, metric: null, isCompleted: true, createdAt: new Date(), completedAt: new Date() },
      { id: 3, title: 'Task 3', description: null, metric: null, isCompleted: false, createdAt: new Date(), completedAt: null },
    ];
    const pending = todos.filter(t => !t.isCompleted);
    
    expect(pending.length).toBe(2);
    expect(pending.map(t => t.id)).toEqual([1, 3]);
  });

  test('should filter completed todos correctly', () => {
    const todos: Todo[] = [
      { id: 1, title: 'Task 1', description: null, metric: null, isCompleted: false, createdAt: new Date(), completedAt: null },
      { id: 2, title: 'Task 2', description: null, metric: null, isCompleted: true, createdAt: new Date(), completedAt: new Date() },
      { id: 3, title: 'Task 3', description: null, metric: null, isCompleted: true, createdAt: new Date(), completedAt: new Date() },
    ];
    const completed = todos.filter(t => t.isCompleted);
    
    expect(completed.length).toBe(2);
    expect(completed.map(t => t.id)).toEqual([2, 3]);
  });

  test('should calculate completion rate with no todos', () => {
    const todos: Todo[] = [];
    const completed = todos.filter(t => t.isCompleted).length;
    const total = todos.length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    expect(completionRate).toBe(0);
    expect(completed).toBe(0);
    expect(total).toBe(0);
  });

  test('should calculate completion rate with all completed', () => {
    const todos: Todo[] = [
      { id: 1, title: 'Task 1', description: null, metric: null, isCompleted: true, createdAt: new Date(), completedAt: new Date() },
      { id: 2, title: 'Task 2', description: null, metric: null, isCompleted: true, createdAt: new Date(), completedAt: new Date() },
    ];
    const completed = todos.filter(t => t.isCompleted).length;
    const total = todos.length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    expect(completionRate).toBe(100);
    expect(completed).toBe(2);
    expect(total).toBe(2);
  });

  test('should calculate completion rate with some completed', () => {
    const todos: Todo[] = [
      { id: 1, title: 'Task 1', description: null, metric: null, isCompleted: true, createdAt: new Date(), completedAt: new Date() },
      { id: 2, title: 'Task 2', description: null, metric: null, isCompleted: false, createdAt: new Date(), completedAt: null },
      { id: 3, title: 'Task 3', description: null, metric: null, isCompleted: false, createdAt: new Date(), completedAt: null },
    ];
    const completed = todos.filter(t => t.isCompleted).length;
    const total = todos.length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    expect(completionRate).toBe(33);
    expect(completed).toBe(1);
    expect(total).toBe(3);
  });

  test('should count today completed todos', () => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    const completedTodos: Todo[] = [
      { id: 1, title: 'Task 1', description: null, metric: null, isCompleted: true, createdAt: todayStart, completedAt: todayStart },
      { id: 2, title: 'Task 2', description: null, metric: null, isCompleted: true, createdAt: new Date(todayStart.getTime() - 86400000), completedAt: new Date(todayStart.getTime() - 86400000) },
      { id: 3, title: 'Task 3', description: null, metric: null, isCompleted: true, createdAt: todayStart, completedAt: todayStart },
    ];
    
    const todayCompleted = completedTodos.filter(t => 
      t.completedAt && new Date(t.completedAt) >= todayStart
    ).length;
    
    expect(todayCompleted).toBe(2);
  });

  test('should count week completed todos', () => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(todayStart);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay());
    
    const completedTodos: Todo[] = [
      { id: 1, title: 'Task 1', description: null, metric: null, isCompleted: true, createdAt: todayStart, completedAt: todayStart },
      { id: 2, title: 'Task 2', description: null, metric: null, isCompleted: true, createdAt: weekStart, completedAt: weekStart },
      { id: 3, title: 'Task 3', description: null, metric: null, isCompleted: true, createdAt: new Date(weekStart.getTime() - 86400000 * 10), completedAt: new Date(weekStart.getTime() - 86400000 * 10) },
    ];
    
    const weekCompleted = completedTodos.filter(t => 
      t.completedAt && new Date(t.completedAt) >= weekStart
    ).length;
    
    expect(weekCompleted).toBe(2);
  });

  test('should count month completed todos', () => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const completedTodos: Todo[] = [
      { id: 1, title: 'Task 1', description: null, metric: null, isCompleted: true, createdAt: now, completedAt: now },
      { id: 2, title: 'Task 2', description: null, metric: null, isCompleted: true, createdAt: monthStart, completedAt: monthStart },
      { id: 3, title: 'Task 3', description: null, metric: null, isCompleted: true, createdAt: new Date(monthStart.getTime() - 86400000 * 40), completedAt: new Date(monthStart.getTime() - 86400000 * 40) },
    ];
    
    const monthCompleted = completedTodos.filter(t => 
      t.completedAt && new Date(t.completedAt) >= monthStart
    ).length;
    
    expect(monthCompleted).toBe(2);
  });

  test('should count year completed todos', () => {
    const now = new Date();
    const yearStart = new Date(now.getFullYear(), 0, 1);
    
    const completedTodos: Todo[] = [
      { id: 1, title: 'Task 1', description: null, metric: null, isCompleted: true, createdAt: now, completedAt: now },
      { id: 2, title: 'Task 2', description: null, metric: null, isCompleted: true, createdAt: yearStart, completedAt: yearStart },
      { id: 3, title: 'Task 3', description: null, metric: null, isCompleted: true, createdAt: new Date(now.getFullYear() - 1, 0, 1), completedAt: new Date(now.getFullYear() - 1, 0, 1) },
    ];
    
    const yearCompleted = completedTodos.filter(t => 
      t.completedAt && new Date(t.completedAt) >= yearStart
    ).length;
    
    expect(yearCompleted).toBe(2);
  });

  test('should sort todos by createdAt descending', () => {
    const todos: Todo[] = [
      { id: 1, title: 'Task 1', description: null, metric: null, isCompleted: false, createdAt: new Date('2024-01-01'), completedAt: null },
      { id: 2, title: 'Task 2', description: null, metric: null, isCompleted: false, createdAt: new Date('2024-01-03'), completedAt: null },
      { id: 3, title: 'Task 3', description: null, metric: null, isCompleted: false, createdAt: new Date('2024-01-02'), completedAt: null },
    ];
    
    const sorted = [...todos].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    
    expect(sorted[0].id).toBe(2);
    expect(sorted[1].id).toBe(3);
    expect(sorted[2].id).toBe(1);
  });

  test('should validate NewTodo type for adding', () => {
    const newTodo: NewTodo = {
      title: 'New Task',
      description: null,
      metric: null,
      isCompleted: false,
      createdAt: new Date(),
      completedAt: null,
    };
    
    expect(newTodo.title).toBe('New Task');
    expect(newTodo.isCompleted).toBe(false);
    expect(newTodo.createdAt).toBeDefined();
  });

  test('should handle null description and metric', () => {
    const newTodo: NewTodo = {
      title: 'New Task',
      description: null,
      metric: null,
      isCompleted: false,
      createdAt: new Date(),
      completedAt: null,
    };
    
    expect(newTodo.description).toBeNull();
    expect(newTodo.metric).toBeNull();
  });

  test('should handle string description and metric', () => {
    const newTodo: NewTodo = {
      title: 'New Task',
      description: 'Some description',
      metric: '5 hours',
      isCompleted: false,
      createdAt: new Date(),
      completedAt: null,
    };
    
    expect(newTodo.description).toBe('Some description');
    expect(newTodo.metric).toBe('5 hours');
  });
});
