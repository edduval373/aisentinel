import * as React from "react"
import * as TogglePrimitive from "@radix-ui/react-toggle"


import { cn } from "@/lib/utils"

const toggleVariants = ({ variant = "default", size = "default" }: { variant?: string; size?: string } = {}) => {
  return "" // Pure CSS inline styles approach - no classes
}

const Toggle = React.forwardRef<
  React.ElementRef<typeof TogglePrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof TogglePrimitive.Root> & {
    variant?: "default" | "outline"
    size?: "default" | "sm" | "lg"
  }
>(({ className, variant = "default", size = "default", ...props }, ref) => (
  <TogglePrimitive.Root
    ref={ref}
    className={className}
    style={{
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: '6px',
      fontSize: '14px',
      fontWeight: '500',
      padding: size === 'sm' ? '8px 10px' : size === 'lg' ? '12px 20px' : '10px 12px',
      minWidth: size === 'sm' ? '36px' : size === 'lg' ? '44px' : '40px',
      height: size === 'sm' ? '36px' : size === 'lg' ? '44px' : '40px',
      backgroundColor: 'transparent',
      border: variant === 'outline' ? '1px solid #e2e8f0' : 'none',
      cursor: 'pointer',
      transition: 'all 0.2s',
      ...props.style
    }}
    {...props}
  />
))

Toggle.displayName = TogglePrimitive.Root.displayName

export { Toggle, toggleVariants }
