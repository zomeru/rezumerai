/**
 * Full-screen loading spinner component.
 * Displays a centered spinning circle indicator while content loads.
 *
 * @returns Centered spinner overlay
 *
 * @example
 * ```tsx
 * if (isLoading) return <Loader />;
 * ```
 */
export default function Loader() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="size-12 animate-spin rounded-full border-3 border-gray-400 border-t-transparent"></div>
    </div>
  );
}
