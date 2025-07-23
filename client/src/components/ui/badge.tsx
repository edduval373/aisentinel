import * as React from "react"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "destructive" | "outline"
}

function Badge({ variant = "default", className, ...props }: BadgeProps) {
  const getBadgeClasses = () => {
    let classes = ['badge']
    
    if (variant === 'secondary') classes.push('badge-secondary')
    else if (variant === 'destructive') classes.push('badge-destructive')
    else if (variant === 'outline') classes.push('badge-outline')
    else classes.push('badge-default')
    
    return classes.join(' ')
  }
  
  return (
    <div className={`${getBadgeClasses()} ${className || ''}`} {...props} />
  )
}

export { Badge }
