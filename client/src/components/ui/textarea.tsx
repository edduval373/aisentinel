import * as React from "react"

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, disabled, ...props }, ref) => {
    const getTextareaClasses = () => {
      let classes = ['input-textarea']
      if (disabled) classes.push('input-textarea:disabled')
      return classes.join(' ')
    }

    return (
      <textarea
        className={`${getTextareaClasses()} ${className || ''}`}
        ref={ref}
        disabled={disabled}
        {...props}
      />
    )
  }
)
Textarea.displayName = "Textarea"

export { Textarea }