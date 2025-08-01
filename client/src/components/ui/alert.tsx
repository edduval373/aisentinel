import * as React from "react"

const alertVariants = ({ variant = "default" }: { variant?: string } = {}) => {
  return "" // Pure CSS inline styles approach - no classes
}

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { variant?: "default" | "destructive" }
>(({ className, variant = "default", ...props }, ref) => (
  <div
    ref={ref}
    role="alert"
    className={className}
    style={{
      position: 'relative',
      width: '100%',
      borderRadius: '8px',
      border: variant === 'destructive' ? '1px solid #fecaca' : '1px solid #e2e8f0',
      padding: '16px',
      backgroundColor: variant === 'destructive' ? '#fef2f2' : '#fff',
      color: variant === 'destructive' ? '#dc2626' : '#374151',
      ...props.style
    }}
    {...props}
  />
))
Alert.displayName = "Alert"

const AlertTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h5
    ref={ref}
    className={className}
    style={{
      marginBottom: '4px',
      fontWeight: '500',
      lineHeight: '1',
      letterSpacing: '-0.025em',
      ...props.style
    }}
    {...props}
  />
))
AlertTitle.displayName = "AlertTitle"

const AlertDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={className}
    style={{
      fontSize: '14px',
      lineHeight: '1.5',
      ...props.style
    }}
    {...props}
  />
))
AlertDescription.displayName = "AlertDescription"

export { Alert, AlertTitle, AlertDescription }
