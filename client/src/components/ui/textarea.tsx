import * as React from "react"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ style, disabled, ...props }, ref) => {
    const textareaStyles = {
      display: 'flex',
      minHeight: '80px',
      width: '100%',
      borderRadius: '6px',
      border: '1px solid #e2e8f0',
      backgroundColor: 'white',
      padding: '8px 12px',
      fontSize: '14px',
      outline: 'none',
      transition: 'border-color 0.2s',
      cursor: disabled ? 'not-allowed' : 'text',
      opacity: disabled ? 0.5 : 1,
      resize: 'vertical' as const,
      fontFamily: 'inherit'
    }

    return (
      <textarea
        style={{ ...textareaStyles, ...style }}
        ref={ref}
        disabled={disabled}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }