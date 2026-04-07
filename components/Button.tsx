
import React from 'react';
import { useVibration } from '../hooks/useVibration';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  isLoading, 
  className = '', 
  onClick,
  disabled,
  ...props 
}) => {
  const { vibrateTap } = useVibration();

  const baseStyles = "inline-flex items-center justify-center rounded-xl font-medium transition-all focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 touch-manipulation";
  
  const variants = {
    primary: "bg-brand-500 text-white hover:bg-brand-600 shadow-premium active:scale-95",
    secondary: "bg-app-text text-app-bg hover:opacity-90 shadow-premium active:scale-95",
    outline: "border-2 border-app-border text-app-text hover:bg-app-bg active:scale-95",
    ghost: "text-app-text opacity-70 hover:bg-app-bg active:scale-95"
  };

  const sizes = {
    sm: "h-10 px-4 text-xs rounded-xl",
    md: "h-12 px-6 text-sm rounded-2xl",
    lg: "h-14 px-8 text-base rounded-3xl"
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled && !isLoading) {
      vibrateTap();
      if (onClick) onClick(e);
    }
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={isLoading || disabled}
      onClick={handleClick}
      aria-busy={isLoading}
      aria-disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center">
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" fill="none" viewBox="0 0 24 24" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Loading...
        </span>
      ) : children}
    </button>
  );
};
