/**
 * Section title component with heading and description text.
 * Used for introducing major page sections with centered, responsive typography.
 *
 * @param props - Section title configuration
 * @param props.title - Main heading text
 * @param props.description - Descriptive subtext
 * @returns Centered section header with title and description
 *
 * @example
 * ```tsx
 * <SectionTitle
 *   title="Our Features"
 *   description="Discover powerful tools for building resumes"
 * />
 * ```
 */

interface SectionTitleProps {
  title: string;
  description: string;
}

export default function SectionTitle({ title, description }: SectionTitleProps) {
  return (
    <div className="mt-6 text-center text-slate-700">
      <h2 className="font-medium text-3xl sm:text-4xl">{title}</h2>
      <p className="max-sm mt-4 max-w-2xl text-slate-500">{description}</p>
    </div>
  );
}
