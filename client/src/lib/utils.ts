import { clsx, type ClassValue } from "clsx"

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

// Utility functions for standard CSS classes
export function combineStyles(...styles: (string | undefined | false | null)[]): string {
  return styles.filter(Boolean).join(' ');
}
