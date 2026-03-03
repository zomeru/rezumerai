// @ts-nocheck
/**
 * Next.js Error Boundary Template (App Router)
 *
 * STYLING: This template is styling-agnostic.
 * Implement with your preferred solution:
 *
 * TAILWIND:
 *   <div className="flex flex-col items-center justify-center min-h-[400px]">
 *   <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
 *
 * MUI:
 *   import { Box, Typography, Button, Stack } from "@mui/material"
 *   <Box display="flex" flexDirection="column" alignItems="center">
 *   <Button variant="contained" onClick={reset}>
 *
 * CSS MODULES:
 *   import styles from "./error.module.css"
 *   <div className={styles.container}>
 */

"use client"

import { useEffect } from "react"

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error to monitoring service (Sentry, etc.)
    console.error("[PAGE_ERROR]", {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
    })

    // Example: Sentry integration
    // Sentry.captureException(error)
  }, [error])

  return (
    <div role="alert">
      {/* Error icon (optional) */}
      {/* <ErrorIcon /> */}

      {/* Error message */}
      <h2>Something went wrong</h2>

      <p>
        {process.env.NODE_ENV === "development"
          ? error.message
          : "An unexpected error occurred"}
      </p>

      {/* Error ID for support */}
      {error.digest && (
        <p>
          <small>Error ID: {error.digest}</small>
        </p>
      )}

      {/* Action buttons */}
      <div>
        <button onClick={reset} type="button">
          Try again
        </button>

        <a href="/">Go home</a>
      </div>
    </div>
  )
}

/**
 * EXAMPLE IMPLEMENTATIONS:
 *
 * // Tailwind CSS
 * return (
 *   <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
 *     <div className="text-center">
 *       <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
 *         Something went wrong
 *       </h2>
 *       <p className="text-gray-600 dark:text-gray-400 mt-2">
 *         {error.message}
 *       </p>
 *     </div>
 *     <div className="flex gap-4">
 *       <button
 *         onClick={reset}
 *         className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
 *       >
 *         Try again
 *       </button>
 *       <a href="/" className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md">
 *         Go home
 *       </a>
 *     </div>
 *   </div>
 * )
 *
 * // MUI
 * import { Box, Typography, Button, Stack, Alert } from "@mui/material"
 * return (
 *   <Box
 *     display="flex"
 *     flexDirection="column"
 *     alignItems="center"
 *     justifyContent="center"
 *     minHeight={400}
 *     gap={2}
 *   >
 *     <Alert severity="error" sx={{ mb: 2 }}>
 *       {error.message}
 *     </Alert>
 *     <Typography variant="h5">Something went wrong</Typography>
 *     <Stack direction="row" spacing={2}>
 *       <Button variant="contained" onClick={reset}>
 *         Try again
 *       </Button>
 *       <Button variant="outlined" href="/">
 *         Go home
 *       </Button>
 *     </Stack>
 *   </Box>
 * )
 */