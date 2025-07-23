import * as React from "react"
import { Slot } from "@radix-ui/react-slot"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
}

const getButtonStyles = (variant: string, size: string, disabled?: boolean) => {
  const baseStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    whiteSpace: 'nowrap' as const,
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: 500,
    transition: 'all 0.2s',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    border: 'none',
    outline: 'none'
  }

  const variantStyles = {
    default: {
      backgroundColor: 'hsl(221, 83%, 53%)',
      color: 'white'
    },
    destructive: {
      backgroundColor: 'hsl(0, 84%, 60%)',
      color: 'white'
    },
    outline: {
      border: '1px solid #e2e8f0',
      backgroundColor: 'white',
      color: '#1e293b'
    },
    secondary: {
      backgroundColor: '#f1f5f9',
      color: '#1e293b'
    },
    ghost: {
      backgroundColor: 'transparent',
      color: '#1e293b'
    },
    link: {
      backgroundColor: 'transparent',
      color: 'hsl(221, 83%, 53%)',
      textDecoration: 'underline'
    }
  }

  const sizeStyles = {
    default: { height: '40px', padding: '8px 16px' },
    sm: { height: '36px', padding: '8px 12px' },
    lg: { height: '44px', padding: '8px 32px' },
    icon: { height: '40px', width: '40px', padding: 0 }
  }

  return {
    ...baseStyles,
    ...variantStyles[variant as keyof typeof variantStyles],
    ...sizeStyles[size as keyof typeof sizeStyles]
  }
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "default", size = "default", asChild = false, disabled, style, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    const buttonStyles = getButtonStyles(variant, size, disabled)
    
    return (
      <Comp
        style={{ ...buttonStyles, ...style }}
        ref={ref}
        disabled={disabled}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
