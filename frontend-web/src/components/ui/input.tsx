'use client';

import * as React from 'react';

interface InputProps {
  label?: string;
  multiline?: boolean;
  minRows?: number;
  className?: string;
  id?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  required?: boolean;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
  checked?: boolean;
  defaultChecked?: boolean;
  onChangeText?: (text: string) => void;
  min?: number;
}

export const Input = React.forwardRef<HTMLInputElement | HTMLTextAreaElement, InputProps>(
  ({ 
    label,
    multiline = false,
    minRows = 2,
    className = '',
    id: providedId,
    onChange,
    onChangeText,
    ...props
  }, ref) => {
    const generatedId = React.useId();
    const inputId = providedId || generatedId;
    
    const baseClasses = `block w-full rounded-md border border-gray-300 bg-white dark:bg-gray-800 dark:text-white px-3 py-2 text-base font-normal placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:focus:ring-primary-500 dark:focus:border-primary-500 ${className}`;
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (onChange) onChange(e);
      if (onChangeText) onChangeText(e.target.value);
    };
    
    return (
      <div className="space-y-2">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {label}{props.required && ' *'}
          </label>
        )}
        {multiline ? (
          <textarea
            id={inputId}
            className={baseClasses}
            rows={minRows}
            ref={ref as React.Ref<HTMLTextAreaElement>}
            value={props.value}
            onChange={handleChange}
            required={props.required}
            placeholder={props.placeholder}
            disabled={props.disabled}
          />
        ) : (
          <input
            id={inputId}
            className={baseClasses}
            ref={ref as React.Ref<HTMLInputElement>}
            type={props.type}
            value={props.value}
            onChange={handleChange}
            required={props.required}
            placeholder={props.placeholder}
            disabled={props.disabled}
            checked={props.checked}
            defaultChecked={props.defaultChecked}
            min={props.min}
          />
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';
