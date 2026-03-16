'use client';

import * as React from 'react';
import { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  asChild?: boolean;
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    variant = 'primary', 
    size = 'default', 
    asChild = false,
    className = '',
    loading = false,
    disabled,
    children,
    ...props
  }, ref: React.Ref<HTMLButtonElement>) => {
    const Component = asChild ? 'span' : 'button';
    
    const baseClasses = 'inline-flex items-center justify-center font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background';
    
    const variantClasses: Record<string, string> = {
      primary: 'bg-primary text-primary-foreground hover:bg-[#FF5252] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/30 active:translate-y-0',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-[#3DBDB4] hover:-translate-y-0.5 hover:shadow-lg hover:shadow-secondary/30 active:translate-y-0',
      outline: 'border-2 border-border bg-transparent hover:border-primary hover:text-primary hover:bg-primary/5',
      ghost: 'bg-transparent hover:bg-muted text-foreground',
      danger: 'bg-destructive text-destructive-foreground hover:bg-red-600',
    };
    
    const sizeClasses: Record<string, string> = {
      default: 'h-10 px-5 py-2 text-sm',
      sm: 'h-8 px-3 text-xs',
      lg: 'h-12 px-8 text-base',
      icon: 'h-10 w-10',
    };
    
    return (
      <Component
        className={`${baseClasses} ${variantClasses[variant] || ''} ${sizeClasses[size] || ''} rounded-lg ${className}`}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {loading ? (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : null}
        {children}
      </Component>
    );
  }
);
Button.displayName = 'Button';
