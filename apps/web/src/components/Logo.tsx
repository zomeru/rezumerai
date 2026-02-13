import { cn } from "@rezumerai/utils/styles";
import Link from "next/link";
import { logoText } from "@/constants";
import { ROUTES } from "@/constants/routing";

/**
 * Props for Logo component.
 *
 * @property className - Optional Tailwind classes for logo text styling
 */
export interface LogoProps {
  className?: string;
}

/**
 * Application logo component with brand text and styled period accent.
 * Renders as a clickable link to the homepage with a decorative period.
 *
 * @param props - Logo configuration
 * @returns Linked logo heading with accent period
 *
 * @example
 * ```tsx
 * <Logo />
 * <Logo className="text-white" />
 * ```
 */
export default function Logo({ className }: LogoProps): React.JSX.Element {
  return (
    <Link href={ROUTES.HOME} className="inline-block">
      <h1
        className={cn(
          "relative font-semibold text-3xl after:absolute after:-bottom-px after:ml-0.5 after:text-6xl after:text-primary-500 after:content-['.']",
          className,
        )}
      >
        {logoText}
      </h1>
    </Link>
  );
}
