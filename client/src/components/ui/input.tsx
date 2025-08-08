import * as React from "react"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ style, type, ...props }, ref) => {
    return (
      <input
        type={type}
        style={{
          display: 'flex',
          height: '40px',
          width: '100%',
          borderRadius: '6px',
          border: '1px solid #d1d5db',
          backgroundColor: '#ffffff',
          padding: '8px 12px',
          fontSize: '16px',
          outline: 'none',
          transition: 'border-color 0.2s, box-shadow 0.2s',
          ...style
        }}
        onFocus={(e) => {
          e.target.style.borderColor = '#3b82f6';
          e.target.style.boxShadow = '0 0 0 2px rgba(59, 130, 246, 0.1)';
        }}
        onBlur={(e) => {
          e.target.style.borderColor = '#d1d5db';
          e.target.style.boxShadow = 'none';
        }}
        ref={ref}
        {...props}
      />
    )
  }
)
Input.displayName = "Input"

export { Input }
