import * as React from "react"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline"
}

const getBadgeStyles = (variant: string) => {
  const baseStyles = {
    display: 'inline-flex',
    alignItems: 'center',
    borderRadius: '9999px',
    padding: '2px 10px',
    fontSize: '12px',
    fontWeight: 600,
    transition: 'colors 0.2s',
    outline: 'none'
  }

  const variantStyles = {
    default: {
      border: 'none',
      backgroundColor: 'hsl(221, 83%, 53%)',
      color: 'white'
    },
    secondary: {
      border: 'none',
      backgroundColor: '#f1f5f9',
      color: '#1e293b'
    },
    destructive: {
      border: 'none', 
      backgroundColor: 'hsl(0, 84%, 60%)',
      color: 'white'
    },
    outline: {
      border: '1px solid #e2e8f0',
      backgroundColor: 'transparent',
      color: '#1e293b'
    }
  }

  return {
    ...baseStyles,
    ...variantStyles[variant as keyof typeof variantStyles]
  }
}

function Badge({ variant = "default", style, ...props }: BadgeProps) {
  const badgeStyles = getBadgeStyles(variant)
  
  return (
    <div style={{ ...badgeStyles, ...style }} {...props} />
  )
}

export { Badge }
