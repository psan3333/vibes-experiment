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
  error?: string;
  icon?: React.ReactNode;
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
    error,
    icon,
    ...props
  }, ref) => {
    const generatedId = React.useId();
    const inputId = providedId || generatedId;
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (onChange) onChange(e);
      if (onChangeText) onChangeText(e.target.value);
    };
    
    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-foreground">
            {label}
            {props.required && <span className="text-primary ml-0.5">*</span>}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {icon}
            </div>
          )}
          {multiline ? (
            <textarea
              id={inputId}
              className={`input-field resize-none ${icon ? 'pl-12' : ''} ${error ? 'border-destructive focus:border-destructive focus:ring-destructive/20' : ''} ${className}`}
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
              className={`input-field ${icon ? 'pl-12' : ''} ${error ? 'border-destructive focus:border-destructive focus:ring-destructive/20' : ''} ${className}`}
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
        {error && (
          <p className="text-xs text-destructive">{error}</p>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';
