"use client";

import { useEffect, useState } from "react";

/**
 * Hook to get current date only on client side to prevent hydration mismatch
 * @returns Current date or null during SSR
 */
export function useClientDate() {
  const [currentDate, setCurrentDate] = useState<Date | null>(null);

  useEffect(() => {
    setCurrentDate(new Date());
  }, []);

  return currentDate;
}

/**
 * Hook to check if component is mounted (client-side)
 * Useful for preventing hydration mismatches
 * @returns true if mounted on client, false during SSR
 */
export function useIsMounted() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return isMounted;
}
