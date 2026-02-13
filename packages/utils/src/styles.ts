import clsx, { type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges Tailwind CSS classes with proper precedence handling.
 * Combines `clsx` for conditional logic and `tailwind-merge` to resolve conflicts.
 *
 * @param inputs - Class values (strings, arrays, objects, or falsy values)
 * @returns Merged class string with Tailwind conflicts resolved
 *
 * @example
 * ```ts
 * cn('px-4 py-2', 'bg-blue-500') // => 'px-4 py-2 bg-blue-500'
 * cn('px-4', 'px-6') // => 'px-6' (last wins)
 * cn('text-base', { 'font-bold': true }) // => 'text-base font-bold'
 * ```
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
