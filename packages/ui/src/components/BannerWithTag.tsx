import { cn } from "@rezumerai/utils/styles";

/**
 * Props for BannerWithTag component.
 *
 * @property tag - Text content displayed in the banner
 * @property bannerStyle - Optional Tailwind classes for banner container styling
 * @property textStyle - Optional Tailwind classes for "New" tag styling
 */
interface BannerWithTagProps {
  tag: string;
  bannerStyle?: string;
  textStyle?: string;
}

/**
 * Full-width banner component with a "New" tag badge and customizable message.
 * Features gradient background from green to white with centered text.
 *
 * @param props - Banner configuration
 * @returns Banner component with "New" badge and message text
 *
 * @example
 * ```tsx
 * <BannerWithTag tag="Feature updates available!" />
 * <BannerWithTag
 *   tag="Premium templates now live"
 *   bannerStyle="bg-blue-100"
 *   textStyle="bg-blue-600"
 * />
 * ```
 */
export default function BannerWithTag({ tag, bannerStyle, textStyle }: BannerWithTagProps): React.JSX.Element {
  return (
    <div
      className={cn(
        "w-full bg-linear-to-r from-[#ABFF7E] to-[#FDFEFF] py-2.5 text-center font-medium text-green-800 text-sm",
        bannerStyle,
      )}
    >
      <p>
        <span className={cn("mr-2 rounded-lg bg-green-600 px-3 py-1 text-white", textStyle)}>New</span>
        {tag}
      </p>
    </div>
  );
}
