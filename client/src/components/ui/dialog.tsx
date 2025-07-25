"use client"

import * as React from "react"
import * as DialogPrimitive from "@radix-ui/react-dialog"
import { X } from "lucide-react"

// Removed cn utility import as we use inline styles

const Dialog = DialogPrimitive.Root

const DialogTrigger = DialogPrimitive.Trigger

const DialogPortal = DialogPrimitive.Portal

const DialogClose = DialogPrimitive.Close

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ style, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    style={{
      position: 'fixed',
      inset: 0,
      zIndex: 50,
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      ...style
    }}
    {...props}
  />
))
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ style, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      style={{
        position: 'fixed',
        left: '50%',
        top: '50%',
        zIndex: 50,
        display: 'grid',
        width: '100%',
        maxWidth: '32rem',
        transform: 'translate(-50%, -50%)',
        gap: '16px',
        border: '1px solid #e2e8f0',
        backgroundColor: 'white',
        padding: '24px',
        borderRadius: '8px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        ...style
      }}
      {...props}
    >
      {children}
      <DialogPrimitive.Close style={{
        position: 'absolute',
        right: '16px',
        top: '16px',
        borderRadius: '4px',
        opacity: 0.7,
        transition: 'opacity 0.2s',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '4px'
      }}>
        <X style={{ width: '16px', height: '16px' }} />
        <span style={{ position: 'absolute', left: '-10000px' }}>Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
))
DialogContent.displayName = DialogPrimitive.Content.displayName

const DialogHeader = ({
  style,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
      textAlign: 'left',
      ...style
    }}
    {...props}
  />
)
DialogHeader.displayName = "DialogHeader"

const DialogFooter = ({
  style,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '8px',
      ...style
    }}
    {...props}
  />
)
DialogFooter.displayName = "DialogFooter"

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ style, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    style={{
      fontSize: '18px',
      fontWeight: '600',
      lineHeight: '1',
      letterSpacing: '-0.025em',
      ...style
    }}
    {...props}
  />
))
DialogTitle.displayName = DialogPrimitive.Title.displayName

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ style, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    style={{
      fontSize: '14px',
      color: '#6b7280',
      ...style
    }}
    {...props}
  />
))
DialogDescription.displayName = DialogPrimitive.Description.displayName

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
}
