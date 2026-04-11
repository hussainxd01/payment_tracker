import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Format number using Indian numbering system
 * Example: 1000000 becomes "10,00,000"
 */
export function formatIndianNumber(num: number): string {
  if (num === 0) return '0'
  
  const isNegative = num < 0
  const absNum = Math.abs(num)
  
  // Split into integer and decimal parts
  const parts = absNum.toString().split('.')
  let integerPart = parts[0]
  const decimalPart = parts[1]
  
  // For numbers less than 1000, no formatting needed
  if (integerPart.length <= 3) {
    const result = isNegative ? `-${absNum}` : absNum.toString()
    return result
  }
  
  // Apply Indian numbering: reverse, group by 2, reverse back
  const reversed = integerPart.split('').reverse()
  const groups: string[] = []
  
  // First group has up to 3 digits
  groups.push(reversed.slice(0, 3).reverse().join(''))
  
  // Rest have 2 digits each
  for (let i = 3; i < reversed.length; i += 2) {
    groups.push(reversed.slice(i, i + 2).reverse().join(''))
  }
  
  const formatted = groups.reverse().join(',')
  const result = isNegative ? `-${formatted}` : formatted
  
  return decimalPart ? `${result}.${decimalPart}` : result
}

/**
 * Parse Indian formatted number back to number
 * Example: "10,00,000" becomes 1000000
 */
export function parseIndianNumber(str: string): number {
  return parseFloat(str.replace(/,/g, ''))
}
