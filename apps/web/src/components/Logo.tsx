import { cn } from "@rezumerai/utils/styles";
import Link from "next/link";
import { LOGO_TEXT } from "@/constants";

export default function Logo({ className }: { className?: string }) {
  return (
    <Link href="/">
      <h1
        className={cn(
          "relative font-semibold text-3xl after:absolute after:bottom-[-1px] after:ml-[2px] after:text-6xl after:text-primary-500 after:content-['.']",
          className,
        )}
      >
        {LOGO_TEXT}
      </h1>
    </Link>
  );
}
