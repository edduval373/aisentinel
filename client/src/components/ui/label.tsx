import * as React from "react"
import * as LabelPrimitive from "@radix-ui/react-label"

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={className}
    style={{
      fontSize: '14px',
      fontWeight: '500',
      lineHeight: '1',
      ...props.style
    }}
    {...props}
  />
))
Label.displayName = LabelPrimitive.Root.displayName

export { Label }
