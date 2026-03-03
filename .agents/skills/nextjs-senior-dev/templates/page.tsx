// @ts-nocheck
/**
 * Next.js Page Template (App Router)
 *
 * STYLING: This template is styling-agnostic.
 * Add your preferred styling solution:
 * - Tailwind CSS: className="..."
 * - MUI: import { Box, Typography } from "@mui/material"
 * - CSS Modules: import styles from "./page.module.css"
 * - Styled Components: import styled from "styled-components"
 */

import { Suspense } from "react"
import { Metadata } from "next"
import { notFound } from "next/navigation"

interface PageProps {
  params: Promise<{ id: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { id } = await params
  // Fetch data for metadata if needed
  // const item = await getItem(id)

  return {
    title: `Page ${id}`,
    description: "Page description",
  }
}

/**
 * Data fetching component - runs on server
 * Wrap in Suspense for streaming
 */
async function PageContent({ id }: { id: string }) {
  // Fetch data here - runs on server
  // const data = await db.items.findUnique({ where: { id } })
  // if (!data) notFound()

  return (
    <article>
      <h1>Page Content</h1>
      {/* Render your data here */}
      {/* Style with your preferred solution */}
    </article>
  )
}

/**
 * Loading skeleton - customize for your styling solution
 *
 * Examples:
 * - Tailwind: className="animate-pulse bg-gray-200 h-8 w-1/4 rounded"
 * - MUI: <Skeleton variant="text" width="25%" height={32} />
 * - CSS Modules: className={styles.skeleton}
 */
function PageSkeleton() {
  return (
    <div role="status" aria-label="Loading">
      {/* Header skeleton */}
      <div aria-hidden="true" />
      {/* Content skeleton */}
      <div aria-hidden="true" />
      <div aria-hidden="true" />
    </div>
  )
}

export default async function Page({ params, searchParams }: PageProps) {
  const { id } = await params
  const query = await searchParams

  return (
    <main>
      <Suspense fallback={<PageSkeleton />}>
        <PageContent id={id} />
      </Suspense>
    </main>
  )
}