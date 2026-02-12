/**
 * String formatting utilities
 */

/**
 * Capitalizes the first letter and lowercases the rest.
 *
 * @param str - String to capitalize
 * @returns Capitalized string
 *
 * @example
 * ```ts
 * capitalize('hello') // => 'Hello'
 * capitalize('WORLD') // => 'World'
 * ```
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

/**
 * Truncates a string to specified length with suffix.
 *
 * @param str - String to truncate
 * @param length - Maximum length including suffix
 * @param suffix - Append when truncated (default: "...")
 * @returns Truncated string or original if under length
 *
 * @example
 * ```ts
 * truncate('Hello World', 8) // => 'Hello...'
 * truncate('Short', 10) // => 'Short'
 * ```
 */
export function truncate(str: string, length: number, suffix: string = "..."): string {
  if (str.length <= length) return str;
  return str.slice(0, length - suffix.length) + suffix;
}

/**
 * Converts string to URL-friendly slug.
 *
 * @param str - String to slugify
 * @returns URL-safe slug (lowercase, hyphenated, no special chars)
 *
 * @example
 * ```ts
 * slugify('Hello World') // => 'hello-world'
 * slugify('  My Blog Post! ') // => 'my-blog-post'
 * ```
 */
export function slugify(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "");
}

/**
 * Formats bytes to human-readable file size.
 *
 * @param bytes - Number of bytes
 * @param decimals - Decimal places (default: 2)
 * @returns Formatted size with unit (e.g., "1.5 MB")
 *
 * @example
 * ```ts
 * formatBytes(1024) // => '1 KB'
 * formatBytes(1048576) // => '1 MB'
 * formatBytes(1234567, 1) // => '1.2 MB'
 * ```
 */
export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${Number.parseFloat((bytes / k ** i).toFixed(dm))} ${sizes[i]}`;
}
