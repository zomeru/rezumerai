import { cn } from "@rezumerai/utils/styles";
import Link from "next/link";
import { LOGO_TEXT } from "@/constants";
import { ROUTES } from "@/constants/routing";

interface LogoProps {
  className?: string;
}

export default function Logo({ className }: LogoProps): React.JSX.Element {
  return (
    <Link href={ROUTES.HOME} className="inline-block">
      <h1
        className={cn(
          "relative font-semibold text-3xl after:absolute after:-bottom-px after:ml-0.5 after:text-6xl after:text-primary-500 after:content-['.']",
          className,
        )}
      >
        {LOGO_TEXT}
      </h1>
    </Link>
  );
}
