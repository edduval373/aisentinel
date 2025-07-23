import * as React from "react"
import { Slot } from "@radix-ui/react-slot"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "default", size = "default", asChild = false, disabled, className, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    
    const getButtonClasses = () => {
      let classes = ['btn']
      
      // Add variant class
      if (variant === 'outline') classes.push('btn-outline')
      else if (variant === 'ghost') classes.push('btn-ghost')
      else if (variant === 'destructive') classes.push('btn-destructive')
      else classes.push('btn-primary')
      
      // Add size class
      if (size === 'sm') classes.push('btn-sm')
      
      // Add disabled class
      if (disabled) classes.push('btn-disabled')
      
      return classes.join(' ')
    }
    
    return (
      <Comp
        className={`${getButtonClasses()} ${className || ''}`}
        ref={ref}
        disabled={disabled}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
