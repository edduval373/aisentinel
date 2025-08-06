"use client"

import * as React from "react"
import * as SelectPrimitive from "@radix-ui/react-select"
import { Check, ChevronDown, ChevronUp } from "lucide-react"

const Select = SelectPrimitive.Root

const SelectGroup = SelectPrimitive.Group

const SelectValue = SelectPrimitive.Value

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ style, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    style={{
      display: 'flex',
      height: '40px',
      width: '100%',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderRadius: '6px',
      border: '1px solid #d1d5db',
      backgroundColor: '#ffffff',
      padding: '8px 12px',
      fontSize: '14px',
      outline: 'none',
      cursor: 'pointer',
      ...style
    }}
    {...props}
  >
    {children}
    <SelectPrimitive.Icon asChild>
      <ChevronDown style={{ height: '16px', width: '16px', opacity: 0.5 }} />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
))
SelectTrigger.displayName = SelectPrimitive.Trigger.displayName

const SelectScrollUpButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollUpButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollUpButton>
>(({ style, ...props }, ref) => (
  <SelectPrimitive.ScrollUpButton
    ref={ref}
    style={{
      display: 'flex',
      cursor: 'default',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '4px 0',
      ...style
    }}
    {...props}
  >
    <ChevronUp style={{ height: '16px', width: '16px' }} />
  </SelectPrimitive.ScrollUpButton>
))
SelectScrollUpButton.displayName = SelectPrimitive.ScrollUpButton.displayName

const SelectScrollDownButton = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.ScrollDownButton>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.ScrollDownButton>
>(({ style, ...props }, ref) => (
  <SelectPrimitive.ScrollDownButton
    ref={ref}
    style={{
      display: 'flex',
      cursor: 'default',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '4px 0',
      ...style
    }}
    {...props}
  >
    <ChevronDown style={{ height: '16px', width: '16px' }} />
  </SelectPrimitive.ScrollDownButton>
))
SelectScrollDownButton.displayName =
  SelectPrimitive.ScrollDownButton.displayName

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content>
>(({ style, children, position = "popper", ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      style={{
        position: 'relative',
        zIndex: 50,
        maxHeight: 'var(--radix-select-content-available-height)',
        minWidth: '8rem',
        overflowY: 'auto',
        overflowX: 'hidden',
        borderRadius: '6px',
        border: '1px solid #d1d5db',
        backgroundColor: '#ffffff',
        color: '#0f172a',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        ...style
      }}
      position={position}
      {...props}
    >
      <SelectScrollUpButton />
      <SelectPrimitive.Viewport
        style={{
          padding: '4px'
        }}
      >
        {children}
      </SelectPrimitive.Viewport>
      <SelectScrollDownButton />
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
))
SelectContent.displayName = SelectPrimitive.Content.displayName

const SelectLabel = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Label>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Label>
>(({ style, ...props }, ref) => (
  <SelectPrimitive.Label
    ref={ref}
    style={{
      padding: '6px 8px 6px 32px',
      fontSize: '14px',
      fontWeight: '600',
      ...style
    }}
    {...props}
  />
))
SelectLabel.displayName = SelectPrimitive.Label.displayName

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ style, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    style={{
      position: 'relative',
      display: 'flex',
      width: '100%',
      cursor: 'default',
      userSelect: 'none',
      alignItems: 'center',
      borderRadius: '4px',
      padding: '6px 8px 6px 32px',
      fontSize: '14px',
      outline: 'none',
      ...style
    }}
    {...props}
  >
    <span style={{
      position: 'absolute',
      left: '8px',
      display: 'flex',
      height: '14px',
      width: '14px',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      <SelectPrimitive.ItemIndicator>
        <Check style={{ height: '16px', width: '16px' }} />
      </SelectPrimitive.ItemIndicator>
    </span>

    <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
))
SelectItem.displayName = SelectPrimitive.Item.displayName

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ style, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    style={{
      margin: '4px -4px',
      height: '1px',
      backgroundColor: '#e5e7eb',
      ...style
    }}
    {...props}
  />
))
SelectSeparator.displayName = SelectPrimitive.Separator.displayName

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
  SelectScrollUpButton,
  SelectScrollDownButton,
}
