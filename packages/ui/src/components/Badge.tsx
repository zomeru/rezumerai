import { cn } from "@rezumerai/utils/styles";

export default function Badge({
  title,
  style,
  svgStyle,
}: {
  title: string;
  style?: string;
  svgStyle?: string;
}) {
  return (
    <div
      className={cn(
        "mb-4 flex w-fit items-center gap-2 rounded-full border-secondary-200 bg-primary-400/10 px-4 py-1 text-primary-700 text-primary-800 text-sm",
        style,
      )}
    >
      <svg
        width="13"
        height="14"
        viewBox="0 0 13 14"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <title>{`Icon representing a ${title}`}</title>
        <path
          d="M1.613 8.2a.62.62 0 0 1-.553-.341.59.59 0 0 1 .076-.637l6.048-6.118a.31.31 0 0 1 .375-.069c.061.033.11.084.137.147a.3.3 0 0 1 .014.197L6.537 4.991a.59.59 0 0 0 .07.552.61.61 0 0 0 .504.257h4.276a.62.62 0 0 1 .553.341.59.59 0 0 1-.076.637l-6.048 6.119a.31.31 0 0 1-.375.067.295.295 0 0 1-.15-.344l1.172-3.61a.59.59 0 0 0-.07-.553.61.61 0 0 0-.504-.257z"
          strokeMiterlimit="5.759"
          strokeLinecap="round"
          className={cn("stroke-primary-700", svgStyle)}
        />
      </svg>
      <span>{title}</span>
    </div>
  );
}
