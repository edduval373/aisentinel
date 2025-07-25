import React from 'react';

interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'secondary' | 'destructive' | 'outline';
  style?: React.CSSProperties;
}

const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', style }) => {
  const baseStyles: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    borderRadius: '9999px',
    padding: '2px 8px',
    fontSize: '12px',
    fontWeight: '500',
    border: '1px solid transparent',
  };

  const variantStyles: Record<string, React.CSSProperties> = {
    default: {
      backgroundColor: '#3b82f6',
      color: '#ffffff',
    },
    secondary: {
      backgroundColor: '#f1f5f9',
      color: '#475569',
    },
    destructive: {
      backgroundColor: '#ef4444',
      color: '#ffffff',
    },
    outline: {
      backgroundColor: 'transparent',
      border: '1px solid #d1d5db',
      color: '#374151',
    },
  };

  return (
    <span style={{
      ...baseStyles,
      ...variantStyles[variant],
      ...style
    }}>
      {children}
    </span>
  );
};

export { Badge };