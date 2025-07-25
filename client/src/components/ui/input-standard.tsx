import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  style?: React.CSSProperties;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ style, ...props }, ref) => {
    return (
      <input
        ref={ref}
        style={{
          width: '100%',
          height: '40px',
          padding: '0 12px',
          border: '1px solid #d1d5db',
          borderRadius: '6px',
          fontSize: '14px',
          backgroundColor: '#ffffff',
          color: '#111827',
          outline: 'none',
          transition: 'all 0.2s',
          ...style
        }}
        onFocus={(e) => {
          e.target.style.borderColor = '#3b82f6';
          e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = '#d1d5db';
          e.target.style.boxShadow = 'none';
        }}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

export { Input };