import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { AddTodoModal } from '../../src/components/AddTodoModal';

const mockOnAdd = jest.fn();
const mockOnClose = jest.fn();

const mockColors = {
  background: '#f5f5f5',
  card: '#ffffff',
  text: '#1a1a1a',
  primary: '#3b82f6',
  secondary: '#6366f1',
  border: '#e5e7eb',
  success: '#10b981',
  error: '#ef4444',
  warning: '#f59e0b',
};

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

const renderComponent = (visible = true) => {
  return render(
    <AddTodoModal
      visible={visible}
      onClose={mockOnClose}
      onAdd={mockOnAdd}
    />
  );
};

describe('AddTodoModal Component Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should render modal when visible', () => {
    const { getByText } = renderComponent();
    expect(getByText('Add New TODO')).toBeTruthy();
  });

  test('should not render modal when not visible', () => {
    const { queryByText } = renderComponent(false);
    expect(queryByText('Add New TODO')).toBeNull();
  });

  test('should have title input field', () => {
    const { getByPlaceholderText } = renderComponent();
    expect(getByPlaceholderText('Enter title')).toBeTruthy();
  });

  test('should have description input field', () => {
    const { getByPlaceholderText } = renderComponent();
    expect(getByPlaceholderText('Enter description (optional)')).toBeTruthy();
  });

  test('should have metric input field', () => {
    const { getByPlaceholderText } = renderComponent();
    expect(getByPlaceholderText('e.g., 5 hours, 3 sessions (optional)')).toBeTruthy();
  });

  test('should have Cancel button', () => {
    const { getByText } = renderComponent();
    expect(getByText('Cancel')).toBeTruthy();
  });

  test('should have Add TODO button', () => {
    const { getByText } = renderComponent();
    expect(getByText('Add TODO')).toBeTruthy();
  });

  test('should show error when title is empty', async () => {
    const { getByText, findByText } = renderComponent();
    
    fireEvent.press(getByText('Add TODO'));
    
    expect(await findByText('Title is required')).toBeTruthy();
  });

  test('should call onAdd with title when provided', async () => {
    const { getByPlaceholderText, getByText } = renderComponent();
    
    fireEvent.changeText(getByPlaceholderText('Enter title'), 'Test Todo');
    fireEvent.press(getByText('Add TODO'));
    
    await waitFor(() => {
      expect(mockOnAdd).toHaveBeenCalledWith('Test Todo', undefined, undefined);
    });
  });

  test('should call onAdd with all fields when provided', async () => {
    const { getByPlaceholderText, getByText } = renderComponent();
    
    fireEvent.changeText(getByPlaceholderText('Enter title'), 'Test Todo');
    fireEvent.changeText(getByPlaceholderText('Enter description (optional)'), 'Test Description');
    fireEvent.changeText(getByPlaceholderText('e.g., 5 hours, 3 sessions (optional)'), '5 hours');
    fireEvent.press(getByText('Add TODO'));
    
    await waitFor(() => {
      expect(mockOnAdd).toHaveBeenCalledWith('Test Todo', 'Test Description', '5 hours');
    });
  });

  test('should call onClose when Cancel is pressed', () => {
    const { getByText } = renderComponent();
    
    fireEvent.press(getByText('Cancel'));
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  test('should clear form after successful add', async () => {
    const { getByPlaceholderText, getByText } = renderComponent();
    
    fireEvent.changeText(getByPlaceholderText('Enter title'), 'Test Todo');
    fireEvent.press(getByText('Add TODO'));
    
    await waitFor(() => {
      expect(getByPlaceholderText('Enter title').props.value).toBe('');
    });
  });

  test('should validate title is required field', async () => {
    const { getByText, findByText, getByPlaceholderText } = renderComponent();
    
    fireEvent.changeText(getByPlaceholderText('Enter title'), '');
    fireEvent.press(getByText('Add TODO'));
    
    expect(await findByText('Title is required')).toBeTruthy();
  });

  test('should allow adding todo with only title', async () => {
    const { getByPlaceholderText, getByText } = renderComponent();
    
    fireEvent.changeText(getByPlaceholderText('Enter title'), 'Simple Todo');
    fireEvent.press(getByText('Add TODO'));
    
    await waitFor(() => {
      expect(mockOnAdd).toHaveBeenCalledWith('Simple Todo', undefined, undefined);
    });
  });

  test('should handle whitespace-only title as empty', async () => {
    const { getByText, findByText, getByPlaceholderText } = renderComponent();
    
    fireEvent.changeText(getByPlaceholderText('Enter title'), '   ');
    fireEvent.press(getByText('Add TODO'));
    
    expect(await findByText('Title is required')).toBeTruthy();
  });
});
