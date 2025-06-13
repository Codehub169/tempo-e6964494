import React from 'react';

const LoadingSpinner = ({ size = 'md', color = 'primary', className = '' }) => {
  const sizeClasses = {
    sm: 'w-6 h-6 border-2',
    md: 'w-10 h-10 border-4',
    lg: 'w-16 h-16 border-4',
    xl: 'w-24 h-24 border-8',
  };

  const colorClasses = {
    primary: 'border-primary',
    white: 'border-white',
    light: 'border-primary-light',
    secondary: 'border-text-secondary',
  };

  const spinnerSizeClass = sizeClasses[size] || sizeClasses.md;
  const spinnerColorClass = colorClasses[color] || colorClasses.primary;

  return (
    <div className={`flex justify-center items-center ${className}`}>
      <div
        className={`animate-spin rounded-full ${spinnerSizeClass} ${spinnerColorClass} border-t-transparent`}
        role="status"
      >
        <span className="sr-only">Loading...</span>
      </div>
    </div>
  );
};

export default LoadingSpinner;
