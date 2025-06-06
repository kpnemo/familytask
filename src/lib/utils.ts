import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function generateFamilyCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let result = ''
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date)
}

export function formatDateOnly(date: Date): string {
  // Format date for display, ensuring it shows the intended day regardless of timezone
  const localDate = new Date(date.getTime() + date.getTimezoneOffset() * 60000)
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(localDate)
}

export function dateToInputString(date: Date): string {
  // Convert date to YYYY-MM-DD format for HTML date inputs using local timezone
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function formatDateTime(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

export function isTaskOverdue(dueDate: Date): boolean {
  // Compare only date parts, ignoring time
  const today = new Date()
  const taskDate = new Date(dueDate)
  
  // Create date-only objects for comparison
  const todayDateOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const taskDateOnly = new Date(taskDate.getFullYear(), taskDate.getMonth(), taskDate.getDate())
  
  return todayDateOnly > taskDateOnly
}

export function isDateBefore(date1: Date, date2: Date): boolean {
  // Compare only date parts, ignoring time
  // Returns true if date1 is before date2
  const dateOnly1 = new Date(date1.getFullYear(), date1.getMonth(), date1.getDate())
  const dateOnly2 = new Date(date2.getFullYear(), date2.getMonth(), date2.getDate())
  
  return dateOnly1 < dateOnly2
}