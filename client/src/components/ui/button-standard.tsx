import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  children: React.ReactNode;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'default', size = 'default', style, children, ...props }, ref) => {
    const baseStyles: React.CSSProperties = {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '6px',
      fontSize: '14px',
      fontWeight: '500',
      transition: 'all 0.2s',
      cursor: 'pointer',
      border: 'none',
      outline: 'none',
      textDecoration: 'none',
    };

    const variantStyles: Record<string, React.CSSProperties> = {
      default: {
        backgroundColor: '#3b82f6',
        color: '#ffffff',
      },
      outline: {
        backgroundColor: 'transparent',
        border: '1px solid #d1d5db',
        color: '#374151',
      },
      ghost: {
        backgroundColor: 'transparent',
        color: '#374151',
      },
      destructive: {
        backgroundColor: '#ef4444',
        color: '#ffffff',
      },
    };

    const sizeStyles: Record<string, React.CSSProperties> = {
      default: {
        height: '40px',
        padding: '0 16px',
      },
      sm: {
        height: '32px',
        padding: '0 12px',
        fontSize: '12px',
      },
      lg: {
        height: '48px',
        padding: '0 24px',
        fontSize: '16px',
      },
      icon: {
        height: '40px',
        width: '40px',
        padding: '0',
      },
    };

    const combinedStyles = {
      ...baseStyles,
      ...variantStyles[variant],
      ...sizeStyles[size],
      ...style,
    };

    return (
      <button ref={ref} style={combinedStyles} {...props}>
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button };