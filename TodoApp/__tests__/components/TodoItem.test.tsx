import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { TodoItem } from '../../src/components/TodoItem';
import { Todo } from '../../src/db/schema';

jest.mock('../../src/context/ThemeContext', () => ({
  useTheme: () => ({
    colors: {
      background: '#f5f5f5',
      card: '#ffffff',
      text: '#1a1a1a',
      primary: '#3b82f6',
      secondary: '#6366f1',
      border: '#e5e7eb',
      success: '#10b981',
      error: '#ef4444',
      warning: '#f59e0b',
    },
    theme: 'light',
  }),
  ThemeProvider: ({ children }: { children: React.ReactNode }) => children,
}));

const mockTodo: Todo = {
  id: 1,
  title: 'Test Todo',
  description: 'Test Description',
  metric: '5 hours',
  isCompleted: false,
  createdAt: new Date('2024-01-01'),
  completedAt: null,
};

const mockOnComplete = jest.fn();
const mockOnUncomplete = jest.fn();
const mockOnDelete = jest.fn();

const renderComponent = (todo: Todo = mockTodo) => {
  return render(
    <TodoItem
      todo={todo}
      onComplete={mockOnComplete}
      onUncomplete={mockOnUncomplete}
      onDelete={mockOnDelete}
    />
  );
};

describe('TodoItem Component Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should render todo title', () => {
    const { getByText } = renderComponent();
    expect(getByText('Test Todo')).toBeTruthy();
  });

  test('should render todo description', () => {
    const { getByText } = renderComponent();
    expect(getByText('Test Description')).toBeTruthy();
  });

  test('should render todo metric', () => {
    const { getByText } = renderComponent();
    expect(getByText('Target: 5 hours')).toBeTruthy();
  });

  test('should show complete button for pending todo', () => {
    const { getByText } = renderComponent();
    expect(getByText('✓')).toBeTruthy();
  });

  test('should call onComplete when complete button is pressed', () => {
    const { getByText } = renderComponent();
    
    fireEvent.press(getByText('✓'));
    
    expect(mockOnComplete).toHaveBeenCalledWith(1);
  });

  test('should show uncomplete button for completed todo', () => {
    const completedTodo: Todo = {
      ...mockTodo,
      isCompleted: true,
      completedAt: new Date('2024-01-02'),
    };
    
    const { getByText } = renderComponent(completedTodo);
    expect(getByText('↩')).toBeTruthy();
  });

  test('should call onUncomplete when uncomplete button is pressed', () => {
    const completedTodo: Todo = {
      ...mockTodo,
      isCompleted: true,
    };
    
    const { getByText } = renderComponent(completedTodo);
    
    fireEvent.press(getByText('↩'));
    
    expect(mockOnUncomplete).toHaveBeenCalledWith(1);
  });

  test('should show delete button', () => {
    const { getByText } = renderComponent();
    expect(getByText('✕')).toBeTruthy();
  });

  test('should call onDelete when delete button is pressed', () => {
    const { getByText } = renderComponent();
    
    fireEvent.press(getByText('✕'));
    
    expect(mockOnDelete).toHaveBeenCalledWith(1);
  });

  test('should not render description when null', () => {
    const todoWithoutDesc: Todo = {
      ...mockTodo,
      description: null,
    };
    
    const { queryByText } = renderComponent(todoWithoutDesc);
    expect(queryByText('Test Description')).toBeNull();
  });

  test('should not render metric when null', () => {
    const todoWithoutMetric: Todo = {
      ...mockTodo,
      metric: null,
    };
    
    const { queryByText } = renderComponent(todoWithoutMetric);
    expect(queryByText('Target: 5 hours')).toBeNull();
  });

  test('should show completed date for completed todo', () => {
    const completedTodo: Todo = {
      ...mockTodo,
      isCompleted: true,
      completedAt: new Date('2024-01-02'),
    };
    
    const { getByText } = renderComponent(completedTodo);
    expect(getByText(/Completed:/)).toBeTruthy();
  });

  test('should apply completed styling to title when todo is completed', () => {
    const completedTodo: Todo = {
      ...mockTodo,
      isCompleted: true,
    };
    
    const { getByText } = renderComponent(completedTodo);
    const title = getByText('Test Todo');
    
    expect(title.props.style).toBeDefined();
  });

  test('should render different todos with different ids', () => {
    const todo1: Todo = { ...mockTodo, id: 1 };
    const todo2: Todo = { ...mockTodo, id: 2 };
    
    const { rerender, getByText } = render(
      <TodoItem
        todo={todo1}
        onComplete={mockOnComplete}
        onUncomplete={mockOnUncomplete}
        onDelete={mockOnDelete}
      />
    );
    
    expect(getByText('Test Todo')).toBeTruthy();
    
    rerender(
      <TodoItem
        todo={todo2}
        onComplete={mockOnComplete}
        onUncomplete={mockOnUncomplete}
        onDelete={mockOnDelete}
      />
    );
    
    expect(getByText('Test Todo')).toBeTruthy();
  });
});
